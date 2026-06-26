"use client";

import React from 'react';
import { DataProvider, useData } from '../context/DataContext';
import { FileUpload } from '../components/FileUpload';
import { DataPreview } from '../components/DataPreview';
import { KPIBuilder } from '../components/KPIBuilder';
import { CalculatedFieldBuilder } from '../components/CalculatedFieldBuilder';
import { FilterBar } from '../components/FilterBar';
import { DashboardGrid } from '../components/DashboardGrid';
import { DataCleaningReport } from '../components/DataCleaningReport';
import { KPISuggestions } from '../components/KPISuggestions';
import { DecisionSupportPanel } from '../components/DecisionSupportPanel';
import { CorrelationMatrix } from '../components/CorrelationMatrix';
import { AdvancedAnalytics } from '../components/AdvancedAnalytics';

function DashboardContent() {
  const { data } = useData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          Insight Engine
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Upload your data, define your KPIs, and visualize your success.
        </p>
      </div>

      <div className={`space-y-6 ${data.length === 0 ? 'max-w-xl mx-auto' : ''}`}>
        {/* File upload bar — always visible */}
        <FileUpload />

        {data.length > 0 && (
          <>
            {/* Data quality report — inline block right below the file bar */}
            <DataCleaningReport />

            {/* Data preview with load-more */}
            <DataPreview />

            {/* Correlation matrix — collapsed by default, click to reveal */}
            <CorrelationMatrix />

            {/* KPI suggestions */}
            <KPISuggestions />

            {/* Filters */}
            <FilterBar />

            {/* Advanced analytics */}
            <AdvancedAnalytics />

            {/* Calculated fields + KPI builder */}
            <CalculatedFieldBuilder />
            <KPIBuilder />

            {/* AI decision panel + final dashboard */}
            <DecisionSupportPanel />
            <DashboardGrid />
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <DataProvider>
      <main className="min-h-screen bg-white">
        <DashboardContent />
      </main>
    </DataProvider>
  );
}
