type Line = { slug: string; qty: number };

class CartStore {
  private map = new Map<string, number>();
  private subs = new Set<() => void>();

  getLines(): Line[] {
    return Array.from(this.map.entries()).map(([slug, qty]) => ({ slug, qty }));
  }
  getCount(): number {
    let n = 0;
    for (const q of this.map.values()) n += q;
    return n;
  }
  add(slug: string, qty = 1): void {
    const cur = this.map.get(slug) ?? 0;
    const next = cur + qty;
    if (next <= 0) this.map.delete(slug);
    else this.map.set(slug, next);
    this.notify();
  }
  update(slug: string, qty: number): void {
    if (qty <= 0) this.map.delete(slug);
    else this.map.set(slug, qty);
    this.notify();
  }
  remove(slug: string): void {
    this.map.delete(slug);
    this.notify();
  }
  clear(): void {
    this.map.clear();
    this.notify();
  }
  subscribe(fn: () => void): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
  private notify(): void {
    for (const fn of this.subs) fn();
  }
}

export const cartStore = new CartStore();
