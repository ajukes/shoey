'use client';

import React from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
  mobileHidden?: boolean; // Hide on mobile
}

interface GlassTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  onRowClick?: (row: T) => void;
  mobileCardView?: boolean; // Show as cards on mobile
}

export function GlassTable<T extends Record<string, any>>({
  data,
  columns,
  className = '',
  onRowClick,
  mobileCardView = true,
}: GlassTableProps<T>) {
  // Desktop table view
  const TableView = () => (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full">
        <thead>
          <tr className="bg-white/5 border-b border-white/10">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-white/90 tracking-wide ${column.mobileHidden ? 'hidden md:table-cell' : ''}`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`
                transition-all duration-200
                ${onRowClick 
                  ? 'cursor-pointer hover:bg-white/10 md:hover:scale-[1.01] hover:shadow-lg hover:shadow-white/5' 
                  : 'hover:bg-white/5'
                }
              `}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-white/80 ${column.mobileHidden ? 'hidden md:table-cell' : ''}`}
                >
                  {column.render 
                    ? column.render(row[column.key], row)
                    : String(row[column.key] || '')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Mobile card view
  const CardView = () => (
    <div className="space-y-3">
      {data.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`
            bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4
            transition-all duration-200
            ${onRowClick
              ? 'cursor-pointer hover:bg-white/10 hover:shadow-lg hover:shadow-white/5 active:scale-[0.98]'
              : ''
            }
          `}
          onClick={() => onRowClick?.(row)}
        >
          <div className="space-y-3">
            {columns.filter(col => !col.mobileHidden).map((column, index) => (
              <div key={String(column.key)} className={index === 0 ? "pb-2 border-b border-white/10" : ""}>
                {index === 0 ? (
                  // First column (usually name) gets special treatment
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '')
                      }
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                      {column.header}
                    </span>
                    <span className="text-sm text-white/90 font-medium text-right flex-1 ml-4">
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '')
                      }
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`glass-table rounded-xl overflow-hidden ${className}`}>
      {/* Show cards on mobile, table on desktop if mobileCardView is true */}
      {mobileCardView ? (
        <>
          <div className="md:hidden">
            <CardView />
          </div>
          <div className="hidden md:block">
            <TableView />
          </div>
        </>
      ) : (
        <TableView />
      )}
      
      {data.length === 0 && (
        <div className="text-center py-8 md:py-12">
          <p className="text-white/60 text-sm md:text-lg">No data available</p>
        </div>
      )}
    </div>
  );
}