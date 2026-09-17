import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

/**
 * Fetch health status of services from Spring Boot Actuator
 */
export const getServiceHealth = () => {
  return api.get('/actuator/health');
};

/**
 * Fetch Circuit Breaker states from Spring Boot Actuator / Resilience4j
 */
export const getCircuitBreakerStates = () => {
  return api.get('/actuator/circuitbreakers');
};

/**
 * Trigger latency injection for a specific microservice (Chaos engineering)
 * POSTs to /chaos/latency/{serviceName}
 * @param {string} serviceName - e.g. 'recommendation-service', 'product-service', 'inventory-service'
 */
export const triggerLatency = (serviceName) => {
  return api.post(`/chaos/latency/${encodeURIComponent(serviceName)}`);
};

export default api;
