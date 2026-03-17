import React from "react";
import "./Table.css";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Table({ columns, data, emptyMessage = "Không có dữ liệu", className }) {
  return (
    <div className={joinClasses("mc-table-wrapper", className)}>
      <table className="mc-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="mc-table-head-cell">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="mc-table-empty">
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map((row) => (
            <tr key={row.id || row.key} className="mc-table-body-row">
              {columns.map((col) => (
                <td key={col.key} className="mc-table-body-cell">
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
