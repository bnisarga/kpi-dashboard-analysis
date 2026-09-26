# Context Directory (`context/`)

This directory contains the central React Context provider (`DataContext.tsx`) responsible for state management, data preprocessing execution, reactive formula evaluation, row filtering, and LocalStorage persistence across the application.

---

## Technical Overview: `DataContext.tsx`

### Core Interfaces

```typescript
// Generic record object for parsed dataset rows
export interface DataRow {
    [key: string]: any;
}

// Key Performance Indicator definition structure
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
    timeRange?: number;
}

// Row filtering specification
export interface Filter {
    id: string;
    column: string;
    operator: 'equals' | 'contains' | 'greater' | 'less';
    value: string;
}

// User-defined dynamic calculated formula
export interface CalculatedField {
    id: string;
    name: string;
    formula: string; // e.g., "[Sales] - [Cost]"
}
```

---

## Key Responsibilities & Workflows

### 1. Ingest & Data Preprocessing Trigger (`setData`)
When a raw parsed dataset array is received from `FileUpload.tsx`:
1. Executes `cleanData(rawData)` from `../utils/dataCleaning.ts`.
2. Stores cleaned dataset in `rawData` state and updates `cleaningReport`.
3. Runs `suggestKPIs(cleaned, baseCols)` from `../utils/kpiSuggestions.ts` to populate heuristic `suggestedKpis`.

### 2. Reactive Data Transformation Pipeline (`useMemo`)
The exported `data` state is dynamically derived in real time:
1. **Calculated Field Evaluation**: Evaluates custom math formulas (e.g. `[Sales] - [Cost]`) in-memory using row-by-row string replacement and strict JavaScript `Function()` evaluation inside browser V8 memory.
2. **Filter Application**: Filters dataset rows reactively based on active user filter rules (`equals`, `contains`, `greater`, `less`).

### 3. LocalStorage Persistence
Automatically persists active KPIs, calculated fields, and AI suggestions to `localStorage` (`kpis`, `calculatedFields`, `aiSuggestedKpis`), restoring workspace state upon page refresh.

### 4. Custom Context Hook (`useData`)
Exposes full state and manipulation handlers to all components:
```typescript
const { 
    data, 
    columns, 
    kpis, 
    cleaningReport, 
    suggestedKpis, 
    addKPI, 
    removeKPI, 
    addFilter, 
    addCalculatedField 
} = useData();
```
