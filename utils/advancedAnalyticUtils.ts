import { DataRow } from '../context/DataContext';
import _ from 'lodash';

export interface AnalyticResult {
    title: string;
    value: string | number;
    takeaway: string;
    type: 'success' | 'warning' | 'info';
}

export function generateExecutiveSummary(data: DataRow[], columns: string[]): AnalyticResult[] {
    const results: AnalyticResult[] = [];

    // 1. Volume
    results.push({
        title: 'Data Volume',
        value: data.length.toLocaleString(),
        takeaway: `The dataset contains **${data.length}** records across **${columns.length}** categories.`,
        type: 'info'
    });

    // 2. Main Metric (find revenue/sales)
    const financialCol = columns.find(c => c.toLowerCase().includes('revenue') || c.toLowerCase().includes('profit') || c.toLowerCase().includes('sales'));
    if (financialCol) {
        const total = _.sum(data.map(d => Number(d[financialCol]) || 0));
        const avg = total / data.length;
        results.push({
            title: `Global ${financialCol}`,
            value: `£${total.toLocaleString()}`,
            takeaway: `Your total ${financialCol} is **£${total.toLocaleString()}**, with an average of **£${avg.toFixed(2)}** per transaction.`,
            type: 'success'
        });
    }

    // 3. Geographical/Categorical spread
    const catCol = columns.find(c => {
        const unique = new Set(data.map(d => d[c])).size;
        return unique > 1 && unique < 50 && typeof data[0][c] === 'string';
    });
    if (catCol) {
        const uniqueCount = new Set(data.map(d => d[catCol])).size;
        results.push({
            title: `${catCol} Diversity`,
            value: uniqueCount,
            takeaway: `Operations are distributed across **${uniqueCount}** distinct **${catCol}** groups.`,
            type: 'info'
        });
    }

    return results;
}

export function suggestPredictiveModels(data: DataRow[], columns: string[]) {
    const targetCol = columns.find(c => c.toLowerCase().includes('revenue') || c.toLowerCase().includes('profit') || c.toLowerCase().includes('sold'));

    if (targetCol) {
        return {
            type: 'Regression',
            target: targetCol,
            suggestion: 'Linear Regression / Random Forest',
            takeaway: `Predict **${targetCol}** values based on historical trends.`,
            features: columns.filter(c => c !== targetCol).slice(0, 5)
        };
    }

    return {
        type: 'Classification',
        target: columns[0],
        suggestion: 'Decision Tree Classifier',
        takeaway: 'Predict categorical outcomes based on input features.',
        features: columns.slice(1, 6)
    };
}

const MAX_STATS_ROWS = 5000;

export function solveLinearSystem(A: number[][], B: number[]): number[] {
    const n = B.length;
    const M = A.map((row, i) => [...row, B[i]]);

    for (let i = 0; i < n; i++) {
        let maxEl = Math.abs(M[i][i]);
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(M[k][i]) > maxEl) {
                maxEl = Math.abs(M[k][i]);
                maxRow = k;
            }
        }

        const temp = M[maxRow];
        M[maxRow] = M[i];
        M[i] = temp;

        if (Math.abs(M[i][i]) < 1e-12) {
            throw new Error("Matrix is singular or near-singular. Try choosing different columns (avoid perfectly correlated/redundant columns).");
        }

        for (let k = i + 1; k < n; k++) {
            const c = -M[k][i] / M[i][i];
            for (let j = i; j <= n; j++) {
                if (i === j) {
                    M[k][j] = 0;
                } else {
                    M[k][j] += c * M[i][j];
                }
            }
        }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += M[i][j] * x[j];
        }
        x[i] = (M[i][n] - sum) / M[i][i];
    }
    return x;
}

export function runMultipleLinearRegression(data: DataRow[], target: string, features: string[]) {
    const workingData = data.length > MAX_STATS_ROWS ? _.sampleSize(data, MAX_STATS_ROWS) : data;
    const n = workingData.length;
    const p = features.length;

    if (n === 0 || p === 0) {
        throw new Error("No data or features selected.");
    }

    // Identify categorical features and build encoding mappings
    const categoricalMappings: Record<string, { valToCode: Record<string, number>, codeToVal: string[] }> = {};
    features.forEach(f => {
        const isCat = typeof workingData[0]?.[f] === 'string';
        if (isCat) {
            const uniqueValues = Array.from(new Set(workingData.map(d => String(d[f] !== undefined && d[f] !== null ? d[f] : ''))));
            const valToCode: Record<string, number> = {};
            const codeToVal: string[] = [];
            uniqueValues.forEach((val, idx) => {
                valToCode[val] = idx;
                codeToVal.push(val);
            });
            categoricalMappings[f] = { valToCode, codeToVal };
        }
    });

    const size = p + 1;
    const A = Array.from({ length: size }, () => new Array(size).fill(0));
    const B = new Array(size).fill(0);

    for (let i = 0; i < n; i++) {
        const row = workingData[i];
        const xVec = [1];
        for (let j = 0; j < p; j++) {
            const feat = features[j];
            if (categoricalMappings[feat]) {
                const val = String(row[feat] !== undefined && row[feat] !== null ? row[feat] : '');
                xVec.push(categoricalMappings[feat].valToCode[val] ?? 0);
            } else {
                xVec.push(Number(row[feat]) || 0);
            }
        }
        const yVal = Number(row[target]) || 0;

        for (let j = 0; j < size; j++) {
            for (let k = 0; k < size; k++) {
                A[j][k] += xVec[j] * xVec[k];
            }
            B[j] += xVec[j] * yVal;
        }
    }

    let beta: number[];
    try {
        beta = solveLinearSystem(A, B);
    } catch (err: any) {
        return {
            type: 'Regression',
            error: err.message || "Failed to solve regression. Check if columns are collinear (perfectly correlated)."
        };
    }

    let sumY = 0;
    for (let i = 0; i < n; i++) {
        sumY += Number(workingData[i][target]) || 0;
    }
    const yMean = sumY / n;

    let ssRes = 0;
    let ssTot = 0;
    for (let i = 0; i < n; i++) {
        const row = workingData[i];
        const yVal = Number(row[target]) || 0;
        
        let yPred = beta[0];
        for (let j = 0; j < p; j++) {
            const feat = features[j];
            let valNum = 0;
            if (categoricalMappings[feat]) {
                const val = String(row[feat] !== undefined && row[feat] !== null ? row[feat] : '');
                valNum = categoricalMappings[feat].valToCode[val] ?? 0;
            } else {
                valNum = Number(row[feat]) || 0;
            }
            yPred += beta[j + 1] * valNum;
        }

        ssRes += Math.pow(yVal - yPred, 2);
        ssTot += Math.pow(yVal - yMean, 2);
    }

    const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
    
    let adjRSquared = rSquared;
    if (n - p - 1 > 0) {
        adjRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - p - 1);
    }

    const terms = [`${beta[0].toFixed(2)}`].concat(
        features.map((f, idx) => {
            const coeff = beta[idx + 1];
            const sign = coeff >= 0 ? "+" : "-";
            return `${sign} ${Math.abs(coeff).toFixed(2)} * [${f}]`;
        })
    );
    const formula = `${target} = ${terms.join(" ")}`;

    return {
        type: 'Regression',
        intercept: beta[0],
        coefficients: beta.slice(1),
        rSquared,
        adjustedRSquared: adjRSquared,
        formula,
        features,
        categoricalMappings
    };
}

export function runSimpleLinearRegression(data: DataRow[], target: string, feature: string) {
    const workingData = data.length > MAX_STATS_ROWS ? _.sampleSize(data, MAX_STATS_ROWS) : data;
    const n = workingData.length;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        const xVal = Number(workingData[i][feature]) || 0;
        const yVal = Number(workingData[i][target]) || 0;
        sumX += xVal;
        sumY += yVal;
        sumXY += xVal * yVal;
        sumX2 += xVal * xVal;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const yMean = sumY / n;
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
        const xVal = Number(workingData[i][feature]) || 0;
        const yVal = Number(workingData[i][target]) || 0;
        ssRes += Math.pow(yVal - (slope * xVal + intercept), 2);
        ssTot += Math.pow(yVal - yMean, 2);
    }
    const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

    return {
        slope,
        intercept,
        rSquared,
        formula: `${target} = (${slope.toFixed(2)} * ${feature}) + ${intercept.toFixed(2)}`
    };
}

export function performHypothesisTest(data: DataRow[], groupCol: string, metricCol: string) {
    const groups = _.groupBy(data, d => d[groupCol]);
    const groupNames = Object.keys(groups).slice(0, 2);

    if (groupNames.length < 2) return null;

    const g1 = groups[groupNames[0]].map(d => Number(d[metricCol]) || 0);
    const g2 = groups[groupNames[1]].map(d => Number(d[metricCol]) || 0);

    const m1 = _.mean(g1);
    const m2 = _.mean(g2);
    const s1 = Math.sqrt(_.sum(g1.map(v => Math.pow(v - m1, 2))) / (g1.length - 1));
    const s2 = Math.sqrt(_.sum(g2.map(v => Math.pow(v - m2, 2))) / (g2.length - 1));

    // Welch's t-test (Basic version)
    const tStat = (m1 - m2) / Math.sqrt((s1 * s1 / g1.length) + (s2 * s2 / g2.length));
    const isSignificant = Math.abs(tStat) > 2.0; // Rough threshold for p < 0.05

    return {
        hypothesis: `Does **${metricCol}** significantly differ between **${groupNames[0]}** and **${groupNames[1]}**?`,
        finding: `T-Statistic: ${tStat.toFixed(3)} | Mean Gap: ${Math.abs(m1 - m2).toFixed(2)}`,
        takeaway: isSignificant
            ? `**Statistically Significant.** Our analysis confirms a real performance gap between these groups that is unlikely to be due to chance.`
            : `**Insignificant Difference.** Any variance between these groups is within normal statistical margins.`,
        recommendation: isSignificant
            ? `Deep-dive into **${m1 > m2 ? groupNames[0] : groupNames[1]}** to replicate its success drivers.`
            : `Treat these segments equally as they are performing at parity.`
    };
}

export function generateAnomalySummary(data: DataRow[], numericColumns: string[]) {
    // Only use a sample for anomaly pattern detection if huge, 
    // though anomalies often need full data search, 30k is small enough for a single pass.
    const findings: string[] = [];

    numericColumns.forEach(col => {
        const vals = data.map(d => Number(d[col]) || 0);
        const mean = _.mean(vals);
        const std = Math.sqrt(_.sum(vals.map(v => Math.pow(v - mean, 2))) / vals.length);

        const outliers = vals.filter(v => Math.abs(v - mean) > 3 * std);
        if (outliers.length > 0) {
            findings.push(`**${col}**: Detected **${outliers.length}** outliers (values beyond ±3 standard deviations).`);
        }
    });

    return findings.length > 0 ? findings : ["No major statistical anomalies detected."];
}

export function calculateDistributionStats(data: DataRow[], col: string) {
    const vals = data.map(d => Number(d[col]) || 0).sort((a, b) => a - b);
    if (vals.length === 0) return null;

    const mean = _.mean(vals);
    const median = vals[Math.floor(vals.length / 2)];
    const min = vals[0];
    const max = vals[vals.length - 1];

    // Skewness
    const std = Math.sqrt(_.sum(vals.map(v => Math.pow(v - mean, 2))) / vals.length);
    const skewness = _.sum(vals.map(v => Math.pow(v - mean, 3))) / (vals.length * Math.pow(std, 3));

    return {
        mean,
        median,
        min,
        max,
        skewness,
        takeaway: skewness > 1 ? `Highly right-skewed (driven by high-value outliers).` :
            skewness < -1 ? `Highly left-skewed.` : `Relatively symmetrical distribution.`
    };
}

export function predictRegressionValue(inputValue: number, slope: number, intercept: number) {
    return (slope * inputValue) + intercept;
}

export function runSimpleClassification(data: DataRow[], target: string, features: string[], inputValues: Record<string, any>) {
    // A simple k-Nearest Neighbors (k=3) implementation for classification
    // We'll use Gower-like distance: Euclidean distance for numeric features, and simple match (0/1) for categorical.
    const neighbors = data.map(row => {
        let distance = 0;
        features.forEach(f => {
            const isCat = typeof row[f] === 'string';
            if (isCat) {
                distance += (String(row[f]) === String(inputValues[f]) ? 0 : 1);
            } else {
                const val1 = Number(row[f]) || 0;
                const val2 = Number(inputValues[f]) || 0;
                distance += Math.pow(val1 - val2, 2);
            }
        });
        return {
            class: String(row[target]),
            distance: Math.sqrt(distance)
        };
    }).sort((a, b) => a.distance - b.distance).slice(0, 3);

    // Vote
    const votes = _.countBy(neighbors, 'class');
    const winner = _.maxBy(Object.keys(votes), k => votes[k]);
    const confidence = neighbors.length > 0 ? (votes[winner!] / neighbors.length) * 100 : 0;

    return {
        prediction: winner,
        confidence,
        explanation: `Based on the ${neighbors.length} most similar historical records, this outcome is predicted with **${confidence.toFixed(0)}% confidence**.`
    };
}

export function runClassificationModelEvaluation(data: DataRow[], target: string, features: string[]) {
    const workingData = data.length > 1000 ? _.sampleSize(data, 1000) : data;
    const n = workingData.length;
    if (n === 0 || features.length === 0) {
        throw new Error("No data or features selected.");
    }

    let correctCount = 0;

    // We evaluate accuracy using leave-one-out prediction
    for (let i = 0; i < n; i++) {
        const targetRow = workingData[i];
        
        // Find nearest neighbors in workingData excluding targetRow
        const neighbors = workingData
            .map((row, idx) => {
                if (idx === i) return null;
                
                let distance = 0;
                features.forEach(f => {
                    const isCat = typeof targetRow[f] === 'string';
                    if (isCat) {
                        distance += (String(row[f]) === String(targetRow[f]) ? 0 : 1);
                    } else {
                        const val1 = Number(row[f]) || 0;
                        const val2 = Number(targetRow[f]) || 0;
                        distance += Math.pow(val1 - val2, 2);
                    }
                });
                
                return {
                    class: String(row[target]),
                    distance: Math.sqrt(distance)
                };
            })
            .filter((item): item is { class: string; distance: number } => item !== null)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);

        if (neighbors.length > 0) {
            const votes = _.countBy(neighbors, 'class');
            const winner = _.maxBy(Object.keys(votes), k => votes[k]);
            if (winner === String(targetRow[target])) {
                correctCount++;
            }
        }
    }

    const accuracy = correctCount / n;
    
    // Build unique values mappings for the features to support UI select boxes
    const categoricalMappings: Record<string, { valToCode: Record<string, number>, codeToVal: string[] }> = {};
    features.forEach(f => {
        const isCat = typeof data[0]?.[f] === 'string';
        if (isCat) {
            const uniqueValues = Array.from(new Set(data.map(d => String(d[f] !== undefined && d[f] !== null ? d[f] : ''))));
            const valToCode: Record<string, number> = {};
            uniqueValues.forEach((val, idx) => {
                valToCode[val] = idx;
            });
            categoricalMappings[f] = { valToCode, codeToVal: uniqueValues };
        }
    });

    return {
        type: 'Classification',
        accuracy,
        totalEvaluated: n,
        features,
        target,
        categoricalMappings
    };
}
