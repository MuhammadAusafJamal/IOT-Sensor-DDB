'use client';

/**
 * Sensor Charts Component
 * 
 * Displays interactive charts for sensor data visualization
 */

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

export default function SensorCharts({ data }) {
    if (!data || !data.statistics) return null;

    const chartData = useMemo(() => {
        if (!data || !data.readings) return [];

        const readings = data.readings;

        // Group by hour and region
        const hourlyData = readings.reduce((acc, reading) => {
            const hour = new Date(reading.timestamp).getHours();
            if (!acc[hour]) {
                acc[hour] = {
                    time: `${hour.toString().padStart(2, '0')}:00`,
                    north: 0,
                    south: 0,
                    east: 0,
                    west: 0,
                    northCount: 0,
                    southCount: 0,
                    eastCount: 0,
                    westCount: 0,
                };
            }

            const region = reading.region;
            if (region && acc[hour][region] !== undefined) {
                acc[hour][region] += parseFloat(reading.temperature);
                acc[hour][`${region}Count`]++;
            }

            return acc;
        }, {});

        // Compute averages
        return Object.values(hourlyData)
            .map(entry => ({
                time: entry.time,
                north: entry.northCount ? entry.north / entry.northCount : 0,
                south: entry.southCount ? entry.south / entry.southCount : 0,
                east: entry.eastCount ? entry.east / entry.eastCount : 0,
                west: entry.westCount ? entry.west / entry.westCount : 0,
            }))
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [data]);

    if (!chartData.length) {
        return (
            <div className="text-white p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
                No sensor data available.
            </div>
        );
    }

    // Prepare data for regional comparison
    const regionalData = data.statistics.map(stat => ({
        region: stat.region.toUpperCase(),
        'Avg Temp (°C)': parseFloat(stat.avgTemp),
        'Avg Humidity (%)': parseFloat(stat.avgHumidity),
        'Avg AQI': parseFloat(stat.avgAqi),
        'Avg Battery (%)': parseFloat(stat.avgBattery),
    }));

    // Prepare time-series data (last 20 readings)
    const timeSeriesData = data.readings
        ?.slice(0, 20)
        .reverse()
        .map((reading, index) => ({
            index: index + 1,
            temperature: parseFloat(reading.temperature),
            humidity: parseFloat(reading.humidity),
            aqi: reading.air_quality,
            time: new Date(reading.timestamp).toLocaleTimeString(),
        })) || [];

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/90 backdrop-blur-lg border border-white/20 rounded-lg p-3">
                    <p className="text-white font-semibold mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Regional Comparison - Bar Chart */}
            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>📊</span> Regional Sensor Comparison
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={regionalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis
                            dataKey="region"
                            stroke="#ffffff80"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#ffffff80"
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ color: '#fff' }}
                            iconType="circle"
                        />
                        <Bar dataKey="Avg Temp (°C)" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Avg Humidity (%)" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Avg AQI" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Temperature & Humidity Trends - Line Chart */}
            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>📈</span> Recent Sensor Readings (Last 20)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis
                            dataKey="index"
                            stroke="#ffffff80"
                            style={{ fontSize: '12px' }}
                            label={{ value: 'Reading #', position: 'insideBottom', offset: -5, fill: '#ffffff80' }}
                        />
                        <YAxis
                            stroke="#ffffff80"
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ color: '#fff' }}
                            iconType="line"
                        />
                        <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            dot={{ fill: '#f59e0b', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Temperature (°C)"
                        />
                        <Line
                            type="monotone"
                            dataKey="humidity"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Humidity (%)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-6">
                    24-Hour Temperature Trends (Real Data)
                </h3>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="time" stroke="#ccc" />
                            <YAxis stroke="#ccc" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #64748b',
                                    borderRadius: '8px',
                                    color: '#fff',
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="north"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="south"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="east"
                                stroke="#facc15"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="west"
                                stroke="#22c55e"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Air Quality Index - Line Chart */}
            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>🌫️</span> Air Quality Index Trend
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis
                            dataKey="index"
                            stroke="#ffffff80"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#ffffff80"
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: '#fff' }} />
                        <Line
                            type="monotone"
                            dataKey="aqi"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Air Quality Index"
                        />
                    </LineChart>
                </ResponsiveContainer>

                {/* AQI Legend */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-gray-300 text-xs">0-50 Good</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-gray-300 text-xs">51-100 Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-500 rounded"></div>
                        <span className="text-gray-300 text-xs">101-150 Unhealthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-gray-300 text-xs">151+ Very Unhealthy</span>
                    </div>
                </div>
            </div>

            {/* Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {data.statistics.map((stat) => (
                    <div
                        key={stat.region}
                        className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-xl p-4"
                    >
                        <h4 className="text-lg font-bold text-white mb-3 uppercase">
                            {stat.region}
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Temperature:</span>
                                <span className="text-orange-400 font-semibold">{stat.avgTemp}°C</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Humidity:</span>
                                <span className="text-blue-400 font-semibold">{stat.avgHumidity}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">AQI:</span>
                                <span className="text-green-400 font-semibold">{stat.avgAqi}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Battery:</span>
                                <span className="text-yellow-400 font-semibold">{stat.avgBattery}%</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                <span className="text-gray-400">Readings:</span>
                                <span className="text-purple-400 font-semibold">{stat.readingCount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}



// 'use client';

// import { useMemo } from 'react';


// export default function SensorCharts({ data }) {
//     // Transform sensor data for the chart
//     const chartData = useMemo(() => {
//         if (!data || !data.readings) return [];

//         const readings = data.readings;

//         // Group by hour and region
//         const hourlyData = readings.reduce((acc, reading) => {
//             const hour = new Date(reading.timestamp).getHours();
//             if (!acc[hour]) {
//                 acc[hour] = {
//                     time: `${hour.toString().padStart(2, '0')}:00`,
//                     north: 0,
//                     south: 0,
//                     east: 0,
//                     west: 0,
//                     northCount: 0,
//                     southCount: 0,
//                     eastCount: 0,
//                     westCount: 0,
//                 };
//             }

//             const region = reading.region;
//             if (region && acc[hour][region] !== undefined) {
//                 acc[hour][region] += parseFloat(reading.temperature);
//                 acc[hour][`${region}Count`]++;
//             }

//             return acc;
//         }, {});

//         // Compute averages
//         return Object.values(hourlyData)
//             .map(entry => ({
//                 time: entry.time,
//                 north: entry.northCount ? entry.north / entry.northCount : 0,
//                 south: entry.southCount ? entry.south / entry.southCount : 0,
//                 east: entry.eastCount ? entry.east / entry.eastCount : 0,
//                 west: entry.westCount ? entry.west / entry.westCount : 0,
//             }))
//             .sort((a, b) => a.time.localeCompare(b.time));
//     }, [data]);

//     if (!chartData.length) {
//         return (
//             <div className="text-white p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
//                 No sensor data available.
//             </div>
//         );
//     }

//     return (
//         <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
//             <h3 className="text-xl font-semibold text-white mb-6">
//                 24-Hour Temperature Trends (Real Data)
//             </h3>

//             <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                     <LineChart
//                         data={chartData}
//                         margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
//                     >
//                         <CartesianGrid strokeDasharray="3 3" stroke="#444" />
//                         <XAxis dataKey="time" stroke="#ccc" />
//                         <YAxis stroke="#ccc" />
//                         <Tooltip
//                             contentStyle={{
//                                 backgroundColor: '#1e293b',
//                                 border: '1px solid #64748b',
//                                 borderRadius: '8px',
//                                 color: '#fff',
//                             }}
//                         />
//                         <Legend />
//                         <Line
//                             type="monotone"
//                             dataKey="north"
//                             stroke="#3b82f6"
//                             strokeWidth={2}
//                             dot={false}
//                         />
//                         <Line
//                             type="monotone"
//                             dataKey="south"
//                             stroke="#ef4444"
//                             strokeWidth={2}
//                             dot={false}
//                         />
//                         <Line
//                             type="monotone"
//                             dataKey="east"
//                             stroke="#facc15"
//                             strokeWidth={2}
//                             dot={false}
//                         />
//                         <Line
//                             type="monotone"
//                             dataKey="west"
//                             stroke="#22c55e"
//                             strokeWidth={2}
//                             dot={false}
//                         />
//                     </LineChart>
//                 </ResponsiveContainer>
//             </div>
//         </div>
//     );
// }