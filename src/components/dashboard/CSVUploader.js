'use client';

/**
 * CSV Uploader Component
 * 
 * Allows users to upload CSV/JSON files for bulk data import
 */

import { useState } from 'react';

export default function CSVUploader({ onUploadComplete }) {
    const [file, setFile] = useState(null);
    const [dataType, setDataType] = useState('devices');
    const [region, setRegion] = useState('north');
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
            if (fileExtension === 'csv' || fileExtension === 'json') {
                setFile(selectedFile);
                setError(null);
            } else {
                setError('Please select a CSV or JSON file');
                setFile(null);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', dataType);
            formData.append('region', region);

            const response = await fetch('/api/upload-csv', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setResult(data);
                setFile(null);
                if (onUploadComplete) {
                    onUploadComplete();
                }
            } else {
                setError(data.error || 'Upload failed');
            }
        } catch (err) {
            setError('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const downloadSampleCSV = (type) => {
        let csvContent;
        let fileName;

        if (type === 'devices') {
            csvContent = `device_id,device_name,device_type,region,location,latitude,longitude,status,firmware_version
DEVICE_IMPORT_001,Import-Sensor-001,temperature_sensor,north,Import District 1,34.0522,-118.2437,active,v1.0.0
DEVICE_IMPORT_002,Import-Sensor-002,humidity_sensor,south,Import District 2,40.7128,-74.0060,active,v1.1.0`;
            fileName = 'sample_devices.csv';
        } else {
            csvContent = `device_id,region,timestamp,temperature,humidity,air_quality,battery_level,signal_strength
DEVICE_NORTH_001,north,2025-10-26T12:00:00Z,22.5,65.3,85,95,-45
DEVICE_SOUTH_001,south,2025-10-26T12:00:00Z,30.2,70.1,90,88,-50`;
            fileName = 'sample_sensors.csv';
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📤</span> Import Data from CSV/JSON
            </h3>

            <div className="space-y-4">
                {/* Data Type Selection */}
                <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                        Data Type:
                    </label>
                    <select
                        value={dataType}
                        onChange={(e) => setDataType(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="devices" className="bg-slate-800">Device Data</option>
                        <option value="sensors" className="bg-slate-800">Sensor Readings</option>
                    </select>
                </div>

                {/* Region Selection */}
                <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                        Target Region:
                    </label>
                    <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="north" className="bg-slate-800">North</option>
                        <option value="south" className="bg-slate-800">South</option>
                        <option value="east" className="bg-slate-800">East</option>
                        <option value="west" className="bg-slate-800">West</option>
                    </select>
                </div>

                {/* File Upload */}
                <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                        Select File (CSV or JSON):
                    </label>
                    <input
                        type="file"
                        accept=".csv,.json"
                        onChange={handleFileChange}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {file && (
                        <p className="text-green-400 text-sm mt-2">
                            ✓ Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </p>
                    )}
                </div>

                {/* Sample Download */}
                <div className="flex gap-2">
                    <button
                        onClick={() => downloadSampleCSV('devices')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                        📥 Sample Devices CSV
                    </button>
                    <button
                        onClick={() => downloadSampleCSV('sensors')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                        📥 Sample Sensors CSV
                    </button>
                </div>

                {/* Upload Button */}
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {uploading ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            Uploading...
                        </>
                    ) : (
                        <>
                            <span>📤</span>
                            Upload & Import
                        </>
                    )}
                </button>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">❌ {error}</p>
                    </div>
                )}

                {/* Success Result */}
                {result && (
                    <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg space-y-2">
                        <p className="text-green-400 font-semibold">✅ {result.message}</p>
                        <div className="text-sm text-gray-300">
                            <p>Total: {result.details.total}</p>
                            <p>Imported: {result.details.imported}</p>
                            <p>Skipped: {result.details.skipped}</p>
                        </div>
                        {result.details.errors && result.details.errors.length > 0 && (
                            <details className="text-xs text-yellow-400">
                                <summary className="cursor-pointer">View Errors</summary>
                                <pre className="mt-2 p-2 bg-black/50 rounded overflow-auto max-h-32">
                                    {JSON.stringify(result.details.errors, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                )}

                {/* Format Instructions */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-300 text-sm font-semibold mb-2">📝 CSV Format Requirements:</p>
                    <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                        <li><strong>Devices:</strong> device_id, device_name, device_type, region, location, status</li>
                        <li><strong>Sensors:</strong> device_id, region, timestamp, temperature, humidity, air_quality</li>
                        <li>File types: .csv or .json</li>
                        <li>Maximum file size: 5MB recommended</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}