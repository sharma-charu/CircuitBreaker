CircuitBreaker – Cloud-Native E-Commerce API Gateway

This project focuses on building a cloud-native e-commerce system using a microservices architecture. The system consists of Product, Inventory, and Recommendation services, with Spring Cloud Gateway acting as the central entry point. Eureka will be used for service discovery, while Resilience4j will provide resilience features such as Circuit Breaker, Rate Limiting, and Bulkhead.

The project will also include a React-based monitoring dashboard to visualize service health and Circuit Breaker states. Micrometer Tracing and Zipkin will be integrated during the later stage for distributed request tracing.

Team Responsibilities

- Member 1 – Product Service
- Member 2 – Inventory Service
- Member 3 – Recommendation Service
- Member 4 – Gateway & Resilience
- Member 5 – Frontend & Monitoring

Initial Progress

Today, the team reviewed the project requirements, divided responsibilities among the members, created the required GitHub branches, and started the initial project setup. Each member will develop their assigned module in their respective branch and collaborate during integration and testing.

Technology Stack

- Java 21 / 25 & Spring Boot
- Spring Cloud Gateway
- Eureka Service Discovery
- Resilience4j (Circuit Breaker, Rate Limiter, Time Limiter)
- React + Vite (Resilience Dashboard UI)
- Central Cluster Orchestrator

---

## 🚀 One-Command Cluster Startup

You can now start **all 6 services** (`Eureka Server`, `API Gateway`, `Product Service`, `Inventory Service`, `Recommendation Service`, and `Resilience Dashboard UI`) using a single command:

### Option 1: Using npm (Recommended)
```bash
npm start
# or
npm run start:all
```

### Option 2: Using Node.js directly
```bash
node service-orchestrator.js
```

### Option 3: Double-Click on Windows
- Double-click **`start-all.bat`** to start everything.
- Double-click **`stop-all.bat`** to stop all background processes and clear ports.

### Option 4: PowerShell
```powershell
.\start-all.ps1
```

### ⚡ Interactive Keyboard Controls (in Orchestrator Console)
- Press **`s`** : Print live health status table of all microservices.
- Press **`o`** : Open the Resilience Dashboard in your default web browser (`http://localhost:5173`).
- Press **`r`** : Gracefully restart the entire cluster.
- Press **`q`** or **`Ctrl + C`** : Cleanly terminate all running microservices without orphaned background processes.

---

## 📡 Service Port Mapping

| Service Name | Port | Description | Health Endpoint |
|---|---|---|---|
| **Eureka Server** | `8761` | Netflix Eureka Service Discovery | `http://localhost:8761/actuator/health` |
| **API Gateway** | `8080` | Spring Cloud Gateway + Resilience4j | `http://localhost:8080/actuator/health` |
| **Product Service** | `8081` | Product Catalog & Inventory Link | `http://localhost:8081/actuator/health` |
| **Inventory Service** | `8082` | Stock Management & Chaos Simulator | `http://localhost:8082/actuator/health` |
| **Recommendation Service** | `8083` | AI Personalization + Fallback CB | `http://localhost:8083/actuator/health` |
| **Resilience Dashboard** | `5173` | React Dashboard UI | `http://localhost:5173` |

