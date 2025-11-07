-- -- Create trigger for automatic alerts on low battery
-- CREATE OR REPLACE FUNCTION check_battery_level()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.battery_level < 20 THEN
--     INSERT INTO alerts (
--       device_id, region, alert_type, severity, 
--       message, threshold_value, actual_value
--     ) VALUES (
--       NEW.device_id, NEW.region, 'low_battery', 'warning',
--       'Battery level critically low', 20, NEW.battery_level
--     );
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Apply trigger to all sensor_data tables
-- CREATE TRIGGER battery_alert_trigger
-- AFTER INSERT OR UPDATE ON sensor_data
-- FOR EACH ROW EXECUTE FUNCTION check_battery_level();

-- -- Trigger for temperature alerts
-- CREATE OR REPLACE FUNCTION check_temperature()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.temperature > 35 OR NEW.temperature < 5 THEN
--     INSERT INTO alerts (
--       device_id, region, alert_type, severity,
--       message, threshold_value, actual_value
--     ) VALUES (
--       NEW.device_id, NEW.region, 'temperature_alert', 'critical',
--       'Temperature out of normal range', 35, NEW.temperature
--     );
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER temperature_alert_trigger
-- AFTER INSERT OR UPDATE ON sensor_data
-- FOR EACH ROW EXECUTE FUNCTION check_temperature();



-- database/triggers/01_alert_triggers.sql

/**
 * Database Triggers for Automatic Monitoring
 * 
 * These triggers automatically create alerts when:
 * 1. Battery level drops below threshold
 * 2. Temperature is abnormal (too high/low)
 * 3. Air quality is unhealthy
 * 4. Signal strength is weak
 * 
 * This demonstrates automatic monitoring in distributed databases
 * Run this SQL on ALL 4 nodes (North, South, East, West)
 */

-- ============================================
-- TRIGGER 1: Low Battery Alert
-- ============================================

/**
 * Function: check_battery_level
 * 
 * Purpose: Monitors battery level and creates alerts
 * Trigger Event: After INSERT or UPDATE on sensor_data
 * Logic: If battery_level < 20%, create a 'warning' alert
 *        If battery_level < 10%, create a 'critical' alert
 * 
 * Why important in DDB:
 * - Automatically monitors devices across all distributed nodes
 * - No need for application to check each reading
 * - Ensures consistent monitoring rules across all nodes
 */

CREATE OR REPLACE FUNCTION check_battery_level()
RETURNS TRIGGER AS $$
DECLARE
  alert_severity VARCHAR(20);
  alert_msg TEXT;
BEGIN
  -- Determine severity based on battery level
  IF NEW.battery_level < 10 THEN
    alert_severity := 'critical';
    alert_msg := 'Battery critically low! Device may shut down soon.';
  ELSIF NEW.battery_level < 20 THEN
    alert_severity := 'warning';
    alert_msg := 'Battery level low. Consider maintenance.';
  ELSE
    -- Battery is fine, no alert needed
    RETURN NEW;
  END IF;

  -- Insert alert into alerts table
  INSERT INTO alerts (
    device_id,
    region,
    alert_type,
    severity,
    message,
    threshold_value,
    actual_value,
    triggered_at
  ) VALUES (
    NEW.device_id,
    NEW.region,
    'low_battery',
    alert_severity,
    alert_msg,
    20,  -- Threshold
    NEW.battery_level,  -- Actual value
    NEW.timestamp
  );

  -- Return NEW to continue with the INSERT/UPDATE
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on sensor_data table
CREATE TRIGGER battery_alert_trigger
AFTER INSERT OR UPDATE OF battery_level ON sensor_data
FOR EACH ROW
EXECUTE FUNCTION check_battery_level();

COMMENT ON FUNCTION check_battery_level() IS 'Automatically creates alerts when battery level is low';
COMMENT ON TRIGGER battery_alert_trigger ON sensor_data IS 'Monitors battery levels and generates alerts';

-- ============================================
-- TRIGGER 2: Temperature Alert
-- ============================================

/**
 * Function: check_temperature
 * 
 * Purpose: Monitors temperature readings for abnormal values
 * Trigger Event: After INSERT or UPDATE on sensor_data
 * Logic: 
 *   - If temp > 40°C → 'critical' (heat damage risk)
 *   - If temp > 35°C → 'warning' (above normal)
 *   - If temp < 0°C → 'critical' (freezing risk)
 *   - If temp < 5°C → 'warning' (too cold)
 * 
 * Why important in DDB:
 * - Different regions have different normal temperatures
 * - Distributed monitoring ensures all nodes are checked
 * - Critical for IoT sensor data quality
 */

CREATE OR REPLACE FUNCTION check_temperature()
RETURNS TRIGGER AS $$
DECLARE
  alert_severity VARCHAR(20);
  alert_msg TEXT;
  threshold_val DECIMAL(5,2);
BEGIN
  -- Check for high temperature
  IF NEW.temperature > 40 THEN
    alert_severity := 'critical';
    alert_msg := 'Temperature critically high! Risk of equipment damage.';
    threshold_val := 40;
  ELSIF NEW.temperature > 35 THEN
    alert_severity := 'warning';
    alert_msg := 'Temperature above normal operating range.';
    threshold_val := 35;
  -- Check for low temperature
  ELSIF NEW.temperature < 0 THEN
    alert_severity := 'critical';
    alert_msg := 'Temperature below freezing! Equipment at risk.';
    threshold_val := 0;
  ELSIF NEW.temperature < 5 THEN
    alert_severity := 'warning';
    alert_msg := 'Temperature too low for optimal operation.';
    threshold_val := 5;
  ELSE
    -- Temperature is normal
    RETURN NEW;
  END IF;

  -- Insert alert
  INSERT INTO alerts (
    device_id,
    region,
    alert_type,
    severity,
    message,
    threshold_value,
    actual_value,
    triggered_at
  ) VALUES (
    NEW.device_id,
    NEW.region,
    'temperature_alert',
    alert_severity,
    alert_msg,
    threshold_val,
    NEW.temperature,
    NEW.timestamp
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER temperature_alert_trigger
AFTER INSERT OR UPDATE OF temperature ON sensor_data
FOR EACH ROW
EXECUTE FUNCTION check_temperature();

COMMENT ON FUNCTION check_temperature() IS 'Automatically creates alerts for abnormal temperature readings';

-- ============================================
-- TRIGGER 3: Air Quality Alert
-- ============================================

/**
 * Function: check_air_quality
 * 
 * Purpose: Monitors Air Quality Index (AQI) for health risks
 * Trigger Event: After INSERT or UPDATE on sensor_data
 * AQI Scale:
 *   0-50:   Good
 *   51-100: Moderate
 *   101-150: Unhealthy for sensitive groups (warning)
 *   151-200: Unhealthy (warning)
 *   201+:    Very unhealthy (critical)
 * 
 * Why important in DDB:
 * - Health monitoring across all distributed locations
 * - Regional air quality varies significantly
 * - Real-time alerts for public health
 */

CREATE OR REPLACE FUNCTION check_air_quality()
RETURNS TRIGGER AS $$
DECLARE
  alert_severity VARCHAR(20);
  alert_msg TEXT;
BEGIN
  -- Check AQI levels
  IF NEW.air_quality > 200 THEN
    alert_severity := 'critical';
    alert_msg := 'Air quality very unhealthy! Recommend indoor activities.';
  ELSIF NEW.air_quality > 150 THEN
    alert_severity := 'warning';
    alert_msg := 'Air quality unhealthy. Sensitive groups should limit outdoor exposure.';
  ELSIF NEW.air_quality > 100 THEN
    alert_severity := 'info';
    alert_msg := 'Air quality unhealthy for sensitive groups.';
  ELSE
    -- AQI is acceptable
    RETURN NEW;
  END IF;

  -- Insert alert
  INSERT INTO alerts (
    device_id,
    region,
    alert_type,
    severity,
    message,
    threshold_value,
    actual_value,
    triggered_at
  ) VALUES (
    NEW.device_id,
    NEW.region,
    'air_quality_alert',
    alert_severity,
    alert_msg,
    100,
    NEW.air_quality,
    NEW.timestamp
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER air_quality_alert_trigger
AFTER INSERT OR UPDATE OF air_quality ON sensor_data
FOR EACH ROW
EXECUTE FUNCTION check_air_quality();

COMMENT ON FUNCTION check_air_quality() IS 'Automatically creates alerts for poor air quality';

-- ============================================
-- TRIGGER 4: Device Status Change Logger
-- ============================================

/**
 * Function: log_device_status_change
 * 
 * Purpose: Track all device status changes for audit trail
 * Trigger Event: BEFORE UPDATE on devices
 * Logic: Records old status → new status in transaction_log
 * 
 * Why important in DDB:
 * - Audit trail for compliance
 * - Track device lifecycle across distributed nodes
 * - Helps debug issues by showing status history
 */

CREATE OR REPLACE FUNCTION log_device_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO transaction_log (
      node_name,
      transaction_type,
      table_name,
      record_id,
      operation_data,
      status
    ) VALUES (
      NEW.region,  -- Which node/region
      'STATUS_CHANGE',
      'devices',
      NEW.device_id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', NOW(),
        'device_name', NEW.device_name
      ),
      'committed'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_status_change_trigger
BEFORE UPDATE OF status ON devices
FOR EACH ROW
EXECUTE FUNCTION log_device_status_change();

COMMENT ON FUNCTION log_device_status_change() IS 'Logs all device status changes for audit trail';

-- ============================================
-- TRIGGER 5: Automatic Updated_At Timestamp
-- ============================================

/**
 * Function: update_timestamp
 * 
 * Purpose: Automatically update 'updated_at' column
 * Trigger Event: BEFORE UPDATE on devices
 * Logic: Set updated_at = NOW() on every update
 * 
 * Why important in DDB:
 * - Track when data was last modified
 * - Critical for optimistic concurrency control
 * - Helps with replication synchronization
 */

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_device_timestamp
BEFORE UPDATE ON devices
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

COMMENT ON FUNCTION update_timestamp() IS 'Automatically updates timestamp on record modification';

-- ============================================
-- TRIGGER 6: Data Replication Marker
-- ============================================

/**
 * Function: mark_for_replication
 * 
 * Purpose: Mark new sensor data for replication to replica nodes
 * Trigger Event: AFTER INSERT on sensor_data
 * Logic: Set synced = FALSE (needs to be replicated)
 * 
 * Why important in DDB:
 * - Ensures new data is replicated to backup nodes
 * - Maintains data consistency across distributed system
 * - Supports fault tolerance
 */

CREATE OR REPLACE FUNCTION mark_for_replication()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark as not yet synced/replicated
  NEW.synced := FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER replication_marker_trigger
BEFORE INSERT ON sensor_data
FOR EACH ROW
EXECUTE FUNCTION mark_for_replication();

COMMENT ON FUNCTION mark_for_replication() IS 'Marks new data for replication to other nodes';

-- ============================================
-- TESTING TRIGGERS
-- ============================================

/**
 * To test these triggers, run:
 * 
 * Test 1: Low Battery Alert
 * INSERT INTO sensor_data (device_id, region, battery_level) 
 * VALUES ('TEST_001', 'north', 15);
 * -- Check: SELECT * FROM alerts WHERE device_id = 'TEST_001';
 * 
 * Test 2: Temperature Alert
 * INSERT INTO sensor_data (device_id, region, temperature) 
 * VALUES ('TEST_002', 'north', 42);
 * -- Check: SELECT * FROM alerts WHERE device_id = 'TEST_002';
 * 
 * Test 3: Status Change Log
 * UPDATE devices SET status = 'maintenance' WHERE device_id = 'DEVICE_NORTH_001';
 * -- Check: SELECT * FROM transaction_log WHERE record_id = 'DEVICE_NORTH_001';
 */

-- ============================================
-- VIEW: Active Alerts Summary
-- ============================================

/**
 * Helper view to see all unresolved alerts
 */
CREATE OR REPLACE VIEW active_alerts_summary AS
SELECT 
  region,
  alert_type,
  severity,
  COUNT(*) as alert_count,
  MAX(triggered_at) as last_triggered
FROM alerts
WHERE resolved = FALSE
GROUP BY region, alert_type, severity
ORDER BY 
  CASE severity 
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'info' THEN 3
  END,
  alert_count DESC;

COMMENT ON VIEW active_alerts_summary IS 'Summary of all active (unresolved) alerts across all regions';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ All triggers created successfully!';
  RAISE NOTICE 'Created 6 triggers:';
  RAISE NOTICE '  1. Battery Alert Trigger';
  RAISE NOTICE '  2. Temperature Alert Trigger';
  RAISE NOTICE '  3. Air Quality Alert Trigger';
  RAISE NOTICE '  4. Device Status Change Logger';
  RAISE NOTICE '  5. Automatic Timestamp Updater';
  RAISE NOTICE '  6. Replication Marker';
  RAISE NOTICE '';
  RAISE NOTICE '📊 You can now test triggers with sample data inserts';
END $$;