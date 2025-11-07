// src/app/api/devices/route.js

/**
 * Devices API Endpoint
 * 
 * Returns device information across all nodes
 * GET /api/devices?region=north&status=active
 */

import { executeQuery, executeParallelQuery } from '@/lib/db/pool';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const region = searchParams.get('region');
        const status = searchParams.get('status');

        // Build query based on filters
        let query = `
      SELECT device_id, device_name, device_type, region, location,
             status, firmware_version, installation_date, updated_at
      FROM devices
      WHERE 1=1
    `;

        const params = [];
        let paramIndex = 1;

        if (region) {
            query += ` AND region = $${paramIndex}`;
            params.push(region);
            paramIndex++;
        }

        if (status) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` ORDER BY device_id`;

        // Query all nodes in parallel
        const result = await executeParallelQuery(
            ['north', 'south', 'east', 'west'],
            query,
            params
        );

        // Combine and deduplicate results
        const allDevices = result.results.flatMap(r => r.result.rows);
        const uniqueDevices = Array.from(
            new Map(allDevices.map(d => [d.device_id, d])).values()
        );

        // Calculate statistics by region
        const byRegion = uniqueDevices.reduce((acc, device) => {
            if (!acc[device.region]) {
                acc[device.region] = { count: 0, devices: [] };
            }
            acc[device.region].count++;
            acc[device.region].devices.push(device);
            return acc;
        }, {});

        // Calculate statistics by status
        const byStatus = uniqueDevices.reduce((acc, device) => {
            if (!acc[device.status]) {
                acc[device.status] = 0;
            }
            acc[device.status]++;
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            total: uniqueDevices.length,
            devices: uniqueDevices,
            statistics: {
                byRegion,
                byStatus,
            },
        });

    } catch (error) {
        console.error('Devices API error:', error);

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