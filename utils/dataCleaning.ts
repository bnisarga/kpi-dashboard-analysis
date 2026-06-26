import { DataRow } from '../context/DataContext';
import _ from 'lodash';

export interface CleaningReport {
    rowsRemoved: number;
    emptyCellsFilled: number;
    trimmedCells: number;
    datesConverted: number;
    numericsCoerced: number;
    missingValuesFound: number;
    outliersDetected: number;
    outliersTreated: number;
    totalRows: number;
    duplicateRowsRemoved: number;
}

export function cleanData(rawData: any[]): { data: DataRow[], report: CleaningReport } {
    let rowsRemoved = 0;
    let trimmedCells = 0;
    let datesConverted = 0;
    let numericsCoerced = 0;
    let missingValuesFound = 0;
    let outliersDetected = 0;
    let outliersTreated = 0;

    const cleanedData: DataRow[] = [];
    const numericValuesMap: { [key: string]: number[] } = {};

    // First pass: Clean and collect numeric values for outlier detection
    const firstPassData = rawData.map((row) => {
        const values = Object.values(row);
        const isEmpty = values.every(val => val === null || val === undefined || val === '');

        if (isEmpty) {
            rowsRemoved++;
            return null;
        }

        const newRow: DataRow = {};
        Object.keys(row).forEach(key => {
            let val = row[key];

            if (val === null || val === undefined || val === '') {
                missingValuesFound++;
                newRow[key] = 0; // Treatment: fill missing with 0
                return;
            }

            if (typeof val === 'string') {
                const original = val;
                val = val.trim();
                if (original !== val) {
                    trimmedCells++;
                }

                // Improved date detection: Check for common date patterns first
                // Supports YYYY-MM-DD, DD-MM-YYYY, MM/DD/YYYY and variations, possibly with time
                const datePatterns = [
                    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/,
                    /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/,
                    /^\d{1,2}[-/]\d{1,2}[-/]\d{2}/
                ];

                if (datePatterns.some(p => p.test(val))) {
                    const date = new Date(val);
                    if (!isNaN(date.getTime())) {
                        newRow[key] = date;
                        datesConverted++;
                        return;
                    }
                }

                const clean = val.replace(/[^0-9.-]+/g, "");
                if (clean !== '' && !isNaN(Number(clean)) && /[0-9]/.test(val)) {
                    const numericVal = Number(clean);
                    newRow[key] = numericVal;
                    numericsCoerced++;
                    if (!numericValuesMap[key]) numericValuesMap[key] = [];
                    numericValuesMap[key].push(numericVal);
                    return;
                }
                newRow[key] = val;
            } else if (typeof val === 'number') {
                const numVal = isNaN(val) ? 0 : val;
                newRow[key] = numVal;
                if (!numericValuesMap[key]) numericValuesMap[key] = [];
                numericValuesMap[key].push(numVal);
            } else {
                newRow[key] = val;
            }
        });

        return newRow;
    }).filter(row => row !== null) as DataRow[];

    // Calculate stats for outlier detection (Z-score > 3)
    const stats: { [key: string]: { mean: number, std: number, upper: number, lower: number } } = {};
    Object.keys(numericValuesMap).forEach(key => {
        const vals = numericValuesMap[key];
        if (vals.length > 2) {
            const mean = _.mean(vals);
            const std = Math.sqrt(_.sum(vals.map(v => Math.pow(v - mean, 2))) / vals.length);
            stats[key] = { mean, std, upper: mean + 3 * std, lower: mean - 3 * std };
        }
    });

    // Second pass: Detect and Treat (Clamp) outliers
    firstPassData.forEach(row => {
        Object.keys(row).forEach(key => {
            if (stats[key] && typeof row[key] === 'number') {
                const { upper, lower, mean, std } = stats[key];
                const val = row[key] as number;
                if (std > 0) {
                    const zScore = Math.abs((val - mean) / std);
                    if (zScore > 3) {
                        outliersDetected++;
                        // Treat by clamping to boundary
                        row[key] = val > upper ? upper : lower;
                        outliersTreated++;
                    }
                }
            }
        });
        cleanedData.push(row);
    });

    // Third pass: Detect and Remove Duplicate Rows
    const finalData: DataRow[] = [];
    const seen = new Set<string>();
    let duplicateRowsRemoved = 0;

    cleanedData.forEach(row => {
        const rowStr = JSON.stringify(row);
        if (seen.has(rowStr)) {
            duplicateRowsRemoved++;
        } else {
            seen.add(rowStr);
            finalData.push(row);
        }
    });

    return {
        data: finalData,
        report: {
            rowsRemoved,
            emptyCellsFilled: missingValuesFound,
            trimmedCells,
            datesConverted,
            numericsCoerced,
            missingValuesFound,
            outliersDetected,
            outliersTreated,
            duplicateRowsRemoved,
            totalRows: finalData.length
        }
    };
}
