import _ from 'lodash';

export function calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    
    for (let i = 0; i < n; i++) {
        const xi = x[i];
        const yi = y[i];
        sumX += xi;
        sumY += yi;
        sumXY += xi * yi;
        sumX2 += xi * xi;
        sumY2 += yi * yi;
    }

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
}

export interface CorrelationMatrixData {
    columns: string[];
    matrix: number[][];
}

export function generateCorrelationMatrix(data: any[], selectedColumns: string[]): CorrelationMatrixData {
    const matrix: number[][] = [];
    
    // Performance Optimization: Sample data if it's too large for UI interactions
    const MAX_ANALYSIS_ROWS = 5000;
    const workingData = data.length > MAX_ANALYSIS_ROWS 
        ? _.sampleSize(data, MAX_ANALYSIS_ROWS) 
        : data;

    // Prepare data for each column (encode string columns for relationship analysis)
    const processedData = selectedColumns.map(col => {
        const sample = workingData.find(d => d[col] !== null && d[col] !== undefined)?.[col];
        if (typeof sample === 'number') {
             return workingData.map(d => Number(d[col]) || 0);
        } else {
            // Label Encoding for categorical correlation
            const uniqueValues = Array.from(new Set(workingData.map(d => String(d[col]))));
            const valMap = new Map(uniqueValues.map((v, i) => [v, i]));
            return workingData.map(d => valMap.get(String(d[col])) || 0);
        }
    });

    for (let i = 0; i < selectedColumns.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < selectedColumns.length; j++) {
            if (i === j) {
                matrix[i][j] = 1;
            } else {
                matrix[i][j] = calculatePearsonCorrelation(processedData[i], processedData[j]);
            }
        }
    }

    return {
        columns: selectedColumns,
        matrix
    };
}

export interface CorrelationInsight {
    pair: [string, string];
    score: number;
    description: string;
}

export function generateCorrelationInsights(matrixData: CorrelationMatrixData): CorrelationInsight[] {
    const insights: CorrelationInsight[] = [];
    const { columns, matrix } = matrixData;

    for (let i = 0; i < columns.length; i++) {
        for (let j = i + 1; j < columns.length; j++) {
            const score = matrix[i][j];
            const absScore = Math.abs(score);

            if (absScore > 0.4) {
                let description = "";
                if (score > 0.8) description = `**${columns[i]}** and **${columns[j]}** have an extremely strong positive correlation. They tend to increase together almost perfectly.`;
                else if (score > 0.5) description = `**${columns[i]}** and **${columns[j]}** show a moderate positive relationship. As one increases, the other usually follows.`;
                else if (score < -0.8) description = `**${columns[i]}** and **${columns[j]}** have a very strong inverse relationship. When one goes up, the other goes down significantly.`;
                else if (score < -0.5) description = `**${columns[i]}** and **${columns[j]}** show a moderate negative correlation.`;
                else description = `**${columns[i]}** and **${columns[j]}** have a weak but noticeable ${score > 0 ? 'positive' : 'negative'} relationship.`;

                insights.push({
                    pair: [columns[i], columns[j]],
                    score,
                    description
                });
            }
        }
    }

    return insights.sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 5);
}
