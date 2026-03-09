import React from "react";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Table({ columns, data, emptyMessage = "Không có dữ liệu", className }) {
  return (
    <div
      className={joinClasses(
        "mc-table-wrapper",
        className
      )}
    >
      <table className="mc-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--color-border-subtle)]">
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-[color:var(--color-text-muted)]">
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map((row) => (
            <tr key={row.id || row.key} className="hover:bg-[color:var(--color-bg-soft)] transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-top">
                  {col.render ? col.render(row) : row[col.dataIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;


