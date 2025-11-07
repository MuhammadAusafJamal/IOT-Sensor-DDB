// test-connection.js

/**
 * Database Connection Test Script
 * 
 * This script tests connectivity to all 4 distributed PostgreSQL nodes.
 * It verifies that:
 * 1. All connection pools can be initialized
 * 2. Each node is reachable and responsive
 * 3. Database credentials are correct
 */

import {
    initializeAllPools,
    checkAllNodesHealth,
    closeAllPools
} from './src/lib/db/pool.js';

async function testConnection() {
    console.log('🔄 Testing database connections...\n');

    try {
        // Initialize all connection pools
        initializeAllPools();

        // Wait a bit for connections to establish
        console.log('⏳ Waiting for connections to establish...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check health of all nodes
        const health = await checkAllNodesHealth();

        console.log('=== Database Health Check Results ===\n');

        let healthyCount = 0;
        let unhealthyCount = 0;

        health.forEach(node => {
            const icon = node.status === 'healthy' ? '✅' : '❌';
            console.log(`${icon} Node: ${node.node.toUpperCase()}`);
            console.log(`   Status: ${node.status}`);

            if (node.status === 'healthy') {
                healthyCount++;
                console.log(`   Timestamp: ${node.timestamp}`);
                console.log(`   Version: ${node.version.split(',')[0]}`); // Show first part of version
            } else {
                unhealthyCount++;
                console.log(`   Error: ${node.error}`);
            }
            console.log('');
        });

        console.log('=================================');
        console.log(`Total Nodes: 4`);
        console.log(`Healthy: ${healthyCount}`);
        console.log(`Unhealthy: ${unhealthyCount}`);
        console.log('=================================\n');

        if (healthyCount === 4) {
            console.log('🎉 SUCCESS! All nodes are connected and healthy!');
        } else if (healthyCount > 0) {
            console.log('⚠️  WARNING! Some nodes are unhealthy. Check the errors above.');
        } else {
            console.log('❌ FAILURE! No nodes are connected. Check your configuration.');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('\nCommon issues:');
        console.error('1. PostgreSQL services not running');
        console.error('2. Wrong password in config/database.js');
        console.error('3. Databases not created');
        console.error('4. Port conflicts');
    } finally {
        // Close all connections
        await closeAllPools();
        console.log('\n✅ Test complete! All connections closed.');
        process.exit(0);
    }
}

// Run the test
testConnection().catch(err => {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
});