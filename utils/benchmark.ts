import { cleanData } from './dataCleaning';
import { IsolationForest } from './anomalyDetection';
import { suggestKPIs } from './kpiSuggestions';
import { generateCorrelationMatrix } from './correlation';

export interface BenchmarkMetrics {
    datasetSize: number;
    cleaningTimeMs: number;
    anomalyDetectionTimeMs: number;
    kpiSuggestionTimeMs: number;
    correlationTimeMs: number;
    totalTimeMs: number;
}

export function generateBenchmarkData(rowCount: number) {
    const data = [];
    const categories = ['North', 'South', 'East', 'West'];
    const segments = ['Consumer', 'Corporate', 'Home Office'];

    for (let i = 0; i < rowCount; i++) {
        // Inject anomalies into ~5% of data points
        const isAnomaly = Math.random() < 0.05;
        const sales = isAnomaly 
            ? Math.floor(Math.random() * 50000) + 20000 
            : Math.floor(Math.random() * 1000) + 50;

        data.push({
            id: i + 1,
            Date: `2024-01-${(i % 28) + 1}`,
            Region: categories[i % categories.length],
            Segment: segments[i % segments.length],
            Sales: sales,
            Profit: isAnomaly ? -5000 : sales * (0.1 + Math.random() * 0.2),
            Quantity: Math.floor(Math.random() * 10) + 1,
            Discount: Math.random() * 0.3
        });
    }

    return data;
}

export function runBenchmark(rowCount: number): BenchmarkMetrics {
    const rawData = generateBenchmarkData(rowCount);

    // 1. Data Cleaning Latency
    const t0 = performance.now();
    const { data: cleanedData } = cleanData(rawData);
    const t1 = performance.now();
    const cleaningTimeMs = Math.round((t1 - t0) * 100) / 100;

    // 2. Isolation Forest Anomaly Detection
    const columns = ['Sales', 'Profit', 'Quantity', 'Discount'];
    const t2 = performance.now();
    const forest = new IsolationForest(100, 256);
    forest.fit(cleanedData, columns);
    forest.predict(cleanedData);
    const t3 = performance.now();
    const anomalyDetectionTimeMs = Math.round((t3 - t2) * 100) / 100;

    // 3. KPI Suggestion Latency
    const t4 = performance.now();
    suggestKPIs(cleanedData, Object.keys(cleanedData[0] || {}));
    const t5 = performance.now();
    const kpiSuggestionTimeMs = Math.round((t5 - t4) * 100) / 100;

    // 4. Correlation Matrix Latency
    const t6 = performance.now();
    generateCorrelationMatrix(cleanedData, columns);
    const t7 = performance.now();
    const correlationTimeMs = Math.round((t7 - t6) * 100) / 100;

    const totalTimeMs = Math.round((cleaningTimeMs + anomalyDetectionTimeMs + kpiSuggestionTimeMs + correlationTimeMs) * 100) / 100;

    return {
        datasetSize: rowCount,
        cleaningTimeMs,
        anomalyDetectionTimeMs,
        kpiSuggestionTimeMs,
        correlationTimeMs,
        totalTimeMs
    };
}
