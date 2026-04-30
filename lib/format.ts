const NEON_GLYPH = "⟁";

export function formatNeon(value: number, opts: { compact?: boolean } = {}): string {
  const v = Math.round(value);
  if (opts.compact) {
    if (Math.abs(v) >= 1_000_000) return `${NEON_GLYPH} ${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (Math.abs(v) >= 1_000) return `${NEON_GLYPH} ${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${NEON_GLYPH} ${v.toLocaleString("en-US")}`;
}

export function formatTxHash(hash: string): string {
  if (hash.length < 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.floor(hr / 24);
  return `${day} d ago`;
}
