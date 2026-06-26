import { DataRow, KPI } from '../context/DataContext';

export function suggestKPIs(data: DataRow[], columns: string[]): KPI[] {
    if (!data || data.length === 0 || columns.length === 0) return [];

    const suggestions: KPI[] = [];

    // Analyze columns to categorize them
    const columnAnalysis = columns.map(col => {
        const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
        const datePatterns = [/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/, /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/];
        const numericValues = values.filter(v => {
            if (v instanceof Date) return false;
            if (typeof v === 'number') return !isNaN(v);
            if (typeof v === 'string') {
                if (datePatterns.some(p => p.test(v))) return false;
                const clean = v.replace(/[^0-9.-]+/g, "");
                return clean !== '' && !isNaN(Number(clean)) && /[0-9]/.test(v);
            }
            return false;
        });
        const uniqueValues = new Set(values);

        const isDate = values.some(v => v instanceof Date) || (values.length > 0 && typeof values[0] === 'string' && datePatterns.some(p => p.test(values[0] as string)));

        return {
            name: col,
            isNumeric: !isDate && numericValues.length > values.length * 0.7, 
            isDate,
            isPotentialCategory: isDate || (uniqueValues.size > 1 && uniqueValues.size <= Math.min(20, data.length * 0.7)),
            cardinality: uniqueValues.size,
            ratioUnique: uniqueValues.size / data.length
        };
    });

    const numericCols = columnAnalysis.filter(a => a.isNumeric);
    const categoricalCols = columnAnalysis.filter(a => a.isPotentialCategory);

    // Heuristic 1: Link numeric with categories
    numericCols.forEach(numCol => {
        categoricalCols.forEach(catCol => {
            if (catCol.name === numCol.name) return;

            // Bar Chart for moderate cardinality
            if (catCol.cardinality <= 15) {
                // Add Sum
                suggestions.push({
                    id: `suggest-${numCol.name}-sum-by-${catCol.name}-bar-${Math.random().toString(36).substr(2, 5)}`,
                    name: `Total ${numCol.name} by ${catCol.name}`,
                    dimension: catCol.name,
                    metric: numCol.name,
                    aggregation: 'sum',
                    chartType: 'bar',
                    color: '#3b82f6'
                });

                // Add Average
                suggestions.push({
                    id: `suggest-${numCol.name}-avg-by-${catCol.name}-bar-${Math.random().toString(36).substr(2, 5)}`,
                    name: `Average ${numCol.name} by ${catCol.name}`,
                    dimension: catCol.name,
                    metric: numCol.name,
                    aggregation: 'average',
                    chartType: 'bar',
                    color: '#8b5cf6'
                });
            }
        });

        // Heuristic 2: Check for Date-like columns for Line Charts
        const dateCol = columnAnalysis.find(a =>
            a.name.toLowerCase().includes('date') ||
            a.name.toLowerCase().includes('time') ||
            a.name.toLowerCase().includes('year') ||
            a.name.toLowerCase().includes('month') ||
            a.name.toLowerCase().includes('day')
        );

        if (dateCol) {
            suggestions.push({
                id: `suggest-${numCol.name}-over-${dateCol.name}-line-${Math.random().toString(36).substr(2, 5)}`,
                name: `${numCol.name} Trend over Time`,
                dimension: dateCol.name,
                metric: numCol.name,
                aggregation: 'average',
                chartType: 'line',
                color: '#f59e0b',
                timeGranularity: 'monthly',
                timeRange: 0
            });
        }
    });

    // Heuristic 3: Count of items by Category
    categoricalCols.slice(0, 2).forEach(catCol => {
        suggestions.push({
            id: `suggest-count-by-${catCol.name}-pie-${Math.random().toString(36).substr(2, 5)}`,
            name: `Volume by ${catCol.name}`,
            dimension: catCol.name,
            metric: catCol.name, 
            aggregation: 'count',
            chartType: 'pie',
            color: '#10b981'
        });
    });

    // Heuristic 4: Scatter Plot for two numeric columns
    if (numericCols.length >= 2) {
        suggestions.push({
            id: `suggest-scatter-${numericCols[0].name}-vs-${numericCols[1].name}-${Math.random().toString(36).substr(2, 5)}`,
            name: `${numericCols[1].name} Correlation`,
            dimension: numericCols[0].name,
            metric: numericCols[1].name,
            aggregation: 'sum', 
            chartType: 'scatter',
            color: '#f43f5e'
        });
    }

    // Heuristic 5: Radar Chart
    if (categoricalCols.length > 0 && numericCols.length > 0) {
        const catCol = categoricalCols.find(c => c.cardinality >= 3 && c.cardinality <= 8);
        if (catCol) {
            suggestions.push({
                id: `suggest-radar-${catCol.name}-${Math.random().toString(36).substr(2, 5)}`,
                name: `${numericCols[0].name} Distribution`,
                dimension: catCol.name,
                metric: numericCols[0].name,
                aggregation: 'average',
                chartType: 'radar',
                color: '#6366f1'
            });
        }
    }

    // Unique and limited
    const uniqueMap = new Map();
    suggestions.forEach(s => {
        if (!uniqueMap.has(s.name)) {
            uniqueMap.set(s.name, s);
        }
    });

    return Array.from(uniqueMap.values()).slice(0, 8);
}
