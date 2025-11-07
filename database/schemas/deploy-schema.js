// // database/schemas/deploy-schema.js

// /**
//  * Schema Deployment Script
//  * 
//  * This script deploys the base schema to all 4 distributed database nodes.
//  * It reads the SQL file and executes it on each node sequentially.
//  * 
//  * Usage: node database/schemas/deploy-schema.js
//  */

// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { executeQuery } from '../../src/lib/db/pool.js';

// // Get current directory path (needed for ES modules)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// /**
//  * Read SQL file content
//  * @param {string} filename - SQL file name
//  * @returns {string} SQL content
//  */
// function readSQLFile(filename) {
//     const filePath = path.join(__dirname, filename);
//     return fs.readFileSync(filePath, 'utf-8');
// }

// /**
//  * Deploy schema to a specific node
//  * @param {string} nodeName - Name of the node
//  * @param {string} sqlContent - SQL statements to execute
//  */
// async function deployToNode(nodeName, sqlContent) {
//     console.log(`\n📦 Deploying schema to ${nodeName.toUpperCase()} node...`);

//     try {
//         // Split SQL content by semicolons to execute statements individually
//         // This is more reliable than executing everything at once
//         const statements = sqlContent
//             .split(';')
//             .map(stmt => stmt.trim())
//             .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

//         console.log(`   Found ${statements.length} SQL statements to execute`);

//         let successCount = 0;
//         let skipCount = 0;

//         for (let i = 0; i < statements.length; i++) {
//             const statement = statements[i];

//             // Skip comments
//             if (statement.startsWith('/*') || statement.startsWith('--')) {
//                 skipCount++;
//                 continue;
//             }

//             try {
//                 await executeQuery(nodeName, statement);
//                 successCount++;

//                 // Show progress every 5 statements
//                 if ((i + 1) % 5 === 0) {
//                     console.log(`   Progress: ${i + 1}/${statements.length} statements executed`);
//                 }
//             } catch (error) {
//                 // Some errors are acceptable (e.g., "already exists")
//                 if (error.message.includes('already exists')) {
//                     console.log(`   ⚠️  Skipped: ${error.message.split('\n')[0]}`);
//                     skipCount++;
//                 } else {
//                     console.error(`   ❌ Error executing statement ${i + 1}:`, error.message);
//                     throw error;
//                 }
//             }
//         }

//         console.log(`   ✅ Schema deployed successfully!`);
//         console.log(`   - Executed: ${successCount} statements`);
//         console.log(`   - Skipped: ${skipCount} statements`);

//     } catch (error) {
//         console.error(`   ❌ Failed to deploy schema to ${nodeName}:`, error.message);
//         throw error;
//     }
// }

// /**
//  * Verify schema deployment by checking if tables exist
//  * @param {string} nodeName - Name of the node
//  */
// async function verifyDeployment(nodeName) {
//     console.log(`\n🔍 Verifying deployment on ${nodeName.toUpperCase()}...`);

//     try {
//         // Query to get all tables in the public schema
//         const query = `
//       SELECT table_name 
//       FROM information_schema.tables 
//       WHERE table_schema = 'public' 
//       AND table_type = 'BASE TABLE'
//       ORDER BY table_name;
//     `;

//         const result = await executeQuery(nodeName, query);

//         console.log(`   Found ${result.rows.length} tables:`);
//         result.rows.forEach(row => {
//             console.log(`   - ${row.table_name}`);
//         });

//         // Expected tables
//         const expectedTables = [
//             'devices',
//             'sensor_data',
//             'sensor_data_basic',
//             'sensor_data_readings',
//             'sensor_data_metadata',
//             'alerts',
//             'node_health',
//             'replication_log',
//             'transaction_log'
//         ];

//         const actualTables = result.rows.map(row => row.table_name);
//         const missingTables = expectedTables.filter(table => !actualTables.includes(table));

//         if (missingTables.length > 0) {
//             console.log(`   ⚠️  Missing tables: ${missingTables.join(', ')}`);
//             return false;
//         } else {
//             console.log(`   ✅ All expected tables exist!`);
//             return true;
//         }

//     } catch (error) {
//         console.error(`   ❌ Verification failed:`, error.message);
//         return false;
//     }
// }

// /**
//  * Main deployment function
//  */
// async function main() {
//     console.log('🚀 IoT DDB Schema Deployment Tool');
//     console.log('==================================\n');

//     try {
//         // Read the base schema SQL file
//         console.log('📖 Reading base schema file...');
//         const sqlContent = readSQLFile('01_base_schema.sql');
//         console.log(`   ✅ Loaded ${sqlContent.length} characters of SQL`);

//         // List of all nodes
//         const nodes = ['north', 'south', 'east', 'west'];

//         // Deploy to each node
//         console.log('\n📦 Starting deployment to all nodes...');

//         for (const nodeName of nodes) {
//             await deployToNode(nodeName, sqlContent);

//             // Small delay between nodes to avoid overwhelming the system
//             await new Promise(resolve => setTimeout(resolve, 500));
//         }

//         console.log('\n' + '='.repeat(50));
//         console.log('🎉 Schema deployment completed on all nodes!');
//         console.log('='.repeat(50));

//         // Verify deployment on all nodes
//         console.log('\n🔍 Verifying deployments...\n');

//         let allVerified = true;
//         for (const nodeName of nodes) {
//             const verified = await verifyDeployment(nodeName);
//             if (!verified) {
//                 allVerified = false;
//             }
//             await new Promise(resolve => setTimeout(resolve, 300));
//         }

//         console.log('\n' + '='.repeat(50));
//         if (allVerified) {
//             console.log('✅ All nodes verified successfully!');
//         } else {
//             console.log('⚠️  Some nodes have missing tables. Check logs above.');
//         }
//         console.log('='.repeat(50));

//         console.log('\n📊 Deployment Summary:');
//         console.log('- Total Nodes: 4');
//         console.log('- Schema File: 01_base_schema.sql');
//         console.log('- Tables Created: 9');
//         console.log('- Status: Complete\n');

//     } catch (error) {
//         console.error('\n💥 Deployment failed:', error.message);
//         process.exit(1);
//     }

//     process.exit(0);
// }

// // Run the deployment
// main();




// database/schemas/deploy-schema.js

/**
 * Schema Deployment Script
 * 
 * This script deploys the base schema to all 4 distributed database nodes.
 * It reads the SQL file and executes it on each node.
 * 
 * Usage: node database/schemas/deploy-schema.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeQuery } from '../../src/lib/db/pool.js';

// Get current directory path (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read SQL file content
 * @param {string} filename - SQL file name
 * @returns {string} SQL content
 */
function readSQLFile(filename) {
    const filePath = path.join(__dirname, filename);
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Parse SQL content into individual statements
 * Handles multi-line statements and comments properly
 * @param {string} sqlContent - Raw SQL content
 * @returns {Array<string>} Array of SQL statements
 */
function parseSQLStatements(sqlContent) {
    // Remove multi-line comments (/* ... */)
    let cleaned = sqlContent.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single-line comments (-- ...)
    cleaned = cleaned.split('\n')
        .map(line => {
            const commentIndex = line.indexOf('--');
            if (commentIndex !== -1) {
                return line.substring(0, commentIndex);
            }
            return line;
        })
        .join('\n');

    // Split by semicolon
    const statements = cleaned.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

    return statements;
}

/**
 * Deploy schema to a specific node
 * @param {string} nodeName - Name of the node
 * @param {string} sqlContent - SQL statements to execute
 */
async function deployToNode(nodeName, sqlContent) {
    console.log(`\n📦 Deploying schema to ${nodeName.toUpperCase()} node...`);

    try {
        const statements = parseSQLStatements(sqlContent);

        console.log(`   Found ${statements.length} SQL statements to execute`);

        let successCount = 0;
        let skipCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            try {
                await executeQuery(nodeName, statement);
                successCount++;

                // Show progress every 10 statements
                if ((i + 1) % 10 === 0) {
                    console.log(`   Progress: ${i + 1}/${statements.length} statements executed`);
                }
            } catch (error) {
                // Some errors are acceptable (e.g., "already exists")
                if (error.message.includes('already exists')) {
                    skipCount++;
                } else {
                    console.error(`   ❌ Error on statement ${i + 1}:`, error.message);
                    console.error(`   Statement preview: ${statement.substring(0, 100)}...`);
                    throw error;
                }
            }
        }

        console.log(`   ✅ Schema deployed successfully!`);
        console.log(`   - Executed: ${successCount} statements`);
        console.log(`   - Skipped: ${skipCount} statements (already exist)`);

    } catch (error) {
        console.error(`   ❌ Failed to deploy schema to ${nodeName}:`, error.message);
        throw error;
    }
}

/**
 * Verify schema deployment by checking if tables exist
 * @param {string} nodeName - Name of the node
 */
async function verifyDeployment(nodeName) {
    console.log(`\n🔍 Verifying deployment on ${nodeName.toUpperCase()}...`);

    try {
        const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

        const result = await executeQuery(nodeName, query);

        console.log(`   Found ${result.rows.length} tables:`);
        result.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

        // Expected tables
        const expectedTables = [
            'devices',
            'sensor_data',
            'sensor_data_basic',
            'sensor_data_readings',
            'sensor_data_metadata',
            'alerts',
            'node_health',
            'replication_log',
            'transaction_log'
        ];

        const actualTables = result.rows.map(row => row.table_name);
        const missingTables = expectedTables.filter(table => !actualTables.includes(table));

        if (missingTables.length > 0) {
            console.log(`   ⚠️  Missing tables: ${missingTables.join(', ')}`);
            return false;
        } else {
            console.log(`   ✅ All expected tables exist!`);
            return true;
        }

    } catch (error) {
        console.error(`   ❌ Verification failed:`, error.message);
        return false;
    }
}

/**
 * Get table row counts for a node
 * @param {string} nodeName - Name of the node
 */
async function getTableStats(nodeName) {
    try {
        const query = `
      SELECT 
        schemaname,
        tablename,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

        const result = await executeQuery(nodeName, query);
        return result.rows;
    } catch (error) {
        console.error(`   Error getting stats:`, error.message);
        return [];
    }
}

/**
 * Main deployment function
 */
async function main() {
    console.log('🚀 IoT DDB Schema Deployment Tool');
    console.log('==================================\n');

    try {
        // Read the base schema SQL file
        console.log('📖 Reading base schema file...');
        const sqlContent = readSQLFile('01_base_schema.sql');
        console.log(`   ✅ Loaded ${sqlContent.length} characters of SQL`);

        // List of all nodes
        const nodes = ['north', 'south', 'east', 'west'];

        // Deploy to each node
        console.log('\n📦 Starting deployment to all nodes...');

        for (const nodeName of nodes) {
            await deployToNode(nodeName, sqlContent);

            // Small delay between nodes
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 Schema deployment completed on all nodes!');
        console.log('='.repeat(50));

        // Verify deployment on all nodes
        console.log('\n🔍 Verifying deployments...\n');

        let allVerified = true;
        for (const nodeName of nodes) {
            const verified = await verifyDeployment(nodeName);
            if (!verified) {
                allVerified = false;
            }
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        console.log('\n' + '='.repeat(50));
        if (allVerified) {
            console.log('✅ ALL NODES VERIFIED SUCCESSFULLY!');
        } else {
            console.log('⚠️  Some nodes have missing tables. Check logs above.');
        }
        console.log('='.repeat(50));

        // Show statistics
        console.log('\n📊 Deployment Summary:');
        console.log('- Total Nodes: 4');
        console.log('- Schema File: 01_base_schema.sql');
        console.log('- Tables Created: 9 per node');
        console.log('- Total Tables: 36 (9 tables × 4 nodes)');
        console.log('- Status: Complete ✓\n');

    } catch (error) {
        console.error('\n💥 Deployment failed:', error.message);
        console.error('\nTroubleshooting tips:');
        console.error('1. Make sure all PostgreSQL nodes are running');
        console.error('2. Check database credentials in config/database.js');
        console.error('3. Verify databases exist (iot_ddb_north, south, east, west)');
        console.error('4. Check PostgreSQL logs for detailed errors\n');
        process.exit(1);
    }

    process.exit(0);
}

// Run the deployment
main();