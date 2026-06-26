"use client";

import React, { useState } from 'react';
import { useData, Filter } from '../context/DataContext';
import { Filter as FilterIcon, X } from 'lucide-react';

export function FilterBar() {
    const { columns, addFilter, filters, removeFilter } = useData();
    const [column, setColumn] = useState('');
    const [operator, setOperator] = useState<Filter['operator']>('equals');
    const [value, setValue] = useState('');

    const handleAddFilter = () => {
        if (!column || !value) return;

        const newFilter: Filter = {
            id: Date.now().toString(),
            column,
            operator,
            value,
        };

        addFilter(newFilter);
        setColumn('');
        setValue('');
        setOperator('equals');
    };

    if (columns.length === 0) return null;

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mt-8 mb-4">
            <h2 className="text-lg font-medium mb-3 text-gray-800 flex items-center gap-2">
                <FilterIcon size={20} />
                Global Filters
            </h2>

            <div className="flex flex-wrap gap-2 items-center">
                <select
                    value={column}
                    onChange={(e) => setColumn(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                    <option value="">Select Column</option>
                    {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>

                <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value as Filter['operator'])}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater">Greater Than</option>
                    <option value="less">Less Than</option>
                </select>

                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Value"
                />

                <button
                    onClick={handleAddFilter}
                    disabled={!column || !value}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Add Filter
                </button>
            </div>

            {filters.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {filters.map(filter => (
                        <div key={filter.id} className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200 text-sm">
                            <span>{filter.column} {filter.operator} "{filter.value}"</span>
                            <button
                                onClick={() => removeFilter(filter.id)}
                                className="hover:text-blue-900"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
