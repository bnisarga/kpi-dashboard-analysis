"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DataRow {
  [key: string]: any;
}

export interface KPI {
  id: string;
  name: string;
  dimension: string;
  metric: string;
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max';
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar';
  color?: string;
  showAnomalies?: boolean;
  anomalySensitivity?: number;
  timeGranularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  timeRange?: number; // In months, 0 for all
}

import { cleanData, CleaningReport } from '../utils/dataCleaning';
import { suggestKPIs } from '../utils/kpiSuggestions';

export interface Filter {
  id: string;
  column: string;
  operator: 'equals' | 'contains' | 'greater' | 'less';
  value: string;
}

export interface CalculatedField {
  id: string;
  name: string;
  formula: string; // e.g. "ColA + ColB"
}

interface DataContextType {
  data: DataRow[];
  columns: string[];
  kpis: KPI[];
  calculatedFields: CalculatedField[];
  filters: Filter[];
  cleaningReport: CleaningReport | null;
  suggestedKpis: KPI[];
  aiSuggestedKpis: (KPI & { reason?: string })[];
  isGeneratingAiSuggestions: boolean;
  generateAiSuggestions: (clientApiKey?: string) => Promise<string | null>;
  setData: (data: DataRow[]) => void;
  setColumns: (columns: string[]) => void;
  addKPI: (kpi: KPI) => void;
  updateKPI: (kpi: KPI) => void;
  removeKPI: (id: string) => void;
  addCalculatedField: (field: CalculatedField) => void;
  removeCalculatedField: (id: string) => void;
  addFilter: (filter: Filter) => void;
  removeFilter: (id: string) => void;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [calculatedFields, setCalculatedFields] = useState<CalculatedField[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [cleaningReport, setCleaningReport] = useState<CleaningReport | null>(null);
  const [suggestedKpis, setSuggestedKpis] = useState<KPI[]>([]);
  const [aiSuggestedKpis, setAiSuggestedKpis] = useState<(KPI & { reason?: string })[]>([]);
  const [isGeneratingAiSuggestions, setIsGeneratingAiSuggestions] = useState(false);

  // Derived state: data with calculated fields AND filters
  const data = React.useMemo(() => {
    let processed = rawData;

    // 1. Apply Calculated Fields
    if (calculatedFields.length > 0 && processed.length > 0) {
      // PERFORMANCE FIX: Pre-sort columns once, not for every row!
      const sortedCols = Object.keys(processed[0]).sort((a, b) => b.length - a.length);
      
      processed = processed.map(row => {
        const newRow = { ...row };
        calculatedFields.forEach(field => {
          try {
            let expression = field.formula;

            for (const col of sortedCols) {
              const val = Number(row[col]);
              const safeVal = isNaN(val) ? 0 : val;
              // split/join is faster than regex for simple exact matches
              expression = expression.split(col).join(String(safeVal));
            }

            if (/^[\d+\-*/().\s]+$/.test(expression)) {
              // eslint-disable-next-line no-new-func
              newRow[field.name] = Function(`"use strict"; return (${expression})`)();
            } else {
              newRow[field.name] = 0;
            }
          } catch (e) {
            newRow[field.name] = 0;
          }
        });
        return newRow;
      });
    }

    // 2. Apply Filters
    if (filters.length > 0) {
      processed = processed.filter(row => {
        return filters.every(filter => {
          const val = row[filter.column];
          if (val === undefined || val === null) return false;

          const rowValue = String(val).toLowerCase();
          const filterValue = filter.value.toLowerCase();
          const numRowValue = Number(val);
          const numFilterValue = Number(filter.value);

          switch (filter.operator) {
            case 'equals':
              return rowValue === filterValue;
            case 'contains':
              return rowValue.includes(filterValue);
            case 'greater':
              return !isNaN(numRowValue) && !isNaN(numFilterValue) && numRowValue > numFilterValue;
            case 'less':
              return !isNaN(numRowValue) && !isNaN(numFilterValue) && numRowValue < numFilterValue;
            default:
              return true;
          }
        });
      });
    }

    return processed;
  }, [rawData, calculatedFields, filters]);

  // Load from LocalStorage on mount
  React.useEffect(() => {
    const savedKpis = localStorage.getItem('kpis');
    const savedCalculatedFields = localStorage.getItem('calculatedFields');
    const savedAiKpis = localStorage.getItem('aiSuggestedKpis');
    if (savedKpis) setKpis(JSON.parse(savedKpis));
    if (savedCalculatedFields) setCalculatedFields(JSON.parse(savedCalculatedFields));
    if (savedAiKpis) setAiSuggestedKpis(JSON.parse(savedAiKpis));
  }, []);

  // Save to LocalStorage on change
  React.useEffect(() => {
    localStorage.setItem('kpis', JSON.stringify(kpis));
    localStorage.setItem('calculatedFields', JSON.stringify(calculatedFields));
    localStorage.setItem('aiSuggestedKpis', JSON.stringify(aiSuggestedKpis));
  }, [kpis, calculatedFields, aiSuggestedKpis]);

  // Update columns when calculated fields change
  React.useEffect(() => {
    if (rawData.length > 0) {
      const baseCols = Object.keys(rawData[0]);
      const calcCols = calculatedFields.map(f => f.name);
      setColumns([...baseCols, ...calcCols]);
    }
  }, [rawData, calculatedFields]);

  const handleSetData = (newData: DataRow[]) => {
    const { data: cleaned, report } = cleanData(newData);
    setRawData(cleaned);
    setCleaningReport(report);

    // Auto-suggest KPIs
    if (cleaned.length > 0) {
      const baseCols = Object.keys(cleaned[0]);
      const suggestions = suggestKPIs(cleaned, baseCols);
      setSuggestedKpis(suggestions);
    }
  };

  const addKPI = (kpi: KPI) => {
    setKpis((prev) => [...prev, kpi]);
  };

  const updateKPI = (kpi: KPI) => {
    setKpis((prev) => prev.map(k => k.id === kpi.id ? kpi : k));
  };

  const removeKPI = (id: string) => {
    setKpis((prev) => prev.filter((k) => k.id !== id));
  };

  const addCalculatedField = (field: CalculatedField) => {
    setCalculatedFields(prev => [...prev, field]);
  };

  const removeCalculatedField = (id: string) => {
    setCalculatedFields(prev => prev.filter(f => f.id !== id));
  };

  const addFilter = (filter: Filter) => {
    setFilters(prev => [...prev, filter]);
  };

  const removeFilter = (id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  };

  const generateAiSuggestions = async (clientApiKey?: string): Promise<string | null> => {
    if (data.length === 0 || columns.length === 0) {
      return 'No data available to analyze.';
    }

    setIsGeneratingAiSuggestions(true);
    try {
      // 1. Determine column types
      const columnTypes: Record<string, string> = {};
      columns.forEach(col => {
        const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
        const datePatterns = [/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/, /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/];
        const isDate = values.some(v => v instanceof Date) || (values.length > 0 && typeof values[0] === 'string' && datePatterns.some(p => p.test(values[0] as string)));
        if (isDate) {
          columnTypes[col] = 'datetime';
          return;
        }
        const numericValues = values.filter(v => {
          if (typeof v === 'number') return !isNaN(v);
          if (typeof v === 'string') {
            const clean = v.replace(/[^0-9.-]+/g, "");
            return clean !== '' && !isNaN(Number(clean)) && /[0-9]/.test(v);
          }
          return false;
        });
        if (numericValues.length > values.length * 0.7) {
          columnTypes[col] = 'numeric';
        } else {
          columnTypes[col] = 'categorical';
        }
      });

      // 2. Prepare sample rows (first 5 rows)
      const sampleData = data.slice(0, 5);

      // 3. Request route API
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columns,
          sampleData,
          columnTypes,
          clientApiKey
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        return resData.error || 'Failed to fetch AI suggestions';
      }

      if (resData.suggestions && Array.isArray(resData.suggestions)) {
        const formattedSuggestions = resData.suggestions.map((s: any) => ({
          id: `ai-suggest-${s.metric}-${s.dimension}-${Math.random().toString(36).substr(2, 5)}`,
          name: s.name,
          dimension: s.dimension,
          metric: s.metric,
          aggregation: s.aggregation,
          chartType: s.chartType,
          color: s.color || '#3b82f6',
          reason: s.reason
        }));
        setAiSuggestedKpis(formattedSuggestions);
        return null;
      } else {
        return 'Invalid response format from server';
      }
    } catch (e: any) {
      console.error(e);
      return e.message || 'An error occurred while generating suggestions.';
    } finally {
      setIsGeneratingAiSuggestions(false);
    }
  };

  const clearData = () => {
    setRawData([]);
    setColumns([]);
    setKpis([]);
    setCalculatedFields([]);
    setFilters([]);
    setCleaningReport(null);
    setSuggestedKpis([]);
    setAiSuggestedKpis([]);
  };

  return (
    <DataContext.Provider
      value={{
        data,
        columns,
        kpis,
        calculatedFields,
        filters,
        cleaningReport,
        suggestedKpis,
        aiSuggestedKpis,
        isGeneratingAiSuggestions,
        generateAiSuggestions,
        setData: handleSetData,
        setColumns,
        addKPI,
        updateKPI,
        removeKPI,
        addCalculatedField,
        removeCalculatedField,
        addFilter,
        removeFilter,
        clearData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
