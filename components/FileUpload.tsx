"use client";

import React, { useCallback, useState } from 'react';
import { useData } from '../context/DataContext';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function FileUpload() {
    const { setData, data, clearData } = useData();
    const [isDragOver, setIsDragOver] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const hasData = data.length > 0;

    const processFile = (file: File) => {
        setLoading(true);
        setError(null);
        setFileName(file.name);

        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setData(results.data as any[]);
                    setLoading(false);
                },
                error: (err) => {
                    setError(`Error parsing CSV: ${err.message}`);
                    setLoading(false);
                },
            });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    setData(jsonData as any[]);
                } catch (err) {
                    setError(`Error parsing Excel file`);
                } finally {
                    setLoading(false);
                }
            };
            reader.readAsBinaryString(file);
        } else {
            setError('Unsupported file format. Please upload CSV or Excel.');
            setLoading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        // reset input so same file can be reloaded
        e.target.value = '';
    };

    const handleClear = () => {
        clearData();
        setFileName(null);
        setError(null);
        setShowConfirm(false);
    };

    // ── When data is already loaded, show a compact "replace file" bar ──
    if (hasData) {
        return (
            <div className="flex items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3">
                <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500 shrink-0" size={20} />
                    <div>
                        <p className="text-sm font-medium text-gray-800">
                            {fileName ?? 'Dataset loaded'} &mdash; {data.length} rows
                        </p>
                        <p className="text-xs text-gray-500">CSV or Excel file</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Upload replacement */}
                    <label
                        htmlFor="file-upload-replace"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors"
                    >
                        <RefreshCw size={14} />
                        Replace file
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload-replace"
                        />
                    </label>

                    {/* Clear / confirm */}
                    {showConfirm ? (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-red-600 font-medium">Clear all data?</span>
                            <button
                                onClick={handleClear}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                            >
                                Yes, clear
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                            <X size={14} />
                            Clear data
                        </button>
                    )}
                </div>

                {error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
            </div>
        );
    }

    // ── Initial upload zone ──
    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={twMerge(
                "border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
                isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                "flex flex-col items-center justify-center gap-4"
            )}
        >
            <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full h-full">
                <div className="p-4 bg-gray-100 rounded-full">
                    {loading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    ) : error ? (
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    ) : (
                        <Upload className="w-8 h-8 text-gray-500" />
                    )}
                </div>

                <div className="space-y-1">
                    <p className="font-medium text-gray-700">
                        {loading ? 'Processing...' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-500">
                        {error ? <span className="text-red-500">{error}</span> : 'CSV or Excel files'}
                    </p>
                </div>
            </label>
        </div>
    );
}
