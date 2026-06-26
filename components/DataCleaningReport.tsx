"use client";

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export function DataCleaningReport() {
    const { cleaningReport } = useData();
    const [expanded, setExpanded] = useState(true);

    if (!cleaningReport) return null;

    const hasChanges =
        cleaningReport.rowsRemoved > 0 ||
        cleaningReport.trimmedCells > 0 ||
        cleaningReport.missingValuesFound > 0 ||
        cleaningReport.outliersDetected > 0 ||
        (cleaningReport.duplicateRowsRemoved && cleaningReport.duplicateRowsRemoved > 0);

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header row — always visible */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
            >
                <div className="flex items-center gap-2">
                    {hasChanges ? (
                        <AlertTriangle className="text-amber-500" size={20} />
                    ) : (
                        <CheckCircle className="text-green-500" size={20} />
                    )}
                    <span className="font-semibold text-gray-900 text-sm">
                        Data Quality Report
                    </span>
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">
                        {cleaningReport.totalRows} rows
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    {hasChanges ? (
                        <span className="text-amber-600 font-medium">Changes applied</span>
                    ) : (
                        <span className="text-green-600 font-medium">Clean data</span>
                    )}
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </button>

            {/* Expandable detail panel */}
            {expanded && (
                <div className="px-6 py-4">
                    {hasChanges ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {cleaningReport.rowsRemoved > 0 && (
                                <div className="flex flex-col gap-0.5 bg-orange-50 border border-orange-100 rounded-lg p-3">
                                    <span className="text-xs text-orange-500 font-semibold uppercase tracking-wide">Empty Rows Removed</span>
                                    <span className="text-2xl font-bold text-orange-700">{cleaningReport.rowsRemoved}</span>
                                </div>
                            )}
                            {cleaningReport.missingValuesFound > 0 && (
                                <div className="flex flex-col gap-0.5 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                                    <span className="text-xs text-yellow-600 font-semibold uppercase tracking-wide">Missing Values Fixed</span>
                                    <span className="text-2xl font-bold text-yellow-700">{cleaningReport.missingValuesFound}</span>
                                </div>
                            )}
                            {cleaningReport.outliersDetected > 0 && (
                                <div className="flex flex-col gap-0.5 bg-red-50 border border-red-100 rounded-lg p-3">
                                    <span className="text-xs text-red-500 font-semibold uppercase tracking-wide">Outliers Clamped</span>
                                    <span className="text-2xl font-bold text-red-700">{cleaningReport.outliersDetected}</span>
                                </div>
                            )}
                            {cleaningReport.trimmedCells > 0 && (
                                <div className="flex flex-col gap-0.5 bg-blue-50 border border-blue-100 rounded-lg p-3">
                                    <span className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Whitespace Trimmed</span>
                                    <span className="text-2xl font-bold text-blue-700">{cleaningReport.trimmedCells}</span>
                                </div>
                            )}
                            {(cleaningReport.datesConverted ?? 0) > 0 && (
                                <div className="flex flex-col gap-0.5 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                                    <span className="text-xs text-indigo-500 font-semibold uppercase tracking-wide">Dates Standardized</span>
                                    <span className="text-2xl font-bold text-indigo-700">{cleaningReport.datesConverted}</span>
                                </div>
                            )}
                            {(cleaningReport.duplicateRowsRemoved ?? 0) > 0 && (
                                <div className="flex flex-col gap-0.5 bg-purple-50 border border-purple-100 rounded-lg p-3">
                                    <span className="text-xs text-purple-500 font-semibold uppercase tracking-wide">Duplicates Removed</span>
                                    <span className="text-2xl font-bold text-purple-700">{cleaningReport.duplicateRowsRemoved}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-green-700 font-medium">
                            ✓ No data quality issues detected. Your dataset is clean and ready to use.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
