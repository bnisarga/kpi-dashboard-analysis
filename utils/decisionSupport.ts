import { AnomalyResult } from './anomalyDetection';

export interface DecisionInsight {
    type: 'risk' | 'opportunity' | 'warning';
    message: string;
    recommendation: string;
}

export function generateInsights(data: any[], anomalies: AnomalyResult[], metric: string): DecisionInsight[] {
    const insights: DecisionInsight[] = [];
    const anomalyCount = anomalies.filter(a => a.isAnomaly).length;
    const anomalyRatio = anomalyCount / data.length;

    if (anomalyRatio > 0.1) {
        insights.push({
            type: 'risk',
            message: `High volatility detected in ${metric}. ${Math.round(anomalyRatio * 100)}% of data points are unusual.`,
            recommendation: 'Investigate potential data entry errors or external factors causing significant spikes/dips.'
        });
    } else if (anomalyCount > 0) {
        insights.push({
            type: 'warning',
            message: `System detected ${anomalyCount} anomalies in ${metric}.`,
            recommendation: 'Review the highlighted red points in the chart for specific instances of deviation.'
        });
    }

    // Trend analysis
    if (data.length > 5) {
        const recent = data.slice(-5).map(d => Number(d[metric]));
        const prev = data.slice(-10, -5).map(d => Number(d[metric]));

        if (recent.length > 0 && prev.length > 0) {
            const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
            const avgPrev = prev.reduce((a, b) => a + b, 0) / prev.length;

            if (avgRecent > avgPrev * 1.2) {
                insights.push({
                    type: 'opportunity',
                    message: `${metric} is trending upwards significantly (up ${Math.round((avgRecent / avgPrev - 1) * 100)}%).`,
                    recommendation: 'Analyze successful factors contributing to this growth to replicate them elsewhere.'
                });
            } else if (avgRecent < avgPrev * 0.8) {
                insights.push({
                    type: 'risk',
                    message: `${metric} has dropped significantly recently (down ${Math.round((1 - avgRecent / avgPrev) * 100)}%).`,
                    recommendation: 'Urgent review required to identify the cause of the performance decline.'
                });
            }
        }
    }

    if (insights.length === 0) {
        insights.push({
            type: 'opportunity',
            message: 'Performance is stable and within expected parameters.',
            recommendation: 'Continue monitoring for any sudden deviations.'
        });
    }

    return insights;
}
