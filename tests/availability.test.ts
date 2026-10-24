import { describe, it, expect, vi } from 'vitest';
import { AvailabilityChecker } from '../src/core/transaction/availability-checker';

describe('AvailabilityChecker', () => {
  it('blocks private IPs and localhost destinations (SSRF Safeguard PRD 12.3)', async () => {
    const localTargets = [
      'http://localhost:8080/admin',
      'http://service.localhost/api',
      'http://127.0.0.1:3000',
      'http://192.168.1.1/router',
      'http://10.0.0.1/',
      'http://172.16.0.1/',
      'http://169.254.169.254/latest/meta-data',
      'http://[::1]:8080/',
      'http://[::]:8080/',
      'http://[fe80::1]/',
      'http://[fc00::1]/',
      'http://router.local/',
      'http://internal-dashboard.internal/'
    ];

    for (const url of localTargets) {
      const result = await AvailabilityChecker.checkUrl(url);
      expect(result.category).toBe('forbidden_scheme');
      expect(result.explanation).toContain('Restricted');
    }
  });

  it('blocks non-web schemes', async () => {
    const fileResult = await AvailabilityChecker.checkUrl('file:///C:/Windows/win.ini');
    expect(fileResult.category).toBe('forbidden_scheme');

    const jsResult = await AvailabilityChecker.checkUrl('javascript:alert(1)');
    expect(jsResult.category).toBe('forbidden_scheme');
  });

  it('correctly classifies HTTP responses without marking pages dead', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('ok')) return Promise.resolve({ status: 200, headers: new Headers() });
      if (url.includes('redirect')) return Promise.resolve({ status: 301, headers: new Headers({ location: 'https://new.com' }) });
      if (url.includes('auth')) return Promise.resolve({ status: 401, headers: new Headers() });
      if (url.includes('rate-limit')) return Promise.resolve({ status: 429, headers: new Headers() });
      return Promise.reject(new Error('DNS lookup failed'));
    });

    const res200 = await AvailabilityChecker.checkUrl('https://example.com/ok', mockFetch);
    expect(res200.category).toBe('reachable');

    const res301 = await AvailabilityChecker.checkUrl('https://example.com/redirect', mockFetch);
    expect(res301.category).toBe('redirect');
    expect(res301.redirectTarget).toBe('https://new.com');

    const res401 = await AvailabilityChecker.checkUrl('https://example.com/auth', mockFetch);
    expect(res401.category).toBe('auth_required');

    const res429 = await AvailabilityChecker.checkUrl('https://example.com/rate-limit', mockFetch);
    expect(res429.category).toBe('blocked_uncertain');

    const resDns = await AvailabilityChecker.checkUrl('https://example.com/error', mockFetch);
    expect(resDns.category).toBe('network_error');
    expect(resDns.explanation).toContain('does not prove the website is permanently offline');
  });
});
