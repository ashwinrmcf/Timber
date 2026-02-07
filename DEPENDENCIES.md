# Project Dependencies

This project uses **Node.js** and **Go**, so we don't use a Python `requirements.txt`.
Here is the equivalent for each part of the system:

## 1. Backend API (Node.js)
**File**: `backend/gateway/package.json`
*   `express`: Web Server Framework.
*   `ksuid`: K-Sortable Unique IDs (better than UUIDs).
*   `cors`: Cross-Origin Resource Sharing.
*   `typescript`: Static typing compiler.

## 2. Frontend (React)
**File**: `frontend/web/package.json`
*   `react`: UI Library.
*   `vite`: Build tool.
*   `lucide-react`: Icons.

## 3. Core Engine (Go)
**File**: `backend/core/go.mod`
*   `github.com/klauspost/reedsolomon`: Erasure Coding library.
*   `github.com/quic-go/quic-go`: HTTP/3 Transport protocol.

## 4. Root Tools (DevOps)
**File**: `package.json`
*   `turbo`: Monorepo build system.
