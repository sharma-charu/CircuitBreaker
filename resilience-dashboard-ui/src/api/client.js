/**
 * ResilienceMesh API Client
 * Centralized client connecting to Spring Cloud Gateway (Port 8080)
 * with Resilience4j Actuator parsers and fallback data simulators.
 */

export const getGatewayUrl = () => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('resilience_gateway_url') : null;
  if (saved && saved !== 'http://localhost:8080' && saved !== 'http://localhost:8090' && saved.trim() !== '') return saved;
  if (import.meta.env.VITE_API_GATEWAY_URL) return import.meta.env.VITE_API_GATEWAY_URL;
  return '';
};

export const setGatewayUrl = (url) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('resilience_gateway_url', url.trim());
  }
};

// Helper to time API calls with high accuracy
async function timedFetch(url, options = {}) {
  const startTime = performance.now();
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const duration = Math.round(performance.now() - startTime);
    let data = null;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    // Detect if this is a Spring Cloud Gateway fallback response
    const isFallback = (
      (data && typeof data === 'object' && data.status === 'fallback') ||
      url.includes('/fallback/')
    );

    return {
      ok: response.ok,
      status: response.status,
      duration,
      data,
      isFallback,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    return {
      ok: false,
      status: 0,
      duration,
      error: err.message,
      data: null,
      isFallback: false,
      timestamp: new Date().toISOString()
    };
  }
}

// ----------------------------------------------------
// Actuator & Circuit Breaker Telemetry
// ----------------------------------------------------

export async function fetchHealth() {
  const gateway = getGatewayUrl();
  const res = await timedFetch(`${gateway}/actuator/health`);
  return res;
}

export async function fetchCircuitBreakers() {
  const gateway = getGatewayUrl();
  const res = await timedFetch(`${gateway}/actuator/circuitbreakers`);
  return res;
}

export async function fetchCircuitBreakerEvents() {
  const gateway = getGatewayUrl();
  const res = await timedFetch(`${gateway}/actuator/circuitbreakerevents`);
  return res;
}

export async function fetchGatewayRoutes() {
  const gateway = getGatewayUrl();
  const res = await timedFetch(`${gateway}/actuator/gateway/routes`);
  return res;
}

// ----------------------------------------------------
// Business Microservices Operations
// ----------------------------------------------------

export async function fetchProducts() {
  const gateway = getGatewayUrl();
  const res = await timedFetch(`${gateway}/products`);
  return res;
}

export async function fetchProductById(id) {
  const gateway = getGatewayUrl();
  const res = await timedFetch(`${gateway}/products/${id}`);
  return res;
}

export async function createProduct(productData) {
  const gateway = getGatewayUrl();
  const res = await timedFetch(`${gateway}/products`, {
    method: 'POST',
    body: JSON.stringify(productData)
  });
  return res;
}

export async function fetchRecommendations() {
  const gateway = getGatewayUrl();
  const res = await timedFetch(`${gateway}/api/recommendations`);
  return res;
}

export async function fetchInventory(skuCode) {
  const gateway = getGatewayUrl();
  const res = await timedFetch(`${gateway}/inventory/${skuCode}`);
  return res;
}

// ----------------------------------------------------
// Chaos Injection & Simulation Controls
// ----------------------------------------------------

/**
 * Triggers latency on the Recommendation Service or Inventory Service
 */
export async function triggerChaosDelay(target = 'recommendation', durationMs = 3000) {
  const gateway = getGatewayUrl();
  let url = '';
  if (target === 'recommendation') {
    url = `${gateway}/api/recommendations/delay`;
  } else if (target === 'inventory') {
    url = `${gateway}/inventory/simulate/delay?durationMs=${durationMs}`;
  } else {
    url = `${gateway}/products?delay=${durationMs}`;
  }

  return await timedFetch(url);
}

/**
 * Triggers a 500 error on the Recommendation or Inventory Service
 */
export async function triggerChaosFault(target = 'recommendation', statusCode = 500) {
  const gateway = getGatewayUrl();
  let url = '';
  if (target === 'recommendation') {
    url = `${gateway}/api/recommendations/failure`;
  } else if (target === 'inventory') {
    url = `${gateway}/inventory/simulate/fault?statusCode=${statusCode}`;
  } else {
    url = `${gateway}/products/fault?code=${statusCode}`;
  }

  return await timedFetch(url);
}

/**
 * Rapidly fires a burst of concurrent requests to test Rate Limiting / Bulkhead
 */
export async function fireStressBurst(endpoint = '/api/recommendations', count = 10) {
  const gateway = getGatewayUrl();
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(timedFetch(`${gateway}${endpoint}`));
  }
  const results = await Promise.all(promises);
  return results;
}

// ----------------------------------------------------
// Mock Data (Graceful Offline Demo)
// ----------------------------------------------------

export const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Quantum HyperX Gaming Laptop',
    description: '16-core CPU, RTX 4090, 64GB DDR5, 240Hz OLED Display',
    price: 2499.99,
    quantity: 18,
    category: 'Electronics',
    sku: 'LAP-QX-90',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: 2,
    name: 'AcousticPro Studio Headphones',
    description: 'Active Noise Cancelling, Spatial Audio 3D, 40h Battery',
    price: 349.99,
    quantity: 42,
    category: 'Audio',
    sku: 'AUD-AP-30',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: 3,
    name: 'UltraVision 4K OLED Monitor 34"',
    description: 'Curved Ultrawide, 175Hz, 0.03ms Response, HDR1000',
    price: 999.00,
    quantity: 12,
    category: 'Displays',
    sku: 'MON-UV-34',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: 4,
    name: 'Mechanical Ergonomic Keyboard',
    description: 'Hot-swappable tactile switches, Wireless BT 5.2, RGB Backlit',
    price: 159.50,
    quantity: 65,
    category: 'Peripherals',
    sku: 'KEY-ME-88',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: 5,
    name: 'Precision Wireless Master Mouse',
    description: '26K DPI Optical Sensor, Ergonomic Thumb Rest, Fast Charge',
    price: 89.99,
    quantity: 90,
    category: 'Peripherals',
    sku: 'MOU-PW-26',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: 6,
    name: 'Smart Ambient Desk Bar Light',
    description: 'Screen-glare free illumination, Auto-dimming sensor, App control',
    price: 69.00,
    quantity: 34,
    category: 'Lighting',
    sku: 'LGT-SA-01',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  }
];

export const MOCK_FALLBACK_RECOMMENDATIONS = [
  {
    id: 101,
    productId: 2,
    productName: 'AcousticPro Studio Headphones',
    reason: '🔥 Top Seller - 2,400+ Sold Today',
    category: 'Audio',
    score: 0.99,
    isFallback: true
  },
  {
    id: 102,
    productId: 4,
    productName: 'Mechanical Ergonomic Keyboard',
    reason: '⭐ Community Choice #1',
    category: 'Peripherals',
    score: 0.96,
    isFallback: true
  },
  {
    id: 103,
    productId: 5,
    productName: 'Precision Wireless Master Mouse',
    reason: '⚡ Frequent Bundle with Laptop',
    category: 'Peripherals',
    score: 0.94,
    isFallback: true
  }
];

export const MOCK_LIVE_RECOMMENDATIONS = [
  {
    id: 201,
    productId: 1,
    productName: 'Quantum HyperX Gaming Laptop',
    reason: '🤖 AI Personalized: Matches your high-compute browsing profile',
    category: 'Electronics',
    score: 0.98,
    isFallback: false
  },
  {
    id: 202,
    productId: 3,
    productName: 'UltraVision 4K OLED Monitor 34"',
    reason: '🤖 AI Personalized: Frequently viewed by developers in your region',
    category: 'Displays',
    score: 0.95,
    isFallback: false
  },
  {
    id: 203,
    productId: 2,
    productName: 'AcousticPro Studio Headphones',
    reason: '🤖 AI Personalized: Complements your selected workstation gear',
    category: 'Audio',
    score: 0.92,
    isFallback: false
  }
];
