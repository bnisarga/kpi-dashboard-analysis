"use client";

import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { IsolationForest } from '../utils/anomalyDetection';
import { generateInsights, DecisionInsight } from '../utils/decisionSupport';
import { calculateKeyDrivers, KeyDriver } from '../utils/analytics';
import { Lightbulb, AlertTriangle, TrendingUp, Info, Zap } from 'lucide-react';

export function DecisionSupportPanel() {
    const { kpis, data } = useData();

    const insights = useMemo(() => {
        if (kpis.length === 0 || data.length === 0) return [];

        const allInsights: (DecisionInsight & { kpiName: string })[] = [];

        kpis.forEach(kpi => {
            // For decision support, we analyze the main metric of each KPI
            const forest = new IsolationForest(100, 256);
            const forestData = data.map(d => ({ [kpi.metric]: Number(d[kpi.metric]) || 0 }));
            forest.fit(forestData, [kpi.metric]);
            const anomalies = forest.predict(forestData);

            const kpiInsights = generateInsights(data, anomalies, kpi.name);
            kpiInsights.forEach(insight => {
                allInsights.push({ ...insight, kpiName: kpi.name });
            });
        });

        return allInsights;
    }, [kpis, data]);

    const activeDrivers = useMemo(() => {
        if (kpis.length === 0 || data.length === 0) return [];

        // Get all unique dimensions used across all KPIs
        const dimensions = Array.from(new Set(kpis.map(k => k.dimension)));
        // For simplicity, we analyze the metric of the first KPI for global drivers
        // or we could iterate through all KPIs. Let's iterate through all currently visible KPIs metrics.
        const metrics = Array.from(new Set(kpis.map(k => k.metric)));

        const allDrivers: (KeyDriver & { metric: string })[] = [];
        metrics.forEach(metric => {
            const drivers = calculateKeyDrivers(data, metric, dimensions);
            if (drivers.length > 0) {
                allDrivers.push({ ...drivers[0], metric }); // Add the top driver for each metric
            }
        });

        return allDrivers;
    }, [kpis, data]);

    if (kpis.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-8">
            <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="text-yellow-500" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Decision Support & Insights</h2>
            </div>

            <div className="space-y-4">
                {insights.length > 0 ? (
                    insights.map((insight, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border flex gap-4 ${insight.type === 'risk' ? 'bg-red-50 border-red-100' :
                                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-100' :
                                    'bg-blue-50 border-blue-100'
                                }`}
                        >
                            <div className="mt-1">
                                {insight.type === 'risk' ? <AlertTriangle className="text-red-500" size={20} /> :
                                    insight.type === 'warning' ? <AlertTriangle className="text-yellow-500" size={20} /> :
                                        <TrendingUp className="text-blue-500" size={20} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">
                                    [{insight.kpiName}] {insight.message}
                                </h3>
                                <p className="text-gray-700 text-sm">
                                    <span className="font-semibold text-gray-900">Recommendation:</span> {insight.recommendation}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-500">
                        <Info size={20} />
                        <p>Gathering more data to provide actionable insights...</p>
                    </div>
                )}
            </div>

            {activeDrivers.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Zap className="text-purple-500" size={24} />
                        <h2 className="text-xl font-bold text-gray-900">Key Driver & Impact Analysis</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeDrivers.map((driver, index) => (
                            <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Top Driver for {driver.metric}</span>
                                    <span className="text-xs font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                                        {driver.impactScore}% impact
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    {driver.dimension}
                                </h3>
                                <p className="text-sm text-gray-700">
                                    The primary factor is <span className="font-bold">{driver.topCategory}</span>,
                                    which accounts for <span className="font-bold">{driver.contribution}%</span> of the total {driver.metric}.
                                </p>
                                <div className="mt-3 w-full bg-purple-200 rounded-full h-1.5">
                                    <div
                                        className="bg-purple-600 h-1.5 rounded-full"
                                        style={{ width: `${driver.impactScore}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
