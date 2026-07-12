const CrudTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No entries found',
  emptyIcon
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <svg className="animate-spin h-8 w-8 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-medium text-gray-500">Loading data...</span>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-sm animate-in fade-in zoom-in-98 duration-200">
        {emptyIcon ? (
          <div className="text-gray-400 mb-3">{emptyIcon}</div>
        ) : (
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        )}
        <h3 className="text-base font-semibold text-gray-700">{emptyMessage}</h3>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Mobile Stacked Cards Layout: Hidden on desktop (md:) */}
      <div className="md:hidden space-y-4">
        {data.map((row, idx) => (
          <div
            key={row.id || idx}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3 hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            {columns.map((col, cIdx) => (
              <div key={col.key || cIdx} className="flex justify-between items-start text-sm gap-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">
                  {col.header}
                </span>
                <span className="text-gray-800 font-semibold text-right break-words max-w-[200px]">
                  {col.render ? col.render(row) : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop Tabular Layout: Hidden on mobile, visible from md breakpoint */}
      <div className="hidden md:block overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {columns.map((col, cIdx) => (
                  <th key={col.key || cIdx} className="py-4 px-6 select-none">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {data.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-slate-50/30 transition-colors duration-150 animate-in fade-in duration-200"
                >
                  {columns.map((col, cIdx) => (
                    <td key={col.key || cIdx} className="py-4 px-6 text-gray-700 font-medium">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CrudTable
