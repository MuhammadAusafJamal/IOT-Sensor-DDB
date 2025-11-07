// src/app/api/upload-csv/route.js

/**
 * CSV Upload API Endpoint
 * 
 * Accepts CSV/JSON files and imports data into the distributed database
 * POST /api/upload-csv
 */

import { executeQuery } from '@/lib/db/pool';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const dataType = formData.get('type'); // 'devices' or 'sensors'
        const region = formData.get('region'); // target region

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Read file content
        const fileContent = await file.text();
        const fileName = file.name.toLowerCase();

        let data;

        // Parse based on file type
        if (fileName.endsWith('.csv')) {
            // Parse CSV
            const parsed = Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                transformHeader: (header) => header.trim().toLowerCase(),
            });

            if (parsed.errors.length > 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'CSV parsing error',
                        details: parsed.errors
                    },
                    { status: 400 }
                );
            }

            data = parsed.data;

        } else if (fileName.endsWith('.json')) {
            // Parse JSON
            try {
                data = JSON.parse(fileContent);
                if (!Array.isArray(data)) {
                    data = [data]; // Convert single object to array
                }
            } catch (error) {
                return NextResponse.json(
                    { success: false, error: 'Invalid JSON format' },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { success: false, error: 'Unsupported file format. Use CSV or JSON' },
                { status: 400 }
            );
        }

        if (!data || data.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No data found in file' },
                { status: 400 }
            );
        }

        // Determine target node based on region
        const nodeMap = {
            north: 'north',
            south: 'south',
            east: 'east',
            west: 'west',
        };

        const targetNode = nodeMap[region] || 'north';

        // Import data based on type
        let result;
        if (dataType === 'devices') {
            result = await importDevices(data, targetNode);
        } else if (dataType === 'sensors') {
            result = await importSensorData(data, targetNode);
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid data type. Use "devices" or "sensors"' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Successfully imported ${result.imported} records`,
            details: result,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('CSV upload error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

/**
 * Import device data
 */
async function importDevices(data, targetNode) {
    let imported = 0;
    let skipped = 0;
    let errors = [];

    for (const row of data) {
        try {
            // Validate required fields
            if (!row.device_id || !row.device_name || !row.region) {
                skipped++;
                errors.push({ row, reason: 'Missing required fields' });
                continue;
            }

            // Insert device
            const query = `
        INSERT INTO devices (
          device_id, device_name, device_type, region, location,
          latitude, longitude, status, firmware_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (device_id) DO UPDATE SET
          device_name = EXCLUDED.device_name,
          status = EXCLUDED.status,
          updated_at = NOW()
      `;

            const values = [
                row.device_id,
                row.device_name,
                row.device_type || 'multi_sensor',
                row.region || targetNode,
                row.location || '',
                row.latitude || null,
                row.longitude || null,
                row.status || 'active',
                row.firmware_version || 'v1.0.0',
            ];

            await executeQuery(targetNode, query, values);
            imported++;

        } catch (error) {
            skipped++;
            errors.push({ row, error: error.message });
        }
    }

    return {
        imported,
        skipped,
        total: data.length,
        errors: errors.slice(0, 5), // Return first 5 errors only
    };
}

/**
 * Import sensor data
 */
async function importSensorData(data, targetNode) {
    let imported = 0;
    let skipped = 0;
    let errors = [];

    for (const row of data) {
        try {
            // Validate required fields
            if (!row.device_id || !row.region) {
                skipped++;
                errors.push({ row, reason: 'Missing required fields' });
                continue;
            }

            // Insert sensor reading
            const query = `
        INSERT INTO sensor_data (
          device_id, region, timestamp, temperature, humidity,
          air_quality, battery_level, signal_strength
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `;

            const values = [
                row.device_id,
                row.region || targetNode,
                row.timestamp || new Date().toISOString(),
                row.temperature || null,
                row.humidity || null,
                row.air_quality || null,
                row.battery_level || 100,
                row.signal_strength || -50,
            ];

            await executeQuery(targetNode, query, values);
            imported++;

        } catch (error) {
            skipped++;
            errors.push({ row, error: error.message });
        }
    }

    return {
        imported,
        skipped,
        total: data.length,
        errors: errors.slice(0, 5),
    };
}