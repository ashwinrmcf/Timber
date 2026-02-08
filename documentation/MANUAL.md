# 📘 Timber Developer Manual

This guide explains how to run the Timber Monorepo locally for development.

## 1. Prerequisites

Before you start, ensure you have the following installed:

*   **Node.js**: v18 or higher (Authentication & Gateway)
*   **Go**: v1.21 or higher (Storage Engine)
*   **Git**: Version Control

## 2. Project Structure

The project is a Monorepo split into two main areas:

| Folder | Purpose | Tech Stack |
| :--- | :--- | :--- |
| **`frontend/web`** | The User Dashboard | React + Vite |
| **`backend/gateway`** | The API Gateway (Entry Point) | Node.js + Express |
| **`backend/core`** | The Storage Engine (Logic) | Go (Golang) |

## 3. Installation

You need to install dependencies for both the Frontend (JS) and the Backend (Go).

### Step 3.1: Install Node.js Dependencies
Run this from the **Root** of the project:
```bash
npm install
```

### Step 3.2: Install Go Dependencies
Run this inside `backend/core`:
```bash
cd backend/core
go mod tidy
cd ../..
```

## 4. Running the Project

We use `turbo` to run everything at once.

### Option A: Run Everything (Recommended)
From the **Root** folder:
```bash
npm run dev
```
*   This starts the React Dashboard at `http://localhost:5173`
*   This starts the Node.js Gateway at `http://localhost:8080`
*   **Note**: You must run the Go backend separately for now (see Option B).

### Option B: Run Services Individually

**1. Run Frontend (React)**
```bash
cd frontend/web
npm run dev
```

**2. Run Gateway (Node.js)**
```bash
cd backend/gateway
npm run dev
```

**3. Run Storage Node (Go)**
```bash
cd backend/core
.\start_storage.bat
```
*   **Note**: This script uses the custom Go path on your machine.
*   It listens on `:8081` (HTTP) and `:4433` (QUIC).

## 5. Typical Workflow

1.  **Open the Dashboard**: Go to `http://localhost:5173`.
2.  **Login**: Click "Connect Wallet".
3.  **Upload**: Drag a file into the dropzone.
    *   The Frontend calls `POST http://localhost:8080/api/upload/init`.
    *   The Gateway returns a unique `uploadToken`.
    *   (Coming Soon): The Frontend uses this token to stream data to `localhost:4433` (Go Node).

## 6. Troubleshooting

*   **"Go command not found"**: Add `C:\Program Files\Go\bin` to your PATH.
*   **"Port 8080 in use"**: Kill any running node processes or change `PORT` in `.env`.
*   **"QUIC connection failed"**: Ensure your firewall allows UDP on port 4433.
