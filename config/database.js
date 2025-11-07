// config/database.js

/**
 * Database Configuration for Distributed PostgreSQL Nodes
 * 
 * This file contains connection settings for all 4 distributed database nodes.
 * Each node represents a different geographic region in our IoT system.
 * 
 * Architecture:
 * - Node 1 (North): Primary node for Northern region devices
 * - Node 2 (South): Primary node for Southern region devices
 * - Node 3 (East): Primary node for Eastern region devices
 * - Node 4 (West): Primary node for Western region devices
 */

// Database connection configurations for each node
export const dbConfigs = {
    // North Region Node - Port 5432
    north: {
        host: 'localhost',
        port: 5432,
        database: 'iot_ddb_north',
        user: 'postgres',
        password: 'postgres123', 
        max: 20, // Maximum number of clients in the connection pool
        idleTimeoutMillis: 30000, // How long a client can remain idle before being closed
        connectionTimeoutMillis: 2000, // How long to wait for a connection
    },

    // South Region Node - Port 5433
    south: {
        host: 'localhost',
        port: 5433,
        database: 'iot_ddb_south',
        user: 'postgres',
        password: 'postgres123', 
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },

    // East Region Node - Port 5434
    east: {
        host: 'localhost',
        port: 5434,
        database: 'iot_ddb_east',
        user: 'postgres',
        password: 'postgres123', 
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },

    // West Region Node - Port 5435
    west: {
        host: 'localhost',
        port: 5435,
        database: 'iot_ddb_west',
        user: 'postgres',
        password: 'postgres123', 
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },
};

/**
 * Node metadata for tracking node information
 * This helps with monitoring and fault tolerance
 */
export const nodeMetadata = {
    north: {
        region: 'North',
        location: 'Northern Data Center',
        timezone: 'UTC+5',
        isPrimary: true, // Primary node for northern devices
        replicatesFrom: ['south'], // Replicates data from south node
    },
    south: {
        region: 'South',
        location: 'Southern Data Center',
        timezone: 'UTC+5',
        isPrimary: true, // Primary node for southern devices
        replicatesFrom: ['north'], // Replicates data from north node
    },
    east: {
        region: 'East',
        location: 'Eastern Data Center',
        timezone: 'UTC+5',
        isPrimary: true, // Primary node for eastern devices
        replicatesFrom: ['west'], // Replicates data from west node
    },
    west: {
        region: 'West',
        location: 'Western Data Center',
        timezone: 'UTC+5',
        isPrimary: true, // Primary node for western devices
        replicatesFrom: ['east'], // Replicates data from east node
    },
};

/**
 * Fragmentation strategy configuration
 * Defines how data is distributed across nodes
 */
export const fragmentationStrategy = {
    // Horizontal fragmentation by region
    horizontal: {
        type: 'range',
        attribute: 'region',
        fragments: {
            north: { regions: ['north'] },
            south: { regions: ['south'] },
            east: { regions: ['east'] },
            west: { regions: ['west'] },
        },
    },

    // Vertical fragmentation for sensor data
    vertical: {
        type: 'column',
        tables: {
            sensor_data_basic: ['device_id', 'timestamp', 'region'],
            sensor_data_readings: ['temperature', 'humidity', 'air_quality'],
            sensor_data_metadata: ['battery_level', 'signal_strength'],
        },
    },
};

/**
 * Replication configuration
 * Defines which data is replicated where
 */
export const replicationConfig = {
    // Replication factor: each fragment is replicated to 1 other node
    replicationFactor: 2,

    // Replication pairs (primary -> replica)
    pairs: [
        { primary: 'north', replica: 'south' },
        { primary: 'south', replica: 'north' },
        { primary: 'east', replica: 'west' },
        { primary: 'west', replica: 'east' },
    ],

    // Replication method: asynchronous or synchronous
    method: 'asynchronous',

    // How often to replicate (in milliseconds)
    intervalMs: 5000, // 5 seconds
};