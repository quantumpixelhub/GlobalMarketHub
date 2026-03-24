import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Edit2, Trash2, Eye } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  loading?: boolean;
  empty?: string;
}

export default function DataTable<T extends { id: any }>({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  loading,
  empty = 'No data available',
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    setSortConfig({
      key,
      direction: sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const sortedData = sortConfig
    ? [...data].sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      })
    : data;

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (sortedData.length === 0) {
    return <div className="text-center py-8 text-gray-500">{empty}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                onClick={() => handleSort(String(col.key), col.sortable)}
                className={`px-6 py-3 text-left text-sm font-semibold text-gray-700 ${
                  col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {col.sortable && (
                    <div className="text-gray-400">
                      {sortConfig?.key === String(col.key) ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )
                      ) : (
                        <ChevronsUpDown size={16} />
                      )}
                    </div>
                  )}
                </div>
              </th>
            ))}
            {(onEdit || onDelete || onView) && <th className="px-6 py-3 text-sm font-semibold text-gray-700">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedData.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-6 py-4 text-sm text-gray-700">
                  {col.render ? col.render((item as any)[String(col.key)], item) : (item as any)[String(col.key)]}
                </td>
              ))}
              {(onEdit || onDelete || onView) && (
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        className="text-blue-500 hover:text-blue-700 transition"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-emerald-600 hover:text-emerald-700 transition"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="text-red-500 hover:text-red-700 transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
