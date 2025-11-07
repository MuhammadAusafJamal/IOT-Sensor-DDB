// // database/seed-data/realistic-data-generator.js

// /**
//  * Realistic IoT Data Generator with Alerts
//  * 
//  * This script generates realistic sensor data with:
//  * - Varying temperatures based on region and time of day
//  * - Battery drain over time
//  * - Random device failures
//  * - Automatic alert generation
//  * - Realistic patterns (higher temps in afternoon, etc.)
//  * 
//  * Usage: node database/seed-data/realistic-data-generator.js
//  */

// import { executeQuery } from '../../src/lib/db/pool.js';

// // Configuration
// const CONFIG = {
//     devicesPerRegion: 25,
//     readingsPerDay: 24, // One reading per hour
//     daysOfData: 7, // Generate last 7 days of data
//     alertProbability: 0.15, // 15% chance of alert condition
// };

// // Regional characteristics
// const REGION_PROFILES = {
//     north: {
//         baseTempRange: [10, 20], // Cooler region
//         tempVariation: 5,
//         batteryDrainRate: 0.8, // Slower drain (cooler = better battery)
//         signalStrength: [-70, -50], // Good signal
//     },
//     south: {
//         baseTempRange: [25, 35], // Warmer region
//         tempVariation: 8,
//         batteryDrainRate: 1.5, // Faster drain (heat affects battery)
//         signalStrength: [-85, -60], // Moderate signal
//     },
//     east: {
//         baseTempRange: [18, 28], // Moderate region
//         tempVariation: 6,
//         batteryDrainRate: 1.0, // Normal drain
//         signalStrength: [-75, -55], // Good signal
//     },
//     west: {
//         baseTempRange: [20, 30], // Moderate-warm region
//         tempVariation: 7,
//         batteryDrainRate: 1.2, // Slightly faster drain
//         signalStrength: [-90, -65], // Weaker signal (remote area)
//     },
// };

// // Helper functions
// function randomBetween(min, max) {
//     return Math.random() * (max - min) + min;
// }

// function randomInt(min, max) {
//     return Math.floor(randomBetween(min, max));
// }

// /**
//  * Generate realistic temperature based on time of day and region
//  */
// function generateTemperature(region, hour, dayOffset) {
//     const profile = REGION_PROFILES[region];
//     const [minTemp, maxTemp] = profile.baseTempRange;

//     // Base temperature for the region
//     let temp = randomBetween(minTemp, maxTemp);

//     // Time of day variation (peak at 14:00, lowest at 4:00)
//     const timeOfDayEffect = Math.sin((hour - 4) * Math.PI / 12) * profile.tempVariation;
//     temp += timeOfDayEffect;

//     // Random daily variation
//     const dailyVariation = Math.sin(dayOffset * Math.PI / 3.5) * 3;
//     temp += dailyVariation;

//     // Add some random noise
//     temp += randomBetween(-2, 2);

//     return parseFloat(temp.toFixed(2));
// }

// /**
//  * Generate realistic humidity (inverse to temperature)
//  */
// function generateHumidity(temperature) {
//     // Higher temperature = lower humidity (generally)
//     const baseHumidity = 70 - (temperature * 0.8);
//     const variation = randomBetween(-10, 10);

//     let humidity = baseHumidity + variation;
//     humidity = Math.max(30, Math.min(90, humidity)); // Clamp between 30-90%

//     return parseFloat(humidity.toFixed(2));
// }

// /**
//  * Generate realistic air quality
//  * Higher AQI in afternoons (traffic) and south/west regions (industrial)
//  */
// function generateAirQuality(region, hour) {
//     let baseAQI;

//     // Regional base AQI
//     switch (region) {
//         case 'north': baseAQI = 45; break; // Clean air
//         case 'south': baseAQI = 85; break; // Industrial area
//         case 'east': baseAQI = 60; break; // Moderate
//         case 'west': baseAQI = 95; break; // Near factories
//         default: baseAQI = 70;
//     }

//     // Time of day effect (traffic peaks at 8am and 6pm)
//     const rushHourEffect = (hour === 8 || hour === 18) ? 30 : 0;
//     const dayEffect = (hour >= 7 && hour <= 19) ? 15 : -10; // Higher during day

//     let aqi = baseAQI + rushHourEffect + dayEffect + randomInt(-15, 15);
//     aqi = Math.max(20, Math.min(200, aqi)); // Clamp between 20-200

//     return aqi;
// }

// /**
//  * Generate battery level (drains over time, some devices fail)
//  */
// function generateBatteryLevel(region, hoursSinceInstall, deviceIndex) {
//     const profile = REGION_PROFILES[region];

//     // Start at 100%, drain based on time
//     let battery = 100 - (hoursSinceInstall * profile.batteryDrainRate * 0.05);

//     // Some devices drain faster (manufacturing defects)
//     if (deviceIndex % 7 === 0) {
//         battery -= 10; // Defective device drains 10% faster
//     }

//     // Add random variation
//     battery += randomBetween(-3, 3);

//     // Clamp between 5-100%
//     battery = Math.max(5, Math.min(100, battery));

//     return Math.round(battery);
// }

// /**
//  * Generate signal strength (varies by region and distance)
//  */
// function generateSignalStrength(region, deviceIndex) {
//     const profile = REGION_PROFILES[region];
//     const [minSignal, maxSignal] = profile.signalStrength;

//     // Devices further from base station have weaker signal
//     const distanceEffect = (deviceIndex / 25) * 15; // Up to 15 dBm weaker

//     let signal = randomBetween(minSignal, maxSignal) - distanceEffect;
//     signal += randomBetween(-5, 5); // Random variation

//     signal = Math.max(-100, Math.min(-30, signal)); // Clamp between -100 to -30 dBm

//     return Math.round(signal);
// }

// /**
//  * Check if reading should trigger an alert
//  */
// function checkForAlerts(reading) {
//     const alerts = [];

//     // Critical temperature (> 40°C or < 0°C)
//     if (reading.temperature > 40) {
//         alerts.push({
//             type: 'high_temperature',
//             severity: 'critical',
//             message: 'Temperature critically high! Equipment at risk.',
//             threshold: 40,
//             actual: reading.temperature,
//         });
//     } else if (reading.temperature < 0) {
//         alerts.push({
//             type: 'low_temperature',
//             severity: 'critical',
//             message: 'Temperature below freezing! Equipment at risk.',
//             threshold: 0,
//             actual: reading.temperature,
//         });
//     } else if (reading.temperature > 35) {
//         alerts.push({
//             type: 'high_temperature',
//             severity: 'warning',
//             message: 'Temperature above normal operating range.',
//             threshold: 35,
//             actual: reading.temperature,
//         });
//     }

//     // Low battery
//     if (reading.battery_level < 10) {
//         alerts.push({
//             type: 'low_battery',
//             severity: 'critical',
//             message: 'Battery critically low! Device may shut down soon.',
//             threshold: 10,
//             actual: reading.battery_level,
//         });
//     } else if (reading.battery_level < 20) {
//         alerts.push({
//             type: 'low_battery',
//             severity: 'warning',
//             message: 'Battery level low. Consider maintenance.',
//             threshold: 20,
//             actual: reading.battery_level,
//         });
//     }

//     // Poor air quality
//     if (reading.air_quality > 150) {
//         alerts.push({
//             type: 'poor_air_quality',
//             severity: 'warning',
//             message: 'Air quality unhealthy. Limit outdoor exposure.',
//             threshold: 150,
//             actual: reading.air_quality,
//         });
//     }

//     // Weak signal
//     if (reading.signal_strength < -90) {
//         alerts.push({
//             type: 'weak_signal',
//             severity: 'info',
//             message: 'Weak signal detected. Check antenna.',
//             threshold: -90,
//             actual: reading.signal_strength,
//         });
//     }

//     return alerts;
// }

// /**
//  * Insert alert into database
//  */
// async function insertAlert(nodeName, deviceId, region, alert, timestamp) {
//     const query = `
//     INSERT INTO alerts (
//       device_id, region, alert_type, severity, message,
//       threshold_value, actual_value, triggered_at
//     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//     ON CONFLICT DO NOTHING
//   `;

//     const values = [
//         deviceId,
//         region,
//         alert.type,
//         alert.severity,
//         alert.message,
//         alert.threshold,
//         alert.actual,
//         timestamp,
//     ];

//     try {
//         await executeQuery(nodeName, query, values);
//     } catch (error) {
//         // Ignore duplicate alerts
//         if (!error.message.includes('duplicate')) {
//             console.error(`Error inserting alert:`, error.message);
//         }
//     }
// }

// /**
//  * Generate realistic data for one device
//  */
// async function generateDeviceData(nodeName, region, deviceIndex) {
//     const deviceId = `DEVICE_${region.toUpperCase()}_${String(deviceIndex).padStart(3, '0')}`;

//     console.log(`   📱 Generating data for ${deviceId}...`);

//     const readings = [];
//     const now = new Date();

//     // Generate readings for past 7 days
//     for (let day = CONFIG.daysOfData - 1; day >= 0; day--) {
//         for (let hour = 0; hour < 24; hour++) {
//             const timestamp = new Date(now);
//             timestamp.setDate(timestamp.getDate() - day);
//             timestamp.setHours(hour, randomInt(0, 59), randomInt(0, 59));

//             // Calculate hours since device installation
//             const hoursSinceInstall = (CONFIG.daysOfData - day) * 24 + hour;

//             // Generate reading
//             const temperature = generateTemperature(region, hour, day);
//             const humidity = generateHumidity(temperature);
//             const airQuality = generateAirQuality(region, hour);
//             const batteryLevel = generateBatteryLevel(region, hoursSinceInstall, deviceIndex);
//             const signalStrength = generateSignalStrength(region, deviceIndex);

//             const reading = {
//                 deviceId,
//                 region,
//                 timestamp,
//                 temperature,
//                 humidity,
//                 airQuality,
//                 batteryLevel,
//                 signalStrength,
//             };

//             readings.push(reading);

//             // Check for alerts (only for recent data to avoid spam)
//             if (day === 0) { // Only today's readings
//                 const alerts = checkForAlerts({
//                     temperature,
//                     battery_level: batteryLevel,
//                     air_quality: airQuality,
//                     signal_strength: signalStrength,
//                 });

//                 // Insert alerts
//                 for (const alert of alerts) {
//                     await insertAlert(nodeName, deviceId, region, alert, timestamp);
//                 }
//             }
//         }
//     }

//     // Batch insert readings
//     const batchSize = 100;
//     for (let i = 0; i < readings.length; i += batchSize) {
//         const batch = readings.slice(i, i + batchSize);

//         const query = `
//       INSERT INTO sensor_data (
//         device_id, region, timestamp, temperature, humidity,
//         air_quality, battery_level, signal_strength
//       ) VALUES ${batch.map((_, idx) =>
//             `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4},
//          $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`
//         ).join(', ')}
//       ON CONFLICT DO NOTHING
//     `;

//         const values = batch.flatMap(r => [
//             r.deviceId, r.region, r.timestamp, r.temperature,
//             r.humidity, r.airQuality, r.batteryLevel, r.signalStrength
//         ]);

//         await executeQuery(nodeName, query, values);
//     }

//     return readings.length;
// }

// /**
//  * Generate realistic data for all devices in a region
//  */
// async function generateRegionData(nodeName, region) {
//     console.log(`\n${'='.repeat(60)}`);
//     console.log(`🌍 Generating realistic data for ${region.toUpperCase()} region`);
//     console.log('='.repeat(60));

//     let totalReadings = 0;

//     for (let i = 1; i <= CONFIG.devicesPerRegion; i++) {
//         const count = await generateDeviceData(nodeName, region, i);
//         totalReadings += count;

//         // Progress indicator
//         if (i % 5 === 0) {
//             console.log(`   Progress: ${i}/${CONFIG.devicesPerRegion} devices`);
//         }
//     }

//     console.log(`\n   ✅ Generated ${totalReadings} readings for ${region.toUpperCase()}`);

//     // Show alert summary
//     const alertQuery = `
//     SELECT severity, COUNT(*) as count
//     FROM alerts
//     WHERE region = $1
//     GROUP BY severity
//   `;
//     const alertResult = await executeQuery(nodeName, alertQuery, [region]);

//     console.log(`   🚨 Alerts generated:`);
//     alertResult.rows.forEach(row => {
//         console.log(`      - ${row.severity}: ${row.count}`);
//     });

//     return totalReadings;
// }

// /**
//  * Clear old data (optional)
//  */
// async function clearOldData(nodeName, region) {
//     console.log(`   🧹 Clearing old data for ${region}...`);

//     await executeQuery(nodeName, 'DELETE FROM alerts WHERE region = $1', [region]);
//     await executeQuery(nodeName, 'DELETE FROM sensor_data WHERE region = $1', [region]);

//     console.log(`   ✅ Old data cleared`);
// }

// /**
//  * Main function
//  */
// async function main() {
//     console.log('🚀 Realistic IoT Data Generator with Alerts');
//     console.log('==========================================\n');

//     console.log('Configuration:');
//     console.log(`- Devices per region: ${CONFIG.devicesPerRegion}`);
//     console.log(`- Readings per day: ${CONFIG.readingsPerDay}`);
//     console.log(`- Days of historical data: ${CONFIG.daysOfData}`);
//     console.log(`- Alert probability: ${CONFIG.alertProbability * 100}%\n`);

//     const regions = [
//         { node: 'north', region: 'north' },
//         { node: 'south', region: 'south' },
//         { node: 'east', region: 'east' },
//         { node: 'west', region: 'west' },
//     ];

//     let grandTotal = 0;

//     for (const { node, region } of regions) {
//         // Optional: Clear old data first
//         // await clearOldData(node, region);

//         const total = await generateRegionData(node, region);
//         grandTotal += total;
//     }

//     console.log('\n' + '='.repeat(60));
//     console.log('🎉 DATA GENERATION COMPLETE!');
//     console.log('='.repeat(60));

//     console.log('\n📊 Summary:');
//     console.log(`✅ Total devices: ${CONFIG.devicesPerRegion * 4}`);
//     console.log(`✅ Total readings: ${grandTotal}`);
//     console.log(`✅ Days of data: ${CONFIG.daysOfData}`);
//     console.log(`✅ Alerts generated: Check dashboard\n`);

//     console.log('🎯 What was generated:');
//     console.log('- Realistic temperature patterns (varies by time of day)');
//     console.log('- Battery drain over time (some devices fail faster)');
//     console.log('- Air quality variations (higher during rush hour)');
//     console.log('- Signal strength variations (weaker for distant devices)');
//     console.log('- Automatic alerts for abnormal readings\n');

//     console.log('🚀 Next steps:');
//     console.log('1. Start your dashboard: npm run dev');
//     console.log('2. View realistic data and alerts');
//     console.log('3. Run replication: node database/replication/replicate-data.js');
//     console.log('4. Take screenshots for your report!\n');
// }

// // Run the generator
// main()
//     .then(() => process.exit(0))
//     .catch(error => {
//         console.error('❌ Error:', error);
//         process.exit(1);
//     });




// database/seed-data/realistic-data-generator.js

/**
 * Realistic IoT Data Generator with Alerts
 * 
 * This script generates realistic sensor data with:
 * - Varying temperatures based on region and time of day
 * - Battery drain over time
 * - Random device failures
 * - Automatic alert generation
 * - Realistic patterns (higher temps in afternoon, etc.)
 * 
 * Usage: node database/seed-data/realistic-data-generator.js
 */

import { executeQuery } from '../../src/lib/db/pool.js';

// Configuration
const CONFIG = {
    devicesPerRegion: 25,
    readingsPerDay: 24, // One reading per hour
    daysOfData: 7, // Generate last 7 days of data
    alertProbability: 0.15, // 15% chance of alert condition
};

// Regional characteristics
const REGION_PROFILES = {
    north: {
        baseTempRange: [10, 20], // Cooler region
        tempVariation: 5,
        batteryDrainRate: 0.8, // Slower drain (cooler = better battery)
        signalStrength: [-70, -50], // Good signal
    },
    south: {
        baseTempRange: [25, 35], // Warmer region
        tempVariation: 8,
        batteryDrainRate: 1.5, // Faster drain (heat affects battery)
        signalStrength: [-85, -60], // Moderate signal
    },
    east: {
        baseTempRange: [18, 28], // Moderate region
        tempVariation: 6,
        batteryDrainRate: 1.0, // Normal drain
        signalStrength: [-75, -55], // Good signal
    },
    west: {
        baseTempRange: [20, 30], // Moderate-warm region
        tempVariation: 7,
        batteryDrainRate: 1.2, // Slightly faster drain
        signalStrength: [-90, -65], // Weaker signal (remote area)
    },
};

// Helper functions
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(randomBetween(min, max));
}

/**
 * Generate realistic temperature based on time of day and region
 */
function generateTemperature(region, hour, dayOffset) {
    const profile = REGION_PROFILES[region];
    const [minTemp, maxTemp] = profile.baseTempRange;

    // Base temperature for the region
    let temp = randomBetween(minTemp, maxTemp);

    // Time of day variation (peak at 14:00, lowest at 4:00)
    const timeOfDayEffect = Math.sin((hour - 4) * Math.PI / 12) * profile.tempVariation;
    temp += timeOfDayEffect;

    // Random daily variation
    const dailyVariation = Math.sin(dayOffset * Math.PI / 3.5) * 3;
    temp += dailyVariation;

    // Add some random noise
    temp += randomBetween(-2, 2);

    return parseFloat(temp.toFixed(2));
}

/**
 * Generate realistic humidity (inverse to temperature)
 */
function generateHumidity(temperature) {
    // Higher temperature = lower humidity (generally)
    const baseHumidity = 70 - (temperature * 0.8);
    const variation = randomBetween(-10, 10);

    let humidity = baseHumidity + variation;
    humidity = Math.max(30, Math.min(90, humidity)); // Clamp between 30-90%

    // ✅ FIX: Return integer instead of decimal
    return Math.round(humidity);
}

/**
 * Generate realistic air quality
 * Higher AQI in afternoons (traffic) and south/west regions (industrial)
 */
function generateAirQuality(region, hour) {
    let baseAQI;

    // Regional base AQI
    switch (region) {
        case 'north': baseAQI = 45; break; // Clean air
        case 'south': baseAQI = 85; break; // Industrial area
        case 'east': baseAQI = 60; break; // Moderate
        case 'west': baseAQI = 95; break; // Near factories
        default: baseAQI = 70;
    }

    // Time of day effect (traffic peaks at 8am and 6pm)
    const rushHourEffect = (hour === 8 || hour === 18) ? 30 : 0;
    const dayEffect = (hour >= 7 && hour <= 19) ? 15 : -10; // Higher during day

    let aqi = baseAQI + rushHourEffect + dayEffect + randomInt(-15, 15);
    aqi = Math.max(20, Math.min(200, aqi)); // Clamp between 20-200

    return aqi;
}

/**
 * Generate battery level (drains over time, some devices fail)
 */
function generateBatteryLevel(region, hoursSinceInstall, deviceIndex) {
    const profile = REGION_PROFILES[region];

    // Start at 100%, drain based on time
    let battery = 100 - (hoursSinceInstall * profile.batteryDrainRate * 0.05);

    // Some devices drain faster (manufacturing defects)
    if (deviceIndex % 7 === 0) {
        battery -= 10; // Defective device drains 10% faster
    }

    // Add random variation
    battery += randomBetween(-3, 3);

    // Clamp between 5-100%
    battery = Math.max(5, Math.min(100, battery));

    return Math.round(battery);
}

/**
 * Generate signal strength (varies by region and distance)
 */
function generateSignalStrength(region, deviceIndex) {
    const profile = REGION_PROFILES[region];
    const [minSignal, maxSignal] = profile.signalStrength;

    // Devices further from base station have weaker signal
    const distanceEffect = (deviceIndex / 25) * 15; // Up to 15 dBm weaker

    let signal = randomBetween(minSignal, maxSignal) - distanceEffect;
    signal += randomBetween(-5, 5); // Random variation

    signal = Math.max(-100, Math.min(-30, signal)); // Clamp between -100 to -30 dBm

    return Math.round(signal);
}

/**
 * Check if reading should trigger an alert
 */
function checkForAlerts(reading) {
    const alerts = [];

    // Critical temperature (> 40°C or < 0°C)
    if (reading.temperature > 40) {
        alerts.push({
            type: 'high_temperature',
            severity: 'critical',
            message: 'Temperature critically high! Equipment at risk.',
            threshold: 40,
            actual: reading.temperature,
        });
    } else if (reading.temperature < 0) {
        alerts.push({
            type: 'low_temperature',
            severity: 'critical',
            message: 'Temperature below freezing! Equipment at risk.',
            threshold: 0,
            actual: reading.temperature,
        });
    } else if (reading.temperature > 35) {
        alerts.push({
            type: 'high_temperature',
            severity: 'warning',
            message: 'Temperature above normal operating range.',
            threshold: 35,
            actual: reading.temperature,
        });
    }

    // Low battery
    if (reading.battery_level < 10) {
        alerts.push({
            type: 'low_battery',
            severity: 'critical',
            message: 'Battery critically low! Device may shut down soon.',
            threshold: 10,
            actual: reading.battery_level,
        });
    } else if (reading.battery_level < 20) {
        alerts.push({
            type: 'low_battery',
            severity: 'warning',
            message: 'Battery level low. Consider maintenance.',
            threshold: 20,
            actual: reading.battery_level,
        });
    }

    // Poor air quality
    if (reading.air_quality > 150) {
        alerts.push({
            type: 'poor_air_quality',
            severity: 'warning',
            message: 'Air quality unhealthy. Limit outdoor exposure.',
            threshold: 150,
            actual: reading.air_quality,
        });
    }

    // Weak signal
    if (reading.signal_strength < -90) {
        alerts.push({
            type: 'weak_signal',
            severity: 'info',
            message: 'Weak signal detected. Check antenna.',
            threshold: -90,
            actual: reading.signal_strength,
        });
    }

    return alerts;
}

/**
 * Insert alert into database
 */
async function insertAlert(nodeName, deviceId, region, alert, timestamp) {
    const query = `
    INSERT INTO alerts (
      device_id, region, alert_type, severity, message,
      threshold_value, actual_value, triggered_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT DO NOTHING
  `;

    const values = [
        deviceId,
        region,
        alert.type,
        alert.severity,
        alert.message,
        alert.threshold,
        alert.actual,
        timestamp,
    ];

    try {
        await executeQuery(nodeName, query, values);
    } catch (error) {
        // Ignore duplicate alerts
        if (!error.message.includes('duplicate')) {
            console.error(`Error inserting alert:`, error.message);
        }
    }
}

/**
 * Generate realistic data for one device
 */
async function generateDeviceData(nodeName, region, deviceIndex) {
    const deviceId = `DEVICE_${region.toUpperCase()}_${String(deviceIndex).padStart(3, '0')}`;

    console.log(`   📱 Generating data for ${deviceId}...`);

    const readings = [];
    const now = new Date();

    // Generate readings for past 7 days
    for (let day = CONFIG.daysOfData - 1; day >= 0; day--) {
        for (let hour = 0; hour < 24; hour++) {
            const timestamp = new Date(now);
            timestamp.setDate(timestamp.getDate() - day);
            timestamp.setHours(hour, randomInt(0, 59), randomInt(0, 59));

            // Calculate hours since device installation
            const hoursSinceInstall = (CONFIG.daysOfData - day) * 24 + hour;

            // Generate reading
            const temperature = generateTemperature(region, hour, day);
            const humidity = generateHumidity(temperature);
            const airQuality = generateAirQuality(region, hour);
            const batteryLevel = generateBatteryLevel(region, hoursSinceInstall, deviceIndex);
            const signalStrength = generateSignalStrength(region, deviceIndex);

            const reading = {
                deviceId,
                region,
                timestamp,
                temperature,
                humidity,
                airQuality,
                batteryLevel,
                signalStrength,
            };

            readings.push(reading);

            // Check for alerts (only for recent data to avoid spam)
            if (day === 0) { // Only today's readings
                const alerts = checkForAlerts({
                    temperature,
                    battery_level: batteryLevel,
                    air_quality: airQuality,
                    signal_strength: signalStrength,
                });

                // Insert alerts
                for (const alert of alerts) {
                    await insertAlert(nodeName, deviceId, region, alert, timestamp);
                }
            }
        }
    }

    // Batch insert readings
    const batchSize = 100;
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
      ON CONFLICT DO NOTHING
    `;

        const values = batch.flatMap(r => [
            r.deviceId, r.region, r.timestamp, r.temperature,
            r.humidity, r.airQuality, r.batteryLevel, r.signalStrength
        ]);

        await executeQuery(nodeName, query, values);
    }

    return readings.length;
}

/**
 * Generate realistic data for all devices in a region
 */
async function generateRegionData(nodeName, region) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌍 Generating realistic data for ${region.toUpperCase()} region`);
    console.log('='.repeat(60));

    let totalReadings = 0;

    for (let i = 1; i <= CONFIG.devicesPerRegion; i++) {
        const count = await generateDeviceData(nodeName, region, i);
        totalReadings += count;

        // Progress indicator
        if (i % 5 === 0) {
            console.log(`   Progress: ${i}/${CONFIG.devicesPerRegion} devices`);
        }
    }

    console.log(`\n   ✅ Generated ${totalReadings} readings for ${region.toUpperCase()}`);

    // Show alert summary
    const alertQuery = `
    SELECT severity, COUNT(*) as count
    FROM alerts
    WHERE region = $1
    GROUP BY severity
  `;
    const alertResult = await executeQuery(nodeName, alertQuery, [region]);

    console.log(`   🚨 Alerts generated:`);
    alertResult.rows.forEach(row => {
        console.log(`      - ${row.severity}: ${row.count}`);
    });

    return totalReadings;
}

/**
 * Clear old data (optional)
 */
async function clearOldData(nodeName, region) {
    console.log(`   🧹 Clearing old data for ${region}...`);

    await executeQuery(nodeName, 'DELETE FROM alerts WHERE region = $1', [region]);
    await executeQuery(nodeName, 'DELETE FROM sensor_data WHERE region = $1', [region]);

    console.log(`   ✅ Old data cleared`);
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Realistic IoT Data Generator with Alerts');
    console.log('==========================================\n');

    console.log('Configuration:');
    console.log(`- Devices per region: ${CONFIG.devicesPerRegion}`);
    console.log(`- Readings per day: ${CONFIG.readingsPerDay}`);
    console.log(`- Days of historical data: ${CONFIG.daysOfData}`);
    console.log(`- Alert probability: ${CONFIG.alertProbability * 100}%\n`);

    const regions = [
        { node: 'north', region: 'north' },
        { node: 'south', region: 'south' },
        { node: 'east', region: 'east' },
        { node: 'west', region: 'west' },
    ];

    let grandTotal = 0;

    for (const { node, region } of regions) {
        // Optional: Clear old data first
        // await clearOldData(node, region);

        const total = await generateRegionData(node, region);
        grandTotal += total;
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATA GENERATION COMPLETE!');
    console.log('='.repeat(60));

    console.log('\n📊 Summary:');
    console.log(`✅ Total devices: ${CONFIG.devicesPerRegion * 4}`);
    console.log(`✅ Total readings: ${grandTotal}`);
    console.log(`✅ Days of data: ${CONFIG.daysOfData}`);
    console.log(`✅ Alerts generated: Check dashboard\n`);

    console.log('🎯 What was generated:');
    console.log('- Realistic temperature patterns (varies by time of day)');
    console.log('- Battery drain over time (some devices fail faster)');
    console.log('- Air quality variations (higher during rush hour)');
    console.log('- Signal strength variations (weaker for distant devices)');
    console.log('- Automatic alerts for abnormal readings\n');

    console.log('🚀 Next steps:');
    console.log('1. Start your dashboard: npm run dev');
    console.log('2. View realistic data and alerts');
    console.log('3. Run replication: node database/replication/replicate-data.js');
    console.log('4. Take screenshots for your report!\n');
}

// Run the generator
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });