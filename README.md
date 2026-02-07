# Timber: Enterprise Distributed Cloud Platform
<div align="center">

<img src="./frontend/assets/logo.png" height=300 width=300 alt="Timber Logo">

**The "Unbreakable" Cloud Standard: Hyper-scalable, Self-healing, and Zero-Trust.**

[![Architecture](https://img.shields.io/badge/Architecture-Enterprise%20v2.0-purple.svg)](./documentation/Timber_Enterprise_Architecture.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

[Enterprise Architecture](./documentation/Timber_Enterprise_Architecture.md) • [Dependencies](./DEPENDENCIES.md) • [Contributing](#contributing)

</div>

## 🚧 Current Development Status (Updated: Feb 8, 2026)

**Phase 2: The Storage Engine (In Progress)**

| Component | Status | Progress | Notes |
| :--- | :--- | :--- | :--- |
| **Monorepo** | ✅ Complete | 100% | `v2.0` Structure (Frontend/Backend) active. |
| **Frontend** | ⚠️ Partial | 30% | Skeleton Ready (`frontend/web`). Basic Dashboard UI implemented. needs API integration. |
| **Gateway** | ⚠️ Partial | 40% | Skeleton Ready (`backend/gateway`). `/api/upload/init` logic added. needs Auth middleware. |
| **Core Engine** | 🔨 Building | 20% | **Current Task**: Implemented Reed-Solomon Encoder & File Chunking. |

### 📋 detailed Todo List
- [x] **Phase 0: Foundation**
    - [x] Initialize Monorepo & Workspaces
    - [x] Set up React + Vite (`frontend/web`)
    - [x] Set up Node.js + Express (`backend/gateway`)
    - [x] Set up Go Module (`backend/core`)
- [ ] **Phase 1: Basic Logic**
    - [x] Dashboard UI (Dark Mode)
    - [x] Gateway Token Generation
    - [x] `cors` configuration
- [ ] **Phase 2: The Engine (Go)**
    - [x] **Step 1**: Implement Reed-Solomon Encoder
    - [x] **Step 2**: Implement File Chunking I/O
    - [x] **Step 3**: Implement QUIC Transport
    - [x] **Step 4**: Implement "Bifurcation" Protocol

---

## 🌟 Enterprise Architecture (Visualized)

Timber v2.0 is designed to be **Unbreakable**. Here is how the components interact:

### 1. High-Level Architecture
This diagram shows the flow from the User to the Edge Storage Nodes.

```mermaid
graph TD
    User((👤 Client)) -->|Upload Request| Gateway[🌍 Global API Gateway]
    
    subgraph "Control Plane (Node.js)"
        Gateway -->|Verify| Auth[🔐 Auth Service]
        Gateway -->|Command| CmdHandler[Command Handler]
        CmdHandler -->|Event| Kafka{Apache Kafka}
        Kafka -->|Consume| Projector[View Projector]
        Projector -->|Write| Redis[(Redis State)]
    end
    
    subgraph "Data Plane (Go)"
        User -->|QUIC Stream| EdgeSupervisor[🚀 Edge Supervisor]
        EdgeSupervisor -->|Split| Encoder[🧮 Erasure Encoder]
        Encoder -->|Shard 1| Node1[Output: Edge Node A]
        Encoder -->|Shard 2| Node2[Output: Edge Node B]
        Encoder -->|Shard N| NodeN[Output: Edge Node N]
    end
```

### 2. The "Bifurcation" Protocol
This is our secret sauce for security. Data is split *before* it leaves the client helper (or Edge Supervisor).

```mermaid
sequenceDiagram
    participant User
    participant Gateway
    participant EdgeNode
    participant Core

    User->>Gateway: 1. Request Upload Token
    Gateway-->>User: 2. Return Token + Sharding Config
    
    User->>User: 3. Bifurcate Data
    Note right of User: Split into A (90%) and B (10%)
    
    User->>EdgeNode: 4. Stream A (Encrypted Shards)
    User->>Core: 5. Stream B (Parity Blocks)
    
    Note over EdgeNode,Core: Even if all EdgeNodes fail, <br/>Data is recoverable from Core Parity.
```

### 3. Reed-Solomon Erasure Coding
How we prevent data loss without standard backups.

```mermaid
graph LR
    Input[📄 Input File (100MB)] --> Split{Sliding Window}
    Split --> D1[Data 1]
    Split --> D2[Data 2]
    Split --> D3[Data 3]
    Split --> P1[Parity 1]
    Split --> P2[Parity 2]
    
    style P1 fill:#f96,stroke:#333
    style P2 fill:#f96,stroke:#333
    
    D1 -.-> Network
    D2 -.-> Network
    D3 -.-> Network
    P1 -.-> Network
    P2 -.-> Network
    
    Note[If D2 is lost, D1 + D3 + P1 can reconstruct it!]
```

---

## 🛠️ Technology Stack (The "Hard" Way)

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Control Plane** | **Node.js + Kafka** | High-throughput event processing |
| **Data Plane** | **Go (Golang)** | Raw block storage & networking |
| **State** | **CockroachDB** | Geo-distributed strong consistency |
| **Orchestration** | **Kubernetes + Istio** | Zero-trust service mesh |
| **Observability** | **OpenTelemetry** | Distributed tracing |
| **Chaos** | **Chaos Mesh** | Continuous failure injection |

## 📚 Documentation
- **[📖 Enterprise Architecture v2.0](./documentation/Timber_Enterprise_Architecture.md)** - *Read this first!*
- [📦 Project Dependencies](./DEPENDENCIES.md)
- [🔧 API Reference (Protobufs)](./proto/README.md)
- [🔒 Security Pattern: Bifurcation](./docs/security.md)
- [🌪️ Chaos Engineering Guide](./docs/chaos.md)

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+
- Go 1.25+
- Docker & Docker Compose

### 2. Installation
```bash
# Install dependencies for Frontend & Gateway
npm install

# Install dependencies for Core (Go)
cd backend/core && go mod tidy
```

### 3. Running the Stack
```bash
# Start the Monorepo (Frontend + Gateway)
turbo run dev
```
