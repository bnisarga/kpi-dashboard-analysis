"use client";

import React from 'react';
import { useData } from '../context/DataContext';
import { ChartCard } from './ChartCard';

export function DashboardGrid() {
    const { kpis } = useData();

    if (kpis.length === 0) {
        return null;
    }

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {kpis.map((kpi) => (
                    <ChartCard key={kpi.id} kpi={kpi} />
                ))}
            </div>
        </div>
    );
}
