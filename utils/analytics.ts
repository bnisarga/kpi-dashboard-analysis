import { DataRow, KPI } from '../context/DataContext';
import _ from 'lodash';

export interface ChartDataPoint {
    name: string;
    value: number;
    x?: number;
    y?: number;
}

export function aggregateData(data: DataRow[], kpi: KPI): ChartDataPoint[] {
    const { dimension, metric, aggregation, chartType, timeGranularity, timeRange } = kpi;

    let processedData = [...data];

    // 1. Time-based filtering
    if (timeRange && timeRange > 0) {
        const now = new Date();
        const cutoff = new Date();
        cutoff.setMonth(now.getMonth() - timeRange);
        
        processedData = processedData.filter(row => {
            const val = row[dimension];
            if (val instanceof Date) return val >= cutoff;
            const date = new Date(val);
            return !isNaN(date.getTime()) && date >= cutoff;
        });
    }

    if (chartType === 'scatter') {
        const uniqueDims = Array.from(new Set(processedData.map(d => String(d[dimension]))));
        const dimMap = new Map(uniqueDims.map((d, i) => [d, i]));

        return processedData.slice(0, 200).map((row, i) => {
            const rawX = row[dimension];
            const rawY = row[metric];
            
            let x: number;
            if (typeof rawX === 'number') {
                x = rawX;
            } else {
                const cleanX = String(rawX).replace(/[^0-9.-]+/g, "");
                x = (cleanX !== '' && !isNaN(Number(cleanX)) && /[0-9]/.test(String(rawX))) 
                    ? Number(cleanX) 
                    : (dimMap.get(String(rawX)) || 0);
            }

            let y: number;
            if (typeof rawY === 'number') {
                y = rawY;
            } else {
                const cleanY = String(rawY).replace(/[^0-9.-]+/g, "");
                y = (cleanY !== '' && !isNaN(Number(cleanY)) && /[0-9]/.test(String(rawY)))
                    ? Number(cleanY)
                    : 0;
            }

            return {
                name: `Point ${i}`,
                x,
                y,
                value: y,
            };
        });
    }

    // 2. Group by dimension (with time handling)
    const grouped = _.groupBy(processedData, (row) => {
        const val = row[dimension];
        const date = val instanceof Date ? val : new Date(val);
        
        if (isNaN(date.getTime())) return String(val);

        switch (timeGranularity) {
            case 'daily':
                return date.toISOString().split('T')[0];
            case 'weekly': {
                const d = new Date(date);
                d.setDate(d.getDate() - d.getDay()); // Start of week
                return `Week of ${d.toISOString().split('T')[0]}`;
            }
            case 'monthly':
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            case 'quarterly':
                return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
            case 'yearly':
                return `${date.getFullYear()}`;
            default:
                return String(val);
        }
    });

    // 3. Aggregate metric
    const result = Object.keys(grouped).map((key) => {
        const group = grouped[key];
        const values = group.map((row) => {
            const val = row[metric];
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const clean = val.replace(/[^0-9.-]+/g, "");
                return clean !== '' ? Number(clean) : 0;
            }
            return 0;
        });

        let value = 0;
        switch (aggregation) {
            case 'sum':
                value = _.sum(values);
                break;
            case 'average':
                value = _.mean(values);
                break;
            case 'count':
                value = values.length;
                break;
            case 'min':
                value = _.min(values) || 0;
                break;
            case 'max':
                value = _.max(values) || 0;
                break;
        }

        return { name: key, value };
    });

    // 4. Sort results if they are time-based
    if (timeGranularity) {
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
}

export function generateChartInsight(data: DataRow[], kpi: KPI, aggregatedData: ChartDataPoint[]): string {
    if (aggregatedData.length === 0) return "No data available to generate insights.";

    const { metric, dimension, aggregation, timeGranularity } = kpi;
    const sorted = [...aggregatedData].sort((a, b) => b.value - a.value);
    if (sorted.length === 0) return "Insufficient data for detailed analysis.";
    
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    const total = _.sum(aggregatedData.map(d => d.value));
    const avg = total / aggregatedData.length;

    let segments: string[] = [];

    // 1. Time-series Analysis
    if (timeGranularity && aggregatedData.length >= 2) {
        const first = aggregatedData[0];
        const last = aggregatedData[aggregatedData.length - 1];
        
        if (first.value !== 0) {
            const change = ((last.value / first.value - 1) * 100).toFixed(1);
            const isUp = last.value > first.value;
            segments.push(`**Trend:** Since ${first.name}, **${metric}** has ${isUp ? 'grown' : 'declined'} by **${Math.abs(Number(change))}%** reaching ${last.value.toLocaleString()} in ${last.name}.`);
        }
        
        // Volatility check
        const values = aggregatedData.map(d => d.value);
        const variance = _.sum(values.map(v => Math.pow(v - avg, 2))) / values.length;
        const std = Math.sqrt(variance);
        if (std > avg * 0.4) {
            segments.push(`**Volatility:** There is **significant fluctuation** in ${metric} across ${dimension}.`);
        }
    }

    // 2. High-level Takeaway
    const topPct = total > 0 ? ((top.value / total) * 100).toFixed(1) : "0";
    segments.push(`**Dominance:** **${top.name}** is the primary driver, contributing **${topPct}%** of total ${metric.toLowerCase()}.`);

    // 3. Dispersion / Gap analysis
    if (sorted.length > 2 && bottom.value > 0) {
        const gap = (top.value / bottom.value).toFixed(1);
        if (Number(gap) > 3) {
            segments.push(`**Outlier Performance:** **${top.name}** is outperforming **${bottom.name}** by over **${gap}x**.`);
        }
    }

    // 4. Recommendation based on trend/distribution
    if (total > 0) {
        if (sorted.length <= 3) {
            segments.push(`**Insight:** Revenue is highly concentrated in very few categories.`);
        } else {
            segments.push(`**Insight:** ${metric} is distributed across ${sorted.length} different ${dimension}s, with an average of ${avg.toFixed(0)} per category.`);
        }
    }

    return segments.join(" \n\n ");
}

export interface KeyDriver {
    dimension: string;
    impactScore: number; // 0 to 100
    topCategory: string;
    contribution: number;
}

export function calculateKeyDrivers(data: DataRow[], metric: string, dimensions: string[]): KeyDriver[] {
    const drivers: KeyDriver[] = [];
    const globalMetricValues = data.map(d => Number(d[metric]) || 0);
    const globalMean = _.mean(globalMetricValues);
    const globalVariance = _.sum(globalMetricValues.map(v => Math.pow(v - globalMean, 2))) / data.length;

    if (globalVariance === 0) return [];

    dimensions.forEach(dim => {
        const grouped = _.groupBy(data, d => d[dim]);
        const groupMeans = Object.values(grouped).map(group =>
            _.mean(group.map(d => Number(d[metric]) || 0))
        );

        // Between-group variance (how much the means of categories differ)
        const meanOfMeans = _.mean(groupMeans);
        const betweenVariance = _.sum(groupMeans.map(m => Math.pow(m - meanOfMeans, 2))) / groupMeans.length;

        // Impact score based on how much this dimension explains the data variance
        const impactScore = Math.min(100, Math.round((betweenVariance / globalVariance) * 100));

        // Find top category for this dimension
        const dimensionAgg = Object.keys(grouped).map(key => ({
            name: key,
            value: _.sum(grouped[key].map(d => Number(d[metric]) || 0))
        })).sort((a, b) => b.value - a.value);

        if (dimensionAgg.length > 0) {
            const total = _.sum(dimensionAgg.map(d => d.value));
            drivers.push({
                dimension: dim,
                impactScore,
                topCategory: dimensionAgg[0].name,
                contribution: Math.round((dimensionAgg[0].value / total) * 100)
            });
        }
    });

    return drivers.sort((a, b) => b.impactScore - a.impactScore);
}
