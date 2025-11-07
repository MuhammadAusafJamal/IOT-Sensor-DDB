-- -- database/schemas/01_base_schema.sql

-- /**
--  * Base Schema for IoT Distributed Database System
--  * 
--  * This script creates the foundational tables for the IoT sensor data management system.
--  * It will be executed on ALL 4 nodes to create a consistent schema structure.
--  * 
--  * Tables Created:
--  * 1. devices - Stores IoT device information
--  * 2. sensor_data - Main table for sensor readings (will be fragmented)
--  * 3. sensor_data_basic - Vertical fragment: basic info
--  * 4. sensor_data_readings - Vertical fragment: sensor readings
--  * 5. sensor_data_metadata - Vertical fragment: device metadata
--  * 6. alerts - System alerts and notifications
--  * 7. node_health - Health monitoring for distributed nodes
--  * 8. replication_log - Tracks data replication between nodes
--  * 9. transaction_log - Distributed transaction logging
--  */

-- -- ============================================
-- -- ENABLE EXTENSIONS
-- -- ============================================

-- -- UUID extension for generating unique identifiers
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -- ============================================
-- -- TABLE: devices
-- -- Stores information about IoT devices
-- -- ============================================

-- CREATE TABLE IF NOT EXISTS devices (
--     device_id VARCHAR(50) PRIMARY KEY,           -- Unique device identifier (e.g., 'DEVICE_001')
--     device_name VARCHAR(100) NOT NULL,           -- Human-readable device name
--     device_type VARCHAR(50) NOT NULL,            -- Type of device (e.g., 'temperature_sensor')
--     region VARCHAR(20) NOT NULL,                 -- Geographic region (north, south, east, west)
--     location VARCHAR(200),                       -- Physical location description
--     latitude DECIMAL(10, 8),                     -- GPS latitude
--     longitude DECIMAL(11, 8),                    -- GPS longitude
--     installation_date TIMESTAMP DEFAULT NOW(),   -- When device was installed
--     last_maintenance TIMESTAMP,                  -- Last maintenance date
--     status VARCHAR(20) DEFAULT 'active',         -- Device status (active, inactive, maintenance)
--     firmware_version VARCHAR(20),                -- Current firmware version
--     created_at TIMESTAMP DEFAULT NOW(),          -- Record creation timestamp
--     updated_at TIMESTAMP DEFAULT NOW()           -- Record last update timestamp
-- );

-- -- Index for faster region-based queries (important for fragmentation)
-- CREATE INDEX IF NOT EXISTS idx_devices_region ON devices(region);

-- -- Index for device status queries
-- CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- -- ============================================
-- -- TABLE: sensor_data (Main Table - Will be Fragmented)
-- -- Stores all sensor readings
-- -- ============================================

-- CREATE TABLE IF NOT EXISTS sensor_data (
--     reading_id SERIAL PRIMARY KEY,               -- Auto-incrementing reading ID
--     device_id VARCHAR(50) NOT NULL,              -- Foreign key to devices table
--     region VARCHAR(20) NOT NULL,                 -- Region (for horizontal fragmentation)
--     timestamp TIMESTAMP DEFAULT NOW(),           -- When reading was taken
    
--     -- Sensor readings
--     temperature DECIMAL(5, 2),                   -- Temperature in Celsius
--     humidity DECIMAL(5, 2),                      -- Humidity percentage (0-100)
--     air_quality INTEGER,                         -- Air Quality Index (0-500)
    
--     -- Device metadata
--     battery_level INTEGER,                       -- Battery percentage (0-100)
--     signal_strength INTEGER,                     -- Signal strength (-100 to 0 dBm)
    
--     -- System fields
--     created_at TIMESTAMP DEFAULT NOW(),          -- Record creation timestamp
--     synced BOOLEAN DEFAULT FALSE,                -- Whether data is replicated
    
--     FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
-- );

-- -- Composite index for efficient querying by device and time
-- CREATE INDEX IF NOT EXISTS idx_sensor_data_device_time ON sensor_data(device_id, timestamp DESC);

-- -- Index for region-based queries (horizontal fragmentation)
-- CREATE INDEX IF NOT EXISTS idx_sensor_data_region ON sensor_data(region);

-- -- Index for timestamp range queries
-- CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp DESC);

-- -- ============================================
-- -- TABLE: sensor_data_basic (Vertical Fragment)
-- -- Contains basic identification and timestamp info
-- -- This demonstrates VERTICAL FRAGMENTATION
-- -- ============================================

-- CREATE TABLE IF NOT EXISTS sensor_data_basic (
--     reading_id SERIAL PRIMARY KEY,
--     device_id VARCHAR(50) NOT NULL,
--     region VARCHAR(20) NOT NULL,
--     timestamp TIMESTAMP DEFAULT NOW(),
--     created_at TIMESTAMP DEFAULT NOW(),
    
--     FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
-- );

-- CREATE INDEX IF NOT EXISTS idx_sensor_basic_device ON sensor_data_basic(device_id);
-- CREATE INDEX IF NOT EXISTS idx_sensor_basic_region ON sensor_data_basic(region);

-- -- ============================================
-- -- TABLE: sensor_data_readings (Vertical Fragment)
-- -- Contains actual sensor measurement values
-- -- ============================================

-- CREATE TABLE IF NOT EXISTS sensor_data_readings (
--     reading_id INTEGER PRIMARY KEY,              -- References sensor_data_basic
--     temperature DECIMAL(5, 2),
--     humidity DECIMAL(5, 2),
--     air_quality INTEGER,
    
--     FOREIGN KEY (reading_id) REFERENCES sensor_data_basic(reading_id) ON DELETE CASCADE
-- );

-- -- ============================================
-- -- TABLE: sensor_data_metadata (Vertical Fragment)
-- -- Contains device health and connectivity metadata
-- -- ============================================

-- CREATE TABLE IF NOT EXISTS sensor_data_metadata (
--     reading_id INTEGER PRIMARY KEY,              -- References sensor_data_basic
--     battery_level INTEGER,
--     signal_strength INTEGER,
    
--     FOREIGN KEY (reading_id) REFERENCES sensor_data_basic(reading_id) ON DELETE CASCADE
-- );

-- -- ============================================
-- -- TABLE: alerts
-- -- Stores system alerts for abnormal sensor readings
-- -- ============================================

-- CREATE TABLE IF NOT EXISTS alerts (
--     alert_id SERIAL PRIMARY KEY,
--     device_id VARCHAR(50) NOT NULL,
--     region VARCHAR(20) NOT NULL,
--     alert_type VARCHAR(50) NOT NULL,             -- Type of alert (high_temp, low_battery, etc.)
--     severity VARCHAR(20) NOT NULL,               -- Severity level (info, warning, critical)
--     message TEXT NOT NULL,                       -- Alert message
--     threshold_value DECIMAL(10, 2),              -- Threshold that was crossed
--     actual_value DECIMAL(10, 2),                 -- Actual value that triggered alert
--     triggered_at TIMESTAMP DEFAULT NOW(),        -- When alert was triggered
--     acknowledged BOOLEAN DEFAULT FALSE,          -- Whether alert was acknowledged
--     acknowledged_at TIMESTAMP,                   -- When alert was acknowledged
--     acknowledged_by VARCHAR(100),                -- Who acknowledged the alert
--     resolved BOOLEAN DEFAULT FALSE,              -- Whether issue is resolved
--     resolved_at TIMESTAMP,                       -- When issue was resolved
    
--     FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
-- );

-- CREATE INDEX IF NOT EXISTS idx_alerts_device ON alerts(device_id);
-- CREATE INDEX IF NOT EXISTS idx_alerts_region ON alerts(region);
-- CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
-- CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON alerts(resolved) WHERE resolved = FALSE;

-- -- ============================================
-- -- TABLE: node_health
-- -- Monitors health of distributed database nodes
-- -- ============================================

-- CREATE TABLE IF NOT EXISTS node_health (
--     health_id SERIAL PRIMARY KEY,
--     node_name VARCHAR(20) NOT NULL,              -- Node identifier (north, south, east, west)
--     status VARCHAR(20) NOT NULL,                 -- Node status (healthy, degraded, down)
--     cpu_usage DECIMAL(5, 2),                     -- CPU usage percentage
--     memory_usage DECIMAL(5, 2),                  -- Memory usage percentage
--     disk_usage DECIMAL(5, 2),                    -- Disk usage percentage
--     active_connections INTEGER,                  -- Number of active database connections
--     queries_per_second DECIMAL(10, 2),           -- Query throughput
--     average_query_time DECIMAL(10, 2),           -- Average query execution time (ms)
--     last_replication_time TIMESTAMP,             -- Last successful replication
--     error_count INTEGER DEFAULT 0,               -- Number of errors since last check
--     checked_at TIMESTAMP DEFAULT NOW()           -- When health check was performed
-- );

-- CREATE INDEX IF NOT EXISTS idx_node_health_node ON node_health(node_name);
-- CREATE INDEX IF NOT EXISTS idx_node_health_time ON node_health(checked_at DESC);

-- -- ============================================
-- -- TABLE: replication_log
-- -- Tracks data replication between nodes
-- -- ============================================

-- CREATE TABLE IF NOT EXISTS replication_log (
--     replication_id SERIAL PRIMARY KEY,
--     source_node VARCHAR(20) NOT NULL,            -- Node where data originated
--     target_node VARCHAR(20) NOT NULL,            -- Node receiving replicated data
--     table_name VARCHAR(100) NOT NULL,            -- Table being replicated
--     record_count INTEGER NOT NULL,               -- Number of records replicated
--     status VARCHAR(20) NOT NULL,                 -- Replication status (success, failed, pending)
--     started_at TIMESTAMP DEFAULT NOW(),          -- When replication started
--     completed_at TIMESTAMP,                      -- When replication completed
--     error_message TEXT,                          -- Error details if failed
--     duration_ms INTEGER                          -- Replication duration in milliseconds
-- );

-- CREATE INDEX IF NOT EXISTS idx_replication_log_source ON replication_log(source_node);
-- CREATE INDEX IF NOT EXISTS idx_replication_log_target ON replication_log(target_node);
-- CREATE INDEX IF NOT EXISTS idx_replication_log_status ON replication_log(status);
-- CREATE INDEX IF NOT EXISTS idx_replication_log_time ON replication_log(started_at DESC);

-- -- ============================================
-- -- TABLE: transaction_log
-- -- Distributed transaction logging for concurrency control
-- -- ============================================

-- CREATE TABLE IF NOT EXISTS transaction_log (
--     transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     node_name VARCHAR(20) NOT NULL,              -- Node where transaction occurred
--     transaction_type VARCHAR(50) NOT NULL,       -- Type (INSERT, UPDATE, DELETE)
--     table_name VARCHAR(100) NOT NULL,            -- Affected table
--     record_id VARCHAR(100),                      -- Affected record ID
--     operation_data JSONB,                        -- Transaction data in JSON format
--     timestamp_vector JSONB,                      -- Vector timestamp for ordering
--     status VARCHAR(20) NOT NULL,                 -- Status (committed, aborted, pending)
--     started_at TIMESTAMP DEFAULT NOW(),
--     committed_at TIMESTAMP,
--     lock_acquired BOOLEAN DEFAULT FALSE,         -- Whether lock was acquired
--     lock_type VARCHAR(20)                        -- Lock type (shared, exclusive)
-- );

-- CREATE INDEX IF NOT EXISTS idx_transaction_log_node ON transaction_log(node_name);
-- CREATE INDEX IF NOT EXISTS idx_transaction_log_type ON transaction_log(transaction_type);
-- CREATE INDEX IF NOT EXISTS idx_transaction_log_status ON transaction_log(status);
-- CREATE INDEX IF NOT EXISTS idx_transaction_log_time ON transaction_log(started_at DESC);

-- -- ============================================
-- -- COMMENTS FOR DOCUMENTATION
-- -- ============================================

-- COMMENT ON TABLE devices IS 'Stores information about all IoT devices in the system';
-- COMMENT ON TABLE sensor_data IS 'Main table storing all sensor readings - will be horizontally fragmented by region';
-- COMMENT ON TABLE sensor_data_basic IS 'Vertical fragment containing basic identification info';
-- COMMENT ON TABLE sensor_data_readings IS 'Vertical fragment containing actual sensor measurements';
-- COMMENT ON TABLE sensor_data_metadata IS 'Vertical fragment containing device health metadata';
-- COMMENT ON TABLE alerts IS 'System alerts generated from abnormal sensor readings';
-- COMMENT ON TABLE node_health IS 'Health monitoring data for distributed database nodes';
-- COMMENT ON TABLE replication_log IS 'Tracks data replication events between nodes';
-- COMMENT ON TABLE transaction_log IS 'Distributed transaction log for concurrency control';





-- database/schemas/01_base_schema.sql

/**
 * Base Schema for IoT Distributed Database System
 * 
 * This script creates the foundational tables for the IoT sensor data management system.
 * It will be executed on ALL 4 nodes to create a consistent schema structure.
 * 
 * Tables Created:
 * 1. devices - Stores IoT device information
 * 2. sensor_data - Main table for sensor readings (will be fragmented)
 * 3. sensor_data_basic - Vertical fragment: basic info
 * 4. sensor_data_readings - Vertical fragment: sensor readings
 * 5. sensor_data_metadata - Vertical fragment: device metadata
 * 6. alerts - System alerts and notifications
 * 7. node_health - Health monitoring for distributed nodes
 * 8. replication_log - Tracks data replication between nodes
 * 9. transaction_log - Distributed transaction logging
 */

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: devices
-- Stores information about IoT devices
-- ============================================

CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(50) PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    region VARCHAR(20) NOT NULL,
    location VARCHAR(200),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    installation_date TIMESTAMP DEFAULT NOW(),
    last_maintenance TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    firmware_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_region ON devices(region);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- ============================================
-- TABLE: sensor_data (Main Table - Will be Fragmented)
-- Stores all sensor readings
-- ============================================

CREATE TABLE IF NOT EXISTS sensor_data (
    reading_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    region VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    air_quality INTEGER,
    battery_level INTEGER,
    signal_strength INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    synced BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sensor_data_device_time ON sensor_data(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_region ON sensor_data(region);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp DESC);

-- ============================================
-- TABLE: sensor_data_basic (Vertical Fragment)
-- Contains basic identification and timestamp info
-- This demonstrates VERTICAL FRAGMENTATION
-- ============================================

CREATE TABLE IF NOT EXISTS sensor_data_basic (
    reading_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    region VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sensor_basic_device ON sensor_data_basic(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_basic_region ON sensor_data_basic(region);

-- ============================================
-- TABLE: sensor_data_readings (Vertical Fragment)
-- Contains actual sensor measurement values
-- NOTE: Must be created AFTER sensor_data_basic
-- ============================================

CREATE TABLE IF NOT EXISTS sensor_data_readings (
    reading_id INTEGER PRIMARY KEY,
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    air_quality INTEGER,
    FOREIGN KEY (reading_id) REFERENCES sensor_data_basic(reading_id) ON DELETE CASCADE
);

-- ============================================
-- TABLE: sensor_data_metadata (Vertical Fragment)
-- Contains device health and connectivity metadata
-- NOTE: Must be created AFTER sensor_data_basic
-- ============================================

CREATE TABLE IF NOT EXISTS sensor_data_metadata (
    reading_id INTEGER PRIMARY KEY,
    battery_level INTEGER,
    signal_strength INTEGER,
    FOREIGN KEY (reading_id) REFERENCES sensor_data_basic(reading_id) ON DELETE CASCADE
);

-- ============================================
-- TABLE: alerts
-- Stores system alerts for abnormal sensor readings
-- ============================================

CREATE TABLE IF NOT EXISTS alerts (
    alert_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    region VARCHAR(20) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    threshold_value DECIMAL(10, 2),
    actual_value DECIMAL(10, 2),
    triggered_at TIMESTAMP DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(100),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alerts_device ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_region ON alerts(region);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON alerts(resolved) WHERE resolved = FALSE;

-- ============================================
-- TABLE: node_health
-- Monitors health of distributed database nodes
-- ============================================

CREATE TABLE IF NOT EXISTS node_health (
    health_id SERIAL PRIMARY KEY,
    node_name VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    cpu_usage DECIMAL(5, 2),
    memory_usage DECIMAL(5, 2),
    disk_usage DECIMAL(5, 2),
    active_connections INTEGER,
    queries_per_second DECIMAL(10, 2),
    average_query_time DECIMAL(10, 2),
    last_replication_time TIMESTAMP,
    error_count INTEGER DEFAULT 0,
    checked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_node_health_node ON node_health(node_name);
CREATE INDEX IF NOT EXISTS idx_node_health_time ON node_health(checked_at DESC);

-- ============================================
-- TABLE: replication_log
-- Tracks data replication between nodes
-- ============================================

CREATE TABLE IF NOT EXISTS replication_log (
    replication_id SERIAL PRIMARY KEY,
    source_node VARCHAR(20) NOT NULL,
    target_node VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_count INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT,
    duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_replication_log_source ON replication_log(source_node);
CREATE INDEX IF NOT EXISTS idx_replication_log_target ON replication_log(target_node);
CREATE INDEX IF NOT EXISTS idx_replication_log_status ON replication_log(status);
CREATE INDEX IF NOT EXISTS idx_replication_log_time ON replication_log(started_at DESC);

-- ============================================
-- TABLE: transaction_log
-- Distributed transaction logging for concurrency control
-- ============================================

CREATE TABLE IF NOT EXISTS transaction_log (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_name VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    operation_data JSONB,
    timestamp_vector JSONB,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    committed_at TIMESTAMP,
    lock_acquired BOOLEAN DEFAULT FALSE,
    lock_type VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_transaction_log_node ON transaction_log(node_name);
CREATE INDEX IF NOT EXISTS idx_transaction_log_type ON transaction_log(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_log_status ON transaction_log(status);
CREATE INDEX IF NOT EXISTS idx_transaction_log_time ON transaction_log(started_at DESC);