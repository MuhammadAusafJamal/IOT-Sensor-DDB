// src/app/api/sensors/route.js

/**
 * Sensor Data API Endpoint
 * 
 * Returns sensor readings and statistics
 * GET /api/sensors?region=north&limit=100
 */

import { executeQuery, executeParallelQuery } from '@/lib/db/pool';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const region = searchParams.get('region');
        const limit = parseInt(searchParams.get('limit') || '100');

        // Get recent sensor readings
        let readingsQuery = `
      SELECT 
        sd.device_id,
        d.device_name,
        sd.region,
        sd.timestamp,
        sd.temperature,
        sd.humidity,
        sd.air_quality,
        sd.battery_level,
        sd.signal_strength
      FROM sensor_data sd
      JOIN devices d ON sd.device_id = d.device_id
    `;

        const params = [];
        let paramIndex = 1;

        if (region) {
            readingsQuery += ` WHERE sd.region = $${paramIndex}`;
            params.push(region);
            paramIndex++;
        }

        readingsQuery += ` ORDER BY sd.timestamp DESC LIMIT $${paramIndex}`;
        params.push(limit);

        // Get statistics for all regions
        const statsQuery = `
      SELECT 
        region,
        COUNT(*) as reading_count,
        ROUND(AVG(temperature)::numeric, 2) as avg_temp,
        ROUND(MIN(temperature)::numeric, 2) as min_temp,
        ROUND(MAX(temperature)::numeric, 2) as max_temp,
        ROUND(AVG(humidity)::numeric, 2) as avg_humidity,
        ROUND(AVG(air_quality)::numeric, 2) as avg_aqi,
        ROUND(AVG(battery_level)::numeric, 2) as avg_battery
      FROM sensor_data
      ${region ? 'WHERE region = $1' : ''}
      GROUP BY region
      ORDER BY region
    `;

        const statsParams = region ? [region] : [];

        // Execute queries in parallel
        const [readingsResult, statsResult] = await Promise.all([
            executeParallelQuery(['north', 'south', 'east', 'west'], readingsQuery, params),
            executeParallelQuery(['north', 'south', 'east', 'west'], statsQuery, statsParams),
        ]);

        // Combine readings
        const allReadings = readingsResult.results.flatMap(r => r.result.rows);

        // Sort by timestamp and limit
        const sortedReadings = allReadings
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

        // Aggregate statistics
        const regionStats = {};
        statsResult.results.forEach(nodeResult => {
            nodeResult.result.rows.forEach(row => {
                if (!regionStats[row.region]) {
                    regionStats[row.region] = {
                        region: row.region,
                        readingCount: 0,
                        avgTemp: 0,
                        minTemp: row.min_temp,
                        maxTemp: row.max_temp,
                        avgHumidity: 0,
                        avgAqi: 0,
                        avgBattery: 0,
                        totalReadings: 0,
                    };
                }

                const stat = regionStats[row.region];
                stat.totalReadings += parseInt(row.reading_count);
                stat.avgTemp += parseFloat(row.avg_temp) * parseInt(row.reading_count);
                stat.avgHumidity += parseFloat(row.avg_humidity) * parseInt(row.reading_count);
                stat.avgAqi += parseFloat(row.avg_aqi) * parseInt(row.reading_count);
                stat.avgBattery += parseFloat(row.avg_battery) * parseInt(row.reading_count);
            });
        });

        // Calculate weighted averages
        Object.values(regionStats).forEach(stat => {
            if (stat.totalReadings > 0) {
                stat.avgTemp = (stat.avgTemp / stat.totalReadings).toFixed(2);
                stat.avgHumidity = (stat.avgHumidity / stat.totalReadings).toFixed(2);
                stat.avgAqi = (stat.avgAqi / stat.totalReadings).toFixed(2);
                stat.avgBattery = (stat.avgBattery / stat.totalReadings).toFixed(2);
                stat.readingCount = stat.totalReadings;
            }
            delete stat.totalReadings;
        });

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            total: sortedReadings.length,
            readings: sortedReadings,
            statistics: Object.values(regionStats),
        });

    } catch (error) {
        console.error('Sensors API error:', error);

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