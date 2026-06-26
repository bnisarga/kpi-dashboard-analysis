"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { generateCorrelationMatrix, generateCorrelationInsights } from '../utils/correlation';
import { Activity, Info, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';

export function CorrelationMatrix() {
    const { data, columns } = useData();
    const [selectedCols, setSelectedCols] = useState<string[]>([]);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Initial selection: first 5-6 columns that look numeric or interesting
    useEffect(() => {
        if (columns.length > 0 && selectedCols.length === 0) {
            const initial = columns.slice(0, 6);
            setSelectedCols(initial);
        }
    }, [columns]);

    const matrixData = useMemo(() => {
        if (selectedCols.length < 2) return null;
        return generateCorrelationMatrix(data, selectedCols);
    }, [data, selectedCols]);

    const insights = useMemo(() => {
        if (!matrixData) return [];
        return generateCorrelationInsights(matrixData);
    }, [matrixData]);

    // If no data yet, nothing to show
    if (data.length === 0 || columns.length < 2) return null;

    const getColor = (value: number) => {
        const opacity = Math.abs(value);
        if (value > 0) return `rgba(59, 130, 246, ${opacity})`; 
        return `rgba(239, 68, 68, ${opacity})`;
    };

    const toggleColumn = (col: string) => {
        setSelectedCols(prev => 
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Toggle button */}
            <button
                onClick={() => setIsOpen(v => !v)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
            >
                <div className="flex items-center gap-2">
                    <Activity className="text-blue-500" size={20} />
                    <span className="font-semibold text-gray-900 text-sm">Variable Correlation Analysis</span>
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">Click to {isOpen ? 'hide' : 'generate'}</span>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {isOpen && (
        <div className="p-6">
            {!matrixData ? (
                <p className="text-sm text-gray-500 py-4 text-center">Select at least 2 columns with numeric data to generate the correlation matrix.</p>
            ) : (<>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <p className="text-xs text-gray-500">Discover hidden relationships between metrics and categories</p>
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Select Columns ({selectedCols.length})
                        <ChevronDown size={16} className={`transition-transform ${isSelectorOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSelectorOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto p-2">
                            {columns.map(col => (
                                <div 
                                    key={col}
                                    onClick={() => toggleColumn(col)}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                                >
                                    {selectedCols.includes(col) ? 
                                        <CheckSquare size={16} className="text-blue-500" /> : 
                                        <Square size={16} className="text-gray-300" />
                                    }
                                    <span className="text-sm text-gray-700 truncate">{col}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto pb-4">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="p-2"></th>
                            {matrixData.columns.map(col => (
                                <th key={col} className="p-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                                    <div className="writing-mode-vertical transform -rotate-45 h-12 w-12 flex items-center justify-center mx-auto">
                                        {col}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrixData.matrix.map((row, i) => (
                            <tr key={matrixData.columns[i]}>
                                <td className="p-2 text-xs font-bold text-gray-700 border-r border-gray-100 whitespace-nowrap pr-4">
                                    {matrixData.columns[i]}
                                </td>
                                {row.map((val, j) => (
                                    <td 
                                        key={j} 
                                        className="p-3 text-center border border-white transition-opacity hover:opacity-80 group cursor-default"
                                        style={{ backgroundColor: getColor(val) }}
                                        title={`${matrixData.columns[i]} vs ${matrixData.columns[j]}: ${val.toFixed(3)}`}
                                    >
                                        <span className={`text-[10px] font-bold ${Math.abs(val) > 0.4 ? 'text-white' : 'text-gray-900 opacity-60'}`}>
                                            {val.toFixed(2)}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex gap-6 text-[10px] text-gray-400 justify-center border-t border-gray-50 pt-4">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
                    <span>Direct Relation (+)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
                    <span>Inverse Relation (-)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Info size={12} />
                    <span>Included string columns are encoded for analysis</span>
                </div>
            </div>

            {insights.length > 0 && (
                <div className="mt-8 bg-blue-50/50 rounded-xl p-5 border border-blue-100/50">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-blue-500 p-1 rounded-md text-white">
                            <Activity size={14} />
                        </div>
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-tight">Key Relationship Insights</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.map((insight, idx) => (
                            <div key={idx} className="flex gap-3 items-start bg-white/80 p-3 rounded-lg border border-blue-50 shadow-sm">
                                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${Math.abs(insight.score) > 0.8 ? 'bg-blue-600' : 'bg-blue-300'}`}></div>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                    {insight.description.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                        part.startsWith('**') && part.endsWith('**') ?
                                            <strong key={i} className="text-blue-900">{part.slice(2, -2)}</strong> :
                                            part
                                    )}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            </>)}
        </div>
            )}
        </div>
    );
}
