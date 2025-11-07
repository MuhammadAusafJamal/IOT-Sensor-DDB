'use client';

/**
 * Device Table Component
 * 
 * Displays an interactive table of all IoT devices
 */

import { useState } from 'react';

export default function DeviceTable({ data }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('device_id');
    const [sortDirection, setSortDirection] = useState('asc');
    const itemsPerPage = 10;

    if (!data || !data.devices) return null;

    // Sort devices
    const sortedDevices = [...data.devices].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    // Paginate
    const totalPages = Math.ceil(sortedDevices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDevices = sortedDevices.slice(startIndex, startIndex + itemsPerPage);

    // Handle sort
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'inactive':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'maintenance':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default:
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    // Get region badge color
    const getRegionColor = (region) => {
        const colors = {
            north: 'bg-blue-500/20 text-blue-400',
            south: 'bg-red-500/20 text-red-400',
            east: 'bg-green-500/20 text-green-400',
            west: 'bg-purple-500/20 text-purple-400',
        };
        return colors[region] || 'bg-gray-500/20 text-gray-400';
    };

    return (
        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
            {/* Table Header Info */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                            Device Inventory
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedDevices.length)} of {sortedDevices.length} devices
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-purple-400">{data.total}</p>
                        <p className="text-gray-400 text-sm">Total Devices</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={() => handleSort('device_id')}
                            >
                                <div className="flex items-center gap-2">
                                    Device ID
                                    {sortField === 'device_id' && (
                                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={() => handleSort('device_name')}
                            >
                                <div className="flex items-center gap-2">
                                    Device Name
                                    {sortField === 'device_name' && (
                                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={() => handleSort('region')}
                            >
                                <div className="flex items-center gap-2">
                                    Region
                                    {sortField === 'region' && (
                                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-2">
                                    Status
                                    {sortField === 'status' && (
                                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                Device Type
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                Firmware
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                Location
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {paginatedDevices.map((device, index) => (
                            <tr
                                key={device.device_id}
                                className="hover:bg-white/5 transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-mono text-purple-400">
                                        {device.device_id}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-medium text-white">
                                        {device.device_name}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRegionColor(device.region)}`}>
                                        {device.region.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(device.status)}`}>
                                        {device.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-300">
                                        {device.device_type.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-mono text-gray-400">
                                        {device.firmware_version}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-400 truncate max-w-xs block">
                                        {device.location}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Previous
                    </button>

                    <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-10 h-10 rounded-lg transition-colors ${currentPage === pageNum
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
}