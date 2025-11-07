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