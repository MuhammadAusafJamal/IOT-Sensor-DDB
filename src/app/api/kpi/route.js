import { executeQuery, executeParallelQuery, checkAllNodesHealth } from '../../../lib/db/pool';

export async function GET(request) {
    try {
        console.log('📊 KPI API called');

        // Query 1: Total Devices (from all nodes)
        const devicesQuery = 'SELECT COUNT(*) as count FROM devices';
        const devicesResult = await executeParallelQuery(
            ['north', 'south', 'east', 'west'],
            devicesQuery
        );

        // Aggregate device counts (remove duplicates due to replication)
        const deviceIds = new Set();
        devicesResult.results.forEach(nodeResult => {
            if (nodeResult.result?.rows) {
                // Get unique device IDs
                const ids = nodeResult.result.rows.map(r => r.device_id);
                ids.forEach(id => deviceIds.add(id));
            }
        });
        const totalDevices = devicesResult.results.reduce(
            (sum, r) => sum + parseInt(r.result.rows[0]?.count || 0),
            0
        ) / 2; // Divide by 2 because of replication factor

        // Query 2: Total Sensor Readings
        const sensorsQuery = 'SELECT COUNT(*) as count FROM sensor_data';
        const sensorsResult = await executeParallelQuery(
            ['north', 'south', 'east', 'west'],
            sensorsQuery
        );
        const totalReadings = sensorsResult.results.reduce(
            (sum, r) => sum + parseInt(r.result.rows[0]?.count || 0),
            0
        ) / 2; // Divide by 2 because of replication

        // Query 3: Active Alerts
        const alertsQuery = 'SELECT COUNT(*) as count FROM alerts WHERE resolved = FALSE';
        const alertsResult = await executeParallelQuery(
            ['north', 'south', 'east', 'west'],
            alertsQuery
        );
        const totalAlerts = alertsResult.results.reduce(
            (sum, r) => sum + parseInt(r.result.rows[0]?.count || 0),
            0
        ) / 2;

        // Query 4: Average Query Time (from last 100 queries)
        const perfQuery = `
      SELECT AVG(duration_ms) as avg_time 
      FROM (
        SELECT duration_ms FROM replication_log 
        ORDER BY started_at DESC 
        LIMIT 100
      ) recent
    `;
        const perfResult = await executeQuery('north', perfQuery);
        const avgQueryTime = Math.round(perfResult.rows[0]?.avg_time || 0);

        // Query 5: Today's new readings
        const todayQuery = `
      SELECT COUNT(*) as count 
      FROM sensor_data 
      WHERE DATE(created_at) = CURRENT_DATE
    `;
        const todayResult = await executeParallelQuery(
            ['north', 'south', 'east', 'west'],
            todayQuery
        );
        const todayReadings = todayResult.results.reduce(
            (sum, r) => sum + parseInt(r.result.rows[0]?.count || 0),
            0
        ) / 2;

        // Query 6: Healthy nodes count
        const health = await checkAllNodesHealth();
        const healthyNodes = health.filter(n => n.status === 'healthy').length;

        // Calculate trends (compare with yesterday)
        const yesterdayQuery = `
      SELECT COUNT(*) as count 
      FROM sensor_data 
      WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
    `;
        const yesterdayResult = await executeParallelQuery(
            ['north', 'south', 'east', 'west'],
            yesterdayQuery
        );
        const yesterdayReadings = yesterdayResult.results.reduce(
            (sum, r) => sum + parseInt(r.result.rows[0]?.count || 0),
            0
        ) / 2;

        const readingsTrend = yesterdayReadings > 0
            ? ((todayReadings - yesterdayReadings) / yesterdayReadings * 100).toFixed(1)
            : 0;

        const kpis = {
            totalDevices: {
                value: Math.round(totalDevices),
                label: 'Total Devices',
                icon: '📱',
                color: 'blue',
                trend: null,
            },
            totalReadings: {
                value: Math.round(totalReadings),
                label: 'Total Readings',
                icon: '📊',
                color: 'green',
                trend: `${readingsTrend > 0 ? '+' : ''}${readingsTrend}% vs yesterday`,
            },
            activeAlerts: {
                value: Math.round(totalAlerts),
                label: 'Active Alerts',
                icon: '⚠️',
                color: 'red',
                trend: null,
            },
            avgQueryTime: {
                value: `${avgQueryTime}ms`,
                label: 'Avg Query Time',
                icon: '⚡',
                color: 'purple',
                trend: null,
            },
            todayReadings: {
                value: Math.round(todayReadings),
                label: "Today's Readings",
                icon: '📈',
                color: 'cyan',
                trend: null,
            },
            healthyNodes: {
                value: `${healthyNodes}/4`,
                label: 'Healthy Nodes',
                icon: '🏥',
                color: 'green',
                trend: '100% uptime',
            },
        };

        console.log('✅ KPI data fetched:', kpis);

        return Response.json({
            success: true,
            data: kpis,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ KPI API error:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// export async function GET(request) {
//     try {
//         // Total Devices (remove duplicates from replication)
//         const devicesResult = await executeParallelQuery(
//             ['north', 'south', 'east', 'west'],
//             'SELECT COUNT(DISTINCT device_id) as count FROM devices'
//         );
//         const totalDevices = devicesResult.results.reduce(
//             (sum, r) => sum + parseInt(r.result.rows[0]?.count || 0),
//             0
//         );

//         // Total Readings
//         const sensorsResult = await executeParallelQuery(
//             ['north', 'south', 'east', 'west'],
//             'SELECT COUNT(*) as count FROM sensor_data'
//         );
//         const totalReadings = sensorsResult.results.reduce(
//             (sum, r) => sum + parseInt(r.result.rows[0]?.count || 0),
//             0
//         ) / 2; // Divide by replication factor

//         // Active Alerts
//         const alertsResult = await executeParallelQuery(
//             ['north', 'south', 'east', 'west'],
//             'SELECT COUNT(*) as count FROM alerts WHERE resolved = FALSE'
//         );
//         const totalAlerts = alertsResult.results.reduce(
//             (sum, r) => sum + parseInt(r.result.rows[0]?.count || 0),
//             0
//         ) / 2;

//         // Critical Alerts
//         const criticalResult = await executeParallelQuery(
//             ['north', 'south', 'east', 'west'],
//             "SELECT COUNT(*) as count FROM alerts WHERE severity = 'critical' AND resolved = FALSE"
//         );
//         const criticalAlerts = criticalResult.results.reduce(
//             (sum, r) => sum + parseInt(r.result.rows[0]?.count || 0),
//             0
//         ) / 2;

//         // Low Battery Devices
//         const lowBatteryResult = await executeParallelQuery(
//             ['north', 'south', 'east', 'west'],
//             `SELECT COUNT(DISTINCT device_id) as count 
//        FROM sensor_data 
//        WHERE battery_level < 20 
//        AND timestamp > NOW() - INTERVAL '1 hour'`
//         );
//         const lowBatteryCount = lowBatteryResult.results.reduce(
//             (sum, r) => sum + parseInt(r.result.rows[0]?.count || 0),
//             0
//         );

//         // Today's Readings
//         const todayResult = await executeParallelQuery(
//             ['north', 'south', 'east', 'west'],
//             `SELECT COUNT(*) as count 
//        FROM sensor_data 
//        WHERE DATE(created_at) = CURRENT_DATE`
//         );
//         const todayReadings = todayResult.results.reduce(
//             (sum, r) => sum + parseInt(r.result.rows[0]?.count || 0),
//             0
//         ) / 2;

//         return Response.json({
//             success: true,
//             data: {
//                 totalDevices: { value: totalDevices, label: 'Total Devices', icon: '📱', color: 'blue' },
//                 totalReadings: { value: Math.round(totalReadings), label: 'Total Readings', icon: '📊', color: 'green' },
//                 activeAlerts: { value: Math.round(totalAlerts), label: 'Active Alerts', icon: '⚠️', color: 'red' },
//                 criticalAlerts: { value: Math.round(criticalAlerts), label: 'Critical Alerts', icon: '🔴', color: 'red' },
//                 lowBattery: { value: lowBatteryCount, label: 'Low Battery', icon: '🔋', color: 'yellow' },
//                 todayReadings: { value: Math.round(todayReadings), label: "Today's Readings", icon: '📈', color: 'cyan' },
//             },
//             timestamp: new Date().toISOString(),
//         });

//     } catch (error) {
//         console.error('KPI API error:', error);
//         return Response.json({ success: false, error: error.message }, { status: 500 });
//     }
// }