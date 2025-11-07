'use client';

/**
 * Node Health Cards Component
 * 
 * Displays health status of all distributed database nodes
 * with real-time monitoring indicators
 */

export default function NodeHealthCards({ data }) {
    if (!data || !data.nodes) return null;

    const getStatusColor = (status) => {
        return status === 'healthy'
            ? 'from-green-500 to-emerald-600'
            : 'from-red-500 to-rose-600';
    };

    const getStatusIcon = (status) => {
        return status === 'healthy' ? '✅' : '❌';
    };

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between text-white">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Cluster Health</h3>
                        <p className="text-3xl font-bold">
                            {data.summary.healthy}/{data.summary.total} Nodes Online
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-bold">
                            {data.summary.healthPercentage}%
                        </div>
                        <p className="text-sm opacity-90">Uptime</p>
                    </div>
                </div>
            </div>

            {/* Individual Node Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.nodes.map((node) => (
                    <div
                        key={node.node}
                        className="relative overflow-hidden rounded-xl bg-black/40 backdrop-blur-lg border border-white/10 p-6 hover:scale-105 transition-transform duration-300"
                    >
                        {/* Gradient overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${getStatusColor(node.status)} opacity-10`}></div>

                        <div className="relative">
                            {/* Node header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white uppercase">
                                    {node.node}
                                </h3>
                                <span className="text-3xl">
                                    {getStatusIcon(node.status)}
                                </span>
                            </div>

                            {/* Status badge */}
                            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold mb-4 bg-gradient-to-r ${getStatusColor(node.status)} text-white`}>
                                {node.status}
                            </div>

                            {/* Node details */}
                            {node.status === 'healthy' ? (
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between text-gray-300">
                                        <span>Version:</span>
                                        <span className="font-mono text-purple-300">
                                            {node.version.split(' ')[1]}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-gray-300">
                                        <span>Errors:</span>
                                        <span className="font-bold text-green-400">
                                            {node.errorCount}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-3">
                                        Last checked: {new Date(node.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-red-300 text-sm">
                                    <p className="font-semibold mb-1">Error:</p>
                                    <p className="text-xs">{node.error}</p>
                                </div>
                            )}

                            {/* Pulse animation for healthy nodes */}
                            {node.status === 'healthy' && (
                                <div className="absolute top-4 right-4">
                                    <span className="flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}