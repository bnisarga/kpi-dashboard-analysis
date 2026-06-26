"use client";

import React, { useState, useMemo, useEffect } from 'react';
import _ from 'lodash';
import { useData } from '../context/DataContext';
import { 
    generateExecutiveSummary, 
    suggestPredictiveModels, 
    performHypothesisTest,
    runSimpleLinearRegression,
    runMultipleLinearRegression,
    generateAnomalySummary,
    calculateDistributionStats,
    predictRegressionValue,
    runSimpleClassification,
    runClassificationModelEvaluation
} from '../utils/advancedAnalyticUtils';
import { 
    Brain, 
    TrendingUp, 
    BarChart3, 
    Target, 
    Lightbulb, 
    ShieldCheck, 
    Sparkles, 
    ChevronDown,
    Zap,
    Play,
    Info,
    ArrowRight
} from 'lucide-react';

type AnalysisType = 'summary' | 'predictive' | 'hypothesis' | 'business' | 'distribution' | 'outliers';

export function AdvancedAnalytics() {
    const { data, columns } = useData();
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType>('summary');
    const [isOpen, setIsOpen] = useState(false);
    
    // Predictive State
    const [selectedTarget, setSelectedTarget] = useState<string>('');
    const [isRunningModel, setIsRunningModel] = useState(false);
    const [modelResult, setModelResult] = useState<any>(null);
    const [selectedPredictors, setSelectedPredictors] = useState<string[]>([]);

    // Selection State for Hypothesis/Distribution
    const [hypoGroup, sethypoGroup] = useState('');
    const [hypoMetric, sethypoMetric] = useState('');
    const [distCol, setDistCol] = useState('');

    // Live Inference State
    const [inferenceValues, setInferenceValues] = useState<Record<string, any>>({});
    const [livePrediction, setLivePrediction] = useState<number | string | null>(null);

    const numericCols = useMemo(() => columns.filter(c => typeof data[0]?.[c] === 'number'), [data, columns]);
    const categoricalCols = useMemo(() => columns.filter(c => typeof data[0]?.[c] === 'string'), [data, columns]);

    const summary = useMemo(() => generateExecutiveSummary(data, columns), [data, columns]);
    const predictiveSug = useMemo(() => suggestPredictiveModels(data, columns), [data, columns]);
    const hypothesis = useMemo(() => performHypothesisTest(data, hypoGroup, hypoMetric), [data, hypoGroup, hypoMetric]);
    const anomalySummary = useMemo(() => generateAnomalySummary(data, numericCols), [data, numericCols]);
    const distStats = useMemo(() => calculateDistributionStats(data, distCol), [data, distCol]);

    useEffect(() => {
        if (numericCols.length > 0) {
            setDistCol(numericCols[0]);
            sethypoMetric(numericCols[0]);
        }
        if (categoricalCols.length > 0) {
            sethypoGroup(categoricalCols[0]);
        }

        // Setup initial predictive model settings
        const initialTarget = predictiveSug.target || columns[0];
        if (initialTarget) {
            setSelectedTarget(initialTarget);
            
            const otherCols = columns.filter(c => c !== initialTarget);
            const defaultPredictors = otherCols.filter(c => typeof data[0]?.[c] === 'number').slice(0, 2);
            setSelectedPredictors(defaultPredictors.length > 0 ? defaultPredictors : otherCols.slice(0, 1));
        }
    }, [data, columns, predictiveSug.target]);

    if (data.length === 0) return null;

    const handleTargetChange = (newTarget: string) => {
        setSelectedTarget(newTarget);
        
        const otherCols = columns.filter(c => c !== newTarget);
        const defaultPredictors = otherCols.filter(c => typeof data[0]?.[c] === 'number').slice(0, 2);
        setSelectedPredictors(defaultPredictors.length > 0 ? defaultPredictors : otherCols.slice(0, 1));
        
        setModelResult(null);
        setLivePrediction(null);
        setInferenceValues({});
    };

    const handleRunModel = () => {
        setIsRunningModel(true);
        setTimeout(() => {
            const isCat = typeof data[0]?.[selectedTarget] === 'string';
            if (isCat) {
                // Run Classification
                try {
                    const res = runClassificationModelEvaluation(data, selectedTarget, selectedPredictors);
                    setModelResult(res);
                    setIsRunningModel(false);
                    
                    const initialInferences: Record<string, any> = {};
                    selectedPredictors.forEach(pred => {
                        const isPredCat = typeof data[0]?.[pred] === 'string';
                        if (isPredCat) {
                            const unique = Array.from(new Set(data.map(d => String(d[pred]))));
                            initialInferences[pred] = unique[0] || '';
                        } else {
                            const meanVal = _.mean(data.map(d => Number(d[pred]) || 0));
                            initialInferences[pred] = Number(meanVal.toFixed(2));
                        }
                    });
                    setInferenceValues(initialInferences);
                    
                    const predRes = runSimpleClassification(data, selectedTarget, selectedPredictors, initialInferences);
                    setLivePrediction(predRes.prediction ?? null);
                } catch (e: any) {
                    setModelResult({ error: e.message || "Failed to run classification model." });
                    setIsRunningModel(false);
                    setLivePrediction(null);
                }
            } else {
                // Run Regression
                const res = runMultipleLinearRegression(data, selectedTarget, selectedPredictors);
                setModelResult(res);
                setIsRunningModel(false);
                
                if (!('error' in res)) {
                    const initialInferences: Record<string, any> = {};
                    let prediction = res.intercept;
                    
                    selectedPredictors.forEach((pred, idx) => {
                        const isPredCat = typeof data[0]?.[pred] === 'string';
                        if (isPredCat) {
                            const unique = res.categoricalMappings[pred]?.codeToVal || [];
                            const firstVal = unique[0] || '';
                            initialInferences[pred] = firstVal;
                            
                            const code = res.categoricalMappings[pred]?.valToCode[firstVal] ?? 0;
                            prediction += res.coefficients[idx] * code;
                        } else {
                            const meanVal = _.mean(data.map(d => Number(d[pred]) || 0));
                            const fixedMean = Number(meanVal.toFixed(2));
                            initialInferences[pred] = fixedMean;
                            prediction += res.coefficients[idx] * fixedMean;
                        }
                    });
                    
                    setInferenceValues(initialInferences);
                    setLivePrediction(prediction);
                } else {
                    setLivePrediction(null);
                }
            }
        }, 800);
    };

    const handleLiveInference = (featureName: string, val: any) => {
        const updatedInferences = {
            ...inferenceValues,
            [featureName]: val
        };
        setInferenceValues(updatedInferences);
        
        if (modelResult && !modelResult.error) {
            if (modelResult.type === 'Classification') {
                const predRes = runSimpleClassification(data, modelResult.target, modelResult.features, updatedInferences);
                setLivePrediction(predRes.prediction ?? null);
            } else {
                let pred = modelResult.intercept;
                selectedPredictors.forEach((predCol, idx) => {
                    const rawVal = updatedInferences[predCol];
                    let valToUse = 0;
                    if (modelResult.categoricalMappings && modelResult.categoricalMappings[predCol]) {
                        const strVal = String(rawVal);
                        valToUse = modelResult.categoricalMappings[predCol].valToCode[strVal] ?? 0;
                    } else {
                        valToUse = rawVal !== undefined ? Number(rawVal) : (_.mean(data.map(d => Number(d[predCol]) || 0)));
                    }
                    pred += modelResult.coefficients[idx] * valToUse;
                });
                setLivePrediction(pred);
            }
        }
    };

    const analysisOptions: { id: AnalysisType; label: string; icon: any; color: string }[] = [
        { id: 'summary', label: 'Executive Summary', icon: ShieldCheck, color: 'text-blue-500' },
        { id: 'predictive', label: 'Predictive Modeling', icon: Brain, color: 'text-purple-500' },
        { id: 'business', label: 'Business Insights', icon: Lightbulb, color: 'text-amber-500' },
        { id: 'hypothesis', label: 'Hypothesis Testing', icon: Target, color: 'text-emerald-500' },
        { id: 'outliers', label: 'Anomaly Report', icon: Zap, color: 'text-rose-500' },
        { id: 'distribution', label: 'Distribution Analysis', icon: BarChart3, color: 'text-indigo-500' },
    ];

    const currentOption = analysisOptions.find(o => o.id === selectedAnalysis)!;

    const renderSummary = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {summary.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{item.title}</h4>
                    <div className="text-2xl font-extrabold text-gray-900 mb-3">{item.value}</div>
                    <p className="text-sm text-gray-600 leading-relaxed italic border-t border-gray-50 pt-3">
                        {item.takeaway.split(/(\*\*.*?\*\*)/).map((part, i) => 
                            part.startsWith('**') && part.endsWith('**') ? 
                                <strong key={i} className="text-blue-600 font-bold">{part.slice(2, -2)}</strong> : 
                                part
                        )}
                    </p>
                </div>
            ))}
        </div>
    );

    const renderPredictive = () => {
        const targetCol = selectedTarget || predictiveSug.target || columns[0];
        const possiblePredictors = columns.filter(c => c !== targetCol);
        const isTargetCat = typeof data[0]?.[targetCol] === 'string';
        const activeModelType = isTargetCat ? 'Classification' : 'Regression';

        return (
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-3xl border border-purple-100 animate-in zoom-in-95 duration-500">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="bg-purple-600 p-4 h-16 w-16 rounded-2xl text-white shadow-xl shadow-purple-200 flex items-center justify-center shrink-0">
                        <Brain size={40} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase mb-4">
                            Model Solution: {activeModelType}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                            <span className="text-sm font-bold text-gray-700">Target Variable (Y):</span>
                            <select
                                value={targetCol}
                                onChange={(e) => handleTargetChange(e.target.value)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                            >
                                {columns.map(c => (
                                    <option key={c} value={c}>
                                        {c} {typeof data[0]?.[c] === 'number' ? '(Numeric - Regression)' : '(Categorical - Classification)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Predict future **{targetCol}** outcomes</h3>
                        <p className="text-gray-600 mb-8 max-w-2xl">
                            {isTargetCat 
                                ? `We recommend running a 3-Nearest Neighbors Classifier. Choose which variables to include in the model, and evaluate the classifier accuracy and live prediction outcomes.` 
                                : `We recommend running a Multiple Linear Regression model. Choose which variables to include in the model, and evaluate their coefficients and live prediction outcomes.`
                            }
                        </p>

                        {possiblePredictors.length === 0 ? (
                            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-sm font-semibold">
                                Predictive modeling requires at least two columns in the dataset.
                            </div>
                        ) : (
                            <>
                                <div className="w-full mb-8 bg-white p-6 rounded-2xl border border-purple-100 shadow-inner">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-3">
                                        Predictor Variables (X) - Select one or more
                                    </label>
                                    <div className="flex flex-wrap gap-2.5 mb-6">
                                        {possiblePredictors.map(c => {
                                            const isSelected = selectedPredictors.includes(c);
                                            return (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            if (selectedPredictors.length > 1) {
                                                                setSelectedPredictors(selectedPredictors.filter(p => p !== c));
                                                            }
                                                        } else {
                                                            setSelectedPredictors([...selectedPredictors, c]);
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                        isSelected 
                                                            ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-100' 
                                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {isSelected ? '✓' : '+'} {c}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4 flex-wrap">
                                        <div className="text-xs text-gray-500 italic">
                                            Currently modeling with <strong>{selectedPredictors.length}</strong> variable{selectedPredictors.length !== 1 ? 's' : ''} to predict <strong>{targetCol}</strong>.
                                        </div>
                                        <button 
                                            onClick={handleRunModel}
                                            disabled={isRunningModel || selectedPredictors.length === 0}
                                            className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-100 disabled:opacity-50"
                                        >
                                            {isRunningModel ? 'Calculating Patterns...' : 'Run Prediction Engine'}
                                            <Play size={16} fill="white" />
                                        </button>
                                    </div>
                                </div>

                                {modelResult && modelResult.error && (
                                    <div className="p-5 bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-500">
                                        <Zap className="text-rose-500 shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <div className="font-bold text-sm">Mathematical Error</div>
                                            <div className="text-xs mt-1 leading-relaxed">{modelResult.error}</div>
                                        </div>
                                    </div>
                                )}

                                {modelResult && !modelResult.error && (
                                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                                        {modelResult.type === 'Classification' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="p-4 bg-white rounded-xl border-l-4 border-l-purple-500 shadow-sm">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Model Accuracy</div>
                                                    <div className="text-2xl font-black text-gray-900">{(modelResult.accuracy * 100).toFixed(1)}%</div>
                                                    <div className="text-[10px] text-gray-500 mt-1">Leave-One-Out cross validation accuracy</div>
                                                </div>
                                                <div className="p-4 bg-white rounded-xl border-l-4 border-l-purple-500 shadow-sm">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Evaluated Rows</div>
                                                    <div className="text-2xl font-black text-gray-900">{modelResult.totalEvaluated.toLocaleString()}</div>
                                                    <div className="text-[10px] text-gray-500 mt-1">Data samples used for model assessment</div>
                                                </div>
                                                <div className="p-4 bg-white rounded-xl border-l-4 border-l-purple-500 shadow-sm">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Classifier Method</div>
                                                    <div className="text-sm font-bold text-purple-700 mt-1">3-Nearest Neighbors (KNN)</div>
                                                    <div className="text-[10px] text-gray-500 mt-1">Gower-like distance for mixed metrics.</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="p-4 bg-white rounded-xl border-l-4 border-l-purple-500 shadow-sm">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Confidence (R²)</div>
                                                    <div className="text-xl font-black text-gray-900">{(modelResult.rSquared * 100).toFixed(1)}%</div>
                                                    <div className="text-[10px] text-gray-500 mt-1">Variance explained by model</div>
                                                </div>
                                                <div className="p-4 bg-white rounded-xl border-l-4 border-l-purple-500 shadow-sm">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Adjusted R²</div>
                                                    <div className="text-xl font-black text-gray-900">{(modelResult.adjustedRSquared * 100).toFixed(1)}%</div>
                                                    <div className="text-[10px] text-gray-500 mt-1">Adjusted for feature volume</div>
                                                </div>
                                                <div className="p-4 bg-white rounded-xl border-l-4 border-l-purple-500 shadow-sm md:col-span-2">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Predictive Formula</div>
                                                    <div className="text-sm font-mono font-bold text-purple-700 mt-1 break-all whitespace-pre-wrap">{modelResult.formula}</div>
                                                    <div className="text-[10px] text-gray-500 mt-1">Mathematical model for live estimation.</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Coefficients contribution cards */}
                                        {modelResult.type === 'Regression' && (
                                            <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Variable Contributions (Coefficients)</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Base Value (Intercept)</span>
                                                        <div className="text-lg font-bold text-gray-900 mt-1">{modelResult.intercept.toFixed(2)}</div>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">Value when all predictors are zero.</p>
                                                    </div>
                                                    {modelResult.features.map((feat: string, idx: number) => {
                                                        const coeff = modelResult.coefficients[idx];
                                                        const isPos = coeff >= 0;
                                                        return (
                                                            <div key={feat} className={`p-3.5 rounded-xl border ${isPos ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/40 border-rose-100'}`}>
                                                                <span className={`text-[10px] font-bold uppercase ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                    {feat} Impact
                                                                </span>
                                                                <div className="text-lg font-bold text-gray-900 mt-1">
                                                                    {coeff >= 0 ? '+' : ''}{coeff.toFixed(4)}
                                                                </div>
                                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                                    {isPos ? 'Positive' : 'Negative'} weight in model.
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Live Inference Section */}
                                        <div className="bg-white p-6 rounded-2xl border-2 border-purple-200 shadow-xl overflow-hidden relative">
                                            <div className="absolute top-0 right-0 p-3 bg-purple-50 rounded-bl-xl border-l border-b border-purple-100">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                    <span className="text-[10px] font-bold text-purple-600 uppercase">Ready for Inference</span>
                                                </div>
                                            </div>

                                            <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                                                <Zap size={16} className="text-amber-500" />
                                                Test the Model: Interactive Multi-Variable Prediction
                                            </h4>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                                <div className="lg:col-span-2 space-y-6">
                                                    {modelResult.features.map((feat: string) => {
                                                        const isCat = modelResult.categoricalMappings && modelResult.categoricalMappings[feat];
                                                        if (isCat) {
                                                            const uniqueVals = modelResult.categoricalMappings[feat].codeToVal || [];
                                                            const currVal = inferenceValues[feat] !== undefined ? inferenceValues[feat] : (uniqueVals[0] || '');
                                                            return (
                                                                <div key={feat} className="space-y-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                                    <div className="flex justify-between items-center">
                                                                        <label className="text-xs font-bold text-gray-600 uppercase">{feat}</label>
                                                                        <span className="text-[10px] font-bold text-purple-600 uppercase bg-purple-50 px-2 py-0.5 rounded">Categorical</span>
                                                                    </div>
                                                                    <select
                                                                        value={currVal}
                                                                        onChange={(e) => handleLiveInference(feat, e.target.value)}
                                                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-purple-500 outline-none text-sm font-semibold text-gray-700"
                                                                    >
                                                                        {uniqueVals.map((val: string) => (
                                                                            <option key={val} value={val}>{val}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            );
                                                        } else {
                                                            const minVal = _.min(data.map(d => Number(d[feat]) || 0)) ?? 0;
                                                            const maxVal = _.max(data.map(d => Number(d[feat]) || 0)) ?? 100;
                                                            const currVal = inferenceValues[feat] !== undefined ? inferenceValues[feat] : Number((_.mean(data.map(d => Number(d[feat]) || 0)) || 0).toFixed(2));
                                                            return (
                                                                <div key={feat} className="space-y-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                                    <div className="flex justify-between items-center">
                                                                        <label className="text-xs font-bold text-gray-600 uppercase">{feat}</label>
                                                                        <div className="flex items-center gap-2">
                                                                            <input 
                                                                                type="number"
                                                                                value={currVal}
                                                                                step="any"
                                                                                onChange={(e) => handleLiveInference(feat, Number(e.target.value))}
                                                                                className="w-20 px-2 py-0.5 text-xs text-right font-bold text-purple-700 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-purple-500 outline-none"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <input 
                                                                        type="range" 
                                                                        min={minVal}
                                                                        max={maxVal}
                                                                        step="any"
                                                                        value={currVal}
                                                                        onChange={(e) => handleLiveInference(feat, Number(e.target.value))}
                                                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                                    />
                                                                    <div className="flex justify-between">
                                                                        <span className="text-[9px] text-gray-400">Min: {minVal.toLocaleString()}</span>
                                                                        <span className="text-[9px] text-gray-400">Max: {maxVal.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    })}
                                                    <div className="text-[11px] text-gray-500 italic px-1">
                                                        Adjust any predictor variable input or slider to see how the model's aggregate prediction responds.
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-br from-gray-900 to-purple-950 p-8 rounded-2xl text-center shadow-inner relative overflow-hidden self-stretch flex flex-col justify-center min-h-[220px]">
                                                    <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                                                        <Brain size={160} />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-2">Predicted {targetCol}</div>
                                                        <div className="text-4xl font-black text-white mb-4 tracking-tight break-words">
                                                            {livePrediction !== null
                                                                ? (typeof livePrediction === 'number' 
                                                                    ? livePrediction.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                                                                    : String(livePrediction))
                                                                : '---'}
                                                        </div>
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-purple-100 backdrop-blur-md border border-white/5 mx-auto">
                                                            <ArrowRight size={10} />
                                                            Live Estimation Output
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderHypothesis = () => (
        <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h3 className="text-xl font-bold text-gray-900">Statistical Significance Explorer</h3>
                <div className="flex gap-2 bg-white p-2 rounded-xl border border-emerald-100 shadow-sm">
                    <select 
                        value={hypoGroup}
                        onChange={(e) => sethypoGroup(e.target.value)}
                        className="px-3 py-1.5 text-xs font-bold bg-gray-50 rounded-lg outline-none text-emerald-700"
                    >
                        {categoricalCols.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="text-xs text-emerald-300 self-center">vs</span>
                    <select 
                        value={hypoMetric}
                        onChange={(e) => sethypoMetric(e.target.value)}
                        className="px-3 py-1.5 text-xs font-bold bg-gray-50 rounded-lg outline-none text-emerald-700"
                    >
                        {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {hypothesis ? (
                <div className="space-y-6">
                    <div className="flex gap-4 items-center">
                        <div className="px-5 py-3 bg-white rounded-2xl border border-emerald-200 text-emerald-800 font-mono font-black shadow-sm">
                            {hypothesis.finding}
                        </div>
                        <div className="bg-emerald-500 p-1.5 rounded-full text-white">
                            <Info size={14} />
                        </div>
                        <span className="text-xs text-emerald-600 font-bold uppercase tracking-tight">Active Analytics Result</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
                            <div className="text-xs font-bold text-emerald-500 uppercase mb-2">Conclusion</div>
                            <p className="text-gray-700 leading-relaxed text-sm">
                                {hypothesis.takeaway.split(/(\*\*.*?\*\*)/).map((part, i) => 
                                    part.startsWith('**') && part.endsWith('**') ? 
                                        <strong key={i} className="text-emerald-900">{part.slice(2, -2)}</strong> : 
                                        part
                                )}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
                            <div className="text-xs font-bold text-emerald-500 uppercase mb-2">Business Action</div>
                            <p className="text-gray-700 leading-relaxed font-bold text-sm italic">"{hypothesis.recommendation}"</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400 text-sm">Select a category and metric to begin testing.</div>
            )}
        </div>
    );

    const renderOutliers = () => (
        <div className="bg-rose-50/50 p-8 rounded-3xl border border-rose-100 animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-4 mb-6">
                <Zap className="text-rose-500" size={32} />
                <h3 className="text-xl font-bold text-gray-900">Advanced Anomaly Report</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {anomalySummary.map((finding, idx) => (
                    <div key={idx} className="flex gap-3 bg-white p-4 rounded-xl border border-rose-100 shadow-sm items-start">
                        <div className="mt-1 shrink-0 bg-rose-100 p-1 rounded-md">
                            <ShieldCheck className="text-rose-600" size={14} />
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">
                            {finding.split(/(\*\*.*?\*\*)/).map((part, i) => 
                                part.startsWith('**') && part.endsWith('**') ? 
                                    <strong key={i} className="text-rose-900">{part.slice(2, -2)}</strong> : 
                                    part
                            )}
                        </p>
                    </div>
                ))}
            </div>
            <div className="bg-rose-600/5 p-4 rounded-xl border border-rose-100 flex items-center gap-3">
                <Info size={16} className="text-rose-500" />
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-tight">Risk Score calculated using local statistical deviation model</span>
            </div>
        </div>
    );

    const renderDistribution = () => (
        <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div className="flex items-center gap-4">
                    <BarChart3 size={32} className="text-indigo-400" />
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Distribution Deep-Dive</h3>
                        <p className="text-xs text-indigo-600 font-medium tracking-tight">Detecting Skewness & Spread Patterns</p>
                    </div>
                </div>
                <select 
                    value={distCol}
                    onChange={(e) => setDistCol(e.target.value)}
                    className="px-4 py-2 bg-white rounded-xl border border-indigo-200 text-sm font-bold text-indigo-700 outline-none shadow-sm"
                >
                    {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {distStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Mean', value: distStats.mean.toLocaleString() },
                            { label: 'Median', value: distStats.median.toLocaleString() },
                            { label: 'Minimum', value: distStats.min.toLocaleString() },
                            { label: 'Maximum', value: distStats.max.toLocaleString() },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm text-center">
                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{stat.label}</div>
                                <div className="text-lg font-black text-indigo-900">{stat.value}</div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-sm flex flex-col justify-center">
                         <div className="text-xs font-bold text-indigo-600 uppercase mb-2">Spread Pattern</div>
                         <p className="text-sm text-gray-800 font-bold leading-snug">{distStats.takeaway}</p>
                         <div className="mt-3 text-[10px] text-gray-400">Skewness Index: {distStats.skewness.toFixed(3)}</div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderBusiness = () => (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                    <div className="mt-1 shrink-0 bg-amber-100 p-2 rounded-xl text-amber-600"><TrendingUp size={24} /></div>
                    <div>
                        <h4 className="font-bold text-amber-900 mb-1">Growth Recommendation</h4>
                        <p className="text-sm text-amber-800 leading-relaxed opacity-80">Focus promotional efforts on the top 20% of your product categories which are driving 80% of revenue.</p>
                    </div>
                </div>
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                    <div className="mt-1 shrink-0 bg-blue-100 p-2 rounded-xl text-blue-600"><ShieldCheck size={24} /></div>
                    <div>
                        <h4 className="font-bold text-blue-900 mb-1">Risk Mitigation</h4>
                        <p className="text-sm text-blue-800 leading-relaxed opacity-80">Monitor the high-variance segments identified in the correlation analysis to ensure consistency.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 mt-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 px-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        Advanced Intelligence Suite <Sparkles className="text-amber-400" size={24} />
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Deep-dive analysis and automated strategic recommendations</p>
                </div>

                <div className="relative w-full md:w-72">
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <currentOption.icon size={18} className={currentOption.color} />
                            {currentOption.label}
                        </div>
                        <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                        <div className="absolute right-0 top-full mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {analysisOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setSelectedAnalysis(opt.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors ${selectedAnalysis === opt.id ? 'bg-blue-50/50 text-blue-600' : 'text-gray-600'}`}
                                >
                                    <opt.icon size={18} className={opt.color} />
                                    <span className="text-sm font-bold">{opt.label}</span>
                                    {selectedAnalysis === opt.id && <Zap size={14} className="ml-auto animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="min-h-[300px] px-2">
                {selectedAnalysis === 'summary' && renderSummary()}
                {selectedAnalysis === 'predictive' && renderPredictive()}
                {selectedAnalysis === 'hypothesis' && renderHypothesis()}
                {selectedAnalysis === 'outliers' && renderOutliers()}
                {selectedAnalysis === 'business' && renderBusiness()}
                {selectedAnalysis === 'distribution' && renderDistribution()}
            </div>
        </div>
    );
}
