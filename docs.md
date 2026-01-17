# Taobin Internship Exam - Pub-Sub Machine System
> This repository contains the solution for the **Taobin Internship Exam**. It implements a Publish-Subscribe mechanism to manage vending machine events, including sales, refills, and stock level monitoring.

---

## Features
- **Core Pub-Sub System:** Fully implemented `subscribe`, `unsubscribe`, and `publish` methods.
- **Event Ordering (FIFO):** Implemented a **Queue System** to ensure events are processed in the correct order (Breadth-First), preventing recursive event handling issues.
- **Stock Management:**
  - `MachineSaleEvent`: Decreases stock.
  - `MachineRefillEvent`: Increases stock.
- **Smart Alerts (Threshold Logic):**
  - `LowStockWarningEvent`: Fires **only once** when stock drops below 3.
  - `StockLevelOkEvent`: Fires **only once** when stock rises back to 3 or above.
- **Abstraction:**
  - Implemented **`MachineRepository`** to decouple data access logic from business logic.

## Project Structure

The project is contained within a single entry file for simplicity, but logically structured as follows:

```text
 simple-pubsub
 |- app.ts              # Main Application (Interfaces, Classes, Logic, and Simulation)
 |- docs.md             # Contain the Information of this project
 |- package.json        # Dependencies
 |- tsconfig.json       # TypeScript Configuration
 |- README.md           # Instruction from Main Repository
 ```
## How to run

> Require: Node.js

### 1. Installation
Install the required dependencies by using this command in **Command Prompt Terminal**
```bash
npm install
```

### 2. Running
You can run the TypeScript file directly using tsx (recommended) or ts-node
``` bash
npx tsx app.ts
```

## Test Scenario
The app.ts includes a simulation script that:
- Creates 3 random machines.
- Generates 10 random Sale/Refill events.
- Specific Test Case: Creates a dedicated test machine (testlowevent) to manually verify the Low Stock and Stock OK logic.

---

Submitted by: `Pimthida B.`