// // database/seed-data/realtime-simulator.js

// /**
//  * Real-Time IoT Data Simulator
//  * 
//  * This script continuously generates new sensor readings every minute,
//  * simulating live IoT devices sending data to the database.
//  * 
//  * Features:
//  * - Generates readings every 60 seconds
//  * - Creates realistic alerts
//  * - Simulates device failures
//  * - Shows live statistics
//  * 
//  * Usage: node database/seed-data/realtime-simulator.js
//  * Keep this running while demonstrating your dashboard!
//  */

// import { executeQuery } from '../../src/lib/db/pool.js';

// // Configuration
// const CONFIG = {
//     updateInterval: 30000, // 60 seconds
//     devicesPerRegion: 25,
//     alertProbability: 0.20, // 20% chance of alert
//     failureProbability: 0.05, // 5% chance of device failure
// };

// // Regional profiles (same as realistic generator)
// const REGION_PROFILES = {
//     north: { baseTempRange: [10, 20], tempVariation: 5, batteryDrain: 0.8 },
//     south: { baseTempRange: [25, 35], tempVariation: 8, batteryDrain: 1.5 },
//     east: { baseTempRange: [18, 28], tempVariation: 6, batteryDrain: 1.0 },
//     west: { baseTempRange: [20, 30], tempVariation: 7, batteryDrain: 1.2 },
// };

// // Track device states
// const deviceStates = new Map();

// // Helper functions
// function randomBetween(min, max) {
//     return Math.random() * (max - min) + min;
// }

// function randomInt(min, max) {
//     return Math.floor(randomBetween(min, max));
// }

// /**
//  * Initialize device state
//  */
// function initializeDeviceState(deviceId, region) {
//     if (!deviceStates.has(deviceId)) {
//         deviceStates.set(deviceId, {
//             batteryLevel: randomInt(60, 100),
//             lastReading: null,
//             failureMode: false,
//             consecutiveAlerts: 0,
//         });
//     }
//     return deviceStates.get(deviceId);
// }

// /**
//  * Generate realistic temperature
//  */
// function generateTemperature(region) {
//     const profile = REGION_PROFILES[region];
//     const [minTemp, maxTemp] = profile.baseTempRange;

//     const hour = new Date().getHours();
//     let temp = randomBetween(minTemp, maxTemp);

//     // Time of day effect
//     const timeEffect = Math.sin((hour - 4) * Math.PI / 12) * profile.tempVariation;
//     temp += timeEffect;

//     // Random variation
//     temp += randomBetween(-2, 2);

//     return parseFloat(temp.toFixed(2));
// }

// /**
//  * Generate one reading for a device
//  */
// async function generateReading(nodeName, region, deviceIndex) {
//     const deviceId = `DEVICE_${region.toUpperCase()}_${String(deviceIndex).padStart(3, '0')}`;
//     const state = initializeDeviceState(deviceId, region);

//     // Check if device failed
//     if (Math.random() < CONFIG.failureProbability) {
//         state.failureMode = true;
//         console.log(`   ⚠️  ${deviceId} entered failure mode`);
//     }

//     // Failure mode: extreme values
//     let temperature, humidity, airQuality, signalStrength;

//     if (state.failureMode) {
//         temperature = Math.random() < 0.5 ? randomBetween(-5, 5) : randomBetween(42, 48);
//         humidity = randomBetween(10, 95);
//         airQuality = randomInt(180, 250);
//         signalStrength = randomInt(-100, -90);
//         state.batteryLevel = Math.max(5, state.batteryLevel - 5);
//     } else {
//         temperature = generateTemperature(region);
//         humidity = parseFloat((70 - (temperature * 0.8) + randomBetween(-10, 10)).toFixed(2));
//         humidity = Math.max(30, Math.min(90, humidity));

//         const hour = new Date().getHours();
//         airQuality = randomInt(40, 120) + (hour === 8 || hour === 18 ? 30 : 0);
//         signalStrength = randomInt(-85, -50);

//         // Battery drain
//         state.batteryLevel = Math.max(5, state.batteryLevel - REGION_PROFILES[region].batteryDrain * 0.1);
//     }

//     const timestamp = new Date();

//     // Insert reading
//     const insertQuery = `
//     INSERT INTO sensor_data (
//       device_id, region, timestamp, temperature, humidity,
//       air_quality, battery_level, signal_strength, synced
//     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
//   `;

//     await executeQuery(nodeName, insertQuery, [
//         deviceId, region, timestamp, temperature, humidity,
//         airQuality, state.batteryLevel, signalStrength
//     ]);

//     // Check for alerts
//     const alerts = [];

//     if (temperature > 40 || temperature < 0) {
//         alerts.push({
//             type: temperature > 40 ? 'high_temperature' : 'low_temperature',
//             severity: 'critical',
//             message: temperature > 40 ? 'Temperature critically high!' : 'Temperature below freezing!',
//             threshold: temperature > 40 ? 40 : 0,
//             actual: temperature,
//         });
//     }

//     if (state.batteryLevel < 20) {
//         alerts.push({
//             type: 'low_battery',
//             severity: state.batteryLevel < 10 ? 'critical' : 'warning',
//             message: state.batteryLevel < 10 ? 'Battery critically low!' : 'Battery level low',
//             threshold: 20,
//             actual: state.batteryLevel,
//         });
//     }

//     if (airQuality > 150) {
//         alerts.push({
//             type: 'poor_air_quality',
//             severity: 'warning',
//             message: 'Air quality unhealthy',
//             threshold: 150,
//             actual: airQuality,
//         });
//     }

//     // Insert alerts
//     for (const alert of alerts) {
//         try {
//             await executeQuery(nodeName, `
//         INSERT INTO alerts (
//           device_id, region, alert_type, severity, message,
//           threshold_value, actual_value, triggered_at, resolved
//         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
//       `, [deviceId, region, alert.type, alert.severity, alert.message,
//                 alert.threshold, alert.actual, timestamp]);

//             state.consecutiveAlerts++;
//         } catch (error) {
//             // Ignore duplicates
//         }
//     }

//     // Auto-resolve some alerts (simulate maintenance)
//     if (state.consecutiveAlerts > 3 && Math.random() < 0.3) {
//         await executeQuery(nodeName, `
//       UPDATE alerts 
//       SET resolved = TRUE, resolved_at = NOW()
//       WHERE device_id = $1 AND resolved = FALSE
//     `, [deviceId]);

//         state.consecutiveAlerts = 0;
//         state.failureMode = false;
//         state.batteryLevel = 100; // Battery replaced
//         console.log(`   🔧 ${deviceId} maintenance completed - issues resolved`);
//     }

//     state.lastReading = timestamp;

//     return { deviceId, alerts: alerts.length, temperature, battery: state.batteryLevel };
// }

// /**
//  * Generate readings for all devices in a region
//  */
// async function generateRegionReadings(nodeName, region) {
//     const readings = [];

//     for (let i = 1; i <= CONFIG.devicesPerRegion; i++) {
//         try {
//             const reading = await generateReading(nodeName, region, i);
//             readings.push(reading);
//         } catch (error) {
//             console.error(`   ❌ Error for device ${i}:`, error.message);
//         }
//     }

//     return readings;
// }

// /**
//  * Display statistics
//  */
// async function displayStats() {
//     console.log('\n' + '='.repeat(70));
//     console.log('📊 SYSTEM STATISTICS');
//     console.log('='.repeat(70));

//     const regions = ['north', 'south', 'east', 'west'];

//     for (const region of regions) {
//         try {
//             // Get total readings
//             const readingCount = await executeQuery(region, `
//         SELECT COUNT(*) as count FROM sensor_data WHERE region = $1
//       `, [region]);

//             // Get active alerts
//             const alertCount = await executeQuery(region, `
//         SELECT 
//           severity,
//           COUNT(*) as count
//         FROM alerts 
//         WHERE region = $1 AND resolved = FALSE
//         GROUP BY severity
//       `, [region]);

//             // Get average temperature
//             const avgTemp = await executeQuery(region, `
//         SELECT ROUND(AVG(temperature)::numeric, 2) as avg_temp
//         FROM sensor_data
//         WHERE region = $1
//         AND timestamp > NOW() - INTERVAL '1 hour'
//       `, [region]);

//             // Get low battery devices
//             const lowBattery = await executeQuery(region, `
//         SELECT COUNT(DISTINCT device_id) as count
//         FROM sensor_data
//         WHERE region = $1
//         AND battery_level < 20
//         AND timestamp > NOW() - INTERVAL '5 minutes'
//       `, [region]);

//             console.log(`\n🌍 ${region.toUpperCase()} Node:`);
//             console.log(`   Total Readings: ${readingCount.rows[0].count}`);
//             console.log(`   Avg Temperature: ${avgTemp.rows[0].avg_temp || 0}°C`);
//             console.log(`   Low Battery Devices: ${lowBattery.rows[0].count}`);
//             console.log(`   Active Alerts:`);

//             if (alertCount.rows.length > 0) {
//                 alertCount.rows.forEach(row => {
//                     const icon = row.severity === 'critical' ? '🔴' :
//                         row.severity === 'warning' ? '🟡' : '🔵';
//                     console.log(`      ${icon} ${row.severity}: ${row.count}`);
//                 });
//             } else {
//                 console.log(`      ✅ No active alerts`);
//             }

//         } catch (error) {
//             console.error(`   ❌ Error getting stats for ${region}:`, error.message);
//         }
//     }

//     console.log('\n' + '='.repeat(70));
// }

// /**
//  * Simulation cycle
//  */
// async function runSimulationCycle() {
//     const cycleStart = Date.now();
//     console.log(`\n⏰ ${new Date().toLocaleString()} - Starting simulation cycle...`);

//     const regions = [
//         { node: 'north', region: 'north' },
//         { node: 'south', region: 'south' },
//         { node: 'east', region: 'east' },
//         { node: 'west', region: 'west' },
//     ];

//     let totalAlerts = 0;

//     for (const { node, region } of regions) {
//         console.log(`\n   📡 ${region.toUpperCase()}: Collecting readings from 25 devices...`);
//         const readings = await generateRegionReadings(node, region);

//         const alertCount = readings.reduce((sum, r) => sum + r.alerts, 0);
//         const avgTemp = (readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length).toFixed(1);
//         const lowBatteryCount = readings.filter(r => r.battery < 20).length;

//         console.log(`      ✅ 25 readings generated | Avg Temp: ${avgTemp}°C | Alerts: ${alertCount} | Low Battery: ${lowBatteryCount}`);

//         totalAlerts += alertCount;
//     }

//     const cycleDuration = ((Date.now() - cycleStart) / 1000).toFixed(2);
//     console.log(`\n   ⚡ Cycle completed in ${cycleDuration}s | Total new alerts: ${totalAlerts}`);

//     // Display stats every cycle
//     await displayStats();
// }

// /**
//  * Main function
//  */
// async function main() {
//     console.clear();
//     console.log('╔═══════════════════════════════════════════════════════════════════╗');
//     console.log('║         🚀 REAL-TIME IoT DATA SIMULATOR                          ║');
//     console.log('╚═══════════════════════════════════════════════════════════════════╝');

//     console.log('\n📋 Configuration:');
//     console.log(`   - Update Interval: ${CONFIG.updateInterval / 1000}s`);
//     console.log(`   - Devices per Region: ${CONFIG.devicesPerRegion}`);
//     console.log(`   - Total Devices: ${CONFIG.devicesPerRegion * 4}`);
//     console.log(`   - Alert Probability: ${CONFIG.alertProbability * 100}%`);
//     console.log(`   - Failure Probability: ${CONFIG.failureProbability * 100}%`);

//     console.log('\n🎯 What this does:');
//     console.log('   - Generates new sensor readings every 60 seconds');
//     console.log('   - Creates realistic alerts for abnormal conditions');
//     console.log('   - Simulates device failures and maintenance');
//     console.log('   - Provides live statistics');

//     console.log('\n⚠️  Keep this running while demonstrating your dashboard!');
//     console.log('   Press Ctrl+C to stop\n');

//     // Display initial stats
//     await displayStats();

//     // Run simulation cycles
//     let cycleCount = 0;

//     while (true) {
//         cycleCount++;
//         console.log(`\n${'═'.repeat(70)}`);
//         console.log(`🔄 CYCLE #${cycleCount}`);
//         console.log('═'.repeat(70));

//         try {
//             await runSimulationCycle();
//         } catch (error) {
//             console.error('\n❌ Error in simulation cycle:', error.message);
//             console.error('Continuing to next cycle...');
//         }

//         // Wait for next cycle
//         console.log(`\n⏳ Waiting ${CONFIG.updateInterval / 1000}s for next cycle...`);
//         await new Promise(resolve => setTimeout(resolve, CONFIG.updateInterval));
//     }
// }

// // Handle graceful shutdown
// process.on('SIGINT', async () => {
//     console.log('\n\n🛑 Stopping simulator...');
//     console.log('✅ Simulator stopped');
//     process.exit(0);
// });

// // Run simulator
// main().catch(error => {
//     console.error('\n❌ Fatal error:', error);
//     process.exit(1);
// });




// database/seed-data/realtime-simulator.js

/**
 * Real-Time IoT Data Simulator
 * 
 * This script continuously generates new sensor readings every minute,
 * simulating live IoT devices sending data to the database.
 * 
 * Features:
 * - Generates readings every 60 seconds
 * - Creates realistic alerts
 * - Simulates device failures
 * - Shows live statistics
 * 
 * Usage: node database/seed-data/realtime-simulator.js
 * Keep this running while demonstrating your dashboard!
 */

import { executeQuery } from '../../src/lib/db/pool.js';

// Configuration
const CONFIG = {
    updateInterval: 60000, // 60 seconds
    devicesPerRegion: 25,
    alertProbability: 0.20, // 20% chance of alert
    failureProbability: 0.05, // 5% chance of device failure
};

// Regional profiles (same as realistic generator)
const REGION_PROFILES = {
    north: { baseTempRange: [10, 20], tempVariation: 5, batteryDrain: 0.8 },
    south: { baseTempRange: [25, 35], tempVariation: 8, batteryDrain: 1.5 },
    east: { baseTempRange: [18, 28], tempVariation: 6, batteryDrain: 1.0 },
    west: { baseTempRange: [20, 30], tempVariation: 7, batteryDrain: 1.2 },
};

// Track device states
const deviceStates = new Map();

// Helper functions
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(randomBetween(min, max));
}

/**
 * Initialize device state
 */
function initializeDeviceState(deviceId, region) {
    if (!deviceStates.has(deviceId)) {
        deviceStates.set(deviceId, {
            batteryLevel: randomInt(60, 100),
            lastReading: null,
            failureMode: false,
            consecutiveAlerts: 0,
        });
    }
    return deviceStates.get(deviceId);
}

/**
 * Generate realistic temperature
 */
function generateTemperature(region) {
    const profile = REGION_PROFILES[region];
    const [minTemp, maxTemp] = profile.baseTempRange;

    const hour = new Date().getHours();
    let temp = randomBetween(minTemp, maxTemp);

    // Time of day effect
    const timeEffect = Math.sin((hour - 4) * Math.PI / 12) * profile.tempVariation;
    temp += timeEffect;

    // Random variation
    temp += randomBetween(-2, 2);

    return parseFloat(temp.toFixed(2));
}

/**
 * Generate one reading for a device
 */
async function generateReading(nodeName, region, deviceIndex) {
    const deviceId = `DEVICE_${region.toUpperCase()}_${String(deviceIndex).padStart(3, '0')}`;
    const state = initializeDeviceState(deviceId, region);

    // Check if device failed
    if (Math.random() < CONFIG.failureProbability) {
        state.failureMode = true;
        console.log(`   ⚠️  ${deviceId} entered failure mode`);
    }

    // Failure mode: extreme values
    let temperature, humidity, airQuality, signalStrength;

    if (state.failureMode) {
        temperature = Math.random() < 0.5 ? randomBetween(-5, 5) : randomBetween(42, 48);
        humidity = randomInt(10, 95); // ✅ FIX: Changed to randomInt
        airQuality = randomInt(180, 250);
        signalStrength = randomInt(-100, -90);
        state.batteryLevel = Math.max(5, state.batteryLevel - 5);
    } else {
        temperature = generateTemperature(region);
        // ✅ FIX: Convert humidity to integer
        let humidityCalc = 70 - (temperature * 0.8) + randomBetween(-10, 10);
        humidityCalc = Math.max(30, Math.min(90, humidityCalc));
        humidity = Math.round(humidityCalc); // Convert to integer

        const hour = new Date().getHours();
        airQuality = randomInt(40, 120) + (hour === 8 || hour === 18 ? 30 : 0);
        signalStrength = randomInt(-85, -50);

        // Battery drain
        state.batteryLevel = Math.max(5, Math.round(state.batteryLevel - REGION_PROFILES[region].batteryDrain * 0.1));
    }

    const timestamp = new Date();

    // Insert reading
    const insertQuery = `
    INSERT INTO sensor_data (
      device_id, region, timestamp, temperature, humidity,
      air_quality, battery_level, signal_strength, synced
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
  `;

    await executeQuery(nodeName, insertQuery, [
        deviceId, region, timestamp, temperature, humidity,
        airQuality, state.batteryLevel, signalStrength
    ]);

    // Check for alerts
    const alerts = [];

    if (temperature > 40 || temperature < 0) {
        alerts.push({
            type: temperature > 40 ? 'high_temperature' : 'low_temperature',
            severity: 'critical',
            message: temperature > 40 ? 'Temperature critically high!' : 'Temperature below freezing!',
            threshold: temperature > 40 ? 40 : 0,
            actual: temperature,
        });
    }

    if (state.batteryLevel < 20) {
        alerts.push({
            type: 'low_battery',
            severity: state.batteryLevel < 10 ? 'critical' : 'warning',
            message: state.batteryLevel < 10 ? 'Battery critically low!' : 'Battery level low',
            threshold: 20,
            actual: state.batteryLevel,
        });
    }

    if (airQuality > 150) {
        alerts.push({
            type: 'poor_air_quality',
            severity: 'warning',
            message: 'Air quality unhealthy',
            threshold: 150,
            actual: airQuality,
        });
    }

    // Insert alerts
    for (const alert of alerts) {
        try {
            await executeQuery(nodeName, `
        INSERT INTO alerts (
          device_id, region, alert_type, severity, message,
          threshold_value, actual_value, triggered_at, resolved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
      `, [deviceId, region, alert.type, alert.severity, alert.message,
                alert.threshold, alert.actual, timestamp]);

            state.consecutiveAlerts++;
        } catch (error) {
            // Ignore duplicates
        }
    }

    // Auto-resolve some alerts (simulate maintenance)
    if (state.consecutiveAlerts > 3 && Math.random() < 0.3) {
        await executeQuery(nodeName, `
      UPDATE alerts 
      SET resolved = TRUE, resolved_at = NOW()
      WHERE device_id = $1 AND resolved = FALSE
    `, [deviceId]);

        state.consecutiveAlerts = 0;
        state.failureMode = false;
        state.batteryLevel = 100; // Battery replaced
        console.log(`   🔧 ${deviceId} maintenance completed - issues resolved`);
    }

    state.lastReading = timestamp;

    return { deviceId, alerts: alerts.length, temperature, battery: state.batteryLevel };
}

/**
 * Generate readings for all devices in a region
 */
async function generateRegionReadings(nodeName, region) {
    const readings = [];

    for (let i = 1; i <= CONFIG.devicesPerRegion; i++) {
        try {
            const reading = await generateReading(nodeName, region, i);
            readings.push(reading);
        } catch (error) {
            console.error(`   ❌ Error for device ${i}:`, error.message);
        }
    }

    return readings;
}

/**
 * Display statistics
 */
async function displayStats() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 SYSTEM STATISTICS');
    console.log('='.repeat(70));

    const regions = ['north', 'south', 'east', 'west'];

    for (const region of regions) {
        try {
            // Get total readings
            const readingCount = await executeQuery(region, `
        SELECT COUNT(*) as count FROM sensor_data WHERE region = $1
      `, [region]);

            // Get active alerts
            const alertCount = await executeQuery(region, `
        SELECT 
          severity,
          COUNT(*) as count
        FROM alerts 
        WHERE region = $1 AND resolved = FALSE
        GROUP BY severity
      `, [region]);

            // Get average temperature
            const avgTemp = await executeQuery(region, `
        SELECT ROUND(AVG(temperature)::numeric, 2) as avg_temp
        FROM sensor_data
        WHERE region = $1
        AND timestamp > NOW() - INTERVAL '1 hour'
      `, [region]);

            // Get low battery devices
            const lowBattery = await executeQuery(region, `
        SELECT COUNT(DISTINCT device_id) as count
        FROM sensor_data
        WHERE region = $1
        AND battery_level < 20
        AND timestamp > NOW() - INTERVAL '5 minutes'
      `, [region]);

            console.log(`\n🌍 ${region.toUpperCase()} Node:`);
            console.log(`   Total Readings: ${readingCount.rows[0].count}`);
            console.log(`   Avg Temperature: ${avgTemp.rows[0].avg_temp || 0}°C`);
            console.log(`   Low Battery Devices: ${lowBattery.rows[0].count}`);
            console.log(`   Active Alerts:`);

            if (alertCount.rows.length > 0) {
                alertCount.rows.forEach(row => {
                    const icon = row.severity === 'critical' ? '🔴' :
                        row.severity === 'warning' ? '🟡' : '🔵';
                    console.log(`      ${icon} ${row.severity}: ${row.count}`);
                });
            } else {
                console.log(`      ✅ No active alerts`);
            }

        } catch (error) {
            console.error(`   ❌ Error getting stats for ${region}:`, error.message);
        }
    }

    console.log('\n' + '='.repeat(70));
}

/**
 * Simulation cycle
 */
async function runSimulationCycle() {
    const cycleStart = Date.now();
    console.log(`\n⏰ ${new Date().toLocaleString()} - Starting simulation cycle...`);

    const regions = [
        { node: 'north', region: 'north' },
        { node: 'south', region: 'south' },
        { node: 'east', region: 'east' },
        { node: 'west', region: 'west' },
    ];

    let totalAlerts = 0;

    for (const { node, region } of regions) {
        console.log(`\n   📡 ${region.toUpperCase()}: Collecting readings from 25 devices...`);
        const readings = await generateRegionReadings(node, region);

        const alertCount = readings.reduce((sum, r) => sum + r.alerts, 0);
        const avgTemp = (readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length).toFixed(1);
        const lowBatteryCount = readings.filter(r => r.battery < 20).length;

        console.log(`      ✅ 25 readings generated | Avg Temp: ${avgTemp}°C | Alerts: ${alertCount} | Low Battery: ${lowBatteryCount}`);

        totalAlerts += alertCount;
    }

    const cycleDuration = ((Date.now() - cycleStart) / 1000).toFixed(2);
    console.log(`\n   ⚡ Cycle completed in ${cycleDuration}s | Total new alerts: ${totalAlerts}`);

    // Display stats every cycle
    await displayStats();
}

/**
 * Main function
 */
async function main() {
    console.clear();
    console.log('╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║         🚀 REAL-TIME IoT DATA SIMULATOR                          ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝');

    console.log('\n📋 Configuration:');
    console.log(`   - Update Interval: ${CONFIG.updateInterval / 1000}s`);
    console.log(`   - Devices per Region: ${CONFIG.devicesPerRegion}`);
    console.log(`   - Total Devices: ${CONFIG.devicesPerRegion * 4}`);
    console.log(`   - Alert Probability: ${CONFIG.alertProbability * 100}%`);
    console.log(`   - Failure Probability: ${CONFIG.failureProbability * 100}%`);

    console.log('\n🎯 What this does:');
    console.log('   - Generates new sensor readings every 60 seconds');
    console.log('   - Creates realistic alerts for abnormal conditions');
    console.log('   - Simulates device failures and maintenance');
    console.log('   - Provides live statistics');

    console.log('\n⚠️  Keep this running while demonstrating your dashboard!');
    console.log('   Press Ctrl+C to stop\n');

    // Display initial stats
    await displayStats();

    // Run simulation cycles
    let cycleCount = 0;

    while (true) {
        cycleCount++;
        console.log(`\n${'═'.repeat(70)}`);
        console.log(`🔄 CYCLE #${cycleCount}`);
        console.log('═'.repeat(70));

        try {
            await runSimulationCycle();
        } catch (error) {
            console.error('\n❌ Error in simulation cycle:', error.message);
            console.error('Continuing to next cycle...');
        }

        // Wait for next cycle
        console.log(`\n⏳ Waiting ${CONFIG.updateInterval / 1000}s for next cycle...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.updateInterval));
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Stopping simulator...');
    console.log('✅ Simulator stopped gracefully');
    process.exit(0);
});

// Run simulator
main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});