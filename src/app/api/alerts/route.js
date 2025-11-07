// import { executeQuery, executeParallelQuery } from '@/lib/db/pool';

// export async function GET(request) {
//     try {
//         const { searchParams } = new URL(request.url);
//         const region = searchParams.get('region');
//         const severity = searchParams.get('severity');
//         const resolved = searchParams.get('resolved') || 'false';

//         // Build query
//         let query = `
//       SELECT 
//         a.alert_id,
//         a.device_id,
//         a.region,
//         a.alert_type,
//         a.severity,
//         a.message,
//         a.threshold_value,
//         a.actual_value,
//         a.triggered_at,
//         a.resolved,
//         d.device_name
//       FROM alerts a
//       JOIN devices d ON a.device_id = d.device_id
//       WHERE a.resolved = $1
//     `;

//         const params = [resolved === 'true'];
//         let paramIndex = 2;

//         if (region) {
//             query += ` AND a.region = $${paramIndex}`;
//             params.push(region);
//             paramIndex++;
//         }

//         if (severity) {
//             query += ` AND a.severity = $${paramIndex}`;
//             params.push(severity);
//             paramIndex++;
//         }

//         query += ` ORDER BY a.triggered_at DESC LIMIT 100`;

//         // Query all nodes in parallel
//         const result = await executeParallelQuery(
//             ['north', 'south', 'east', 'west'],
//             query,
//             params
//         );

//         // Combine results
//         const allAlerts = result.results.flatMap(r => r.result.rows);

//         // Remove duplicates and sort
//         const uniqueAlerts = Array.from(
//             new Map(allAlerts.map(a => [a.alert_id, a])).values()
//         ).sort((a, b) => new Date(b.triggered_at) - new Date(a.triggered_at));

//         // Add time ago
//         const alertsWithTimeAgo = uniqueAlerts.map(alert => ({
//             ...alert,
//             time_ago: getTimeAgo(new Date(alert.triggered_at))
//         }));

//         return Response.json({
//             success: true,
//             data: alertsWithTimeAgo,
//             total: alertsWithTimeAgo.length
//         });

//     } catch (error) {
//         console.error('Alerts API error:', error);
//         return Response.json(
//             { success: false, error: error.message },
//             { status: 500 }
//         );
//     }
// }

// function getTimeAgo(date) {
//     const seconds = Math.floor((new Date() - date) / 1000);

//     if (seconds < 60) return `${seconds}s ago`;
//     if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
//     if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
//     return `${Math.floor(seconds / 86400)}d ago`;
// }




// import { executeQuery, executeParallelQuery } from '../../../lib/db/pool';

// export async function GET(request) {
//     try {
//         const { searchParams } = new URL(request.url);
//         const limit = searchParams.get('limit') || '50';

//         const query = `
//       SELECT 
//         a.alert_id,
//         a.device_id,
//         a.region,
//         a.alert_type,
//         a.severity,
//         a.message,
//         a.threshold_value,
//         a.actual_value,
//         a.triggered_at,
//         a.resolved,
//         d.device_name
//       FROM alerts a
//       LEFT JOIN devices d ON a.device_id = d.device_id
//       WHERE a.resolved = FALSE
//       ORDER BY a.triggered_at DESC
//       LIMIT $1
//     `;

//         const result = await executeParallelQuery(
//             ['north', 'south', 'east', 'west'],
//             query,
//             [limit]
//         );

//         // Combine and deduplicate
//         const allAlerts = result.results.flatMap(r => r.result.rows);
//         const uniqueAlerts = Array.from(
//             new Map(allAlerts.map(a => [a.alert_id, a])).values()
//         );

//         // Add time ago
//         const alertsWithTime = uniqueAlerts.map(alert => ({
//             ...alert,
//             time_ago: getTimeAgo(new Date(alert.triggered_at))
//         }));

//         return Response.json({
//             success: true,
//             data: alertsWithTime,
//             total: alertsWithTime.length,
//         });

//     } catch (error) {
//         console.error('Alerts API error:', error);
//         return Response.json({ success: false, error: error.message }, { status: 500 });
//     }
// }

// function getTimeAgo(date) {
//     const seconds = Math.floor((new Date() - date) / 1000);
//     if (seconds < 60) return `${seconds}s ago`;
//     if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
//     if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
//     return `${Math.floor(seconds / 86400)}d ago`;
// }


// app/api/alerts/route.js

import { executeQuery, executeParallelQuery } from '../../../lib/db/pool';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Get filter parameters
        const severity = searchParams.get('severity') || '';
        const region = searchParams.get('region') || '';
        const type = searchParams.get('type') || '';
        const limit = searchParams.get('limit') || '100';
        const resolved = searchParams.get('resolved') || 'false';

        // Build WHERE clause
        let whereConditions = ['a.resolved = $1'];
        let paramIndex = 2;
        const params = [resolved === 'true'];

        if (severity) {
            whereConditions.push(`a.severity = $${paramIndex}`);
            params.push(severity);
            paramIndex++;
        }

        if (region) {
            whereConditions.push(`a.region = $${paramIndex}`);
            params.push(region);
            paramIndex++;
        }

        if (type) {
            whereConditions.push(`a.alert_type = $${paramIndex}`);
            params.push(type);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
      SELECT 
        a.alert_id,
        a.device_id,
        a.region,
        a.alert_type,
        a.severity,
        a.message,
        a.threshold_value,
        a.actual_value,
        a.triggered_at,
        a.resolved,
        a.resolved_at,
        d.device_name
      FROM alerts a
      LEFT JOIN devices d ON a.device_id = d.device_id
      WHERE ${whereClause}
      ORDER BY a.triggered_at DESC
      LIMIT $${paramIndex}
    `;

        params.push(limit);

        console.log('🔍 Alerts query:', { severity, region, type, resolved, limit });

        const result = await executeParallelQuery(
            ['north', 'south', 'east', 'west'],
            query,
            params
        );

        // Combine and deduplicate
        const allAlerts = result.results.flatMap(r => r.result.rows);
        const uniqueAlerts = Array.from(
            new Map(allAlerts.map(a => [a.alert_id, a])).values()
        );

        // Sort by triggered_at
        uniqueAlerts.sort((a, b) =>
            new Date(b.triggered_at) - new Date(a.triggered_at)
        );

        // Add time ago
        const alertsWithTime = uniqueAlerts.map(alert => ({
            ...alert,
            time_ago: getTimeAgo(new Date(alert.triggered_at))
        }));

        // Calculate summary statistics
        const summary = {
            total: alertsWithTime.length,
            critical: alertsWithTime.filter(a => a.severity === 'critical').length,
            warning: alertsWithTime.filter(a => a.severity === 'warning').length,
            info: alertsWithTime.filter(a => a.severity === 'info').length,
            byRegion: {
                north: alertsWithTime.filter(a => a.region === 'north').length,
                south: alertsWithTime.filter(a => a.region === 'south').length,
                east: alertsWithTime.filter(a => a.region === 'east').length,
                west: alertsWithTime.filter(a => a.region === 'west').length,
            }
        };

        console.log('✅ Alerts fetched:', summary);

        return Response.json({
            success: true,
            data: alertsWithTime,
            summary,
            filters: { severity, region, type, resolved },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ Alerts API error:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}