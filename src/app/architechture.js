import React, { useState } from 'react';
import { Database, Server, Network, Shield, Activity, GitBranch, Layers, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const IoTDDBDiagrams = () => {
    const [activeTab, setActiveTab] = useState('architecture');

    const tabs = [
        { id: 'architecture', name: 'System Architecture', icon: Server },
        { id: 'er', name: 'ER Diagram', icon: Database },
        { id: 'fragmentation', name: 'Fragmentation', icon: Layers },
        { id: 'replication', name: 'Replication', icon: GitBranch },
        { id: 'query', name: 'Query Processing', icon: Network },
        { id: 'concurrency', name: 'Concurrency Control', icon: Lock },
        { id: 'fault', name: 'Fault Tolerance', icon: Shield }
    ];

    return (
        <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        IoT Sensor Data Management
                    </h1>
                    <p className="text-blue-300">Distributed Database System - Complete Architecture</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.name}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-slate-800/50 rounded-xl p-6 overflow-auto backdrop-blur">
                    {activeTab === 'architecture' && <ArchitectureDiagram />}
                    {activeTab === 'er' && <ERDiagram />}
                    {activeTab === 'fragmentation' && <FragmentationDiagram />}
                    {activeTab === 'replication' && <ReplicationDiagram />}
                    {activeTab === 'query' && <QueryProcessingDiagram />}
                    {activeTab === 'concurrency' && <ConcurrencyDiagram />}
                    {activeTab === 'fault' && <FaultToleranceDiagram />}
                </div>
            </div>
        </div>
    );
};

const ArchitectureDiagram = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">System Architecture</h2>

        <div className="grid grid-cols-1 gap-6">
            {/* Layer 1: Client Layer */}
            <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 p-4 rounded-lg border border-green-600">
                <h3 className="text-xl font-semibold text-green-300 mb-3">Client Layer</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-700/30 p-3 rounded text-center">
                        <p className="font-semibold">Web Application</p>
                        <p className="text-sm text-green-200">Dashboard & Monitoring</p>
                    </div>
                    <div className="bg-green-700/30 p-3 rounded text-center">
                        <p className="font-semibold">IoT Devices</p>
                        <p className="text-sm text-green-200">Sensors (100 devices)</p>
                    </div>
                    <div className="bg-green-700/30 p-3 rounded text-center">
                        <p className="font-semibold">API Gateway</p>
                        <p className="text-sm text-green-200">RESTful Interface</p>
                    </div>
                </div>
            </div>

            {/* Layer 2: Application Layer */}
            <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 p-4 rounded-lg border border-blue-600">
                <h3 className="text-xl font-semibold text-blue-300 mb-3">Application Layer (Node.js)</h3>
                <div className="grid grid-cols-4 gap-3">
                    <div className="bg-blue-700/30 p-3 rounded text-center">
                        <p className="font-semibold">Query Router</p>
                        <p className="text-sm text-blue-200">Distributed queries</p>
                    </div>
                    <div className="bg-blue-700/30 p-3 rounded text-center">
                        <p className="font-semibold">Transaction Manager</p>
                        <p className="text-sm text-blue-200">ACID compliance</p>
                    </div>
                    <div className="bg-blue-700/30 p-3 rounded text-center">
                        <p className="font-semibold">Replication Engine</p>
                        <p className="text-sm text-blue-200">Async replication</p>
                    </div>
                    <div className="bg-blue-700/30 p-3 rounded text-center">
                        <p className="font-semibold">Health Monitor</p>
                        <p className="text-sm text-blue-200">Node monitoring</p>
                    </div>
                </div>
            </div>

            {/* Layer 3: Database Layer */}
            <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 p-4 rounded-lg border border-purple-600">
                <h3 className="text-xl font-semibold text-purple-300 mb-3">Database Layer (PostgreSQL - 4 Nodes)</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <NodeCard name="NORTH" port="5432" region="Northern" color="blue" />
                        <NodeCard name="SOUTH" port="5433" region="Southern" color="red" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <NodeCard name="EAST" port="5434" region="Eastern" color="yellow" />
                        <NodeCard name="WEST" port="5435" region="Western" color="green" />
                    </div>
                </div>
            </div>

            {/* Replication Lines */}
            <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Replication Pairs</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>North ⟷ South (Primary-Replica)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>East ⟷ West (Primary-Replica)</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-cyan-900/30 p-4 rounded-lg border border-cyan-600">
                <h4 className="font-semibold text-cyan-300 mb-2">🎯 Key Features</h4>
                <ul className="text-sm space-y-1 text-cyan-100">
                    <li>• 4 distributed nodes</li>
                    <li>• Horizontal fragmentation by region</li>
                    <li>• Replication factor: 2</li>
                    <li>• Asynchronous replication</li>
                </ul>
            </div>
            <div className="bg-green-900/30 p-4 rounded-lg border border-green-600">
                <h4 className="font-semibold text-green-300 mb-2">✅ Benefits</h4>
                <ul className="text-sm space-y-1 text-green-100">
                    <li>• High availability</li>
                    <li>• Fault tolerance</li>
                    <li>• Load balancing</li>
                    <li>• Regional data locality</li>
                </ul>
            </div>
            <div className="bg-orange-900/30 p-4 rounded-lg border border-orange-600">
                <h4 className="font-semibold text-orange-300 mb-2">📊 Scale</h4>
                <ul className="text-sm space-y-1 text-orange-100">
                    <li>• 100 IoT devices</li>
                    <li>• 10,000+ sensor readings</li>
                    <li>• 4 geographic regions</li>
                    <li>• Real-time monitoring</li>
                </ul>
            </div>
        </div>
    </div>
);

const NodeCard = ({ name, port, region, color }) => {
    const colors = {
        blue: 'from-blue-600 to-blue-800',
        red: 'from-red-600 to-red-800',
        yellow: 'from-yellow-600 to-yellow-800',
        green: 'from-green-600 to-green-800'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} p-3 rounded-lg border-2 border-white/20`}>
            <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5" />
                <p className="font-bold">{name}</p>
            </div>
            <div className="text-sm space-y-1">
                <p>Port: {port}</p>
                <p>Region: {region}</p>
                <p className="text-xs opacity-75">25 devices</p>
            </div>
        </div>
    );
};

const ERDiagram = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Entity-Relationship Diagram</h2>

        <div className="grid grid-cols-3 gap-6">
            {/* Devices Entity */}
            <div className="bg-blue-900/40 p-4 rounded-lg border-2 border-blue-500">
                <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    DEVICES
                </h3>
                <div className="space-y-1 text-sm">
                    <p className="font-semibold text-yellow-300">🔑 device_id (PK)</p>
                    <p>device_name</p>
                    <p>device_type</p>
                    <p>region</p>
                    <p>location</p>
                    <p>latitude, longitude</p>
                    <p>status</p>
                    <p>firmware_version</p>
                </div>
            </div>

            {/* Sensor Data Entity */}
            <div className="bg-purple-900/40 p-4 rounded-lg border-2 border-purple-500">
                <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    SENSOR_DATA
                </h3>
                <div className="space-y-1 text-sm">
                    <p className="font-semibold text-yellow-300">🔑 reading_id (PK)</p>
                    <p className="font-semibold text-green-300">🔗 device_id (FK)</p>
                    <p>region</p>
                    <p>timestamp</p>
                    <p>temperature</p>
                    <p>humidity</p>
                    <p>air_quality</p>
                    <p>battery_level</p>
                    <p>signal_strength</p>
                </div>
            </div>

            {/* Alerts Entity */}
            <div className="bg-red-900/40 p-4 rounded-lg border-2 border-red-500">
                <h3 className="text-lg font-bold text-red-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    ALERTS
                </h3>
                <div className="space-y-1 text-sm">
                    <p className="font-semibold text-yellow-300">🔑 alert_id (PK)</p>
                    <p className="font-semibold text-green-300">🔗 device_id (FK)</p>
                    <p>alert_type</p>
                    <p>severity</p>
                    <p>message</p>
                    <p>threshold_value</p>
                    <p>actual_value</p>
                    <p>resolved</p>
                </div>
            </div>

            {/* Vertical Fragments */}
            <div className="bg-cyan-900/40 p-4 rounded-lg border-2 border-cyan-500">
                <h3 className="text-sm font-bold text-cyan-300 mb-3">SENSOR_DATA_BASIC</h3>
                <div className="space-y-1 text-xs">
                    <p className="font-semibold text-yellow-300">🔑 reading_id</p>
                    <p>device_id</p>
                    <p>region</p>
                    <p>timestamp</p>
                </div>
            </div>

            <div className="bg-cyan-900/40 p-4 rounded-lg border-2 border-cyan-500">
                <h3 className="text-sm font-bold text-cyan-300 mb-3">SENSOR_DATA_READINGS</h3>
                <div className="space-y-1 text-xs">
                    <p className="font-semibold text-yellow-300">🔑 reading_id</p>
                    <p>temperature</p>
                    <p>humidity</p>
                    <p>air_quality</p>
                </div>
            </div>

            <div className="bg-cyan-900/40 p-4 rounded-lg border-2 border-cyan-500">
                <h3 className="text-sm font-bold text-cyan-300 mb-3">SENSOR_DATA_METADATA</h3>
                <div className="space-y-1 text-xs">
                    <p className="font-semibold text-yellow-300">🔑 reading_id</p>
                    <p>battery_level</p>
                    <p>signal_strength</p>
                </div>
            </div>
        </div>

        {/* Relationships */}
        <div className="bg-slate-700/40 p-4 rounded-lg border border-slate-500">
            <h3 className="text-lg font-semibold text-slate-300 mb-3">Relationships</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>DEVICES (1) → SENSOR_DATA (M) - One device has many readings</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>DEVICES (1) → ALERTS (M) - One device generates many alerts</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>SENSOR_DATA_BASIC (1) → READINGS (1) - Vertical split</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>SENSOR_DATA_BASIC (1) → METADATA (1) - Vertical split</span>
                </div>
            </div>
        </div>

        {/* Additional Tables */}
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-600">
                <h4 className="font-semibold text-slate-300 mb-2">NODE_HEALTH</h4>
                <p className="text-xs text-slate-400">Monitors node status, CPU, memory, active connections</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-600">
                <h4 className="font-semibold text-slate-300 mb-2">REPLICATION_LOG</h4>
                <p className="text-xs text-slate-400">Tracks replication events between nodes</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-600">
                <h4 className="font-semibold text-slate-300 mb-2">TRANSACTION_LOG</h4>
                <p className="text-xs text-slate-400">Logs distributed transactions for concurrency</p>
            </div>
        </div>
    </div>
);

const FragmentationDiagram = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Data Fragmentation Strategy</h2>

        {/* Horizontal Fragmentation */}
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-6 rounded-lg border-2 border-blue-500">
            <h3 className="text-xl font-bold text-blue-300 mb-4">1. Horizontal Fragmentation (by Region)</h3>
            <div className="grid grid-cols-4 gap-4">
                <FragmentCard
                    title="North Fragment"
                    node="Node 1 (Port 5432)"
                    condition="WHERE region = 'north'"
                    data={['25 devices', '2,500 readings', 'North region data']}
                    color="blue"
                />
                <FragmentCard
                    title="South Fragment"
                    node="Node 2 (Port 5433)"
                    condition="WHERE region = 'south'"
                    data={['25 devices', '2,500 readings', 'South region data']}
                    color="red"
                />
                <FragmentCard
                    title="East Fragment"
                    node="Node 3 (Port 5434)"
                    condition="WHERE region = 'east'"
                    data={['25 devices', '2,500 readings', 'East region data']}
                    color="yellow"
                />
                <FragmentCard
                    title="West Fragment"
                    node="Node 4 (Port 5435)"
                    condition="WHERE region = 'west'"
                    data={['25 devices', '2,500 readings', 'West region data']}
                    color="green"
                />
            </div>
            <div className="mt-4 bg-blue-800/30 p-3 rounded">
                <p className="text-sm"><strong>Benefit:</strong> Data locality - queries for specific regions only access one node</p>
                <p className="text-sm"><strong>Implementation:</strong> Region-based partitioning ensures balanced load distribution</p>
            </div>
        </div>

        {/* Vertical Fragmentation */}
        <div className="bg-gradient-to-r from-cyan-900/40 to-teal-900/40 p-6 rounded-lg border-2 border-cyan-500">
            <h3 className="text-xl font-bold text-cyan-300 mb-4">2. Vertical Fragmentation (sensor_data table)</h3>
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-cyan-700/30 p-4 rounded-lg border border-cyan-500">
                    <h4 className="font-semibold text-cyan-200 mb-2">sensor_data_basic</h4>
                    <div className="text-sm space-y-1">
                        <p>• reading_id</p>
                        <p>• device_id</p>
                        <p>• region</p>
                        <p>• timestamp</p>
                    </div>
                    <p className="text-xs mt-2 text-cyan-300">Frequently accessed for queries</p>
                </div>
                <div className="bg-teal-700/30 p-4 rounded-lg border border-teal-500">
                    <h4 className="font-semibold text-teal-200 mb-2">sensor_data_readings</h4>
                    <div className="text-sm space-y-1">
                        <p>• reading_id (FK)</p>
                        <p>• temperature</p>
                        <p>• humidity</p>
                        <p>• air_quality</p>
                    </div>
                    <p className="text-xs mt-2 text-teal-300">Sensor measurement values</p>
                </div>
                <div className="bg-emerald-700/30 p-4 rounded-lg border border-emerald-500">
                    <h4 className="font-semibold text-emerald-200 mb-2">sensor_data_metadata</h4>
                    <div className="text-sm space-y-1">
                        <p>• reading_id (FK)</p>
                        <p>• battery_level</p>
                        <p>• signal_strength</p>
                    </div>
                    <p className="text-xs mt-2 text-emerald-300">Device health metadata</p>
                </div>
            </div>
            <div className="mt-4 bg-cyan-800/30 p-3 rounded">
                <p className="text-sm"><strong>Benefit:</strong> Reduces I/O - queries only access needed columns</p>
                <p className="text-sm"><strong>Reconstruction:</strong> JOIN on reading_id when full data needed</p>
            </div>
        </div>

        {/* Fragmentation Rules */}
        <div className="bg-slate-700/40 p-4 rounded-lg border border-slate-500">
            <h3 className="text-lg font-semibold text-slate-300 mb-3">Fragmentation Rules</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="font-semibold text-blue-300 mb-2">Horizontal Fragmentation Query:</p>
                    <code className="bg-slate-900 p-2 rounded block text-xs">
                        SELECT * FROM devices WHERE region = 'north'<br />
                        -- Only queries Node 1 (North)
                    </code>
                </div>
                <div>
                    <p className="font-semibold text-cyan-300 mb-2">Vertical Reconstruction Query:</p>
                    <code className="bg-slate-900 p-2 rounded block text-xs">
                        SELECT * FROM sensor_data_basic b<br />
                        JOIN sensor_data_readings r ON b.reading_id = r.reading_id<br />
                        JOIN sensor_data_metadata m ON b.reading_id = m.reading_id
                    </code>
                </div>
            </div>
        </div>
    </div>
);

const FragmentCard = ({ title, node, condition, data, color }) => {
    const colors = {
        blue: 'from-blue-600/50 to-blue-800/50 border-blue-400',
        red: 'from-red-600/50 to-red-800/50 border-red-400',
        yellow: 'from-yellow-600/50 to-yellow-800/50 border-yellow-400',
        green: 'from-green-600/50 to-green-800/50 border-green-400'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} p-4 rounded-lg border-2`}>
            <h4 className="font-bold mb-2">{title}</h4>
            <p className="text-xs opacity-75 mb-2">{node}</p>
            <code className="text-xs bg-black/30 p-1 rounded block mb-2">{condition}</code>
            <div className="text-xs space-y-1">
                {data.map((item, idx) => (
                    <p key={idx}>• {item}</p>
                ))}
            </div>
        </div>
    );
};

const ReplicationDiagram = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Replication Strategy</h2>

        {/* Replication Overview */}
        <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-6 rounded-lg border-2 border-purple-500">
                <h3 className="text-xl font-bold text-purple-300 mb-4">Replication Configuration</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center bg-purple-800/30 p-2 rounded">
                        <span>Strategy:</span>
                        <span className="font-semibold text-purple-200">Asynchronous</span>
                    </div>
                    <div className="flex justify-between items-center bg-purple-800/30 p-2 rounded">
                        <span>Replication Factor:</span>
                        <span className="font-semibold text-purple-200">2 (Primary + Replica)</span>
                    </div>
                    <div className="flex justify-between items-center bg-purple-800/30 p-2 rounded">
                        <span>Interval:</span>
                        <span className="font-semibold text-purple-200">5 seconds</span>
                    </div>
                    <div className="flex justify-between items-center bg-purple-800/30 p-2 rounded">
                        <span>Method:</span>
                        <span className="font-semibold text-purple-200">Log-based</span>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 p-6 rounded-lg border-2 border-blue-500">
                <h3 className="text-xl font-bold text-blue-300 mb-4">Replication Pairs</h3>
                <div className="space-y-4">
                    <ReplicationPair
                        primary="NORTH (5432)"
                        replica="SOUTH (5433)"
                        region="north"
                        color="blue"
                    />
                    <ReplicationPair
                        primary="SOUTH (5433)"
                        replica="NORTH (5432)"
                        region="south"
                        color="red"
                    />
                    <ReplicationPair
                        primary="EAST (5434)"
                        replica="WEST (5435)"
                        region="east"
                        color="yellow"
                    />
                    <ReplicationPair
                        primary="WEST (5435)"
                        replica="EAST (5434)"
                        region="west"
                        color="green"
                    />
                </div>
            </div>
        </div>

        {/* Replication Process */}
        <div className="bg-slate-700/40 p-6 rounded-lg border border-slate-500">
            <h3 className="text-lg font-semibold text-slate-300 mb-4">Replication Process Flow</h3>
            <div className="grid grid-cols-5 gap-2">
                <ProcessStep number="1" title="Data Insert" desc="New sensor data inserted in primary node" />
                <ProcessStep number="2" title="Mark Unsynced" desc="synced = FALSE flag set" />
                <ProcessStep number="3" title="Replication Check" desc="Every 5 seconds" />
                <ProcessStep number="4" title="Copy to Replica" desc="Batch transfer to replica node" />
                <ProcessStep number="5" title="Mark Synced" desc="synced = TRUE on success" />
            </div>
        </div>

        {/* Benefits & Code Example */}
        <div className="grid grid-cols-2 gap-6">
            <div className="bg-green-900/30 p-4 rounded-lg border border-green-600">
                <h4 className="font-semibold text-green-300 mb-3">✅ Benefits</h4>
                <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-400" />
                        <span><strong>Fault Tolerance:</strong> Data survives node failure</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-400" />
                        <span><strong>Load Balancing:</strong> Read queries distributed</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-400" />
                        <span><strong>High Availability:</strong> 99.9% uptime</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-400" />
                        <span><strong>Data Durability:</strong> No data loss on failure</span>
                    </li>
                </ul>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                <h4 className="font-semibold text-slate-300 mb-2">Replication Code Snippet</h4>
                <code className="text-xs bg-black/50 p-3 rounded block overflow-x-auto">
                    {`// Get unsynced data
SELECT * FROM sensor_data 
WHERE region = 'north' 
AND synced = FALSE;

// Copy to replica
INSERT INTO sensor_data 
  (device_id, region, timestamp, ...)
VALUES (...);

// Mark as synced
UPDATE sensor_data 
SET synced = TRUE 
WHERE reading_id IN (...);`}
                </code>
            </div>
        </div>
    </div>
);

const ReplicationPair = ({ primary, replica, region, color }) => {
    const colors = {
        blue: 'from-blue-600/30 to-blue-800/30',
        red: 'from-red-600/30 to-red-800/30',
        yellow: 'from-yellow-600/30 to-yellow-800/30',
        green: 'from-green-600/30 to-green-800/30'
    };

    return (
        <div className={`bg-gradient-to-r ${colors[color]} p-3 rounded-lg flex items-center justify-between`}>
            <div className="font-semibold">{primary}</div>
            <div className="flex items-center gap-2">
                <span className="text-2xl">⟷</span>
            </div>
            <div className="font-semibold">{replica}</div>
            <div className="text-xs bg-black/30 px-2 py-1 rounded">
                Region: {region}
            </div>
        </div>
    );
};

const ProcessStep = ({ number, title, desc }) => (
    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600 text-center">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
            {number}
        </div>
        <p className="font-semibold text-sm mb-1">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
    </div>
);

const QueryProcessingDiagram = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Distributed Query Processing</h2>

        {/* Query Types */}
        <div className="grid grid-cols-3 gap-4">
            <QueryTypeCard
                title="Local Query"
                desc="Single node query"
                example="SELECT * FROM devices WHERE region = 'north'"
                steps={['Route to North node', 'Execute locally', 'Return results']}
                color="green"
            />
            <QueryTypeCard
                title="Distributed Query"
                desc="Multi-node aggregation"
                example="SELECT AVG(temperature) FROM sensor_data GROUP BY region"
                steps={['Query all 4 nodes', 'Aggregate results', 'Return combined data']}
                color="blue"
            />
            <QueryTypeCard
                title="Join Query"
                desc="Vertical fragment join"
                example="SELECT * FROM sensor_data_basic JOIN sensor_data_readings"
                steps={['Join fragments', 'Reconstruct data', 'Return full rows']}
                color="purple"
            />
        </div>

        {/* Query Processing Flow */}
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-6 rounded-lg border-2 border-blue-500">
            <h3 className="text-xl font-bold text-blue-300 mb-4">Query Processing Steps</h3>
            <div className="grid grid-cols-6 gap-3">
                <QueryStep num="1" title="Parse" desc="SQL parsing" />
                <QueryStep num="2" title="Analyze" desc="Determine nodes" />
                <QueryStep num="3" title="Decompose" desc="Split query" />
                <QueryStep num="4" title="Execute" desc="Parallel exec" />
                <QueryStep num="5" title="Aggregate" desc="Combine results" />
                <QueryStep num="6" title="Return" desc="Send to client" />
            </div>
        </div>

        {/* Example Queries */}
        <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                <h4 className="font-semibold text-cyan-300 mb-3">Example 1: Get All Devices</h4>
                <code className="text-xs bg-black/50 p-3 rounded block mb-3">
                    {`// Distributed SELECT
SELECT device_id, device_name, region 
FROM devices;

// Execution:
// 1. Query North, South, East, West in parallel
// 2. Aggregate results
// 3. Remove duplicates (replication)
// 4. Return 100 unique devices`}
                </code>
                <div className="text-sm">
                    <p className="text-green-400">✓ Queries 4 nodes simultaneously</p>
                    <p className="text-green-400">✓ ~75% faster than sequential</p>
                </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                <h4 className="font-semibold text-cyan-300 mb-3">Example 2: Temperature Stats</h4>
                <code className="text-xs bg-black/50 p-3 rounded block mb-3">
                    {`// Distributed Aggregation
SELECT region, 
       AVG(temperature) as avg_temp,
       MIN(temperature) as min_temp,
       MAX(temperature) as max_temp
FROM sensor_data
GROUP BY region;

// Execution:
// 1. Each node calculates local aggregates
// 2. Combine aggregates at coordinator
// 3. Return regional statistics`}
                </code>
                <div className="text-sm">
                    <p className="text-green-400">✓ Efficient aggregation</p>
                    <p className="text-green-400">✓ Minimal data transfer</p>
                </div>
            </div>
        </div>

        {/* Query Optimization */}
        <div className="bg-orange-900/30 p-4 rounded-lg border border-orange-600">
            <h4 className="font-semibold text-orange-300 mb-3">🚀 Query Optimization Techniques</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="font-semibold text-orange-200 mb-1">Query Routing</p>
                    <p className="text-xs">Send queries to relevant nodes only based on region filter</p>
                </div>
                <div>
                    <p className="font-semibold text-orange-200 mb-1">Parallel Execution</p>
                    <p className="text-xs">Execute queries on multiple nodes simultaneously</p>
                </div>
                <div>
                    <p className="font-semibold text-orange-200 mb-1">Result Caching</p>
                    <p className="text-xs">Cache frequent query results to reduce load</p>
                </div>
            </div>
        </div>
    </div>
);

const QueryTypeCard = ({ title, desc, example, steps, color }) => {
    const colors = {
        green: 'from-green-900/40 to-green-800/40 border-green-500',
        blue: 'from-blue-900/40 to-blue-800/40 border-blue-500',
        purple: 'from-purple-900/40 to-purple-800/40 border-purple-500'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} p-4 rounded-lg border-2`}>
            <h4 className="font-bold text-lg mb-2">{title}</h4>
            <p className="text-sm text-slate-300 mb-3">{desc}</p>
            <code className="text-xs bg-black/40 p-2 rounded block mb-3">{example}</code>
            <div className="space-y-1 text-xs">
                {steps.map((step, idx) => (
                    <p key={idx}>→ {step}</p>
                ))}
            </div>
        </div>
    );
};

const QueryStep = ({ num, title, desc }) => (
    <div className="bg-blue-800/30 p-3 rounded-lg text-center border border-blue-600">
        <div className="text-2xl font-bold text-blue-300 mb-1">{num}</div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
    </div>
);

const ConcurrencyDiagram = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Concurrency Control Mechanisms</h2>

        <div className="grid grid-cols-2 gap-6">
            {/* Pessimistic Locking */}
            <div className="bg-gradient-to-br from-red-900/40 to-orange-900/40 p-6 rounded-lg border-2 border-red-500">
                <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-8 h-8 text-red-300" />
                    <h3 className="text-xl font-bold text-red-300">Pessimistic Locking</h3>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="bg-red-800/30 p-3 rounded">
                        <p className="font-semibold text-red-200 mb-2">How It Works:</p>
                        <ol className="space-y-1 text-xs">
                            <li>1. Transaction acquires EXCLUSIVE LOCK</li>
                            <li>2. Other transactions WAIT</li>
                            <li>3. Update data</li>
                            <li>4. COMMIT releases lock</li>
                        </ol>
                    </div>

                    <code className="text-xs bg-black/50 p-3 rounded block">
                        {`BEGIN;
SELECT * FROM devices 
WHERE device_id = 'DEVICE_001'
FOR UPDATE;  -- Acquire lock

UPDATE devices 
SET status = 'maintenance'
WHERE device_id = 'DEVICE_001';

COMMIT;  -- Release lock`}
                    </code>

                    <div className="bg-orange-800/30 p-2 rounded">
                        <p className="font-semibold text-orange-200">Use Case:</p>
                        <p className="text-xs">High contention scenarios (bank transactions, inventory)</p>
                    </div>

                    <div className="space-y-1 text-xs">
                        <p className="text-green-400">✓ Prevents conflicts</p>
                        <p className="text-green-400">✓ Strong consistency</p>
                        <p className="text-red-400">✗ Lower concurrency</p>
                        <p className="text-red-400">✗ Possible deadlocks</p>
                    </div>
                </div>
            </div>

            {/* Optimistic Concurrency */}
            <div className="bg-gradient-to-br from-green-900/40 to-teal-900/40 p-6 rounded-lg border-2 border-green-500">
                <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-8 h-8 text-green-300" />
                    <h3 className="text-xl font-bold text-green-300">Optimistic Control</h3>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="bg-green-800/30 p-3 rounded">
                        <p className="font-semibold text-green-200 mb-2">How It Works:</p>
                        <ol className="space-y-1 text-xs">
                            <li>1. Read data + timestamp (NO LOCK)</li>
                            <li>2. Process data</li>
                            <li>3. Update with timestamp check</li>
                            <li>4. Retry if conflict detected</li>
                        </ol>
                    </div>

                    <code className="text-xs bg-black/50 p-3 rounded block">
                        {`-- Read with timestamp
SELECT *, updated_at 
FROM devices 
WHERE device_id = 'DEVICE_001';

-- Update with timestamp check
UPDATE devices 
SET status = 'maintenance',
    updated_at = NOW()
WHERE device_id = 'DEVICE_001'
AND updated_at = '2024-10-29 10:00:00';
-- Fails if timestamp changed`}
                    </code>

                    <div className="bg-teal-800/30 p-2 rounded">
                        <p className="font-semibold text-teal-200">Use Case:</p>
                        <p className="text-xs">Low contention scenarios (IoT sensors, analytics)</p>
                    </div>

                    <div className="space-y-1 text-xs">
                        <p className="text-green-400">✓ Higher concurrency</p>
                        <p className="text-green-400">✓ No deadlocks</p>
                        <p className="text-red-400">✗ Retry overhead</p>
                        <p className="text-red-400">✗ Conflict detection delayed</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-slate-700/40 p-4 rounded-lg border border-slate-500">
            <h4 className="font-semibold text-slate-300 mb-3">Comparison</h4>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-600">
                        <th className="text-left p-2">Aspect</th>
                        <th className="text-left p-2">Pessimistic Locking</th>
                        <th className="text-left p-2">Optimistic Control</th>
                    </tr>
                </thead>
                <tbody className="text-xs">
                    <tr className="border-b border-slate-700">
                        <td className="p-2 font-semibold">Lock Acquisition</td>
                        <td className="p-2">Before reading data</td>
                        <td className="p-2">No locks used</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                        <td className="p-2 font-semibold">Conflict Prevention</td>
                        <td className="p-2">Prevents conflicts proactively</td>
                        <td className="p-2">Detects conflicts at commit</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                        <td className="p-2 font-semibold">Performance</td>
                        <td className="p-2">Lower throughput, higher latency</td>
                        <td className="p-2">Higher throughput, lower latency</td>
                    </tr>
                    <tr>
                        <td className="p-2 font-semibold">Best For</td>
                        <td className="p-2">High contention, critical data</td>
                        <td className="p-2">Low contention, read-heavy</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* Transaction Log */}
        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-600">
            <h4 className="font-semibold text-blue-300 mb-3">Transaction Logging</h4>
            <p className="text-sm mb-2">All transactions are logged in <code className="bg-black/30 px-2 py-1 rounded">transaction_log</code> table for audit and recovery:</p>
            <code className="text-xs bg-black/50 p-3 rounded block">
                {`INSERT INTO transaction_log (
  transaction_id,
  node_name,
  transaction_type,
  table_name,
  record_id,
  status,
  lock_acquired,
  lock_type
) VALUES (
  uuid_generate_v4(),
  'north',
  'UPDATE',
  'devices',
  'DEVICE_001',
  'committed',
  true,
  'exclusive'
);`}
            </code>
        </div>
    </div>
);

const FaultToleranceDiagram = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Fault Tolerance & Recovery</h2>

        {/* Failure Scenarios */}
        <div className="grid grid-cols-3 gap-4">
            <FailureScenario
                title="Node Failure"
                icon="💥"
                desc="Database node crashes or becomes unreachable"
                impact="Primary data temporarily unavailable"
                solution="Automatic failover to replica node"
                color="red"
            />
            <FailureScenario
                title="Network Partition"
                icon="🔌"
                desc="Network connection between nodes lost"
                impact="Cannot replicate data between nodes"
                solution="Queue updates, sync when reconnected"
                color="yellow"
            />
            <FailureScenario
                title="Disk Failure"
                icon="💾"
                desc="Storage device fails on a node"
                impact="Data loss risk on affected node"
                solution="Restore from replica node backup"
                color="orange"
            />
        </div>

        {/* Recovery Process */}
        <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 p-6 rounded-lg border-2 border-blue-500">
            <h3 className="text-xl font-bold text-blue-300 mb-4">Automatic Recovery Process</h3>
            <div className="grid grid-cols-5 gap-3">
                <RecoveryStep
                    num="1"
                    title="Detect Failure"
                    desc="Health check fails"
                    icon="🔍"
                />
                <RecoveryStep
                    num="2"
                    title="Failover"
                    desc="Route to replica"
                    icon="🔄"
                />
                <RecoveryStep
                    num="3"
                    title="Continue Operations"
                    desc="System stays online"
                    icon="✅"
                />
                <RecoveryStep
                    num="4"
                    title="Node Recovery"
                    desc="Failed node restarts"
                    icon="🔧"
                />
                <RecoveryStep
                    num="5"
                    title="Data Sync"
                    desc="Restore from replica"
                    icon="📥"
                />
            </div>
        </div>

        {/* Health Monitoring */}
        <div className="grid grid-cols-2 gap-6">
            <div className="bg-green-900/30 p-4 rounded-lg border border-green-600">
                <h4 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Health Monitoring
                </h4>
                <div className="space-y-2 text-sm">
                    <div className="bg-green-800/30 p-2 rounded">
                        <p className="font-semibold text-green-200">Continuous Checks:</p>
                        <ul className="text-xs space-y-1 mt-1">
                            <li>• Database connection status</li>
                            <li>• Query response time</li>
                            <li>• CPU and memory usage</li>
                            <li>• Replication lag</li>
                            <li>• Active connections</li>
                        </ul>
                    </div>
                    <code className="text-xs bg-black/50 p-2 rounded block">
                        {`-- Health check query
SELECT version(), 
       NOW() as timestamp,
       pg_database_size('iot_ddb_north')
FROM pg_stat_activity;`}
                    </code>
                </div>
            </div>

            <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-600">
                <h4 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Recovery Strategies
                </h4>
                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-300 mt-0.5" />
                        <div>
                            <p className="font-semibold text-purple-200">Point-in-Time Recovery</p>
                            <p className="text-xs">Restore to any previous state using transaction logs</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-300 mt-0.5" />
                        <div>
                            <p className="font-semibold text-purple-200">Replica Promotion</p>
                            <p className="text-xs">Promote replica to primary if main node fails</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-300 mt-0.5" />
                        <div>
                            <p className="font-semibold text-purple-200">Data Reconstruction</p>
                            <p className="text-xs">Rebuild failed node from replica's complete copy</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Example Code */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
            <h4 className="font-semibold text-slate-300 mb-3">Failover Code Example</h4>
            <code className="text-xs bg-black/50 p-3 rounded block">
                {`async function queryWithFailover(primaryNode, query) {
  try {
    // Try primary node first
    return await executeQuery(primaryNode, query);
  } catch (error) {
    console.log('Primary failed, attempting failover...');
    
    // Get replica node
    const replicaNode = getReplicaFor(primaryNode);
    
    // Execute on replica
    const result = await executeQuery(replicaNode, query);
    
    console.log('✓ Failover successful!');
    return result;
  }
}

// Example: North fails → automatically uses South
queryWithFailover('north', 'SELECT * FROM devices WHERE region = "north"');
// Automatically routes to 'south' node if north is down`}
            </code>
        </div>

        {/* Benefits */}
        <div className="bg-cyan-900/30 p-4 rounded-lg border border-cyan-600">
            <h4 className="font-semibold text-cyan-300 mb-3">🎯 Fault Tolerance Benefits</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                    <div className="text-3xl mb-2">99.9%</div>
                    <p className="text-xs text-cyan-200">Uptime</p>
                </div>
                <div className="text-center">
                    <div className="text-3xl mb-2">0</div>
                    <p className="text-xs text-cyan-200">Data Loss</p>
                </div>
                <div className="text-center">
                    <div className="text-3xl mb-2">&lt;1s</div>
                    <p className="text-xs text-cyan-200">Failover Time</p>
                </div>
                <div className="text-center">
                    <div className="text-3xl mb-2">2x</div>
                    <p className="text-xs text-cyan-200">Redundancy</p>
                </div>
            </div>
        </div>
    </div>
);

const FailureScenario = ({ title, icon, desc, impact, solution, color }) => {
    const colors = {
        red: 'from-red-900/40 to-red-800/40 border-red-500',
        yellow: 'from-yellow-900/40 to-yellow-800/40 border-yellow-500',
        orange: 'from-orange-900/40 to-orange-800/40 border-orange-500'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} p-4 rounded-lg border-2`}>
            <div className="text-4xl mb-2">{icon}</div>
            <h4 className="font-bold text-lg mb-2">{title}</h4>
            <p className="text-sm mb-2">{desc}</p>
            <div className="text-xs space-y-2">
                <div className="bg-black/30 p-2 rounded">
                    <p className="font-semibold text-red-300">Impact:</p>
                    <p>{impact}</p>
                </div>
                <div className="bg-black/30 p-2 rounded">
                    <p className="font-semibold text-green-300">Solution:</p>
                    <p>{solution}</p>
                </div>
            </div>
        </div>
    );
};

const RecoveryStep = ({ num, title, desc, icon }) => (
    <div className="bg-blue-800/30 p-3 rounded-lg border border-blue-600 text-center">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-xl font-bold text-blue-300 mb-1">{num}</div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
    </div>
);

export default IoTDDBDiagrams;