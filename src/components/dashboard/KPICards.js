// 'use client';

// /**
//  * KPI Cards Component
//  * 
//  * Displays key performance indicators for the IoT system
//  */

// export default function KPICards({ devicesData, sensorsData }) {
//     if (!devicesData || !sensorsData) return null;

//     // Calculate KPIs
//     const totalDevices = devicesData.total || 0;
//     const activeDevices = devicesData.statistics?.byStatus?.active || 0;
//     const totalReadings = sensorsData.total || 0;

//     // Calculate average temperature across all regions
//     const avgTemperature = sensorsData.statistics?.length > 0
//         ? (sensorsData.statistics.reduce((sum, s) => sum + parseFloat(s.avgTemp), 0) / sensorsData.statistics.length).toFixed(1)
//         : '0';

//     // Calculate average battery level
//     const avgBattery = sensorsData.statistics?.length > 0
//         ? (sensorsData.statistics.reduce((sum, s) => sum + parseFloat(s.avgBattery), 0) / sensorsData.statistics.length).toFixed(0)
//         : '0';

//     // Calculate regions
//     const regionsCount = Object.keys(devicesData.statistics?.byRegion || {}).length;

//     const kpis = [
//         {
//             title: 'Total Devices',
//             value: totalDevices,
//             icon: '📱',
//             change: '+12%',
//             trend: 'up',
//             color: 'from-blue-500 to-cyan-500',
//         },
//         {
//             title: 'Active Devices',
//             value: activeDevices,
//             icon: '✅',
//             change: `${((activeDevices / totalDevices) * 100).toFixed(0)}%`,
//             trend: 'up',
//             color: 'from-green-500 to-emerald-500',
//         },
//         {
//             title: 'Sensor Readings',
//             value: totalReadings.toLocaleString(),
//             icon: '📊',
//             change: '+8.5K',
//             trend: 'up',
//             color: 'from-purple-500 to-pink-500',
//         },
//         {
//             title: 'Avg Temperature',
//             value: `${avgTemperature}°C`,
//             icon: '🌡️',
//             change: '+2.3°C',
//             trend: 'up',
//             color: 'from-orange-500 to-red-500',
//         },
//         {
//             title: 'Avg Battery',
//             value: `${avgBattery}%`,
//             icon: '🔋',
//             change: '-5%',
//             trend: 'down',
//             color: 'from-yellow-500 to-amber-500',
//         },
//         {
//             title: 'Regions',
//             value: regionsCount,
//             icon: '🌍',
//             change: '4 active',
//             trend: 'neutral',
//             color: 'from-teal-500 to-cyan-500',
//         },
//     ];

//     return (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {kpis.map((kpi, index) => (
//                 <div
//                     key={index}
//                     className="relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-lg border border-white/10 p-6 hover:scale-105 transition-all duration-300 group"
//                 >
//                     {/* Background gradient */}
//                     <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>

//                     <div className="relative">
//                         {/* Icon */}
//                         <div className="flex items-center justify-between mb-4">
//                             <span className="text-4xl">{kpi.icon}</span>
//                             {kpi.trend !== 'neutral' && (
//                                 <span className={`text-sm font-semibold px-2 py-1 rounded-full ${kpi.trend === 'up'
//                                         ? 'bg-green-500/20 text-green-400'
//                                         : 'bg-red-500/20 text-red-400'
//                                     }`}>
//                                     {kpi.trend === 'up' ? '↑' : '↓'} {kpi.change}
//                                 </span>
//                             )}
//                         </div>

//                         {/* Value */}
//                         <div className="mb-2">
//                             <h3 className={`text-4xl font-bold bg-gradient-to-r ${kpi.color} bg-clip-text text-transparent`}>
//                                 {kpi.value}
//                             </h3>
//                         </div>

//                         {/* Title */}
//                         <p className="text-gray-300 text-sm font-medium">
//                             {kpi.title}
//                         </p>
//                     </div>
//                 </div>
//             ))}
//         </div>
//     );
// }




'use client';

import { useState, useEffect } from 'react';

export default function KPICards() {
    const [kpiData, setKpiData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchKPIs();

        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchKPIs, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchKPIs = async () => {
        try {
            const response = await fetch('/api/kpi');
            const result = await response.json();

            if (result.success) {
                setKpiData(result.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching KPIs:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-slate-800/50 rounded-xl p-6 animate-pulse">
                        <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-slate-700 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!kpiData) {
        return <div className="text-white">Failed to load KPIs</div>;
    }

    const getColorClasses = (color) => {
        const colors = {
            blue: 'from-blue-600 to-blue-800',
            green: 'from-green-600 to-green-800',
            red: 'from-red-600 to-red-800',
            purple: 'from-purple-600 to-purple-800',
            cyan: 'from-cyan-600 to-cyan-800',
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(kpiData).map(([key, kpi]) => (
                <div
                    key={key}
                    className={`bg-gradient-to-br ${getColorClasses(kpi.color)} rounded-xl p-6 text-white transform hover:scale-105 transition-transform`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm opacity-90">{kpi.label}</div>
                        <div className="text-2xl">{kpi.icon}</div>
                    </div>

                    <div className="text-3xl font-bold mb-2">
                        {typeof kpi.value === 'number'
                            ? kpi.value.toLocaleString()
                            : kpi.value
                        }
                    </div>

                    {kpi.trend && (
                        <div className="text-xs opacity-75 flex items-center gap-1">
                            {kpi.trend.includes('+') && <span>📈</span>}
                            {kpi.trend.includes('-') && <span>📉</span>}
                            {kpi.trend}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}