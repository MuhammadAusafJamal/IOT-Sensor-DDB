// database/queries/distributed-queries.js

/**
 * Distributed Query Processing System
 * 
 * This module implements distributed query processing across multiple nodes.
 * It demonstrates:
 * - Query decomposition (breaking queries into sub-queries for each node)
 * - Parallel execution (running queries simultaneously on multiple nodes)
 * - Result aggregation (combining results from multiple nodes)
 * - Query optimization (choosing best nodes for queries)
 * 
 * Usage: node database/queries/distributed-queries.js
 */

import { executeQuery, executeParallelQuery } from '../../src/lib/db/pool.js';

/**
 * Get all devices across all regions
 * Demonstrates distributed SELECT with result aggregation
 */
async function getAllDevices() {
    console.log('\n📱 Query 1: Get All Devices (Distributed SELECT)');
    console.log('   Strategy: Query all 4 nodes in parallel and aggregate results\n');

    const startTime = Date.now();

    const query = `
    SELECT device_id, device_name, device_type, region, location, status
    FROM devices
    ORDER BY device_id
  `;

    try {
        const result = await executeParallelQuery(['north', 'south', 'east', 'west'], query);

        // Aggregate results from all nodes
        const allDevices = result.results.flatMap(r => r.result.rows);

        // Remove duplicates (due to replication)
        const uniqueDevices = Array.from(
            new Map(allDevices.map(d => [d.device_id, d])).values()
        );

        const duration = Date.now() - startTime;

        console.log(`   ✅ Retrieved ${uniqueDevices.length} unique devices`);
        console.log(`   📊 Queried ${result.successfulNodes} nodes successfully`);
        console.log(`   ⏱️  Total time: ${duration}ms`);
        console.log(`   📍 Sample devices:`);
        uniqueDevices.slice(0, 5).forEach(d => {
            console.log(`      - ${d.device_id}: ${d.device_name} (${d.region})`);
        });

        return uniqueDevices;

    } catch (error) {
        console.error('   ❌ Query failed:', error.message);
        throw error;
    }
}

/**
 * Get average temperature by region
 * Demonstrates distributed aggregation query
 */
async function getAverageTemperatureByRegion() {
    console.log('\n🌡️  Query 2: Average Temperature by Region (Distributed Aggregation)');
    console.log('   Strategy: Calculate averages on each node, then combine\n');

    const startTime = Date.now();

    const query = `
    SELECT 
      region,
      ROUND(AVG(temperature)::numeric, 2) as avg_temp,
      ROUND(MIN(temperature)::numeric, 2) as min_temp,
      ROUND(MAX(temperature)::numeric, 2) as max_temp,
      COUNT(*) as reading_count
    FROM sensor_data
    GROUP BY region
    ORDER BY region
  `;

    try {
        const result = await executeParallelQuery(['north', 'south', 'east', 'west'], query);

        // Aggregate results
        const regionStats = {};

        result.results.forEach(nodeResult => {
            nodeResult.result.rows.forEach(row => {
                if (!regionStats[row.region]) {
                    regionStats[row.region] = {
                        region: row.region,
                        totalTemp: 0,
                        count: 0,
                        min: row.min_temp,
                        max: row.max_temp,
                    };
                }

                // Accumulate for global average
                regionStats[row.region].totalTemp += parseFloat(row.avg_temp) * parseInt(row.reading_count);
                regionStats[row.region].count += parseInt(row.reading_count);
                regionStats[row.region].min = Math.min(regionStats[row.region].min, row.min_temp);
                regionStats[row.region].max = Math.max(regionStats[row.region].max, row.max_temp);
            });
        });

        // Calculate global averages
        const finalStats = Object.values(regionStats).map(stat => ({
            region: stat.region,
            avg_temp: (stat.totalTemp / stat.count).toFixed(2),
            min_temp: stat.min.toFixed(2),
            max_temp: stat.max.toFixed(2),
            reading_count: stat.count,
        }));

        const duration = Date.now() - startTime;

        console.log(`   ✅ Calculated temperature statistics for ${finalStats.length} regions`);
        console.log(`   ⏱️  Total time: ${duration}ms`);
        console.log(`   📊 Results:`);
        finalStats.forEach(stat => {
            console.log(`      ${stat.region.toUpperCase()}: Avg ${stat.avg_temp}°C (Min: ${stat.min_temp}°C, Max: ${stat.max_temp}°C) - ${stat.reading_count} readings`);
        });

        return finalStats;

    } catch (error) {
        console.error('   ❌ Query failed:', error.message);
        throw error;
    }
}

/**
 * Get recent sensor readings from a specific region
 * Demonstrates query routing (sending query to specific node)
 */
async function getRecentReadingsByRegion(region, limit = 10) {
    console.log(`\n📊 Query 3: Recent Readings for ${region.toUpperCase()} (Query Routing)`);
    console.log(`   Strategy: Route query to primary node for ${region} region\n`);

    const startTime = Date.now();

    // Determine which node to query based on region
    const nodeForRegion = {
        north: 'north',
        south: 'south',
        east: 'east',
        west: 'west',
    };

    const targetNode = nodeForRegion[region];

    const query = `
    SELECT 
      sd.device_id,
      d.device_name,
      sd.timestamp,
      sd.temperature,
      sd.humidity,
      sd.air_quality
    FROM sensor_data sd
    JOIN devices d ON sd.device_id = d.device_id
    WHERE sd.region = $1
    ORDER BY sd.timestamp DESC
    LIMIT $2
  `;

    try {
        const result = await executeQuery(targetNode, query, [region, limit]);

        const duration = Date.now() - startTime;

        console.log(`   ✅ Retrieved ${result.rows.length} readings from ${targetNode.toUpperCase()} node`);
        console.log(`   ⏱️  Query time: ${duration}ms`);
        console.log(`   📍 Recent readings:`);
        result.rows.slice(0, 3).forEach(r => {
            console.log(`      - ${r.device_name}: ${r.temperature}°C, ${r.humidity}% humidity (${new Date(r.timestamp).toLocaleString()})`);
        });

        return result.rows;

    } catch (error) {
        console.error('   ❌ Query failed:', error.message);
        throw error;
    }
}

/**
 * Get devices with low battery across all regions
 * Demonstrates distributed filtering with UNION
 */
async function getDevicesWithLowBattery(threshold = 30) {
    console.log(`\n🔋 Query 4: Devices with Low Battery (<${threshold}%) (Distributed Filter)`);
    console.log('   Strategy: Query all nodes and combine results\n');

    const startTime = Date.now();

    const query = `
    SELECT DISTINCT
      d.device_id,
      d.device_name,
      d.region,
      sd.battery_level,
      sd.timestamp
    FROM devices d
    JOIN sensor_data sd ON d.device_id = sd.device_id
    WHERE sd.battery_level < $1
    AND sd.timestamp = (
      SELECT MAX(timestamp)
      FROM sensor_data
      WHERE device_id = d.device_id
    )
    ORDER BY sd.battery_level ASC
  `;

    try {
        const result = await executeParallelQuery(['north', 'south', 'east', 'west'], query, [threshold]);

        // Combine and deduplicate results
        const allDevices = result.results.flatMap(r => r.result.rows);
        const uniqueDevices = Array.from(
            new Map(allDevices.map(d => [d.device_id, d])).values()
        );

        const duration = Date.now() - startTime;

        console.log(`   ✅ Found ${uniqueDevices.length} devices with low battery`);
        console.log(`   📊 Queried ${result.successfulNodes} nodes`);
        console.log(`   ⏱️  Total time: ${duration}ms`);

        if (uniqueDevices.length > 0) {
            console.log(`   ⚠️  Critical devices:`);
            uniqueDevices.slice(0, 5).forEach(d => {
                console.log(`      - ${d.device_name} (${d.region}): ${d.battery_level}%`);
            });
        }

        return uniqueDevices;

    } catch (error) {
        console.error('   ❌ Query failed:', error.message);
        throw error;
    }
}

/**
 * Get air quality statistics using vertical fragments
 * Demonstrates querying vertically fragmented data
 */
async function getAirQualityStats() {
    console.log('\n🌫️  Query 5: Air Quality Statistics (Vertical Fragment Join)');
    console.log('   Strategy: Join vertical fragments to reconstruct full data\n');

    const startTime = Date.now();

    const query = `
    SELECT 
      sdb.region,
      ROUND(AVG(sdr.air_quality)::numeric, 2) as avg_aqi,
      MIN(sdr.air_quality) as min_aqi,
      MAX(sdr.air_quality) as max_aqi,
      COUNT(*) as reading_count
    FROM sensor_data_basic sdb
    JOIN sensor_data_readings sdr ON sdb.reading_id = sdr.reading_id
    GROUP BY sdb.region
    ORDER BY sdb.region
  `;

    try {
        const result = await executeParallelQuery(['north', 'south', 'east', 'west'], query);

        // Aggregate results across nodes
        const regionAQI = {};

        result.results.forEach(nodeResult => {
            nodeResult.result.rows.forEach(row => {
                if (!regionAQI[row.region]) {
                    regionAQI[row.region] = {
                        region: row.region,
                        totalAQI: 0,
                        count: 0,
                        min: row.min_aqi,
                        max: row.max_aqi,
                    };
                }

                regionAQI[row.region].totalAQI += parseFloat(row.avg_aqi) * parseInt(row.reading_count);
                regionAQI[row.region].count += parseInt(row.reading_count);
                regionAQI[row.region].min = Math.min(regionAQI[row.region].min, row.min_aqi);
                regionAQI[row.region].max = Math.max(regionAQI[row.region].max, row.max_aqi);
            });
        });

        const finalStats = Object.values(regionAQI).map(stat => ({
            region: stat.region,
            avg_aqi: (stat.totalAQI / stat.count).toFixed(2),
            min_aqi: stat.min,
            max_aqi: stat.max,
            count: stat.count,
            category: getAQICategory(stat.totalAQI / stat.count),
        }));

        const duration = Date.now() - startTime;

        console.log(`   ✅ Retrieved air quality statistics for ${finalStats.length} regions`);
        console.log(`   ⏱️  Total time: ${duration}ms`);
        console.log(`   📊 Results:`);
        finalStats.forEach(stat => {
            console.log(`      ${stat.region.toUpperCase()}: ${stat.category} (Avg AQI: ${stat.avg_aqi}, Range: ${stat.min}-${stat.max})`);
        });

        return finalStats;

    } catch (error) {
        console.error('   ❌ Query failed:', error.message);
        throw error;
    }
}

/**
 * Get AQI category from value
 */
function getAQICategory(aqi) {
    if (aqi <= 50) return 'Good 😊';
    if (aqi <= 100) return 'Moderate 😐';
    if (aqi <= 150) return 'Unhealthy for Sensitive 😷';
    return 'Unhealthy ⚠️';
}

/**
 * Get device count per region
 * Simple distributed count query
 */
async function getDeviceCountByRegion() {
    console.log('\n📊 Query 6: Device Count by Region (Distributed COUNT)');
    console.log('   Strategy: Count on each node and aggregate\n');

    const startTime = Date.now();

    const query = `
    SELECT region, COUNT(DISTINCT device_id) as device_count
    FROM devices
    GROUP BY region
    ORDER BY region
  `;

    try {
        const result = await executeParallelQuery(['north', 'south', 'east', 'west'], query);

        const regionCounts = {};

        result.results.forEach(nodeResult => {
            nodeResult.result.rows.forEach(row => {
                regionCounts[row.region] = parseInt(row.device_count);
            });
        });

        const duration = Date.now() - startTime;

        console.log(`   ✅ Device counts retrieved`);
        console.log(`   ⏱️  Total time: ${duration}ms`);
        console.log(`   📊 Results:`);
        Object.entries(regionCounts).forEach(([region, count]) => {
            console.log(`      ${region.toUpperCase()}: ${count} devices`);
        });

        return regionCounts;

    } catch (error) {
        console.error('   ❌ Query failed:', error.message);
        throw error;
    }
}

/**
 * Main demonstration function
 */
async function main() {
    console.log('🚀 Distributed Query Processing Demonstration');
    console.log('='.repeat(60));
    console.log('\nThis demonstrates various distributed database query techniques:\n');
    console.log('1. Distributed SELECT with result aggregation');
    console.log('2. Distributed aggregation (AVG, MIN, MAX)');
    console.log('3. Query routing (sending query to optimal node)');
    console.log('4. Distributed filtering with deduplication');
    console.log('5. Vertical fragment joins');
    console.log('6. Distributed COUNT operations');

    try {
        // Run all demonstration queries
        await getAllDevices();
        await getAverageTemperatureByRegion();
        await getRecentReadingsByRegion('north', 5);
        await getDevicesWithLowBattery(40);
        await getAirQualityStats();
        await getDeviceCountByRegion();

        console.log('\n' + '='.repeat(60));
        console.log('🎉 DISTRIBUTED QUERY PROCESSING COMPLETE!');
        console.log('='.repeat(60));

        console.log('\n📝 Key Techniques Demonstrated:');
        console.log('✓ Query decomposition across multiple nodes');
        console.log('✓ Parallel query execution');
        console.log('✓ Result aggregation and deduplication');
        console.log('✓ Query routing to optimal nodes');
        console.log('✓ Distributed aggregation functions');
        console.log('✓ Vertical fragment reconstruction');
        console.log('✓ Performance optimization through parallelism\n');

    } catch (error) {
        console.error('\n💥 Query processing failed:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

// Run demonstration
main();