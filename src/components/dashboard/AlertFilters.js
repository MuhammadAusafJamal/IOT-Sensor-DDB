// components/dashboard/AlertFilters.jsx

'use client';

import { useState } from 'react';

export default function AlertFilters({filters, onFilterChange=()=>{} }) {
    // const [alertFilters, setAlertFilters] = useState({
    //     severity: '',
    //     region: '',
    //     type: '',
    // });

    const handleChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        // setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const emptyFilters = { severity: '', region: '', type: '' };
        onFilterChange(emptyFilters);
    };

    const hasActiveFilters = filters.severity || filters.region || filters.type;

    return (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">🔍 Filters:</span>
                </div>

                {/* Severity Filter */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400">Severity:</label>
                    <select
                        value={filters.severity}
                        onChange={(e) => handleChange('severity', e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                        <option value="">All</option>
                        <option value="critical">Critical</option>
                        <option value="warning">Warning</option>
                        <option value="info">Info</option>
                    </select>
                </div>

                {/* Region Filter */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400">Region:</label>
                    <select
                        value={filters.region}
                        onChange={(e) => handleChange('region', e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                        <option value="">All</option>
                        <option value="north">North</option>
                        <option value="south">South</option>
                        <option value="east">East</option>
                        <option value="west">West</option>
                    </select>
                </div>

                {/* Alert Type Filter */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400">Type:</label>
                    <select
                        value={filters.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                        <option value="">All</option>
                        <option value="low_battery">Low Battery</option>
                        <option value="high_temperature">High Temperature</option>
                        <option value="low_temperature">Low Temperature</option>
                        <option value="poor_air_quality">Poor Air Quality</option>
                        <option value="weak_signal">Weak Signal</option>
                    </select>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                    >
                        <span>✕</span>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">Active:</span>
                    {filters.severity && (
                        <span className="px-2 py-1 bg-purple-600/30 rounded text-xs text-purple-300">
                            Severity: {filters.severity}
                        </span>
                    )}
                    {filters.region && (
                        <span className="px-2 py-1 bg-purple-600/30 rounded text-xs text-purple-300">
                            Region: {filters.region}
                        </span>
                    )}
                    {filters.type && (
                        <span className="px-2 py-1 bg-purple-600/30 rounded text-xs text-purple-300">
                            Type: {filters.type.replace('_', ' ')}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}