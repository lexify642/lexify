"use client";

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p += 1) pages.push(p);

  return (
    <div className="pagination">
      <button type="button" className="pagination-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Prev
      </button>
      {start > 1 && <span className="pagination-ellipsis">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`pagination-btn${p === page ? " active" : ""}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className="pagination-ellipsis">…</span>}
      <button type="button" className="pagination-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </div>
  );
}
