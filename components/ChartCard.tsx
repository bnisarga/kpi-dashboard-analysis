"use client";

import React, { useMemo } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
    ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { KPI, useData } from '../context/DataContext';
import { aggregateData, generateChartInsight } from '../utils/analytics';
import { IsolationForest } from '../utils/anomalyDetection';
import { AlertTriangle, Info } from 'lucide-react';

interface ChartCardProps {
    kpi: KPI;
}

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function ChartCard({ kpi }: ChartCardProps) {
    const { data, updateKPI } = useData();

    const COLORS = useMemo(() => {
        return kpi.color ? [kpi.color, ...DEFAULT_COLORS] : DEFAULT_COLORS;
    }, [kpi.color]);

    const chartData = useMemo(() => aggregateData(data, kpi), [data, kpi]);

    const insight = useMemo(() => generateChartInsight(data, kpi, chartData), [data, kpi, chartData]);

    const anomalyInfo = useMemo(() => {
        if (!kpi.showAnomalies || chartData.length === 0) return { anomalies: [], riskScore: 0 };

        const forest = new IsolationForest(100, 256);
        // Map chart data to a format the forest can use (just the values)
        const forestData = chartData.map(d => ({ [kpi.metric]: d.value }));
        forest.fit(forestData, [kpi.metric]);
        const results = forest.predict(forestData);

        // Filter anomalies based on sensitivity (1 - sensitivity because higher score in forest = more anomalous)
        const threshold = 1 - (kpi.anomalySensitivity || 0.6);
        const anomalies = results.filter(r => r.score > (kpi.anomalySensitivity || 0.6)).map(r => ({
            ...chartData[r.index],
            index: r.index
        }));

        return {
            anomalies,
            riskScore: Math.round((anomalies.length / chartData.length) * 100)
        };
    }, [chartData, kpi.showAnomalies, kpi.metric, kpi.anomalySensitivity]);

    const renderAnomalies = () => {
        if (!kpi.showAnomalies || anomalyInfo.anomalies.length === 0) return null;

        // Recharts Scatter needs its own ResponsiveContainer or can be added to the chart?
        // Actually, we can just add a Scatter component to the existing charts!
        return (
            <path /> // Placeholder for now, actually we'll add Scatter to the switch
        );
    };

    const renderChart = () => {
        const commonAxisProps = {
            axisLine: false,
            tickLine: false,
            tick: { fill: '#6b7280', fontSize: 12 }
        };

        const tooltipStyle = {
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            padding: '8px 12px'
        };

        switch (kpi.chartType) {
            case 'bar':
                return (
                    <BarChart data={chartData}>
                        <defs>
                            <linearGradient id={`barGradient-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={kpi.color || "#3b82f6"} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={kpi.color || "#3b82f6"} stopOpacity={0.2} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" {...commonAxisProps} />
                        <YAxis {...commonAxisProps} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f9fafb' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar
                            dataKey="value"
                            fill={`url(#barGradient-${kpi.id})`}
                            name={kpi.metric}
                            radius={[4, 4, 0, 0]}
                            barSize={Math.min(40, 400 / chartData.length)}
                        />
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" {...commonAxisProps} />
                        <YAxis {...commonAxisProps} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={kpi.color || "#3b82f6"}
                            strokeWidth={3}
                            dot={{ r: 4, fill: kpi.color || "#3b82f6", strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            name={kpi.metric}
                        />
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`areaGradient-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={kpi.color || "#3b82f6"} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={kpi.color || "#3b82f6"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" {...commonAxisProps} />
                        <YAxis {...commonAxisProps} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={kpi.color || "#3b82f6"}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#areaGradient-${kpi.id})`}
                            name={kpi.metric}
                        />
                    </AreaChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" />
                    </PieChart>
                );
            case 'scatter':
                return (
                    <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis type="number" dataKey="x" name={kpi.dimension} {...commonAxisProps} />
                        <YAxis type="number" dataKey="y" name={kpi.metric} {...commonAxisProps} />
                        <ZAxis type="number" range={[60, 400]} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
                        <Legend iconType="circle" />
                        <Scatter
                            name={kpi.name}
                            data={chartData}
                            fill={kpi.color || "#ef4444"}
                        />
                    </ScatterChart>
                );
            case 'radar':
                return (
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <Radar
                            name={kpi.metric}
                            dataKey="value"
                            stroke={kpi.color || "#6366f1"}
                            fill={kpi.color || "#6366f1"}
                            fillOpacity={0.5}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend iconType="circle" />
                    </RadarChart>
                );
            default:
                return null;
        }
    };

    const isDateColumn = (colName: string) => {
        const lower = colName.toLowerCase();
        return lower.includes('date') || lower.includes('time') || lower.includes('year') || lower.includes('month');
    };

    const handleUpdate = (updates: Partial<KPI>) => {
        updateKPI({ ...kpi, ...updates });
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 relative group">
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{kpi.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                        <select 
                            value={kpi.aggregation}
                            onChange={(e) => handleUpdate({ aggregation: e.target.value as any })}
                            className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                        >
                            {!isDateColumn(kpi.metric) && <option value="sum">Sum</option>}
                            {!isDateColumn(kpi.metric) && <option value="average">Avg</option>}
                            <option value="count">Count</option>
                            {!isDateColumn(kpi.metric) && <option value="min">Min</option>}
                            {!isDateColumn(kpi.metric) && <option value="max">Max</option>}
                        </select>

                        {isDateColumn(kpi.dimension) && (
                            <>
                                <select 
                                    value={kpi.timeGranularity || 'monthly'}
                                    onChange={(e) => handleUpdate({ timeGranularity: e.target.value as any })}
                                    className="text-[10px] bg-blue-50 border border-blue-100 rounded px-1 py-0.5 text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>

                                <select 
                                    value={kpi.timeRange || 0}
                                    onChange={(e) => handleUpdate({ timeRange: parseInt(e.target.value) })}
                                    className="text-[10px] bg-purple-50 border border-purple-100 rounded px-1 py-0.5 text-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer"
                                >
                                    <option value={0}>All Time</option>
                                    <option value={6}>6m</option>
                                    <option value={12}>12m</option>
                                    <option value={24}>2y</option>
                                </select>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {kpi.showAnomalies && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${anomalyInfo.riskScore > 20 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            <AlertTriangle size={14} />
                            {anomalyInfo.riskScore}%
                        </div>
                    )}
                </div>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart() || <div>Unknown Chart Type</div>}
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50/50 -mx-4 px-4 py-4 rounded-b-lg">
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 p-1 rounded">
                        <Info size={14} className="text-blue-600" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">AI Data Takeaways</span>
                </div>
                <div className="space-y-3">
                    {insight.split('\n\n').map((segment, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                            <p className="text-xs text-gray-700 leading-relaxed">
                                {segment.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                    part.startsWith('**') && part.endsWith('**') ?
                                        <strong key={i} className="text-gray-900 border-b border-blue-200">{part.slice(2, -2)}</strong> :
                                        part
                                )}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
