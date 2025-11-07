<!-- # IoT Sensor Data Management System - Distributed Database

## Overview
A comprehensive distributed database system demonstrating:
- **Horizontal & Vertical Fragmentation**
- **Data Replication** (Replication Factor: 2)
- **Distributed Query Processing**
- **Concurrency Control** (Pessimistic & Optimistic)
- **Fault Tolerance & Recovery**
- **Real-time Dashboard** with monitoring

## Architecture
- **4 PostgreSQL Nodes**: North, South, East, West (Ports: 5432-5435)
- **100 IoT Devices**: 25 per region
- **10,000+ Sensor Readings**: Distributed across nodes
- **Next.js Dashboard**: Real-time monitoring and analytics

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 18
- 16GB RAM, 2GB disk space

### Installation

1. **Clone the repository**
```bash
git clone <your-repo>
cd iot-ddb-project
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup PostgreSQL Nodes**
```bash
# Follow instructions in docs/POSTGRESQL_SETUP.md
```

4. **Deploy Schema**
```bash
node database/schemas/deploy-schema.js
```

5. **Generate Data**
```bash
node database/seed-data/generate-data.js
```

6. **Setup Replication**
```bash
node database/replication/replicate-data.js
```

7. **Start Dashboard**
```bash
npm run dev
```

Visit: http://localhost:3000

## Features

### Distributed Database Concepts
- ✅ Horizontal Fragmentation by Region
- ✅ Vertical Fragmentation (3 tables)
- ✅ Hybrid Fragmentation
- ✅ Asynchronous Replication
- ✅ Parallel Query Processing
- ✅ Pessimistic Locking (SELECT FOR UPDATE)
- ✅ Optimistic Concurrency (Timestamp-based)
- ✅ Automatic Failover
- ✅ Data Recovery

### Dashboard Features
- Real-time node health monitoring
- Interactive KPI cards
- Dynamic filters (Region, Status)
- Temperature, Humidity, AQI charts
- Device management table
- CSV/JSON data import
- Auto-refresh every 30 seconds

## Testing

### Test Distributed Queries
```bash
node database/queries/distributed-queries.js
```

### Test Concurrency Control
```bash
node database/procedures/concurrency-control.js
```

### Test Fault Tolerance
```bash
node database/recovery/fault-tolerance.js
```

## Technologies Used
- **Backend**: PostgreSQL 18, Node.js
- **Frontend**: Next.js 14, React
- **Styling**: Tailwind CSS, Recharts
- **Database**: Distributed PostgreSQL (4 nodes)

## Project Structure
```
iot-ddb-project/
├── config/              # Database configurations
├── database/
│   ├── schemas/         # SQL schemas
│   ├── fragments/       # Fragmentation scripts
│   ├── replication/     # Replication logic
│   ├── queries/         # Distributed queries
│   ├── procedures/      # Concurrency control
│   ├── recovery/        # Fault tolerance
│   └── seed-data/       # Data generation
├── src/
│   ├── app/
│   │   ├── api/         # REST API routes
│   │   └── page.js      # Main dashboard
│   ├── components/      # React components
│   └── lib/             # Utilities
└── README.md
```

## Author
**Muhammad Ausaf Jamal** - Final Year Project 2025

## License
MIT -->





# IoT Sensor Data Management System
## Distributed Database Final Year Project

---

## Table of Contents
1. Introduction & Problem Statement
2. System Design & Architecture
3. Implementation Details
4. Query Processing & Optimization
5. Fault Tolerance & Recovery
6. Results & Performance
7. Conclusion & Future Work

---

## 1. Introduction & Problem Statement

### 1.1 Background
IoT devices generate massive amounts of data across geographic locations...

### 1.2 Problem Statement
Traditional centralized databases face challenges:
- Geographic latency
- Single point of failure
- Scalability limitations

### 1.3 Why Distributed Database?
- **Geographic Distribution**: Data stored closer to source
- **High Availability**: Replication ensures no data loss
- **Scalability**: Horizontal scaling across nodes
- **Fault Tolerance**: System continues during node failures

---

## 2. System Design & Architecture

### 2.1 ER Diagram
[INSERT ER DIAGRAM HERE]

Entities:
- Devices (device_id PK, device_name, type, region, location...)
- Sensor_Data (reading_id PK, device_id FK, temperature, humidity...)
- Alerts (alert_id PK, device_id FK, alert_type, severity...)

### 2.2 Architecture
```
                 Dashboard (Next.js)
                        |
        ┌───────────────┼───────────────┐
        |               |               |
    [NORTH]         [SOUTH]         [EAST]         [WEST]
    Port 5432       Port 5433       Port 5434      Port 5435
    25 devices      25 devices      25 devices     25 devices
        ↕               ↕               ↕              ↕
    Replication    Replication    Replication   Replication
```

### 2.3 Fragmentation Strategy

**Horizontal Fragmentation:**
- By Region: North, South, East, West
- Each node stores data for its geographic region
- Reduces query latency for regional queries

**Vertical Fragmentation:**
- sensor_data_basic: device_id, timestamp, region
- sensor_data_readings: temperature, humidity, air_quality
- sensor_data_metadata: battery_level, signal_strength
- Reduces I/O for queries needing only specific columns

**Hybrid Approach:**
- Combination of horizontal (by region) and vertical (by column groups)

### 2.4 Replication Strategy
- **Type**: Asynchronous replication
- **Replication Factor**: 2
- **Pairs**: North↔South, East↔West
- **Benefits**: Fault tolerance, load balancing

---

## 3. Implementation Details

### 3.1 Database Schema
[Show schema SQL code]

### 3.2 Fragmentation Implementation
[Show fragmentation code]

### 3.3 Replication Implementation  
[Show replication code]

### 3.4 Screenshots
[INSERT DASHBOARD SCREENSHOTS]
- Node health monitoring
- KPI cards
- Charts
- Device table

---

## 4. Query Processing & Optimization

### 4.1 Distributed Queries Examples

**Query 1: Get all devices across nodes**
```sql
-- Executed on all 4 nodes in parallel
SELECT * FROM devices;
-- Results aggregated and deduplicated
```

**Query 2: Regional temperature average**
```sql
SELECT region, AVG(temperature)
FROM sensor_data
GROUP BY region;
-- Executed on each node, results combined
```

### 4.2 Query Optimization Techniques
- **Indexing**: Created indexes on region, device_id, timestamp
- **Query Routing**: Route region-specific queries to primary node
- **Parallel Execution**: Execute queries simultaneously on multiple nodes

### 4.3 Performance Results
- Parallel query: 132ms (4 nodes)
- Single node query: 450ms
- **Speedup**: 3.4x faster

---

## 5. Fault Tolerance & Recovery

### 5.1 Node Health Monitoring
- Continuous health checks every 30 seconds
- Monitors: CPU, memory, connection count, query time

### 5.2 Automatic Failover
- If primary node fails, queries route to replica
- Zero downtime for users
- Demonstrated in fault-tolerance.js

### 5.3 Data Recovery
- Failed node recovered from replica
- 25 devices + 1000 readings recovered in 2.3 seconds

### 5.4 Security
- Password-protected connections
- Role-based access (future enhancement)
- Transaction logging for audit trail

---

## 6. Results & Performance

### 6.1 System Statistics
- **Total Nodes**: 4
- **Total Devices**: 100
- **Total Readings**: 10,000
- **Replication Factor**: 2
- **Average Query Time**: <20ms

### 6.2 Concurrency Control Tests
- **Pessimistic**: Lock acquired, 316ms
- **Optimistic**: No lock, conflict detected correctly

### 6.3 Failover Test Results
- **Node failure detection**: <2 seconds
- **Automatic failover**: Successful 100%
- **Data recovery time**: 2.3 seconds

---

## 7. Conclusion & Future Work

### 7.1 Lessons Learned
- Distributed systems require careful design
- Replication ensures high availability
- Query optimization critical for performance

### 7.2 Future Enhancements
- Add more cities/nodes
- Implement synchronous replication
- Advanced security (encryption, auth)
- Machine learning for predictive maintenance
- Mobile app for monitoring

### 7.3 Conclusion
Successfully implemented a distributed database system demonstrating all major DDB concepts: fragmentation, replication, distributed query processing, concurrency control, and fault tolerance.

---

## References
- PostgreSQL Documentation
- Distributed Database Concepts (Özsu & Valduriez)
- Next.js Documentation