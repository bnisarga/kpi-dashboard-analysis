"use client";

import React, { useState, useEffect } from 'react';
import { useData, KPI } from '../context/DataContext';
import { Sparkles, Plus, Check, Key, Settings, AlertCircle, ExternalLink, HelpCircle, RefreshCw, BarChart } from 'lucide-react';

export function KPISuggestions() {
    const {
        suggestedKpis,
        aiSuggestedKpis,
        isGeneratingAiSuggestions,
        generateAiSuggestions,
        addKPI,
        kpis,
        data,
        setData
    } = useData();

    const [activeTab, setActiveTab] = useState<'standard' | 'ai'>('standard');
    const [clientApiKey, setClientApiKey] = useState('');
    const [showApiConfig, setShowApiConfig] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Initialize API key from localStorage on mount
    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setClientApiKey(savedKey);
        }
    }, []);

    const handleSaveApiKey = (key: string) => {
        setClientApiKey(key);
        localStorage.setItem('gemini_api_key', key);
        setApiError(null);
    };

    const handleGenerateAi = async () => {
        setApiError(null);
        const error = await generateAiSuggestions(clientApiKey);
        if (error) {
            setApiError(error);
        }
    };

    const isKpiAdded = (name: string) => kpis.some(k => k.name === name);

    return (
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 p-6 rounded-2xl border border-indigo-100 shadow-sm mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section with Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-indigo-100/50">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-indigo-600 animate-pulse" size={24} />
                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Analysis & KPI Suggestions</h2>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-200/60 p-1 rounded-xl self-start sm:self-center">
                    <button
                        onClick={() => setActiveTab('standard')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'standard'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Standard Suggestions
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'ai'
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-100'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Sparkles size={12} className={activeTab === 'ai' ? 'animate-spin' : ''} />
                        AI suggestions
                    </button>
                </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'standard' ? (
                // --- Standard Heuristics Tab ---
                <>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-600">
                            Based on your data columns, we've identified some useful default metrics for your dashboard.
                        </p>
                        <button
                            onClick={() => setData([...data])} // Trigger re-analysis
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                        >
                            <RefreshCw size={12} />
                            Refresh
                        </button>
                    </div>

                    {suggestedKpis.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {suggestedKpis.map((suggestion) => {
                                const added = isKpiAdded(suggestion.name);
                                return (
                                    <div
                                        key={suggestion.id}
                                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full uppercase tracking-wider">
                                                    {suggestion.chartType}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1 text-sm">{suggestion.name}</h3>
                                            <p className="text-xs text-gray-500 mb-4">
                                                {suggestion.aggregation} of {suggestion.metric} by {suggestion.dimension}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => !added && addKPI({ ...suggestion, id: Date.now().toString() + Math.random().toString() })}
                                            disabled={added}
                                            className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${added
                                                ? 'bg-green-50 text-green-700 cursor-default'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                                }`}
                                        >
                                            {added ? (
                                                <>
                                                    <Check size={14} />
                                                    Added to Dashboard
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={14} />
                                                    Add to Dashboard
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-10 text-center bg-white/50 rounded-xl border border-dashed border-indigo-200">
                            <p className="text-gray-500 text-sm italic">
                                Please upload a structured dataset to generate metric suggestions.
                            </p>
                        </div>
                    )}
                </>
            ) : (
                // --- AI Suggestions Tab ---
                <div className="space-y-6">
                    {/* API Key management panel */}
                    <div className="bg-white p-4 rounded-xl border border-indigo-100/80 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-800">
                                <Key className="text-indigo-500" size={16} />
                                <span className="font-semibold">Gemini API Configuration</span>
                                {clientApiKey ? (
                                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Configured (Local)</span>
                                ) : (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">Key Required</span>
                                )}
                            </div>
                            <button
                                onClick={() => setShowApiConfig(!showApiConfig)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                            >
                                <Settings size={14} />
                                {showApiConfig ? 'Hide Setup' : 'Manage Key'}
                            </button>
                        </div>

                        {/* Collapsible API Key Config Form */}
                        {(showApiConfig || !clientApiKey) && (
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                <div className="text-xs text-gray-600 leading-relaxed">
                                    To get API suggestions based on complex data patterns, you can use Google Gemini.
                                    Don't have a key? You can get a <span className="font-bold text-indigo-600">free API Key</span> from Google AI Studio in less than a minute.
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="password"
                                            placeholder="Paste your Gemini API Key here..."
                                            value={clientApiKey}
                                            onChange={(e) => handleSaveApiKey(e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                                        />
                                        {clientApiKey && (
                                            <button
                                                onClick={() => handleSaveApiKey('')}
                                                className="absolute right-2.5 top-2 text-[10px] text-red-500 font-semibold hover:underline"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <a
                                        href="https://aistudio.google.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors"
                                    >
                                        Get Free Key <ExternalLink size={12} />
                                    </a>
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    Your key is stored securely in your browser's LocalStorage and is sent directly to your server endpoint to contact the Gemini API.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* AI Suggestions Results */}
                    {apiError && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-800 text-xs">
                            <AlertCircle className="shrink-0 text-red-500" size={16} />
                            <div>
                                <span className="font-bold">Error generating suggestions:</span> {apiError}
                            </div>
                        </div>
                    )}

                    {isGeneratingAiSuggestions ? (
                        /* Loading state */
                        <div className="p-12 text-center bg-white rounded-xl border border-indigo-100/50 shadow-sm flex flex-col items-center justify-center space-y-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                                <Sparkles className="absolute inset-0 m-auto text-indigo-500 animate-pulse" size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm">Gemini is analyzing your dataset...</h3>
                                <p className="text-xs text-gray-500 mt-1">Identifying schema relations, cardinality, and strategic data patterns.</p>
                            </div>
                        </div>
                    ) : aiSuggestedKpis.length > 0 ? (
                        /* Suggestions Grid */
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-600">
                                    AI recommendations optimized for your data content and structure.
                                </p>
                                <button
                                    onClick={handleGenerateAi}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold"
                                >
                                    <RefreshCw size={12} />
                                    Regenerate suggestions
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {aiSuggestedKpis.map((suggestion) => {
                                    const added = isKpiAdded(suggestion.name);
                                    return (
                                        <div
                                            key={suggestion.id}
                                            className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full uppercase tracking-wider">
                                                        {suggestion.chartType}
                                                    </span>
                                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded uppercase tracking-wide flex items-center gap-0.5">
                                                        <Sparkles size={8} /> AI
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-gray-900 mb-1 text-sm">{suggestion.name}</h3>
                                                <p className="text-[11px] text-gray-500 mb-3">
                                                    {suggestion.aggregation} of {suggestion.metric} by {suggestion.dimension}
                                                </p>
                                                {suggestion.reason && (
                                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-4 text-[11px] text-gray-600 italic leading-relaxed">
                                                        <strong>Analyst Insights:</strong> "{suggestion.reason}"
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => !added && addKPI({
                                                    id: Date.now().toString() + Math.random().toString(),
                                                    name: suggestion.name,
                                                    dimension: suggestion.dimension,
                                                    metric: suggestion.metric,
                                                    aggregation: suggestion.aggregation,
                                                    chartType: suggestion.chartType,
                                                    color: suggestion.color || '#3b82f6'
                                                })}
                                                disabled={added}
                                                className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${added
                                                    ? 'bg-green-50 text-green-700 cursor-default'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                                    }`}
                                            >
                                                {added ? (
                                                    <>
                                                        <Check size={14} />
                                                        Added to Dashboard
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus size={14} />
                                                        Add to Dashboard
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Welcome CTA to generate suggestions */
                        <div className="p-8 text-center bg-white rounded-xl border border-indigo-100 shadow-sm flex flex-col items-center justify-center space-y-4">
                            <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                                <BarChart size={32} />
                            </div>
                            <div className="max-w-md">
                                <h3 className="font-bold text-gray-900 text-sm">Generate AI recommendations</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Google Gemini will inspect your dataset columns, types, and sample entries to suggest the most relevant business trends, breakdowns, and KPIs.
                                </p>
                            </div>
                            <button
                                onClick={handleGenerateAi}
                                disabled={isGeneratingAiSuggestions}
                                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-100 hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Sparkles size={14} className="animate-pulse" />
                                Analyze Data with AI
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
