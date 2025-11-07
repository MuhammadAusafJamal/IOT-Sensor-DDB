// src/lib/db/pool.js

/**
 * Database Connection Pool Manager
 * 
 * This module manages connection pools for all 4 distributed database nodes.
 * It provides a centralized way to:
 * 1. Create and manage database connections
 * 2. Execute queries across multiple nodes
 * 3. Handle connection errors and retries
 * 4. Monitor connection health
 * 
 * Connection pooling improves performance by reusing database connections
 * instead of creating new ones for each query.
 */

import pkg from 'pg';
const { Pool } = pkg;
import { dbConfigs } from '../../../config/database.js';

// Store all connection pools in an object
// Each key corresponds to a node (north, south, east, west)
const pools = {};

// Track connection health status for each node
const nodeHealth = {
    north: { status: 'unknown', lastCheck: null, errorCount: 0 },
    south: { status: 'unknown', lastCheck: null, errorCount: 0 },
    east: { status: 'unknown', lastCheck: null, errorCount: 0 },
    west: { status: 'unknown', lastCheck: null, errorCount: 0 },
};

/**
 * Initialize connection pool for a specific node
 * @param {string} nodeName - Name of the node (north, south, east, west)
 * @returns {Pool} PostgreSQL connection pool
 */
export function initializePool(nodeName) {
    // Check if pool already exists
    if (pools[nodeName]) {
        return pools[nodeName];
    }

    // Get configuration for this node
    const config = dbConfigs[nodeName];

    if (!config) {
        throw new Error(`Configuration not found for node: ${nodeName}. Available nodes: ${Object.keys(dbConfigs).join(', ')}`);
    }

    // Create new connection pool
    const pool = new Pool(config);

    // Event listener: Handle connection errors
    pool.on('error', (err, client) => {
        console.error(`[${nodeName.toUpperCase()}] Unexpected error on idle client:`, err.message);
        nodeHealth[nodeName].status = 'error';
        nodeHealth[nodeName].errorCount += 1;
    });

    // Event listener: Handle successful connections
    pool.on('connect', (client) => {
        console.log(`[${nodeName.toUpperCase()}] New client connected`);
        nodeHealth[nodeName].status = 'healthy';
        nodeHealth[nodeName].lastCheck = new Date();
    });

    // Event listener: Handle connection removal
    pool.on('remove', (client) => {
        console.log(`[${nodeName.toUpperCase()}] Client removed from pool`);
    });

    // Store pool in our pools object
    pools[nodeName] = pool;

    console.log(`[${nodeName.toUpperCase()}] Connection pool initialized`);

    return pool;
}

/**
 * Initialize all connection pools at startup
 * This ensures all nodes are connected when the application starts
 */
export function initializeAllPools() {
    const nodeNames = ['north', 'south', 'east', 'west'];

    console.log('Available database configs:', Object.keys(dbConfigs));

    nodeNames.forEach(nodeName => {
        try {
            initializePool(nodeName);
        } catch (error) {
            console.error(`Failed to initialize pool for ${nodeName}:`, error.message);
        }
    });

    console.log('All database connection pools initialized');
}

/**
 * Get connection pool for a specific node
 * @param {string} nodeName - Name of the node
 * @returns {Pool} PostgreSQL connection pool
 */
export function getPool(nodeName) {
    // Initialize pool if it doesn't exist
    if (!pools[nodeName]) {
        return initializePool(nodeName);
    }

    return pools[nodeName];
}

/**
 * Execute a query on a specific node
 * @param {string} nodeName - Name of the node
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters (for parameterized queries)
 * @returns {Promise<Object>} Query result
 */
export async function executeQuery(nodeName, query, params = []) {
    const pool = getPool(nodeName);

    try {
        const startTime = Date.now();
        const result = await pool.query(query, params);
        const duration = Date.now() - startTime;

        console.log(`[${nodeName.toUpperCase()}] Query executed in ${duration}ms`);

        // Update health status on successful query
        nodeHealth[nodeName].status = 'healthy';
        nodeHealth[nodeName].lastCheck = new Date();
        nodeHealth[nodeName].errorCount = 0;

        return result;
    } catch (error) {
        console.error(`[${nodeName.toUpperCase()}] Query error:`, error.message);

        // Update health status on error
        nodeHealth[nodeName].status = 'error';
        nodeHealth[nodeName].errorCount += 1;

        // Gracefully handle missing/offline databases
        if (error.code === '3D000' || error.message.includes('does not exist')) {
            console.warn(`[${nodeName.toUpperCase()}] Database not found or offline — skipping this node.`);
            return {
                rows: [],
                warning: `Database for ${nodeName} unavailable.`,
                success: false,
                error: error.message,
            };
        }

        // Handle connection errors (like ECONNREFUSED, etc.)
        if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
            console.warn(`[${nodeName.toUpperCase()}] Connection refused — node offline.`);
            return {
                rows: [],
                warning: `Node ${nodeName} connection refused.`,
                success: false,
                error: error.message,
            };
        }

        throw error;
    }
}

/**
 * Execute the same query on multiple nodes in parallel
 * Useful for distributed queries that need data from multiple nodes
 * @param {Array<string>} nodeNames - Array of node names
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Combined results from all nodes
 */
export async function executeParallelQuery(nodeNames, query, params = []) {
    try {
        // Create array of query promises
        const queryPromises = nodeNames.map(nodeName =>
            executeQuery(nodeName, query, params)
                .then(result => ({ nodeName, success: true, result }))
                .catch(error => ({ nodeName, success: false, error: error.message }))
        );

        // Wait for all queries to complete
        const results = await Promise.all(queryPromises);

        // Combine successful results
        const successfulResults = results.filter(r => r.success);
        const failedResults = results.filter(r => !r.success);

        return {
            success: successfulResults.length > 0,
            results: successfulResults,
            failures: failedResults,
            totalNodes: nodeNames.length,
            successfulNodes: successfulResults.length,
        };
    } catch (error) {
        console.error('Error in parallel query execution:', error);
        throw error;
    }
}

/**
 * Check health of a specific node
 * @param {string} nodeName - Name of the node
 * @returns {Promise<Object>} Health status
 */
export async function checkNodeHealth(nodeName) {
    try {
        const result = await executeQuery(nodeName, 'SELECT NOW() as current_time, version() as version');

        return {
            node: nodeName,
            status: 'healthy',
            timestamp: result.rows[0].current_time,
            version: result.rows[0].version,
            errorCount: nodeHealth[nodeName].errorCount,
        };
    } catch (error) {
        return {
            node: nodeName,
            status: 'unhealthy',
            error: error.message,
            errorCount: nodeHealth[nodeName].errorCount,
        };
    }
}

/**
 * Check health of all nodes
 * @returns {Promise<Array>} Health status of all nodes
 */
export async function checkAllNodesHealth() {
    const nodeNames = ['north', 'south', 'east', 'west'];
    const healthChecks = nodeNames.map(nodeName => checkNodeHealth(nodeName));

    return Promise.all(healthChecks);
}

/**
 * Close a specific connection pool
 * @param {string} nodeName - Name of the node
 */
export async function closePool(nodeName) {
    if (pools[nodeName]) {
        await pools[nodeName].end();
        delete pools[nodeName];
        console.log(`[${nodeName.toUpperCase()}] Connection pool closed`);
    }
}

/**
 * Close all connection pools
 * Should be called when shutting down the application
 */
export async function closeAllPools() {
    const nodeNames = Object.keys(pools);

    for (const nodeName of nodeNames) {
        await closePool(nodeName);
    }

    console.log('All connection pools closed');
}