'use client'

import { ReactNode } from 'react'

interface Column {
  key: string
  header: string
  render?: (row: any) => ReactNode
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  emptyMessage?: string
}

export default function DataTable({ columns, data, emptyMessage = 'No data available' }: DataTableProps) {
  return (
    <div className="table-container">
      <table className="audit-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty-row">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <style jsx>{`
        .table-container {
          overflow-x: auto;
        }

        .audit-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        .audit-table th,
        .audit-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .audit-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }

        .audit-table tr:hover {
          background: #f8f9fa;
        }

        .empty-row {
          text-align: center;
          color: #999;
          padding: 40px !important;
        }
      `}</style>
    </div>
  )
}