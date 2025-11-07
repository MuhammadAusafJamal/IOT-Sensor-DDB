-- -- Procedure to get device summary
-- CREATE OR REPLACE PROCEDURE get_device_summary(
--   p_region VARCHAR,
--   OUT total_devices INT,
--   OUT active_devices INT,
--   OUT total_readings BIGINT
-- )
-- LANGUAGE plpgsql AS $$
-- BEGIN
--   SELECT COUNT(*) INTO total_devices
--   FROM devices WHERE region = p_region;
  
--   SELECT COUNT(*) INTO active_devices
--   FROM devices WHERE region = p_region AND status = 'active';
  
--   SELECT COUNT(*) INTO total_readings
--   FROM sensor_data WHERE region = p_region;
-- END;
-- $$;

-- -- Procedure to cleanup old data
-- CREATE OR REPLACE PROCEDURE cleanup_old_readings(
--   days_to_keep INT
-- )
-- LANGUAGE plpgsql AS $$
-- BEGIN
--   DELETE FROM sensor_data
--   WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;
  
--   RAISE NOTICE 'Cleanup completed';
-- END;
-- $$;

-- -- Procedure for batch device updates
-- CREATE OR REPLACE PROCEDURE update_device_status_batch(
--   device_ids VARCHAR[],
--   new_status VARCHAR
-- )
-- LANGUAGE plpgsql AS $$
-- BEGIN
--   UPDATE devices
--   SET status = new_status, updated_at = NOW()
--   WHERE device_id = ANY(device_ids);
  
--   RAISE NOTICE 'Updated % devices', array_length(device_ids, 1);
-- END;
-- $$;



-- database/procedures/02_stored_procedures.sql

/**
 * Stored Procedures for Distributed Database Operations
 * 
 * These procedures provide reusable business logic for:
 * 1. Data aggregation across nodes
 * 2. Batch operations
 * 3. Maintenance tasks
 * 4. Reporting and analytics
 * 5. Replication management
 * 
 * Run this SQL on ALL 4 nodes (North, South, East, West)
 */

-- ============================================
-- PROCEDURE 1: Get Device Summary
-- ============================================

/**
 * Procedure: get_device_summary
 * 
 * Purpose: Get comprehensive statistics for a specific region
 * Input: p_region (VARCHAR) - Region name (north/south/east/west)
 * Output: Multiple statistics about devices and sensors
 * 
 * Returns:
 * - Total devices in region
 * - Active devices count
 * - Inactive devices count
 * - Total sensor readings
 * - Average temperature
 * - Average humidity
 * - Average air quality
 * 
 * Why important in DDB:
 * - Single procedure can query data on its local node
 * - No need for complex application logic
 * - Consistent reporting across all nodes
 * 
 * Usage:
 * CALL get_device_summary('north');
 */

CREATE OR REPLACE PROCEDURE get_device_summary(
    p_region VARCHAR,
    OUT total_devices INT,
    OUT active_devices INT,
    OUT inactive_devices INT,
    OUT maintenance_devices INT,
    OUT total_readings BIGINT,
    OUT avg_temperature DECIMAL(5,2),
    OUT avg_humidity DECIMAL(5,2),
    OUT avg_air_quality DECIMAL(5,2),
    OUT last_reading_time TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Count total devices in region
    SELECT COUNT(*) INTO total_devices
    FROM devices
    WHERE region = p_region;

    -- Count active devices
    SELECT COUNT(*) INTO active_devices
    FROM devices
    WHERE region = p_region AND status = 'active';

    -- Count inactive devices
    SELECT COUNT(*) INTO inactive_devices
    FROM devices
    WHERE region = p_region AND status = 'inactive';

    -- Count devices under maintenance
    SELECT COUNT(*) INTO maintenance_devices
    FROM devices
    WHERE region = p_region AND status = 'maintenance';

    -- Get sensor reading statistics
    SELECT 
        COUNT(*),
        ROUND(AVG(temperature)::numeric, 2),
        ROUND(AVG(humidity)::numeric, 2),
        ROUND(AVG(air_quality)::numeric, 2),
        MAX(timestamp)
    INTO 
        total_readings,
        avg_temperature,
        avg_humidity,
        avg_air_quality,
        last_reading_time
    FROM sensor_data
    WHERE region = p_region;

    -- Log the procedure execution
    INSERT INTO transaction_log (
        node_name, transaction_type, table_name, status
    ) VALUES (
        p_region, 'PROCEDURE_CALL', 'get_device_summary', 'committed'
    );

    -- Print summary
    RAISE NOTICE '📊 Device Summary for %:', UPPER(p_region);
    RAISE NOTICE '   Total Devices: %', total_devices;
    RAISE NOTICE '   Active: %, Inactive: %, Maintenance: %', 
        active_devices, inactive_devices, maintenance_devices;
    RAISE NOTICE '   Total Readings: %', total_readings;
    RAISE NOTICE '   Avg Temp: %°C, Avg Humidity: %%', 
        avg_temperature, avg_humidity;
END;
$$;

COMMENT ON PROCEDURE get_device_summary IS 
'Returns comprehensive statistics for devices and sensors in a specific region';

-- ============================================
-- PROCEDURE 2: Get Sensor Statistics
-- ============================================

/**
 * Procedure: get_sensor_statistics
 * 
 * Purpose: Detailed sensor data analysis for a time period
 * Input: 
 *   - p_region: Region to analyze
 *   - p_days_back: Number of days to look back (default 7)
 * Output: Statistics for the time period
 * 
 * Why important in DDB:
 * - Time-based analytics on local node
 * - Reduces network traffic (processing happens at node)
 * - Can be called in parallel on all nodes for global stats
 * 
 * Usage:
 * CALL get_sensor_statistics('north', 7);
 */

CREATE OR REPLACE PROCEDURE get_sensor_statistics(
    p_region VARCHAR,
    p_days_back INT DEFAULT 7,
    OUT reading_count BIGINT,
    OUT min_temp DECIMAL(5,2),
    OUT max_temp DECIMAL(5,2),
    OUT avg_temp DECIMAL(5,2),
    OUT min_humidity DECIMAL(5,2),
    OUT max_humidity DECIMAL(5,2),
    OUT avg_humidity DECIMAL(5,2),
    OUT critical_alerts INT,
    OUT warning_alerts INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    start_date TIMESTAMP;
BEGIN
    -- Calculate start date
    start_date := NOW() - (p_days_back || ' days')::INTERVAL;

    -- Get temperature statistics
    SELECT 
        COUNT(*),
        MIN(temperature),
        MAX(temperature),
        ROUND(AVG(temperature)::numeric, 2)
    INTO 
        reading_count,
        min_temp,
        max_temp,
        avg_temp
    FROM sensor_data
    WHERE region = p_region 
      AND timestamp >= start_date;

    -- Get humidity statistics
    SELECT 
        MIN(humidity),
        MAX(humidity),
        ROUND(AVG(humidity)::numeric, 2)
    INTO 
        min_humidity,
        max_humidity,
        avg_humidity
    FROM sensor_data
    WHERE region = p_region 
      AND timestamp >= start_date;

    -- Count alerts in period
    SELECT 
        COUNT(*) FILTER (WHERE severity = 'critical'),
        COUNT(*) FILTER (WHERE severity = 'warning')
    INTO 
        critical_alerts,
        warning_alerts
    FROM alerts
    WHERE region = p_region 
      AND triggered_at >= start_date;

    -- Print summary
    RAISE NOTICE '📈 Sensor Statistics for % (Last % days):', 
        UPPER(p_region), p_days_back;
    RAISE NOTICE '   Readings: %', reading_count;
    RAISE NOTICE '   Temperature: Min %.2f°C, Max %.2f°C, Avg %.2f°C', 
        min_temp, max_temp, avg_temp;
    RAISE NOTICE '   Humidity: Min %.2f%%, Max %.2f%%, Avg %.2f%%', 
        min_humidity, max_humidity, avg_humidity;
    RAISE NOTICE '   Alerts: % critical, % warning', 
        critical_alerts, warning_alerts;
END;
$$;

COMMENT ON PROCEDURE get_sensor_statistics IS 
'Analyzes sensor data for a specific region over a time period';

-- ============================================
-- PROCEDURE 3: Batch Update Device Status
-- ============================================

/**
 * Procedure: update_device_status_batch
 * 
 * Purpose: Update status of multiple devices at once
 * Input:
 *   - p_device_ids: Array of device IDs
 *   - p_new_status: New status to set
 * Output: Number of devices updated
 * 
 * Why important in DDB:
 * - Efficient batch operations
 * - Transactional (all succeed or all fail)
 * - Logged for audit trail
 * 
 * Usage:
 * CALL update_device_status_batch(
 *   ARRAY['DEVICE_NORTH_001', 'DEVICE_NORTH_002'], 
 *   'maintenance'
 * );
 */

CREATE OR REPLACE PROCEDURE update_device_status_batch(
    p_device_ids VARCHAR[],
    p_new_status VARCHAR,
    OUT updated_count INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    device_id_var VARCHAR;
BEGIN
    updated_count := 0;

    -- Validate status
    IF p_new_status NOT IN ('active', 'inactive', 'maintenance') THEN
        RAISE EXCEPTION 'Invalid status: %. Must be active, inactive, or maintenance', 
            p_new_status;
    END IF;

    -- Update each device
    FOREACH device_id_var IN ARRAY p_device_ids
    LOOP
        UPDATE devices
        SET status = p_new_status,
            updated_at = NOW()
        WHERE device_id = device_id_var;

        IF FOUND THEN
            updated_count := updated_count + 1;
        END IF;
    END LOOP;

    -- Log the batch operation
    INSERT INTO transaction_log (
        node_name, transaction_type, table_name, 
        operation_data, status
    ) VALUES (
        'system', 'BATCH_UPDATE', 'devices',
        jsonb_build_object(
            'device_count', updated_count,
            'new_status', p_new_status,
            'device_ids', p_device_ids
        ),
        'committed'
    );

    RAISE NOTICE '✅ Updated % devices to status: %', 
        updated_count, p_new_status;
END;
$$;

COMMENT ON PROCEDURE update_device_status_batch IS 
'Updates status of multiple devices in a single transaction';

-- ============================================
-- PROCEDURE 4: Cleanup Old Data
-- ============================================

/**
 * Procedure: cleanup_old_data
 * 
 * Purpose: Remove sensor readings older than specified days
 * Input: p_days_to_keep (default 180 days = 6 months)
 * Output: Number of readings deleted
 * 
 * Why important in DDB:
 * - Prevents database from growing too large
 * - Improves query performance
 * - Each node can clean its own data independently
 * - Scheduled maintenance task
 * 
 * Usage:
 * CALL cleanup_old_data(90);  -- Keep only last 90 days
 */

CREATE OR REPLACE PROCEDURE cleanup_old_data(
    p_days_to_keep INT DEFAULT 180,
    OUT deleted_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    cutoff_date TIMESTAMP;
BEGIN
    -- Calculate cutoff date
    cutoff_date := NOW() - (p_days_to_keep || ' days')::INTERVAL;

    -- Delete old sensor readings
    WITH deleted AS (
        DELETE FROM sensor_data
        WHERE timestamp < cutoff_date
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    -- Log the cleanup
    INSERT INTO transaction_log (
        node_name, transaction_type, table_name,
        operation_data, status
    ) VALUES (
        'system', 'CLEANUP', 'sensor_data',
        jsonb_build_object(
            'deleted_count', deleted_count,
            'cutoff_date', cutoff_date,
            'days_kept', p_days_to_keep
        ),
        'committed'
    );

    RAISE NOTICE '🗑️  Cleanup completed:';
    RAISE NOTICE '   Deleted % old readings', deleted_count;
    RAISE NOTICE '   Kept data from % onwards', cutoff_date;
END;
$$;

COMMENT ON PROCEDURE cleanup_old_data IS 
'Deletes sensor readings older than specified number of days';

-- ============================================
-- PROCEDURE 5: Manual Replication Trigger
-- ============================================

/**
 * Procedure: replicate_to_backup
 * 
 * Purpose: Manually trigger replication of unsynced data
 * Input: p_region - Source region
 * Output: Number of records marked for replication
 * 
 * Why important in DDB:
 * - Manual control over replication
 * - Can be scheduled or triggered on-demand
 * - Ensures data consistency across nodes
 * 
 * Usage:
 * CALL replicate_to_backup('north');
 */

CREATE OR REPLACE PROCEDURE replicate_to_backup(
    p_region VARCHAR,
    OUT records_to_sync BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Count unsynced records
    SELECT COUNT(*) INTO records_to_sync
    FROM sensor_data
    WHERE region = p_region AND synced = FALSE;

    -- Mark for replication (set synced flag)
    -- Note: Actual replication handled by external process
    UPDATE sensor_data
    SET synced = TRUE
    WHERE region = p_region AND synced = FALSE;

    -- Log replication trigger
    INSERT INTO replication_log (
        source_node, target_node, table_name, 
        record_count, status
    ) VALUES (
        p_region, 
        CASE p_region
            WHEN 'north' THEN 'south'
            WHEN 'south' THEN 'north'
            WHEN 'east' THEN 'west'
            WHEN 'west' THEN 'east'
        END,
        'sensor_data',
        records_to_sync,
        'pending'
    );

    RAISE NOTICE '🔄 Replication triggered:';
    RAISE NOTICE '   Region: %', UPPER(p_region);
    RAISE NOTICE '   Records to sync: %', records_to_sync;
END;
$$;

COMMENT ON PROCEDURE replicate_to_backup IS 
'Manually triggers replication of unsynced data to backup node';

-- ============================================
-- PROCEDURE 6: Generate Health Report
-- ============================================

/**
 * Procedure: generate_health_report
 * 
 * Purpose: Comprehensive node health report
 * Input: None (checks current node)
 * Output: Health metrics and recommendations
 * 
 * Why important in DDB:
 * - Monitor node performance
 * - Identify potential issues
 * - Proactive maintenance
 * 
 * Usage:
 * CALL generate_health_report();
 */

-- CREATE OR REPLACE PROCEDURE generate_health_report()
-- LANGUAGE plpgsql
-- AS $$
-- DECLARE
--     device_count INT;
--     reading_count BIGINT;
--     alert_count INT;
--     unresolved_alerts INT;
--     db_size TEXT;
--     table_count INT;
--     last_reading TIMESTAMP;
--     oldest_reading TIMESTAMP;
-- BEGIN
--     -- Get database statistics
--     SELECT COUNT(*) INTO device_count FROM devices;
--     SELECT COUNT(*) INTO reading_count FROM sensor_data;
--     SELECT COUNT(*) INTO alert_count FROM alerts;
--     SELECT COUNT(*) INTO unresolved_alerts FROM alerts WHERE resolved = FALSE;
    
--     -- Get database size
--     SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
    
--     -- Get table count
--     SELECT COUNT(*) INTO table_count 
--     FROM information_schema.tables 
--     WHERE table_schema = 'public';

--     -- Get reading timestamps
--     SELECT MAX(timestamp), MIN(timestamp) 
--     INTO last_reading, oldest_reading
--     FROM sensor_data;

--     -- Print comprehensive report
--     RAISE NOTICE '';
--     RAISE NOTICE '═══════════════════════════════════════════';
--     RAISE NOTICE '        NODE HEALTH REPORT';
--     RAISE NOTICE '═══════════════════════════════════════════';
--     RAISE NOTICE '';
--     RAISE NOTICE '📊 DATABASE STATISTICS:';
--     RAISE NOTICE '   Database Size: %', db_size;
--     RAISE NOTICE '   Total Tables: %', table_count;
--     RAISE NOTICE '';
--     RAISE NOTICE '📱 DEVICE STATISTICS:';
--     RAISE NOTICE '   Total Devices: %', device_count;
--     RAISE NOTICE '';
--     RAISE NOTICE '📈 SENSOR DATA:';
--     RAISE NOTICE '   Total Readings: %', reading_count;
--     RAISE NOTICE '   Oldest Reading: %', oldest_reading;
--     RAISE NOTICE '   Latest Reading: %', last_reading;
--     RAISE NOTICE '';
--     RAISE NOTICE '⚠️  ALERTS:';
--     RAISE NOTICE '   Total Alerts: %', alert_count;
--     RAISE NOTICE '   Unresolved: %', unresolved_alerts;
--     RAISE NOTICE '';
--     RAISE NOTICE '✅ RECOMMENDATIONS:';
    
--     IF unresolved_alerts > 10 THEN
--         RAISE NOTICE '   ⚠️  High number of unresolved alerts - investigate!';
--     END IF;
    
--     IF reading_count > 100000 THEN
--         RAISE NOTICE '   ℹ️  Consider running cleanup_old_data()';
--     END IF;
    
--     RAISE NOTICE '';
--     RAISE NOTICE '═══════════════════════════════════════════';

--     -- Log health check
--     INSERT INTO node_health (
--         node_name, status, checked_at
--     ) VALUES (
--         current_database(), 'healthy', NOW()
--     );
-- END;
-- $$;

-- COMMENT ON PROCEDURE generate_health_report IS 
-- 'Generates comprehensive health report for the database node';

-- -- ============================================
-- -- TESTING PROCEDURES
-- -- ============================================

-- /**
--  * To test these procedures, run:
--  * 
--  * Test 1: Device Summary
--  * CALL get_device_summary('north');
--  * 
--  * Test 2: Sensor Statistics
--  * CALL get_sensor_statistics('north', 7);
--  * 
--  * Test 3: Batch Update
--  * CALL update_device_status_batch(
--  *   ARRAY['DEVICE_NORTH_001', 'DEVICE_NORTH_002'],
--  *   'maintenance'
--  * );
--  * 
--  * Test 4: Cleanup (safe - won't delete recent data)
--  * CALL cleanup_old_data(180);
--  * 
--  * Test 5: Health Report
--  * CALL generate_health_report();
--  */

-- -- ============================================
-- -- SUCCESS MESSAGE
-- -- ============================================

-- DO $$
-- BEGIN
--     RAISE NOTICE '✅ All stored procedures created successfully!';
--     RAISE NOTICE '';
--     RAISE NOTICE 'Created 6 procedures:';
--     RAISE NOTICE '  1. get_device_summary() - Regional statistics';
--     RAISE NOTICE '  2. get_sensor_statistics() - Time-based analytics';
--     RAISE NOTICE '  3. update_device_status_batch() - Batch operations';
--     RAISE NOTICE '  4. cleanup_old_data() - Maintenance';
--     RAISE NOTICE '  5. replicate_to_backup() - Manual replication';
--     RAISE NOTICE '  6. generate_health_report() - Health monitoring';
--     RAISE NOTICE '';
--     RAISE NOTICE '📊 Test procedures with sample calls (see comments above)';
-- END $$;



-- database/procedures/02_stored_procedures_fixed.sql
-- Fixed version with corrected syntax

-- ============================================
-- PROCEDURE 1: Get Device Summary (FIXED)
-- ============================================

CREATE OR REPLACE PROCEDURE get_device_summary(
    p_region VARCHAR,
    OUT total_devices INT,
    OUT active_devices INT,
    OUT inactive_devices INT,
    OUT total_readings BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT COUNT(*) INTO total_devices
    FROM devices WHERE region = p_region;

    SELECT COUNT(*) INTO active_devices
    FROM devices WHERE region = p_region AND status = 'active';

    SELECT COUNT(*) INTO inactive_devices
    FROM devices WHERE region = p_region AND status = 'inactive';

    SELECT COUNT(*) INTO total_readings
    FROM sensor_data WHERE region = p_region;

    RAISE NOTICE 'Device Summary for %: Total=%, Active=%, Inactive=%', 
        p_region, total_devices, active_devices, inactive_devices;
END;
$$;

-- ============================================
-- PROCEDURE 2: Get Sensor Statistics (FIXED)
-- ============================================

CREATE OR REPLACE PROCEDURE get_sensor_statistics(
    p_region VARCHAR,
    p_days_back INT,
    OUT reading_count BIGINT,
    OUT avg_temp DECIMAL(5,2),
    OUT avg_humidity DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    start_date TIMESTAMP;
BEGIN
    start_date := NOW() - (p_days_back || ' days')::INTERVAL;

    SELECT 
        COUNT(*),
        ROUND(AVG(temperature)::numeric, 2),
        ROUND(AVG(humidity)::numeric, 2)
    INTO reading_count, avg_temp, avg_humidity
    FROM sensor_data
    WHERE region = p_region AND timestamp >= start_date;

    RAISE NOTICE 'Statistics for % (% days): Readings=%, AvgTemp=%', 
        p_region, p_days_back, reading_count, avg_temp;
END;
$$;

-- ============================================
-- PROCEDURE 3: Batch Update Device Status (FIXED)
-- ============================================

CREATE OR REPLACE PROCEDURE update_device_status_batch(
    p_device_ids VARCHAR[],
    p_new_status VARCHAR,
    OUT updated_count INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    updated_count := 0;

    UPDATE devices
    SET status = p_new_status, updated_at = NOW()
    WHERE device_id = ANY(p_device_ids);

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RAISE NOTICE 'Updated % devices to status: %', updated_count, p_new_status;
END;
$$;

-- ============================================
-- PROCEDURE 4: Cleanup Old Data (FIXED)
-- ============================================

CREATE OR REPLACE PROCEDURE cleanup_old_data(
    p_days_to_keep INT,
    OUT deleted_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    cutoff_date TIMESTAMP;
BEGIN
    cutoff_date := NOW() - (p_days_to_keep || ' days')::INTERVAL;

    WITH deleted AS (
        DELETE FROM sensor_data
        WHERE timestamp < cutoff_date
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RAISE NOTICE 'Cleanup: Deleted % readings older than %', deleted_count, cutoff_date;
END;
$$;

-- ============================================
-- PROCEDURE 5: Generate Health Report (FIXED)
-- ============================================

CREATE OR REPLACE PROCEDURE generate_health_report(
    OUT device_count INT,
    OUT reading_count BIGINT,
    OUT alert_count INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT COUNT(*) INTO device_count FROM devices;
    SELECT COUNT(*) INTO reading_count FROM sensor_data;
    SELECT COUNT(*) INTO alert_count FROM alerts WHERE resolved = FALSE;

    RAISE NOTICE 'Health Report: Devices=%, Readings=%, Unresolved Alerts=%', 
        device_count, reading_count, alert_count;
END;
$$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: All 5 stored procedures created!';
    RAISE NOTICE '1. get_device_summary(region)';
    RAISE NOTICE '2. get_sensor_statistics(region, days)';
    RAISE NOTICE '3. update_device_status_batch(device_ids[], status)';
    RAISE NOTICE '4. cleanup_old_data(days_to_keep)';
    RAISE NOTICE '5. generate_health_report()';
END $$;
