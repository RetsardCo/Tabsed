/**
 * Tabsed Link Availability Checker
 * Aligned with Tabsed PRD FR-070 to FR-076 and Section 12.3 SSRF Safeguards
 */

export type AvailabilityCategory =
  | 'reachable'
  | 'redirect'
  | 'auth_required'
  | 'blocked_uncertain'
  | 'timeout'
  | 'network_error'
  | 'forbidden_scheme';

export interface AvailabilityResult {
  url: string;
  category: AvailabilityCategory;
  httpStatus?: number;
  redirectTarget?: string;
  errorMessage?: string;
  checkedAt: string;
  durationMs: number;
  explanation: string;
}

export class AvailabilityChecker {
  private static readonly PRIVATE_IP_PATTERNS = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/,
    /^0\.0\.0\.0$/,
    /^\[::1\]$/
  ];

  /**
   * Safe URL validation against SSRF and unsupported schemes (PRD 12.3)
   */
  public static isSafeWebUrl(rawUrl: string): { safe: boolean; reason?: string } {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { safe: false, reason: `Unsupported protocol scheme: ${parsed.protocol}` };
      }

      for (const pattern of this.PRIVATE_IP_PATTERNS) {
        if (pattern.test(parsed.hostname)) {
          return { safe: false, reason: `Restricted local or private network destination: ${parsed.hostname}` };
        }
      }

      return { safe: true };
    } catch {
      return { safe: false, reason: 'Malformed URL' };
    }
  }

  /**
   * Categorize an HTTP response or fetch error
   */
  public static categorizeStatus(status: number): { category: AvailabilityCategory; explanation: string } {
    if (status >= 200 && status < 300) {
      return {
        category: 'reachable',
        explanation: 'Page responded successfully (HTTP ' + status + ').'
      };
    }
    if (status >= 300 && status < 400) {
      return {
        category: 'redirect',
        explanation: 'Page returned a redirect status (HTTP ' + status + ').'
      };
    }
    if (status === 401 || status === 403) {
      return {
        category: 'auth_required',
        explanation: 'Site requires authentication or authorization (HTTP ' + status + ').'
      };
    }
    if (status === 429 || status === 503) {
      return {
        category: 'blocked_uncertain',
        explanation: 'Rate-limited or temporarily unavailable (HTTP ' + status + '). Page may still be active.'
      };
    }
    return {
      category: 'blocked_uncertain',
      explanation: 'Server returned HTTP ' + status + '. Does not guarantee page is dead.'
    };
  }

  /**
   * Run availability check against a URL with safe network rules
   */
  public static async checkUrl(
    url: string,
    fetchFn: (input: string, init?: any) => Promise<any> = globalThis.fetch,
    timeoutMs = 5000
  ): Promise<AvailabilityResult> {
    const startTime = Date.now();
    const safety = this.isSafeWebUrl(url);

    if (!safety.safe) {
      return {
        url,
        category: 'forbidden_scheme',
        errorMessage: safety.reason,
        checkedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        explanation: safety.reason || 'Blocked by security policy'
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetchFn(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': 'Tabsed-Availability-Check/1.0' }
      });

      clearTimeout(timeoutId);

      const status = response.status;
      const { category, explanation } = this.categorizeStatus(status);

      return {
        url,
        category,
        httpStatus: status,
        redirectTarget: response.headers?.get ? response.headers.get('location') ?? undefined : undefined,
        checkedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        explanation
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        return {
          url,
          category: 'timeout',
          errorMessage: 'Request timed out after ' + timeoutMs + 'ms',
          checkedAt: new Date().toISOString(),
          durationMs,
          explanation: 'Connection timed out. The server may be slow or filtering automated requests.'
        };
      }

      return {
        url,
        category: 'network_error',
        errorMessage: err.message || 'Network connection failed',
        checkedAt: new Date().toISOString(),
        durationMs,
        explanation: 'Network, DNS, or TLS error. This check does not prove the website is permanently offline.'
      };
    }
  }
}
