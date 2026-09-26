# App Directory (`app/`)

This directory contains the Next.js 16 App Router pages, layout wrappers, global styles, and serverless API route handlers.

---

## Directory Structure & File Map

```
app/
├── api/
│   └── suggest/
│       └── route.ts         # POST route: Ephemeral Serverless Proxy Relay for Google Gemini API
├── favicon.ico              # Application browser favicon icon
├── globals.css              # Global CSS styles & Tailwind CSS directives
├── layout.tsx               # Root HTML metadata layout wrapper & font loader
└── page.tsx                 # Main application dashboard single-page container
```

---

## Technical Details

### 1. Root Page Container (`app/page.tsx`)
- **Type**: Client Component (`"use client"`)
- **Role**: Serves as the primary single-page application dashboard layout.
- **Workflow**:
  1. Wraps the dashboard with `<DataProvider>` context.
  2. Renders `<FileUpload />` prominently at the top.
  3. When data is present (`data.length > 0`), renders the reactive workflow modules in logical sequence:
     - `<DataCleaningReport />` (Data quality & transformation metrics)
     - `<EvaluationMetrics />` (Empirical ML tuning & performance evaluation panel)
     - `<DataPreview />` (Searchable tabular data viewer)
     - `<CorrelationMatrix />` (Pearson correlation matrix & natural language insights)
     - `<KPISuggestions />` (Heuristic KPI recommendation cards)
     - `<FilterBar />` (Dynamic row filter creator)
     - `<AdvancedAnalytics />` (Statistical macro summary)
     - `<CalculatedFieldBuilder />` & `<KPIBuilder />` (Custom KPI & formula tools)
     - `<DecisionSupportPanel />` (AI decision panel)
     - `<DashboardGrid />` (Main Recharts visualization grid)

### 2. Root Layout & Metadata (`app/layout.tsx`)
- **Role**: Configures the base HTML document structure, language attributes, metadata titles, and global font family (Geist font optimization).

### 3. Serverless API Proxy Route (`app/api/suggest/route.ts`)
- **Route**: `POST /api/suggest`
- **Role**: Ephemeral Security Proxy Relay for Google Gemini LLM suggestions.
- **Privacy Boundary**:
  - **Does NOT store dataset data**.
  - Receives schema column headers and top 5 sample rows from the client.
  - Relays the payload securely to Google's Gemini API (Gemini 2.5 / 3.6 Flash model) using the server-side API key (`GEMINI_API_KEY`) or client-provided key.
  - Returns context-aware natural language KPI recommendations and reasoning strings to the browser.
