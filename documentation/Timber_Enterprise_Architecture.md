# Timber: Enterprise Distributed Cloud Platform
## Architecture Specification v2.0 ("The Unbreakable Standard")

### Executive Summary

Timber v2.0 represents an evolution from a standard distributed storage system to a hyper-scalable, antifragile enterprise cloud platform. This architecture is designed with a "Zero Trust, Zero Downtime" philosophy, utilizing advanced patterns like CQRS, Event Sourcing, and Chaos Engineering to ensure resilience at a global scale.

---

## 1. Deep Component Analysis

### 1.1 The Control Plane (The "Brain")
The Control Plane is responsible for metadata management, user authentication, and orchestration. It **never** touches the actual file data, only the metadata (file locations, permissions, implementation details).

*   **Global API Gateway (Kong/Nginx)**: The single entry point.
    *   *Role*: Handles SSL termination, Rate Limiting (10,000 req/s), and Route Dispatching.
    *   *Why*: Protects internal microservices from DDoS and organizes traffic.
*   **Command API (Node.js)**:
    *   *Role*: Accepts "Write" operations (e.g., "Upload File", "Create User"). It validates the request and pushes an Event to Kafka.
    *   *Why Node.js*: Extremely fast I/O for handling thousands of concurrent connections.
*   **Event Bus (Apache Kafka)**:
    *   *Role*: The central nervous system. Stores every state change as an immutable event log.
    *   *Why*: Allows us to replay history if a database crashes. Decouples services.
*   **View Projectors (Go)**:
    *   *Role*: Reads events from Kafka and updates the "Read Databases" (Redis/Elasticsearch).
    *   *Why Go*: High performance processing of millions of events per second.

### 1.2 The Data Plane (The "Muscle")
The Data Plane handles the heavy lifting of storage, encryption, and transfer.

*   **Edge Supervisor (Go Daemon)**:
    *   *Role*: Runs on the user's device (consumer PC/Mobile). Manages local disk space.
    *   *Key Feature*: **Polymorphic Storage**. It can store "Hot" data on NVMe SSDs and "Cold" data on HDDs automatically.
*   **Protocol**: **QUIC (HTTP/3)**:
    *   *Role*: Transport layer for massive file transfers.
    *   *Why*: Standard TCP has "Head-of-Line Blocking" (one lost packet stops everything). QUIC runs over UDP and fixes this, making uploads 30% faster on weak Wi-Fi.
*   **Erasure Coding Engine**:
    *   *Role*: Splits files into 14 shards (10 Data + 4 Parity).
    *   *Math*: Reed-Solomon Algorithms.
    *   *Resilience*: You can lose ANY 4 shards and still recover the file.

### 1.3 The Consensus Layer (The "Truth")
*   **CockroachDB**:
    *   *Role*: Stores the "Source of Truth" (User Balances, File Owners).
    *   *Why*: It is a Distributed SQL database that survives entire datacenter outages.

---

## 2. Technology Stack Rationale

| Component | Technology | Why this specific choice? |
| :--- | :--- | :--- |
| **Edge Runtime** | **Go (Golang)** | **Concurrency**: Goroutines allow handling thousands of connections with minimal RAM. **Static Binary**: Compiles to a single file (no "npm install" on user devices). |
| **API Logic** | **Node.js** | **Speed**: Fastest development cycle for JSON-heavy APIs. **Ecosystem**: Best libraries for auth (Passport) and validation (Zod). |
| **Event Bus** | **Kafka** | **Scale**: Proven to handle Trillions of messages/day (LinkedIn/Uber use it). |
| **State Store** | **CockroachDB** | **Survival**: You can kill a node, and it auto-rebalances. Traditional MySQL cannot do this easily. |
| **Cache** | **Redis Cluster** | **Latency**: Sub-millisecond access for "Hot" metadata (e.g., "Where is my file?"). |
| **Secret Mgmt** | **Vault** | **Security**: Eliminates "hardcoded passwords". Apps request secrets at runtime. |
| **Frontend** | **React + Vite** | **User Experience**: The standard for high-performance SPAs. |

---

## 3. Step-by-Step Implementation Guide (Team of 4)

### Phase 1: The "Iron Skeleton" (Weeks 1-2)
**Goal**: Get the Monorepo, Docker, and Basic Communication working.

*   **Architect (You)**:
    1.  Initialize **Nx Monorepo**.
    2.  Set up **Docker Compose** (Kafka, CockroachDB, Redis).
    3.  Define **Protobuf Contracts** (`proto/system.proto`).
*   **DevOps (Team Member 4)**:
    1.  Create `infrastructure/terraform` for AWS S3 (Backup).
    2.  Set up **CI Pipeline** (GitHub Actions) to check lint/build.
*   **Backend (Team Member 3)**:
    1.  Build **Gateway Service** (Node.js) that talks to Kafka.
*   **Frontend (Team Member 2)**:
    1.  Initialize **React Dashboard** (Vite).

### Phase 2: The Data Engine (Weeks 3-5)
**Goal**: Make it possible to upload a file and store it.

*   **Architect (You)**:
    1.  Implement **Reed-Solomon** in Go (`pkg/erasure`).
    2.  Build **Edge Supervisor** that accepts chunks via gRPC.
*   **Backend (Team Member 3)**:
    1.  Implement **File Service** (Node) -> Writes "FileCreated" event to Kafka.
*   **Frontend (Team Member 2)**:
    1.  Build **Upload UI** (Drag & Drop) -> Calls Gateway.

### Phase 3: The "Unbreakable" Logic (Weeks 6-8)
**Goal**: Add Resilience and Self-Healing.

*   **Architect (You)**:
    1.  Implement **QUIC Transport** using `quic-go`.
    2.  Write **Chaos Monkey** script (kills random Edge nodes).
*   **DevOps (Team Member 4)**:
    1.  Deploy **Prometheus + Grafana** for monitoring.
    2.  Set up **AlertManager** (Slack alerts if node dies).
*   **Backend (Team Member 3)**:
    1.  Implement **Billing Service** (Stripe) listening to Kafka.

### Phase 4: Polish & Launch (Weeks 9-12)
**Goal**: UI Polish, Documentation, and Final Presentation.

*   **All Hands**:
    1.  Bug fixing.
    2.  Writing `docs/` for the final report.
    3.  Recording the Demo Video.

---

## 4. Security Architecture: Zero Trust

### 4.1 Implementation
1.  **mTLS Everywhere**: Every service-to-service call is authenticated via mutual TLS certificates, rotated hourly by Cert-Manager.
2.  **Spiffe/Spire**: Identity framework for workloads. A pod is identified by a cryptographic signature, not an IP address.
3.  **Hardware Attestation**: Edge nodes must sign challenges using TPM 2.0 chips to prove effective hardware isolation.

### 4.2 The "Bifurcation" Protocol
Data is split into two streams at the client:
1.  **Stream A (90%)**: High-entropy encrypted chunks -> Stored on Consumer Edge Devices.
2.  **Stream B (10%)**: Parity/Recovery blocks -> Stored in Enterprise Core (AWS/GCP).
*result*: Even if all Edge nodes vanish, data is recoverable from Core parity (albeit slowly).

---

## 5. Scalability & Resilience Patterns

### 5.1 Chaos Engineering
*   **Chaos Mesh**: Installed in the Production cluster.
*   **"The Monkey"**:
    *   *Pod Kill*: Randomly kills pods every hour.
    *   *Network Partition*: Simulates 50% packet loss between regions.
    *   *Time Skew*: Simulates clock drift to test consensus safety.

### 5.2 Auto-Scaling
*   **KEDA (Kubernetes Event-Driven Autoscaling)**: Scale pods based on Kafka Lag, not just CPU.
    *   *Scenario*: If 1M users upload simultaneously, `Lag` spikes -> KEDA spins up 500 `Storage-Ingestor` pods instantly.

---

*Verified by: Timber Architecture Council*
