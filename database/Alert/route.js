import { executeParallelQuery } from '@/src/lib/db/pool';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || '50';

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
        d.device_name
      FROM alerts a
      LEFT JOIN devices d ON a.device_id = d.device_id
      WHERE a.resolved = FALSE
      ORDER BY a.triggered_at DESC
      LIMIT $1
    `;

        const result = await executeParallelQuery(
            ['north', 'south', 'east', 'west'],
            query,
            [limit]
        );

        // Combine and deduplicate
        const allAlerts = result.results.flatMap(r => r.result.rows);
        const uniqueAlerts = Array.from(
            new Map(allAlerts.map(a => [a.alert_id, a])).values()
        );

        // Add time ago
        const alertsWithTime = uniqueAlerts.map(alert => ({
            ...alert,
            time_ago: getTimeAgo(new Date(alert.triggered_at))
        }));

        return Response.json({
            success: true,
            data: alertsWithTime,
            total: alertsWithTime.length,
        });

    } catch (error) {
        console.error('Alerts API error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}