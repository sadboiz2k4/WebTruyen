export default function Pagination({ currentPage = 0, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  const delta = 2;
  const pages = [];
  const left = Math.max(0, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  if (left > 0) {
    pages.push(0);
    if (left > 1) pages.push('...');
  }
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) {
    if (right < totalPages - 2) pages.push('...');
    pages.push(totalPages - 1);
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`}>...</span>
        ) : (
          <button
            key={p}
            type="button"
            className={currentPage === p ? 'active' : ''}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        )
      )}

      <button
        type="button"
        disabled={currentPage === totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
      >
        ›
      </button>
    </nav>
  );
}
