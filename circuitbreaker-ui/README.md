# 🛡️ Circuit Breaker Monitoring Dashboard

A real-time, dark-mode React frontend for monitoring microservice resilience patterns built with **Spring Cloud Gateway**, **Resilience4j**, and **Netflix Eureka**.

---

## 🌐 Live Eureka Service Discovery

The Eureka Service Registry is deployed and active on Render:

- **Eureka Dashboard:** [https://circuit-breaker-s6d7.onrender.com](https://circuit-breaker-s6d7.onrender.com)
- **Eureka Service URL (for microservices):** `https://circuit-breaker-s6d7.onrender.com/eureka/`

### ⚙️ Microservice Configuration (`application.properties`)
Add the following to each Spring Boot microservice (`product-service`, `inventory-service`, `recommendation-service`, and `api-gateway`):

```properties
# Eureka Client Configuration
eureka.client.service-url.defaultZone=https://circuit-breaker-s6d7.onrender.com/eureka/
eureka.client.register-with-eureka=true
eureka.client.fetch-registry=true
```

---

## 🚀 Quick Start (Frontend)

### 1. Installation
Navigate to the `circuitbreaker-ui` directory and install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure your API Gateway URL:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
VITE_API_BASE_URL=http://localhost:8080
```

### 3. Running Locally
Start the Vite development server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Production Build
```bash
npm run build
```

---

## 📡 Backend Endpoints

The frontend connects to the Spring Cloud API Gateway at `VITE_API_BASE_URL` (default: `http://localhost:8080`) using the following endpoints:

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/actuator/health` | `GET` | Aggregated service health and Eureka discovery status |
| `/actuator/circuitbreakers` | `GET` | Resilience4j circuit breaker states for registered services |
| `/chaos/latency/{serviceName}` | `POST` | Injects deliberate delay/latency for chaos engineering demonstrations |

> **Tip:** If the gateway is not yet running or during local UI review, toggle **Simulation Mode** in the header to preview state transitions, live latency charts, and fallback UI displays.

---

## 🧩 Component Architecture

| Component | File Path | Description |
| :--- | :--- | :--- |
| **`Navbar`** | `src/components/Navbar.jsx` | Sticky navigation bar with branding, tab routing, and direct link to the live Render Eureka dashboard. |
| **`Dashboard`** | `src/pages/Dashboard.jsx` | Main monitoring view displaying summary statistics cards, simulation toggle, live polling (3s interval), and the responsive microservice fleet grid. |
| **`ServiceCard`** | `src/components/ServiceCard.jsx` | Dedicated card for each microservice (`product-service`, `inventory-service`, `recommendation-service`), showing health status, circuit breaker badge, fallback panel, latency history chart, and the **Trigger Latency** button. |
| **`CircuitBreakerBadge`** | `src/components/CircuitBreakerBadge.jsx` | State indicator badge with pulsing dot and smooth CSS transitions representing `CLOSED` (emerald), `OPEN` (rose), and `HALF_OPEN` (amber) states. |
| **`FallbackPanel`** | `src/components/FallbackPanel.jsx` | Notice panel appearing on a `ServiceCard` exclusively when its circuit breaker state is `OPEN`, showing *"Serving cached fallback: Top Sellers"*. |
| **`LatencyChart`** | `src/components/LatencyChart.jsx` | Responsive area chart using Recharts visualizing the last 20 latency readings with average latency and tooltips. |
| **`ToastContainer` / `Toast`** | `src/components/Toast.jsx` | Lightweight toast notification floating in the corner, broadcasting `<service> is now <state>` on every transition and auto-dismissing after 4 seconds. |
| **`History`** | `src/pages/History.jsx` | Chronological transition log table recording state changes, timestamps, and service transitions with localStorage persistence and clear actions. |
| **`useCircuitBreakerHistory`** | `src/hooks/useCircuitBreakerHistory.js` | Custom React hook managing transition event logging, localStorage persistence, and event broadcasting. |
| **`api.js`** | `src/api.js` | Centralized Axios HTTP client configuring `VITE_API_BASE_URL` with health, circuit breaker, and chaos latency injection functions. |

---

## 🚦 Circuit Breaker State Reference

* 🟢 **CLOSED**: Normal operation. Requests pass through directly to downstream services.
* 🔴 **OPEN**: Failure rate or slow call rate exceeded threshold. Gateway immediately short-circuits requests and serves the cached fallback response.
* 🟡 **HALF-OPEN**: Trial state after the wait duration expires. Allows a configurable number of test requests to determine if the downstream service has recovered.
