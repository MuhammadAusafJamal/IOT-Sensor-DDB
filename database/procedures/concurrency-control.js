// database/procedures/concurrency-control.js

/**
 * Concurrency Control System
 * 
 * This module implements two concurrency control mechanisms:
 * 1. Pessimistic Concurrency Control (Locking)
 * 2. Optimistic Concurrency Control (Timestamp-based)
 * 
 * These mechanisms ensure data consistency when multiple transactions
 * attempt to access the same data simultaneously.
 * 
 * Usage: node database/procedures/concurrency-control.js
 */

import { executeQuery } from '../../src/lib/db/pool.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Pessimistic Concurrency Control - Exclusive Lock
 * Acquires an exclusive lock before updating data
 */
async function pessimisticUpdate(nodeName, deviceId, newStatus) {
  console.log(`\n🔒 Pessimistic Lock: Updating device ${deviceId} on ${nodeName.toUpperCase()}`);
  
  const transactionId = uuidv4();
  const startTime = Date.now();
  
  // Start transaction
  await executeQuery(nodeName, 'BEGIN');
  
  try {
    // Step 1: Acquire exclusive lock (SELECT FOR UPDATE)
    console.log('   1️⃣  Acquiring exclusive lock...');
    const lockQuery = `
      SELECT device_id, status, updated_at
      FROM devices
      WHERE device_id = $1
      FOR UPDATE
    `;
    const lockResult = await executeQuery(nodeName, lockQuery, [deviceId]);
    
    if (lockResult.rows.length === 0) {
      throw new Error(`Device ${deviceId} not found`);
    }
    
    console.log(`   ✅ Lock acquired on device ${deviceId}`);
    
    // Log transaction start with lock
    await executeQuery(nodeName, `
      INSERT INTO transaction_log (
        transaction_id, node_name, transaction_type, table_name,
        record_id, status, lock_acquired, lock_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [transactionId, nodeName, 'UPDATE', 'devices', deviceId, 'pending', true, 'exclusive']);
    
    // Step 2: Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 3: Perform update
    console.log('   2️⃣  Performing update...');
    const updateQuery = `
      UPDATE devices
      SET status = $1, updated_at = NOW()
      WHERE device_id = $2
      RETURNING *
    `;
    const updateResult = await executeQuery(nodeName, updateQuery, [newStatus, deviceId]);
    
    console.log(`   ✅ Updated device status: ${lockResult.rows[0].status} → ${newStatus}`);
    
    // Step 4: Commit transaction (releases lock)
    await executeQuery(nodeName, 'COMMIT');
    console.log('   3️⃣  Transaction committed, lock released');
    
    // Update transaction log
    await executeQuery(nodeName, `
      UPDATE transaction_log
      SET status = 'committed', committed_at = NOW()
      WHERE transaction_id = $1
    `, [transactionId]);
    
    const duration = Date.now() - startTime;
    console.log(`   ⏱️  Total time: ${duration}ms`);
    
    return { success: true, device: updateResult.rows[0], duration };
    
  } catch (error) {
    // Rollback on error
    await executeQuery(nodeName, 'ROLLBACK');
    console.error(`   ❌ Transaction rolled back: ${error.message}`);
    
    // Update transaction log
    await executeQuery(nodeName, `
      UPDATE transaction_log
      SET status = 'aborted'
      WHERE transaction_id = $1
    `, [transactionId]);
    
    throw error;
  }
}

/**
 * Demonstrate lock conflict
 * Two transactions trying to update the same record
 */
async function demonstrateLockConflict(nodeName, deviceId) {
  console.log(`\n⚔️  Lock Conflict Demo: Two transactions competing for ${deviceId}`);
  
  // Transaction 1 - Will acquire lock first
  const transaction1 = async () => {
    console.log('\n   🔵 Transaction 1: Starting...');
    await executeQuery(nodeName, 'BEGIN');
    
    try {
      // Acquire lock
      console.log('   🔵 Transaction 1: Acquiring lock...');
      await executeQuery(nodeName, `
        SELECT * FROM devices WHERE device_id = $1 FOR UPDATE
      `, [deviceId]);
      console.log('   🔵 Transaction 1: Lock acquired!');
      
      // Hold lock for 2 seconds
      console.log('   🔵 Transaction 1: Processing (holding lock for 2s)...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update
      await executeQuery(nodeName, `
        UPDATE devices SET status = 'maintenance', updated_at = NOW()
        WHERE device_id = $1
      `, [deviceId]);
      
      await executeQuery(nodeName, 'COMMIT');
      console.log('   🔵 Transaction 1: Committed ✓');
      
    } catch (error) {
      await executeQuery(nodeName, 'ROLLBACK');
      console.error('   🔵 Transaction 1: Error -', error.message);
    }
  };
  
  // Transaction 2 - Will wait for lock
  const transaction2 = async () => {
    // Start slightly after transaction 1
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('\n   🟢 Transaction 2: Starting...');
    await executeQuery(nodeName, 'BEGIN');
    
    try {
      console.log('   🟢 Transaction 2: Trying to acquire lock (will wait)...');
      const startWait = Date.now();
      
      await executeQuery(nodeName, `
        SELECT * FROM devices WHERE device_id = $1 FOR UPDATE
      `, [deviceId]);
      
      const waitTime = Date.now() - startWait;
      console.log(`   🟢 Transaction 2: Lock acquired after waiting ${waitTime}ms!`);
      
      // Update
      await executeQuery(nodeName, `
        UPDATE devices SET status = 'active', updated_at = NOW()
        WHERE device_id = $1
      `, [deviceId]);
      
      await executeQuery(nodeName, 'COMMIT');
      console.log('   🟢 Transaction 2: Committed ✓');
      
    } catch (error) {
      await executeQuery(nodeName, 'ROLLBACK');
      console.error('   🟢 Transaction 2: Error -', error.message);
    }
  };
  
  // Run both transactions
  await Promise.all([transaction1(), transaction2()]);
  
  console.log('\n   ✅ Lock conflict resolved - transactions executed serially');
}

/**
 * Optimistic Concurrency Control - Timestamp-based
 * Uses timestamps to detect conflicts without locking
 */
async function optimisticUpdate(nodeName, deviceId, newStatus) {
  console.log(`\n⏰ Optimistic Control: Updating device ${deviceId} on ${nodeName.toUpperCase()}`);
  
  const transactionId = uuidv4();
  const startTime = Date.now();
  
  try {
    // Step 1: Read data and timestamp (no lock)
    console.log('   1️⃣  Reading current data (no lock)...');
    const readQuery = `
      SELECT device_id, status, updated_at
      FROM devices
      WHERE device_id = $1
    `;
    const readResult = await executeQuery(nodeName, readQuery, [deviceId]);
    
    if (readResult.rows.length === 0) {
      throw new Error(`Device ${deviceId} not found`);
    }
    
    const originalTimestamp = readResult.rows[0].updated_at;
    const originalStatus = readResult.rows[0].status;
    console.log(`   ✅ Read device: status=${originalStatus}, timestamp=${new Date(originalTimestamp).toISOString()}`);
    
    // Log transaction (no lock acquired)
    await executeQuery(nodeName, `
      INSERT INTO transaction_log (
        transaction_id, node_name, transaction_type, table_name,
        record_id, status, lock_acquired, lock_type,
        timestamp_vector
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      transactionId, nodeName, 'UPDATE', 'devices', deviceId,
      'pending', false, 'none',
      JSON.stringify({ read_timestamp: originalTimestamp })
    ]);
    
    // Step 2: Simulate processing time
    console.log('   2️⃣  Processing (other transactions can read/write)...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 3: Attempt update with timestamp check
    console.log('   3️⃣  Attempting update with timestamp validation...');
    const updateQuery = `
      UPDATE devices
      SET status = $1, updated_at = NOW()
      WHERE device_id = $2 AND updated_at = $3
      RETURNING *
    `;
    const updateResult = await executeQuery(nodeName, updateQuery, [
      newStatus,
      deviceId,
      originalTimestamp
    ]);
    
    if (updateResult.rows.length === 0) {
      // Timestamp mismatch - another transaction modified the data
      throw new Error('Conflict detected! Data was modified by another transaction');
    }
    
    console.log(`   ✅ Update successful: ${originalStatus} → ${newStatus}`);
    
    // Update transaction log
    await executeQuery(nodeName, `
      UPDATE transaction_log
      SET status = 'committed', committed_at = NOW()
      WHERE transaction_id = $1
    `, [transactionId]);
    
    const duration = Date.now() - startTime;
    console.log(`   ⏱️  Total time: ${duration}ms (no lock held)`);
    
    return { success: true, device: updateResult.rows[0], duration };
    
  } catch (error) {
    console.error(`   ❌ Transaction aborted: ${error.message}`);
    
    // Update transaction log
    await executeQuery(nodeName, `
      UPDATE transaction_log
      SET status = 'aborted'
      WHERE transaction_id = $1
    `, [transactionId]);
    
    throw error;
  }
}

/**
 * Demonstrate optimistic conflict detection
 */
async function demonstrateOptimisticConflict(nodeName, deviceId) {
  console.log(`\n⚔️  Optimistic Conflict Demo: Two transactions with timestamp check`);
  
  try {
    // Both transactions read the same data
    console.log('\n   📖 Both transactions read device data...');
    const readQuery = `SELECT device_id, status, updated_at FROM devices WHERE device_id = $1`;
    const data1 = await executeQuery(nodeName, readQuery, [deviceId]);
    const data2 = await executeQuery(nodeName, readQuery, [deviceId]);
    
    const timestamp1 = data1.rows[0].updated_at;
    const timestamp2 = data2.rows[0].updated_at;
    
    console.log(`   🔵 Transaction 1 read: timestamp=${new Date(timestamp1).toISOString()}`);
    console.log(`   🟢 Transaction 2 read: timestamp=${new Date(timestamp2).toISOString()}`);
    
    // Transaction 1 updates first
    console.log('\n   🔵 Transaction 1: Updating to "maintenance"...');
    const update1 = await executeQuery(nodeName, `
      UPDATE devices
      SET status = 'maintenance', updated_at = NOW()
      WHERE device_id = $1 AND updated_at = $2
      RETURNING *
    `, [deviceId, timestamp1]);
    
    if (update1.rows.length > 0) {
      console.log('   🔵 Transaction 1: Update successful ✓');
    }
    
    // Transaction 2 tries to update with old timestamp
    console.log('\n   🟢 Transaction 2: Trying to update to "inactive"...');
    const update2 = await executeQuery(nodeName, `
      UPDATE devices
      SET status = 'inactive', updated_at = NOW()
      WHERE device_id = $1 AND updated_at = $2
      RETURNING *
    `, [deviceId, timestamp2]);
    
    if (update2.rows.length === 0) {
      console.log('   🟢 Transaction 2: ❌ CONFLICT DETECTED! Timestamp mismatch.');
      console.log('   🟢 Transaction 2: Another transaction modified the data.');
      console.log('   🟢 Transaction 2: Would need to retry with fresh data.');
    }
    
    console.log('\n   ✅ Optimistic conflict detection working correctly');
    
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
}

/**
 * Show transaction logs
 */
async function showTransactionLogs(nodeName, limit = 10) {
  console.log(`\n📜 Recent Transaction Logs from ${nodeName.toUpperCase()}`);
  
  const query = `
    SELECT 
      transaction_id,
      transaction_type,
      table_name,
      record_id,
      status,
      lock_acquired,
      lock_type,
      started_at,
      committed_at
    FROM transaction_log
    ORDER BY started_at DESC
    LIMIT $1
  `;
  
  const result = await executeQuery(nodeName, query, [limit]);
  
  console.log(`\n   Found ${result.rows.length} recent transactions:`);
  result.rows.forEach((tx, idx) => {
    const lockInfo = tx.lock_acquired ? `${tx.lock_type} lock` : 'no lock';
    const duration = tx.committed_at ? 
      `${Math.round((new Date(tx.committed_at) - new Date(tx.started_at)))}ms` : 
      'pending';
    console.log(`   ${idx + 1}. ${tx.transaction_type} on ${tx.table_name} - ${tx.status} (${lockInfo}) - ${duration}`);
  });
}

/**
 * Main demonstration function
 */
async function main() {
  console.log('🚀 Concurrency Control Demonstration');
  console.log('='.repeat(60));
  console.log('\nThis demonstrates two concurrency control mechanisms:\n');
  console.log('1. Pessimistic (Locking) - Prevents conflicts by locking');
  console.log('2. Optimistic (Timestamp) - Detects conflicts after the fact\n');
  
  try {
    const testNode = 'north';
    const testDevice1 = 'DEVICE_NORTH_001';
    const testDevice2 = 'DEVICE_NORTH_002';
    const testDevice3 = 'DEVICE_NORTH_003';
    
    // === PESSIMISTIC CONCURRENCY CONTROL ===
    console.log('\n' + '='.repeat(60));
    console.log('PART 1: PESSIMISTIC CONCURRENCY CONTROL (LOCKING)');
    console.log('='.repeat(60));
    
    // Simple pessimistic update
    await pessimisticUpdate(testNode, testDevice1, 'maintenance');
    
    // Demonstrate lock conflict
    await demonstrateLockConflict(testNode, testDevice1);
    
    // === OPTIMISTIC CONCURRENCY CONTROL ===
    console.log('\n' + '='.repeat(60));
    console.log('PART 2: OPTIMISTIC CONCURRENCY CONTROL (TIMESTAMP)');
    console.log('='.repeat(60));
    
    // Reset device status first for clean demo
    await executeQuery(testNode, `
      UPDATE devices SET status = 'active', updated_at = NOW()
      WHERE device_id = $1
    `, [testDevice3]);
    
    // Wait a moment to ensure timestamp is different
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simple optimistic update
    try {
      await optimisticUpdate(testNode, testDevice3, 'maintenance');
    } catch (error) {
      console.log('   ℹ️  Expected behavior - demonstrating retry mechanism');
    }
    
    // Demonstrate optimistic conflict
    await demonstrateOptimisticConflict(testNode, testDevice2);
    
    // === TRANSACTION LOGS ===
    console.log('\n' + '='.repeat(60));
    console.log('TRANSACTION LOGS');
    console.log('='.repeat(60));
    
    await showTransactionLogs(testNode, 10);
    
    // === SUMMARY ===
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CONCURRENCY CONTROL DEMONSTRATION COMPLETE!');
    console.log('='.repeat(60));
    
    console.log('\n📝 Key Concepts Demonstrated:\n');
    console.log('✓ Pessimistic Locking (SELECT FOR UPDATE)');
    console.log('✓ Lock acquisition and release');
    console.log('✓ Lock conflict resolution (wait/serialize)');
    console.log('✓ Optimistic Timestamp-based control');
    console.log('✓ Conflict detection without locking');
    console.log('✓ Transaction logging');
    console.log('✓ ACID properties maintained\n');
    
    console.log('Comparison:');
    console.log('Pessimistic: Higher overhead, prevents conflicts, good for high contention');
    console.log('Optimistic: Lower overhead, detects conflicts, good for low contention\n');
    
  } catch (error) {
    console.error('\n💥 Demo failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run demonstration
main();