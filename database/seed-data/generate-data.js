// database/seed-data/generate-data.js

/**
 * IoT Sensor Data Generator
 * 
 * This script generates realistic IoT sensor data for testing the distributed database.
 * It creates:
 * - 100 IoT devices (25 per region)
 * - Historical sensor readings (6 months of data)
 * - Demonstrates horizontal fragmentation (data distributed by region)
 * 
 * Usage: node database/seed-data/generate-data.js
 */

import { executeQuery } from '../../src/lib/db/pool.js';

/**
 * Generate random number between min and max
 */
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random decimal number
 */
function randomDecimal(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
}

/**
 * Generate realistic temperature based on region
 */
function generateTemperature(region) {
    const baseTempByRegion = {
        north: 15,  // Cooler
        south: 30,  // Warmer
        east: 22,   // Moderate
        west: 25,   // Moderate-warm
    };

    const baseTemp = baseTempByRegion[region] || 20;
    const variation = randomDecimal(-5, 5, 2);
    return baseTemp + variation;
}

/**
 * Generate realistic humidity (40-80%)
 */
function generateHumidity() {
    return randomDecimal(40, 80, 2);
}

/**
 * Generate air quality index (0-200)
 * 0-50: Good, 51-100: Moderate, 101-150: Unhealthy for sensitive, 151-200: Unhealthy
 */
function generateAirQuality() {
    return randomNumber(20, 150);
}

/**
 * Generate battery level (0-100%)
 */
function generateBatteryLevel() {
    return randomNumber(20, 100);
}

/**
 * Generate signal strength (-100 to -30 dBm)
 */
function generateSignalStrength() {
    return randomNumber(-100, -30);
}

/**
 * Generate device name
 */
function generateDeviceName(region, index) {
    const regionPrefix = region.toUpperCase().substring(0, 1);
    return `${region.charAt(0).toUpperCase() + region.slice(1)}-Sensor-${regionPrefix}${String(index).padStart(3, '0')}`;
}

/**
 * Generate location coordinates based on region
 */
function generateCoordinates(region) {
    const coordinates = {
        north: { lat: [33.0, 37.0], lon: [71.0, 75.0] },  // Northern Pakistan
        south: { lat: [24.0, 26.0], lon: [67.0, 69.0] },  // Southern Pakistan (Karachi area)
        east: { lat: [30.0, 32.0], lon: [73.0, 75.0] },   // Eastern Pakistan (Lahore area)
        west: { lat: [29.0, 31.0], lon: [66.0, 68.0] },   // Western Pakistan (Quetta area)
    };

    const coord = coordinates[region];
    return {
        latitude: randomDecimal(coord.lat[0], coord.lat[1], 6),
        longitude: randomDecimal(coord.lon[0], coord.lon[1], 6),
    };
}

/**
 * Create devices for a specific region
 * This demonstrates HORIZONTAL FRAGMENTATION by region
 */
async function createDevices(nodeName, region, deviceCount) {
    console.log(`\n📱 Creating ${deviceCount} devices for ${region.toUpperCase()} region...`);

    const devices = [];

    for (let i = 1; i <= deviceCount; i++) {
        const deviceId = `DEVICE_${region.toUpperCase()}_${String(i).padStart(3, '0')}`;
        const deviceName = generateDeviceName(region, i);
        const coords = generateCoordinates(region);

        // Random device type
        const deviceTypes = ['temperature_sensor', 'humidity_sensor', 'air_quality_monitor', 'multi_sensor'];
        const deviceType = deviceTypes[randomNumber(0, deviceTypes.length - 1)];

        // Random installation date (within last 2 years)
        const installationDate = new Date();
        installationDate.setDate(installationDate.getDate() - randomNumber(1, 730));

        const query = `
      INSERT INTO devices (
        device_id, device_name, device_type, region, location,
        latitude, longitude, installation_date, status, firmware_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (device_id) DO NOTHING
      RETURNING device_id;
    `;

        const values = [
            deviceId,
            deviceName,
            deviceType,
            region,
            `${region.charAt(0).toUpperCase() + region.slice(1)} District, Sector ${i}`,
            coords.latitude,
            coords.longitude,
            installationDate,
            'active',
            `v${randomNumber(1, 3)}.${randomNumber(0, 9)}.${randomNumber(0, 9)}`
        ];

        try {
            const result = await executeQuery(nodeName, query, values);
            if (result.rows.length > 0) {
                devices.push(deviceId);
            }
        } catch (error) {
            console.error(`   ❌ Error creating device ${deviceId}:`, error.message);
        }
    }

    console.log(`   ✅ Created ${devices.length} devices in ${nodeName.toUpperCase()} node`);
    return devices;
}

/**
 * Generate sensor readings for devices
 * Creates historical data for the last 6 months
 */
async function generateSensorReadings(nodeName, region, devices, readingsPerDevice) {
    console.log(`\n📊 Generating ${readingsPerDevice} readings per device for ${region.toUpperCase()}...`);

    let totalInserted = 0;
    const batchSize = 100; // Insert in batches for better performance

    for (const deviceId of devices) {
        const readings = [];

        // Generate readings for last 6 months (one reading every hour)
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Calculate interval between readings
        const totalHours = Math.floor((now - sixMonthsAgo) / (1000 * 60 * 60));
        const hoursBetweenReadings = Math.floor(totalHours / readingsPerDevice);

        for (let i = 0; i < readingsPerDevice; i++) {
            const timestamp = new Date(sixMonthsAgo);
            timestamp.setHours(timestamp.getHours() + (i * hoursBetweenReadings));

            readings.push({
                deviceId,
                region,
                timestamp,
                temperature: generateTemperature(region),
                humidity: generateHumidity(),
                airQuality: generateAirQuality(),
                batteryLevel: generateBatteryLevel(),
                signalStrength: generateSignalStrength(),
            });
        }

        // Insert readings in batches
        for (let i = 0; i < readings.length; i += batchSize) {
            const batch = readings.slice(i, i + batchSize);

            const query = `
        INSERT INTO sensor_data (
          device_id, region, timestamp, temperature, humidity,
          air_quality, battery_level, signal_strength
        ) VALUES ${batch.map((_, idx) =>
                `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4}, 
           $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`
            ).join(', ')}
      `;

            const values = batch.flatMap(r => [
                r.deviceId, r.region, r.timestamp, r.temperature,
                r.humidity, r.airQuality, r.batteryLevel, r.signalStrength
            ]);

            try {
                await executeQuery(nodeName, query, values);
                totalInserted += batch.length;
            } catch (error) {
                console.error(`   ❌ Error inserting batch:`, error.message);
            }
        }

        // Show progress
        const deviceIndex = devices.indexOf(deviceId) + 1;
        if (deviceIndex % 5 === 0) {
            console.log(`   Progress: ${deviceIndex}/${devices.length} devices processed`);
        }
    }

    console.log(`   ✅ Inserted ${totalInserted} sensor readings in ${nodeName.toUpperCase()} node`);
    return totalInserted;
}

/**
 * Generate vertical fragmentation data
 * Splits sensor_data into sensor_data_basic, sensor_data_readings, and sensor_data_metadata
 */
async function generateVerticalFragments(nodeName, region) {
    console.log(`\n🔄 Creating vertical fragments for ${region.toUpperCase()}...`);

    try {
        // Insert into sensor_data_basic (device_id, region, timestamp)
        const basicQuery = `
      INSERT INTO sensor_data_basic (device_id, region, timestamp)
      SELECT device_id, region, timestamp
      FROM sensor_data
      WHERE region = $1
      ON CONFLICT DO NOTHING;
    `;
        await executeQuery(nodeName, basicQuery, [region]);

        // Insert into sensor_data_readings (temperature, humidity, air_quality)
        const readingsQuery = `
      INSERT INTO sensor_data_readings (reading_id, temperature, humidity, air_quality)
      SELECT 
        sdb.reading_id,
        sd.temperature,
        sd.humidity,
        sd.air_quality
      FROM sensor_data sd
      JOIN sensor_data_basic sdb ON 
        sd.device_id = sdb.device_id AND 
        sd.timestamp = sdb.timestamp
      WHERE sd.region = $1
      ON CONFLICT DO NOTHING;
    `;
        await executeQuery(nodeName, readingsQuery, [region]);

        // Insert into sensor_data_metadata (battery_level, signal_strength)
        const metadataQuery = `
      INSERT INTO sensor_data_metadata (reading_id, battery_level, signal_strength)
      SELECT 
        sdb.reading_id,
        sd.battery_level,
        sd.signal_strength
      FROM sensor_data sd
      JOIN sensor_data_basic sdb ON 
        sd.device_id = sdb.device_id AND 
        sd.timestamp = sdb.timestamp
      WHERE sd.region = $1
      ON CONFLICT DO NOTHING;
    `;
        await executeQuery(nodeName, metadataQuery, [region]);

        console.log(`   ✅ Vertical fragments created for ${region.toUpperCase()}`);

    } catch (error) {
        console.error(`   ❌ Error creating vertical fragments:`, error.message);
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 IoT Sensor Data Generator');
    console.log('============================\n');

    const regions = [
        { node: 'north', region: 'north' },
        { node: 'south', region: 'south' },
        { node: 'east', region: 'east' },
        { node: 'west', region: 'west' },
    ];

    const devicesPerRegion = 25;
    const readingsPerDevice = 100; // 100 readings per device

    console.log('Configuration:');
    console.log(`- Devices per region: ${devicesPerRegion}`);
    console.log(`- Total devices: ${devicesPerRegion * 4} (across 4 regions)`);
    console.log(`- Readings per device: ${readingsPerDevice}`);
    console.log(`- Total readings: ${devicesPerRegion * 4 * readingsPerDevice}`);
    console.log(`- Time period: Last 6 months`);

    try {
        for (const { node, region } of regions) {
            console.log(`\n${'='.repeat(50)}`);
            console.log(`Processing ${region.toUpperCase()} region on ${node.toUpperCase()} node`);
            console.log('='.repeat(50));

            // Create devices
            const devices = await createDevices(node, region, devicesPerRegion);

            // Generate sensor readings
            const readingsCount = await generateSensorReadings(node, region, devices, readingsPerDevice);

            // Create vertical fragments
            await generateVerticalFragments(node, region);

            console.log(`\n✅ ${region.toUpperCase()} region complete!`);
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 DATA GENERATION COMPLETE!');
        console.log('='.repeat(50));

        console.log('\n📊 Summary:');
        console.log(`✓ Total devices created: ${devicesPerRegion * 4}`);
        console.log(`✓ Total sensor readings: ~${devicesPerRegion * 4 * readingsPerDevice}`);
        console.log(`✓ Horizontal fragmentation: Data distributed by region`);
        console.log(`✓ Vertical fragmentation: Data split into 3 fragment tables`);
        console.log(`✓ All 4 nodes populated with regional data\n`);

    } catch (error) {
        console.error('\n💥 Data generation failed:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

// Run the generator
main();