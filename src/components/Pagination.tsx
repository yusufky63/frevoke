"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="text-xs text-gray-700 dark:text-gray-300">
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {Array.from(
              { length: Math.min(5, totalPages) },
              (_, i) => {
                const pageNum =
                  Math.max(
                    1,
                    Math.min(totalPages - 4, currentPage - 2)
                  ) + i;
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-2 py-1 text-xs rounded ${
                      currentPage === pageNum
                        ? "bg-indigo-600 text-white"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
            )}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
