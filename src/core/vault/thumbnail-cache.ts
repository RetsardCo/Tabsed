/**
 * Tabsed Bounded Thumbnail LRU Cache
 * Aligned with PRD Epic 1.6 & Section 13.1 Performance Restraint:
 * Keeps memory bounded by evicting least-recently-used thumbnails when capacity is exceeded.
 */

export class ThumbnailLRUCache {
  private cache = new Map<string, string>();
  private maxCapacity: number;
  private onEvict?: (id: string, dataUrl: string) => void;

  constructor(maxCapacity = 100, onEvict?: (id: string, dataUrl: string) => void) {
    this.maxCapacity = Math.max(1, maxCapacity);
    this.onEvict = onEvict;
  }

  public get(id: string): string | undefined {
    const val = this.cache.get(id);
    if (val !== undefined) {
      // Re-insert to mark as most recently used
      this.cache.delete(id);
      this.cache.set(id, val);
    }
    return val;
  }

  public put(id: string, dataUrl: string): void {
    if (this.cache.has(id)) {
      this.cache.delete(id);
    } else if (this.cache.size >= this.maxCapacity) {
      // Evict oldest (first item in Map iterator)
      const oldestEntry = this.cache.entries().next().value;
      if (oldestEntry) {
        const [oldestKey, oldestVal] = oldestEntry;
        this.cache.delete(oldestKey);
        if (this.onEvict) {
          try {
            this.onEvict(oldestKey, oldestVal);
          } catch {}
        }
      }
    }
    this.cache.set(id, dataUrl);
  }

  public has(id: string): boolean {
    return this.cache.has(id);
  }

  public delete(id: string): boolean {
    return this.cache.delete(id);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }

  public getCapacity(): number {
    return this.maxCapacity;
  }

  public setCapacity(newCapacity: number): void {
    this.maxCapacity = Math.max(1, newCapacity);
    while (this.cache.size > this.maxCapacity) {
      const oldestEntry = this.cache.entries().next().value;
      if (oldestEntry) {
        const [oldestKey, oldestVal] = oldestEntry;
        this.cache.delete(oldestKey);
        if (this.onEvict) {
          try {
            this.onEvict(oldestKey, oldestVal);
          } catch {}
        }
      } else {
        break;
      }
    }
  }

  public keys(): string[] {
    return Array.from(this.cache.keys());
  }
}
