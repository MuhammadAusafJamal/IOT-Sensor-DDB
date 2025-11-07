'use client';

import { useState } from 'react';

export default function TestsPanel() {
    const [testResults, setTestResults] = useState({});
    const [runningTest, setRunningTest] = useState(null);

    const tests = [
        { id: 'fragmentation', name: 'Fragmentation Test', desc: 'Test horizontal & vertical fragmentation' },
        { id: 'replication', name: 'Replication Test', desc: 'Test data replication across nodes' },
        { id: 'concurrency', name: 'Concurrency Control', desc: 'Test locking mechanisms' },
        { id: 'faultTolerance', name: 'Fault Tolerance', desc: 'Test failover and recovery' },
        { id: 'queries', name: 'Query Performance', desc: 'Test distributed queries' },
    ];

    const runTest = async (testType) => {
        setRunningTest(testType);

        try {
            const response = await fetch('/api/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testType })
            });

            const result = await response.json();

            if (result.success) {
                setTestResults({ ...testResults, [testType]: result });
            }
        } catch (error) {
            console.error('Test failed:', error);
        } finally {
            setRunningTest(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-6 border border-purple-700">
                <h3 className="text-xl font-semibold text-white mb-2">Distributed Database Test Suite</h3>
                <p className="text-purple-200 text-sm">
                    Run comprehensive tests to demonstrate all DDB concepts.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tests.map(test => {
                    const result = testResults[test.id];
                    const isRunning = runningTest === test.id;

                    return (
                        <div key={test.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                            <h4 className="font-semibold text-white mb-2">{test.name}</h4>
                            <p className="text-xs text-slate-400 mb-4">{test.desc}</p>

                            {!result && !isRunning && (
                                <button
                                    onClick={() => runTest(test.id)}
                                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                                >
                                    Run Test
                                </button>
                            )}

                            {isRunning && (
                                <div className="flex items-center justify-center py-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                                </div>
                            )}

                            {result && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-white">
                                        <span>Status:</span>
                                        <span className="text-green-400">{result.status}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-white">
                                        <span>Duration:</span>
                                        <span>{result.duration}</span>
                                    </div>
                                    <div className="mt-3 space-y-1">
                                        {result.details.map((detail, idx) => (
                                            <div key={idx} className="text-xs bg-slate-900/50 rounded p-2 text-white">
                                                <div className="flex justify-between">
                                                    <span>{detail.test}</span>
                                                    <span className={detail.result === 'PASS' ? 'text-green-400' : 'text-red-400'}>
                                                        {detail.result}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 mt-1">{detail.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}