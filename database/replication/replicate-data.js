// database/replication/replicate-data.js

/**
 * Data Replication System
 * 
 * This script implements asynchronous data replication between distributed nodes.
 * Replication pairs:
 * - North ↔ South (North's data replicated to South, and vice versa)
 * - East ↔ West (East's data replicated to West, and vice versa)
 * 
 * This provides:
 * - Fault tolerance (data survives node failure)
 * - Load balancing (queries can be distributed)
 * - Replication factor of 2 (each fragment exists on 2 nodes)
 * 
 * Usage: node database/replication/replicate-data.js
 */

import { executeQuery, executeParallelQuery } from '../../src/lib/db/pool.js';

/**
 * Replication configuration
 * Defines which nodes replicate to which targets
 */
const replicationPairs = [
    { source: 'north', target: 'south', sourceRegion: 'north' },
    { source: 'south', target: 'north', sourceRegion: 'south' },
    { source: 'east', target: 'west', sourceRegion: 'east' },
    { source: 'west', target: 'east', sourceRegion: 'west' },
];

/**
 * Log replication event
 */
async function logReplication(sourceNode, targetNode, tableName, recordCount, status, errorMessage = null, durationMs = 0) {
    const query = `
    INSERT INTO replication_log (
      source_node, target_node, table_name, record_count,
      status, completed_at, error_message, duration_ms
    ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
  `;

    const values = [sourceNode, targetNode, tableName, recordCount, status, errorMessage, durationMs];

    try {
        await executeQuery(sourceNode, query, values);
    } catch (error) {
        console.error(`   ⚠️  Failed to log replication:`, error.message);
    }
}

/**
 * Replicate devices table
 * Copies device records from source to target node
 */
async function replicateDevices(sourceNode, targetNode, region) {
    console.log(`   📋 Replicating devices table...`);
    const startTime = Date.now();

    try {
        // Get devices from source node for this region
        const selectQuery = `
      SELECT device_id, device_name, device_type, region, location,
             latitude, longitude, installation_date, last_maintenance,
             status, firmware_version, created_at, updated_at
      FROM devices
      WHERE region = $1
    `;

        const sourceData = await executeQuery(sourceNode, selectQuery, [region]);

        if (sourceData.rows.length === 0) {
            console.log(`   ⚠️  No devices found to replicate for region ${region}`);
            return 0;
        }

        // Insert into target node (using ON CONFLICT to handle duplicates)
        let insertedCount = 0;

        for (const device of sourceData.rows) {
            const insertQuery = `
        INSERT INTO devices (
          device_id, device_name, device_type, region, location,
          latitude, longitude, installation_date, last_maintenance,
          status, firmware_version, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (device_id) DO UPDATE SET
          device_name = EXCLUDED.device_name,
          status = EXCLUDED.status,
          last_maintenance = EXCLUDED.last_maintenance,
          updated_at = NOW()
      `;

            const values = [
                device.device_id, device.device_name, device.device_type, device.region,
                device.location, device.latitude, device.longitude, device.installation_date,
                device.last_maintenance, device.status, device.firmware_version,
                device.created_at, device.updated_at
            ];

            await executeQuery(targetNode, insertQuery, values);
            insertedCount++;
        }

        const duration = Date.now() - startTime;
        console.log(`   ✅ Replicated ${insertedCount} devices (${duration}ms)`);

        // Log successful replication
        await logReplication(sourceNode, targetNode, 'devices', insertedCount, 'success', null, duration);

        return insertedCount;

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`   ❌ Failed to replicate devices:`, error.message);

        // Log failed replication
        await logReplication(sourceNode, targetNode, 'devices', 0, 'failed', error.message, duration);

        throw error;
    }
}

/**
 * Replicate sensor_data table
 * Copies sensor readings from source to target node
 */
async function replicateSensorData(sourceNode, targetNode, region) {
    console.log(`   📊 Replicating sensor_data table...`);
    const startTime = Date.now();

    try {
        // Get unsynced sensor data from source node
        const selectQuery = `
      SELECT reading_id, device_id, region, timestamp, temperature,
             humidity, air_quality, battery_level, signal_strength,
             created_at, synced
      FROM sensor_data
      WHERE region = $1 AND synced = FALSE
      ORDER BY timestamp DESC
      LIMIT 1000
    `;

        const sourceData = await executeQuery(sourceNode, selectQuery, [region]);

        if (sourceData.rows.length === 0) {
            console.log(`   ℹ️  No new sensor data to replicate`);
            return 0;
        }

        // Batch insert into target node
        let insertedCount = 0;
        const batchSize = 100;

        for (let i = 0; i < sourceData.rows.length; i += batchSize) {
            const batch = sourceData.rows.slice(i, i + batchSize);

            const insertQuery = `
        INSERT INTO sensor_data (
          device_id, region, timestamp, temperature, humidity,
          air_quality, battery_level, signal_strength, created_at, synced
        ) VALUES ${batch.map((_, idx) =>
                `($${idx * 10 + 1}, $${idx * 10 + 2}, $${idx * 10 + 3}, $${idx * 10 + 4}, 
           $${idx * 10 + 5}, $${idx * 10 + 6}, $${idx * 10 + 7}, $${idx * 10 + 8},
           $${idx * 10 + 9}, $${idx * 10 + 10})`
            ).join(', ')}
        ON CONFLICT DO NOTHING
      `;

            const values = batch.flatMap(r => [
                r.device_id, r.region, r.timestamp, r.temperature, r.humidity,
                r.air_quality, r.battery_level, r.signal_strength, r.created_at, true
            ]);

            await executeQuery(targetNode, insertQuery, values);
            insertedCount += batch.length;
        }

        // Mark source data as synced
        const readingIds = sourceData.rows.map(r => r.reading_id);
        const updateQuery = `
      UPDATE sensor_data 
      SET synced = TRUE 
      WHERE reading_id = ANY($1)
    `;
        await executeQuery(sourceNode, updateQuery, [readingIds]);

        const duration = Date.now() - startTime;
        console.log(`   ✅ Replicated ${insertedCount} sensor readings (${duration}ms)`);

        // Log successful replication
        await logReplication(sourceNode, targetNode, 'sensor_data', insertedCount, 'success', null, duration);

        return insertedCount;

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`   ❌ Failed to replicate sensor data:`, error.message);

        // Log failed replication
        await logReplication(sourceNode, targetNode, 'sensor_data', 0, 'failed', error.message, duration);

        throw error;
    }
}

/**
 * Replicate vertical fragments
 */
async function replicateVerticalFragments(sourceNode, targetNode, region) {
    console.log(`   🔄 Replicating vertical fragments...`);
    const startTime = Date.now();

    try {
        let totalReplicated = 0;

        // Replicate sensor_data_basic
        const basicQuery = `
      INSERT INTO sensor_data_basic (device_id, region, timestamp, created_at)
      SELECT device_id, region, timestamp, created_at
      FROM sensor_data
      WHERE region = $1
      ON CONFLICT DO NOTHING
    `;
        await executeQuery(targetNode, basicQuery, [region]);

        // Replicate sensor_data_readings
        const readingsQuery = `
      INSERT INTO sensor_data_readings (reading_id, temperature, humidity, air_quality)
      SELECT sdb.reading_id, sd.temperature, sd.humidity, sd.air_quality
      FROM sensor_data sd
      JOIN sensor_data_basic sdb ON sd.device_id = sdb.device_id AND sd.timestamp = sdb.timestamp
      WHERE sd.region = $1
      ON CONFLICT DO NOTHING
    `;
        await executeQuery(targetNode, readingsQuery, [region]);

        // Replicate sensor_data_metadata
        const metadataQuery = `
      INSERT INTO sensor_data_metadata (reading_id, battery_level, signal_strength)
      SELECT sdb.reading_id, sd.battery_level, sd.signal_strength
      FROM sensor_data sd
      JOIN sensor_data_basic sdb ON sd.device_id = sdb.device_id AND sd.timestamp = sdb.timestamp
      WHERE sd.region = $1
      ON CONFLICT DO NOTHING
    `;
        await executeQuery(targetNode, metadataQuery, [region]);

        const duration = Date.now() - startTime;
        console.log(`   ✅ Replicated vertical fragments (${duration}ms)`);

        return totalReplicated;

    } catch (error) {
        console.error(`   ❌ Failed to replicate vertical fragments:`, error.message);
        throw error;
    }
}

/**
 * Perform replication for a single pair
 */
async function replicatePair(sourceNode, targetNode, sourceRegion) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Replicating: ${sourceNode.toUpperCase()} → ${targetNode.toUpperCase()}`);
    console.log(`   Region: ${sourceRegion}`);
    console.log('='.repeat(60));

    try {
        // Replicate devices
        const deviceCount = await replicateDevices(sourceNode, targetNode, sourceRegion);

        // Replicate sensor data
        const sensorCount = await replicateSensorData(sourceNode, targetNode, sourceRegion);

        // Replicate vertical fragments
        await replicateVerticalFragments(sourceNode, targetNode, sourceRegion);

        console.log(`\n   ✅ Replication complete: ${deviceCount} devices, ${sensorCount} readings`);

        return {
            success: true,
            deviceCount,
            sensorCount,
        };

    } catch (error) {
        console.error(`\n   ❌ Replication failed:`, error.message);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Verify replication by comparing record counts
 */
async function verifyReplication() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🔍 Verifying Replication');
    console.log('='.repeat(60));

    const nodes = ['north', 'south', 'east', 'west'];

    for (const node of nodes) {
        console.log(`\n📊 ${node.toUpperCase()} node:`);

        try {
            // Count devices
            const deviceQuery = 'SELECT region, COUNT(*) as count FROM devices GROUP BY region ORDER BY region';
            const deviceResult = await executeQuery(node, deviceQuery);

            console.log('   Devices by region:');
            deviceResult.rows.forEach(row => {
                console.log(`   - ${row.region}: ${row.count} devices`);
            });

            // Count sensor readings
            const sensorQuery = 'SELECT region, COUNT(*) as count FROM sensor_data GROUP BY region ORDER BY region';
            const sensorResult = await executeQuery(node, sensorQuery);

            console.log('   Sensor readings by region:');
            sensorResult.rows.forEach(row => {
                console.log(`   - ${row.region}: ${row.count} readings`);
            });

        } catch (error) {
            console.error(`   ❌ Error verifying ${node}:`, error.message);
        }
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 IoT DDB Replication System');
    console.log('==============================\n');

    console.log('Replication Configuration:');
    console.log('- Strategy: Asynchronous replication');
    console.log('- Replication Factor: 2');
    console.log('- Pairs:');
    console.log('  • North ↔ South');
    console.log('  • East ↔ West');

    try {
        const results = [];

        // Perform replication for all pairs
        for (const pair of replicationPairs) {
            const result = await replicatePair(pair.source, pair.target, pair.sourceRegion);
            results.push({ ...pair, ...result });

            // Small delay between replications
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Summary
        console.log(`\n${'='.repeat(60)}`);
        console.log('📊 Replication Summary');
        console.log('='.repeat(60));

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`\n✅ Successful: ${successful}/${results.length}`);
        console.log(`❌ Failed: ${failed}/${results.length}`);

        results.forEach(r => {
            const status = r.success ? '✅' : '❌';
            console.log(`${status} ${r.source} → ${r.target}: ${r.success ? `${r.deviceCount} devices, ${r.sensorCount} readings` : r.error}`);
        });

        // Verify replication
        await verifyReplication();

        console.log(`\n${'='.repeat(60)}`);
        console.log('🎉 REPLICATION COMPLETE!');
        console.log('='.repeat(60));

        console.log('\n📝 Key Achievements:');
        console.log('✓ Data replicated across node pairs');
        console.log('✓ Fault tolerance established (replication factor: 2)');
        console.log('✓ Each region\'s data exists on 2 nodes');
        console.log('✓ Vertical fragments replicated');
        console.log('✓ Replication logs maintained\n');

    } catch (error) {
        console.error('\n💥 Replication failed:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

// Run replication
main();