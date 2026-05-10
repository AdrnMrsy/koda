# Koda

## Project Overview

**Project Name:** Koda

**Version:** 1.0.0

**Platform:** Mobile (iOS / Android)

**Architecture Style:** Offline-First / Local-First / Edge AI computing

### **1.1 Purpose & Value Proposition**

This application is a privacy-centric, offline-first personal finance tracker. It leverages on-device Large Language Models (LLMs) to allow users to input transactions using natural language without sending sensitive financial data to cloud servers. The application guarantees zero data latency, zero API costs, and absolute data sovereignty.

---

## System Architecture

The application operates entirely within the sandboxed environment of the mobile device.

### **2.1 High-Level Data Flow**

1. **User Input:** The user provides text or voice input via the React Native UI.
2. **Local Inference:** The input is routed to the on-device LLM (e.g., Gemma 4B) to parse the unstructured text into a structured JSON payload (Amount, Category, Merchant).
3. **Validation layer:** The JSON payload is validated and sanitized to prevent malformed data or prompt injection.
4. **Local Persistence:** The structured data is securely written to an encrypted SQLite database via Expo SQLite.

---

## Technology Stack

### **3.1 Frontend & Core Framework**

* **Framework:** React Native with Expo.
* **State Management:** TanStack Query (React Query) for handling database loading states and caching.
* **Styling:** NativeWind (Tailwind CSS for React Native) or StyleSheet.

### **3.2 Database & Storage**

* **Database Engine:** Expo SQLite.
* **ORM / Query Builder:** Drizzle ORM (optional, for type-safe SQL queries) or raw SQL via `expo-sqlite`.

### **3.3 Artificial Intelligence**

* **Inference Engine:** MLC LLM (Machine Learning Compilation for local deployment).
* **Model:** Quantized Gemma (4B) or Llama 3.2 (1B/3B) optimized for mobile chips.

### **3.4 Security & Authentication**

* **Authentication:** `expo-local-authentication` (Biometrics: FaceID, TouchID, PIN).
* **Encryption:** SQLCipher (256-bit AES database encryption).
* **Key Management:** `expo-secure-store` (Hardware-backed keystore).

---

## Database Schema

The database is normalized to ensure data integrity and efficient querying on mobile hardware.

| **Table**        | **Column** | **Data Type** | **Constraints / Relations**    |
| ---------------------- | ---------------- | ------------------- | ------------------------------------ |
| **categories**   | `id`           | INTEGER             | PRIMARY KEY, AUTOINCREMENT           |
|                        | `name`         | TEXT                | NOT NULL, UNIQUE                     |
|                        | `type`         | TEXT                | CHECK(type IN ('income', 'expense')) |
|                        | `icon`         | TEXT                | NULLABLE                             |
| **transactions** | `id`           | INTEGER             | PRIMARY KEY, AUTOINCREMENT           |
|                        | `amount`       | REAL                | NOT NULL                             |
|                        | `description`  | TEXT                | NULLABLE                             |
|                        | `date`         | TEXT                | NOT NULL (ISO-8601 Format)           |
|                        | `category_id`  | INTEGER             | FOREIGN KEY -> categories(id)        |
|                        | `type`         | TEXT                | CHECK(type IN ('income', 'expense')) |
| **budgets**      | `id`           | INTEGER             | PRIMARY KEY, AUTOINCREMENT           |
|                        | `category_id`  | INTEGER             | FOREIGN KEY -> categories(id)        |
|                        | `amount_limit` | REAL                | NOT NULL                             |
|                        | `month_year`   | TEXT                | NOT NULL (Format: MM-YYYY)           |

---

## Core Features & Functional Requirements

### **5.1 AI-Powered Natural Language Parsing**

* **Requirement:** The system must accept strings (e.g., "I spent 500 on groceries at SM") and output a standardized JSON object.
* **Constraint:** The LLM must operate offline with a maximum response latency of < 3 seconds on modern hardware.

### **5.2 Offline CRUD Operations**

* **Requirement:** Users can Create, Read, Update, and Delete transactions and categories seamlessly without an internet connection.
* **Constraint:** Data must persist across app restarts and device reboots.

### **5.3 Financial Visualizations**

* **Requirement:** The dashboard must display total net worth, monthly budget progress, and spending trends using charts.

---

## Security Protocol

1. **Biometric Gate:** Upon launching or foregrounding the app, the system invokes local biometrics. Access to the UI is blocked until authentication succeeds.
2. **Data at Rest:** The SQLite `.db` file is encrypted using SQLCipher. The encryption key is randomly generated upon first installation and stored safely inside the device's Secure Enclave/Keystore.
3. **App Switcher Privacy:** When the app is pushed to the background, the UI is overlaid with a solid color or blur effect to prevent shoulder-surfing via the OS task manager.
4. **Output Sanitization:** All LLM outputs are treated as untrusted. The system strictly parses the output as JSON and casts data types before executing any `INSERT` or `UPDATE` queries.

---

## Development Phases

* **Phase 1: Foundation.** Setup Expo, configure SQLite database initialization, and build basic CRUD interfaces for transactions.
* **Phase 2: AI Integration.** Embed the local LLM SDK, configure the system prompt, and wire the text input to the database execution.
* **Phase 3: Visuals & Logic.** Implement budgeting logic, chart components, and dynamic category management.
* **Phase 4: Security & Polish.** Implement Biometrics, SecureStore, Dark Mode, and final performance optimizations.
