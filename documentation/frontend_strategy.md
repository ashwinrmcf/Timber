# 🌲 Timber Cloud: Frontend Strategy & Design System

## 🎯 **Vision: Professional, Sharp, Satisfying**
Timber Cloud aims to be the **AWS** of decentralized storage. The frontend experience must convey **trust**, **performance**, and **solidity**.

The user has explicitly requested a "Frontend First" approach for the remaining system components. We will build the **entire UI Shell** and all anticipated pages now, even if their backends are mocked or not yet implemented. This ensures the design is cohesive and won't require major refactors later.

---

## 🎨 **Design System: "The Silver Standard"**

### **1. Core Palette**
*   **Primary (Brand)**: `Silver / Metallic` (Headers, borders, accents).
*   **Backgrounds**:
    *   **Layer 0 (Canvas)**: `#050505` (Deep Black).
    *   **Layer 1 (Cards)**: `#0A0A0A` with `1px` border of `#333`.
*   **Typography**: `Inter` (UI) and `JetBrains Mono` (Data).

---

## 📱 **Site Map & Page Architecture**

We will implement the following pages immediately:

### **1. Dashboard (The "Command Center")**
*   **Status**: *Backend Partially Ready (Metrics are mocked)*.
*   **Purpose**: High-level overview of the user's storage empire.
*   **Components**:
    *   Global Health (Network Status).
    *   Usage Metrics (Storage Used, Bandwidth, Token Balance).
    *   Recent Activity Feed.

### **2. My Files (The "S3 Bucket" View)**
*   **Status**: *Backend Ready (Phase 3 Complete)*.
*   **Purpose**: Main file management interface.
*   **Components**:
    *   Sortable Data Table (Name, Size, Date, CID/Hash).
    *   File Preview Panel.
    *   Context Actions (Download, Share, Delete).

### **3. Node Network (The "EC2" View)**
*   **Status**: *Frontend Only (Backend to be built)*.
*   **Purpose**: Visualize the decentralized infrastructure.
*   **Components**:
    *   **World Map / Grid**: Visualizing the 14+ storage nodes.
    *   **Node List**: Table of active nodes with latency and uptime.
    *   **Add Node**: UI for users to register their own storage provider.

### **4. Wallet & Tokenomics (The "Billing" View)**
*   **Status**: *Frontend Only (Backend to be built)*.
*   **Purpose**: Manage subscription and earnings.
*   **Components**:
    *   Token Balance (TMBR).
    *   Transaction History.
    *   "Top Up" interface.

### **5. Settings & API Keys (The "IAM" View)**
*   **Status**: *Frontend Only*.
*   **Purpose**: Developer tools and access control.
*   **Components**:
    *   API Key Management.
    *   Gateway Configuration.
    *   Encryption Key Backup.

---

## 🏗️ **Technical Architecture**

1.  **Framework**: React 18 + Vite.
2.  **Router**: `React Router` (Crucial for multi-page app).
3.  **Styling**: Tailwind CSS.
4.  **Icons**: Lucide React.
5.  **State**: React Context (for global "Mock" state of future backends).

---

## 🚀 **Execution Plan (Phase 4)**

1.  **Setup**: Install Tailwind, Router, Lucide, Framer Motion.
2.  **Shell**: Build the `Layout` (Sidebar + Topbar) that wraps every page.
3.  **Pages**: Create the route structure and empty components for all 5 pages.
4.  **Implementation**:
    *   Migrate existing `App.tsx` logic into `My Files`.
    *   Build out `Dashboard`, `Node Network`, `Wallet`, and `Settings` using mock data.
