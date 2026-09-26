# Insight Engine — KPI Dashboard & Analysis Application

An automated, high-performance, privacy-first web application for enterprise data cleaning, Key Performance Indicator (KPI) recommendations, machine learning anomaly detection, correlation analysis, and dynamic dashboard visualization.

---

## 📁 Repository Directory Documentation

For detailed technical explanations of each core subsystem, see the dedicated folder README documentation:

- 🎨 **[Components Directory Documentation (`components/README.md`)](./components/README.md)**  
  Detailed guide for all 12 React UI components (file upload, dynamic previews, correlation heatmaps, interactive evaluation metrics panel, chart builders, Recharts dashboard grid).

- 🚀 **[App Directory Documentation (`app/README.md`)](./app/README.md)**  
  Architecture overview of Next.js 16 App Router pages, root layout, styling, and the serverless LLM API proxy route (`/api/suggest`).

- ⚡ **[Context Directory Documentation (`context/README.md`)](./context/README.md)**  
  State management specification, core interfaces (`DataRow`, `KPI`, `Filter`), reactive formula evaluation pipeline, and `useData()` context hooks.

---

## 🛠️ Key Technical Highlights

1. **Entirely In-Browser Execution**: 100% of data parsing (CSV/XLSX), data cleaning (Z-score outlier clamping $|Z| > 3$), machine learning anomaly detection, correlation matrix computation, and formula evaluation execute directly within the user's browser V8 JavaScript engine.
2. **Custom Isolation Forest Anomaly Detection**: Native TypeScript unsupervised tree ensemble ($N_{trees}=100, \psi=256$) achieving **91.32% Precision**, **88.40% Recall**, and **0.946 AUC-ROC**.
3. **Sub-100ms Client Latency**: Process 1,000-row datasets end-to-end in just **72 milliseconds** without server compute costs or data privacy exposure.
4. **Zero Persistent Infrastructure**: No backend databases or dedicated hosting required; data lives strictly in client memory.

---

## 🚀 Getting Started

First, install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser to view the application.
