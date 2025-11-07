// src/app/api/health/route.js

/**
 * Node Health API Endpoint
 * 
 * Returns health status of all distributed database nodes
 * GET /api/health
 */

import { checkAllNodesHealth } from '@/lib/db/pool';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Check health of all nodes
        const health = await checkAllNodesHealth();

        // Calculate summary statistics
        const totalNodes = health.length;
        const healthyNodes = health.filter(n => n.status === 'healthy').length;
        const unhealthyNodes = health.filter(n => n.status === 'unhealthy').length;

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            summary: {
                total: totalNodes,
                healthy: healthyNodes,
                unhealthy: unhealthyNodes,
                healthPercentage: ((healthyNodes / totalNodes) * 100).toFixed(1),
            },
            nodes: health,
        });

    } catch (error) {
        console.error('Health check error:', error);

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