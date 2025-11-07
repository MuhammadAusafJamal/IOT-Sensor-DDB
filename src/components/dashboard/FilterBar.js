'use client';

/**
 * Filter Bar Component
 * 
 * Provides filtering controls for the dashboard
 */

export default function FilterBar({ filters, onChange }) {
    const regions = ['', 'north', 'south', 'east', 'west'];
    const statuses = ['', 'active', 'inactive', 'maintenance'];

    return (
        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-xl p-6">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">🔍 Filters:</span>
                </div>

                {/* Region Filter */}
                <div className="flex items-center gap-2">
                    <label className="text-gray-300 text-sm">Region:</label>
                    <select
                        value={filters.region}
                        onChange={(e) => onChange({ region: e.target.value })}
                        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Regions</option>
                        {regions.slice(1).map((region) => (
                            <option key={region} value={region} className="bg-slate-800">
                                {region.charAt(0).toUpperCase() + region.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <label className="text-gray-300 text-sm">Status:</label>
                    <select
                        value={filters.status}
                        onChange={(e) => onChange({ status: e.target.value })}
                        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Statuses</option>
                        {statuses.slice(1).map((status) => (
                            <option key={status} value={status} className="bg-slate-800">
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Clear Filters */}
                {(filters.region || filters.status) && (
                    <button
                        onClick={() => onChange({ region: '', status: '' })}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        ✕ Clear Filters
                    </button>
                )}

                {/* Active Filters Display */}
                <div className="flex-1"></div>
                <div className="flex items-center gap-2">
                    {filters.region && (
                        <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">
                            Region: {filters.region}
                        </span>
                    )}
                    {filters.status && (
                        <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">
                            Status: {filters.status}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}