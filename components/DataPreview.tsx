"use client";

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ROWS_PER_PAGE = 10;

export function DataPreview() {
    const { data, columns } = useData();
    const [visibleCount, setVisibleCount] = useState(ROWS_PER_PAGE);

    if (!data || data.length === 0) {
        return null;
    }

    const previewData = data.slice(0, visibleCount);
    const hasMore = visibleCount < data.length;

    const loadMore = () => {
        setVisibleCount(prev => Math.min(prev + ROWS_PER_PAGE, data.length));
    };

    const collapse = () => {
        setVisibleCount(ROWS_PER_PAGE);
    };

    return (
        <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-700">{previewData.length}</span> of{' '}
                        <span className="font-medium text-gray-700">{data.length}</span> rows
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {previewData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                                {columns.map((col) => (
                                    <td
                                        key={`${rowIndex}-${col}`}
                                        className="px-6 py-3 whitespace-nowrap text-sm text-gray-600"
                                    >
                                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Load more / Collapse footer */}
            {data.length > ROWS_PER_PAGE && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-center gap-3">
                    {hasMore && (
                        <button
                            onClick={loadMore}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                            <ChevronDown size={15} />
                            Load {Math.min(ROWS_PER_PAGE, data.length - visibleCount)} more rows
                        </button>
                    )}
                    {visibleCount > ROWS_PER_PAGE && (
                        <button
                            onClick={collapse}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors"
                        >
                            <ChevronUp size={15} />
                            Collapse
                        </button>
                    )}
                    {!hasMore && visibleCount <= ROWS_PER_PAGE && (
                        <span className="text-sm text-gray-400">All {data.length} rows shown</span>
                    )}
                </div>
            )}
        </div>
    );
}
