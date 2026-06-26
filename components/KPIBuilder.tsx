"use client";

import React, { useState } from 'react';
import { useData, KPI } from '../context/DataContext';
import { PlusCircle, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function KPIBuilder() {
    const { columns, addKPI, kpis, removeKPI } = useData();
    const [name, setName] = useState('');
    const [dimension, setDimension] = useState('');
    const [metric, setMetric] = useState('');
    const [aggregation, setAggregation] = useState<KPI['aggregation']>('sum');
    const [chartType, setChartType] = useState<KPI['chartType']>('bar');
    const [color, setColor] = useState('#8884d8');
    const [showAnomalies, setShowAnomalies] = useState(false);
    const [anomalySensitivity, setAnomalySensitivity] = useState(0.6);
    const [timeGranularity, setTimeGranularity] = useState<KPI['timeGranularity']>('monthly');
    const [timeRange, setTimeRange] = useState<number>(0);

    const isDateColumn = (colName: string) => {
        const lower = colName.toLowerCase();
        return lower.includes('date') || lower.includes('time') || lower.includes('year') || lower.includes('month');
    };

    React.useEffect(() => {
        if (isDateColumn(metric)) {
            setAggregation('count');
        }
    }, [metric]);

    const handleAddKPI = () => {
        if (!name || !dimension || !metric) return;

        const newKPI: KPI = {
            id: Date.now().toString(),
            name,
            dimension,
            metric,
            aggregation,
            chartType,
            color,
            showAnomalies,
            anomalySensitivity,
            timeGranularity: isDateColumn(dimension) ? timeGranularity : undefined,
            timeRange: isDateColumn(dimension) ? timeRange : undefined,
        };

        addKPI(newKPI);
        setName('');
        setDimension('');
        setMetric('');
        setAggregation('sum');
        setChartType('bar'); // Reset to default
        setColor('#8884d8');
        setShowAnomalies(false);
        setAnomalySensitivity(0.6);
        setTimeGranularity('monthly');
        setTimeRange(0);
    };

    if (columns.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">KPI Builder</h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">KPI Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="e.g. Sales by Region"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                        {chartType === 'pie' ? 'Categorize By (Slices)' : 
                         chartType === 'scatter' ? 'X-Axis (Dimension)' : 'Dimension (X-Axis)'}
                    </label>
                    <select
                        value={dimension}
                        onChange={(e) => setDimension(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                        <option value="">Select Column</option>
                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                        {chartType === 'pie' ? 'Measure By (Value)' : 
                         chartType === 'scatter' ? 'Y-Axis (Metric)' : 'Metric (Y-Axis)'}
                    </label>
                    <select
                        value={metric}
                        onChange={(e) => setMetric(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                        <option value="">Select Column</option>
                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Aggregation</label>
                    <select
                        value={aggregation}
                        onChange={(e) => setAggregation(e.target.value as KPI['aggregation'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                        {!isDateColumn(metric) && <option value="sum">Sum</option>}
                        {!isDateColumn(metric) && <option value="average">Average</option>}
                        <option value="count">Count</option>
                        {!isDateColumn(metric) && <option value="min">Min</option>}
                        {!isDateColumn(metric) && <option value="max">Max</option>}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Chart Type</label>
                    <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value as KPI['chartType'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="area">Area Chart</option>
                        <option value="scatter">Scatter Plot</option>
                        <option value="radar">Radar Chart</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Color</label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer"
                    />
                </div>

                <div className="flex items-center gap-4 col-span-1 md:col-span-3 mt-2 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showAnomalies}
                            onChange={(e) => setShowAnomalies(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold text-gray-900">Detect Anomalies</span>
                    </label>

                    {showAnomalies && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 whitespace-nowrap">Sensitivity:</span>
                            <input
                                type="range"
                                min="0.1"
                                max="0.9"
                                step="0.1"
                                value={anomalySensitivity}
                                onChange={(e) => setAnomalySensitivity(parseFloat(e.target.value))}
                                className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className="text-xs font-mono text-blue-600 w-8">{anomalySensitivity}</span>
                        </div>
                    )}

                    {isDateColumn(dimension) && (
                        <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700">Group By:</span>
                                <select
                                    value={timeGranularity}
                                    onChange={(e) => setTimeGranularity(e.target.value as KPI['timeGranularity'])}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700">Range:</span>
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(parseInt(e.target.value))}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                                >
                                    <option value={0}>All Time</option>
                                    <option value={3}>Last 3 Months</option>
                                    <option value={6}>Last 6 Months</option>
                                    <option value={12}>Last 12 Months</option>
                                    <option value={24}>Last 2 Years</option>
                                    <option value={60}>Last 5 Years</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <button
                    onClick={handleAddKPI}
                    disabled={!name || !dimension || !metric}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <PlusCircle size={20} />
                    Add KPI
                </button>
            </div>

            {kpis.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Active KPIs</h3>
                    <div className="space-y-2">
                        {kpis.map((kpi) => (
                            <div key={kpi.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                                <div>
                                    <span className="font-semibold text-gray-900">{kpi.name}</span>
                                    <span className="text-sm text-gray-500 ml-2">
                                        {kpi.aggregation}({kpi.metric}) by {kpi.dimension} [{kpi.chartType}]
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeKPI(kpi.id)}
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
