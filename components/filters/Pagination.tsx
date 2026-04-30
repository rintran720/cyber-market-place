"use client";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, pageSize, total, onChange }: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage <= 1) return null;
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= lastPage; p++) {
    if (p === 1 || p === lastPage || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <nav className="cp-pagination" aria-label="Pagination">
      <button
        className="cp-pagination__item"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="cp-pagination__ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`cp-pagination__item ${p === page ? "cp-pagination__item--active" : ""}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        className="cp-pagination__item"
        onClick={() => onChange(Math.min(lastPage, page + 1))}
        disabled={page === lastPage}
      >
        ›
      </button>
    </nav>
  );
}
