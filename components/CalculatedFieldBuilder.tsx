"use client";

import React, { useState } from 'react';
import { useData, CalculatedField } from '../context/DataContext';
import { PlusCircle, Trash2, Calculator } from 'lucide-react';

export function CalculatedFieldBuilder() {
    const { columns, addCalculatedField, calculatedFields, removeCalculatedField } = useData();
    const [name, setName] = useState('');
    const [formula, setFormula] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAddField = () => {
        if (!name || !formula) return;

        // Basic validation
        if (calculatedFields.some(f => f.name === name)) {
            setError('Field name already exists');
            return;
        }
        setError(null);

        const newField: CalculatedField = {
            id: Date.now().toString(),
            name,
            formula,
        };

        addCalculatedField(newField);
        setName('');
        setFormula('');
    };

    const insertColumn = (col: string) => {
        setFormula(prev => prev + col);
    };

    const insertOperator = (op: string) => {
        setFormula(prev => prev + ' ' + op + ' ');
    };

    // Filter out existing calculated fields from the column list to avoid circular dependency (v1 limitation)
    // Actually, we can allow it if we are careful, but for now let's only allow base columns (roughly approximated by not showing calc fields in list if needed, 
    // but `columns` in context includes calc fields. For simplicity, let's just show all columns but warn user.)
    // Better: We should differentiate raw columns vs calculated. But context merges them.
    // For now, let's just list available columns.

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Calculator size={24} />
                Calculated Fields
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Field Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="e.g. Profit"
                    />

                    <label className="block text-sm font-semibold text-gray-900 mt-4 mb-1">Formula</label>
                    <textarea
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 text-gray-900 font-mono"
                        placeholder="Select columns and operators below..."
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

                    <div className="mt-4 flex flex-wrap gap-2">
                        {['+', '-', '*', '/', '(', ')'].map(op => (
                            <button
                                key={op}
                                onClick={() => insertOperator(op)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded text-lg font-bold text-gray-900 shadow-sm min-w-[3rem]"
                            >
                                {op}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleAddField}
                        disabled={!name || !formula}
                        className="mt-6 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <PlusCircle size={20} />
                        Create Field
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Available Columns (Click to Insert)</label>
                    <div className="border border-gray-200 rounded-md p-2 h-64 overflow-y-auto bg-gray-50 flex flex-col gap-2">
                        {columns.length === 0 ? (
                            <div className="text-gray-500 text-sm p-4 text-center italic">
                                No columns found. Please upload a CSV or Excel file first.
                            </div>
                        ) : (
                            columns.map(col => (
                                <button
                                    key={col}
                                    onClick={() => insertColumn(col)}
                                    className="text-left px-3 py-2 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-sm text-blue-900 font-semibold transition-colors shadow-sm"
                                    title={`Insert ${col}`}
                                >
                                    {col}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {calculatedFields.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Created Fields</h3>
                    <div className="space-y-2">
                        {calculatedFields.map((field) => (
                            <div key={field.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                                <div>
                                    <span className="font-semibold text-gray-900">{field.name}</span>
                                    <span className="text-sm text-gray-500 ml-2 font-mono bg-gray-200 px-1 rounded">
                                        = {field.formula}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeCalculatedField(field.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
