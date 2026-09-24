import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import StorefrontView from './components/StorefrontView';
import ChaosLabView from './components/ChaosLabView';
import TopologyView from './components/TopologyView';
import HealthDiscoveryView from './components/HealthDiscoveryView';
import TelemetryAuditView from './components/TelemetryAuditView';
import { 
  fetchHealth, 
  fetchCircuitBreakers, 
  fetchCircuitBreakerEvents, 
  fetchProducts, 
  fetchRecommendations,
  triggerChaosDelay,
  MOCK_PRODUCTS,
  MOCK_LIVE_RECOMMENDATIONS,
  MOCK_FALLBACK_RECOMMENDATIONS
} from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('store');
  const [cbState, setCbState] = useState('CLOSED');
  const [isOnline, setIsOnline] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // Data States
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [recommendations, setRecommendations] = useState(MOCK_LIVE_RECOMMENDATIONS);
  const [recommendationsFallback, setRecommendationsFallback] = useState(false);
  const [recommendationLatency, setRecommendationLatency] = useState(42);
  const [healthData, setHealthData] = useState(null);
  const [cbEvents, setCbEvents] = useState([]);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [slidingWindow, setSlidingWindow] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const prevCbStateRef = useRef(cbState);

  const showToast = (title, message, type = 'info') => {
    setToastMessage({ title, message, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const addTelemetryLog = (logEntry) => {
    setTelemetryLogs(prev => [
      {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        ...logEntry
      },
      ...prev.slice(0, 100)
    ]);
  };

  // Central Polling & Sync Function
  const syncClusterState = useCallback(async () => {
    try {
      // 1. Fetch Health
      const healthRes = await fetchHealth();
      const online = healthRes.ok || healthRes.status === 200 || healthRes.status === 503;
      setIsOnline(online);
      if (healthRes.data) {
        setHealthData(healthRes.data);
      }

      // 2. Fetch Circuit Breakers Actuator
      const cbRes = await fetchCircuitBreakers();
      let extractedState = null;

      if (cbRes.ok && cbRes.data) {
        const cbs = cbRes.data.circuitBreakers || cbRes.data;
        if (Array.isArray(cbs)) {
          const recCB = cbs.find(c => c.name?.toLowerCase().includes('recommendation') || c.name === 'recommendationCB');
          if (recCB) extractedState = recCB.state;
        } else if (typeof cbs === 'object') {
          const key = Object.keys(cbs).find(k => k.toLowerCase().includes('recommendation') || k === 'recommendationCB');
          if (key) {
            extractedState = typeof cbs[key] === 'string' ? cbs[key] : cbs[key].state;
          }
        }
      }

      // Fallback: Check health actuator details
      if (!extractedState && healthRes.data?.components?.circuitBreakers?.details) {
        const details = healthRes.data.components.circuitBreakers.details;
        const key = Object.keys(details).find(k => k.toLowerCase().includes('recommendation'));
        if (key && details[key].details?.state) {
          extractedState = details[key].details.state;
        }
      }

      if (extractedState) {
        const normalized = extractedState.toUpperCase();
        setCbState(normalized);
        if (normalized !== prevCbStateRef.current) {
          if (normalized === 'OPEN') {
            showToast('⚡ Circuit Breaker Tripped!', 'Recommendation service is overwhelmed. Instant cached fallback is active.', 'danger');
            addTelemetryLog({ type: 'danger', message: 'Resilience4j Transition: CLOSED -> OPEN (Threshold Exceeded)' });
          } else if (normalized === 'HALF_OPEN') {
            showToast('🟡 Circuit Half-Open', 'Testing recovery with trial canary requests.', 'warning');
            addTelemetryLog({ type: 'warning', message: 'Resilience4j Transition: OPEN -> HALF_OPEN (Probing)' });
          } else if (normalized === 'CLOSED') {
            showToast('🟢 Circuit Closed', 'Downstream service recovered. Full traffic restored.', 'success');
            addTelemetryLog({ type: 'success', message: 'Resilience4j Transition: HALF_OPEN -> CLOSED (Restored)' });
          }
          prevCbStateRef.current = normalized;
        }
      }

      // 3. Fetch Circuit Breaker Events
      const eventsRes = await fetchCircuitBreakerEvents();
      if (eventsRes.ok && eventsRes.data?.circuitBreakerEvents) {
        setCbEvents(eventsRes.data.circuitBreakerEvents);
      }

      // 4. Fetch Products if live
      if (online) {
        const prodRes = await fetchProducts();
        if (prodRes.ok && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
          const mergedProducts = prodRes.data.map(liveProd => {
            const mock = MOCK_PRODUCTS.find(m => m.id === liveProd.id || m.name.toLowerCase() === liveProd.name.toLowerCase()) || {};
            return {
              ...mock,
              ...liveProd,
              image: liveProd.image || mock.image,
              category: liveProd.category || mock.category || 'Electronics',
              sku: liveProd.sku || mock.sku || `SKU-${liveProd.id}`
            };
          });
          setProducts(mergedProducts);
        }
      }

      setLastUpdated(Date.now());
    } catch (err) {
      console.warn('Telemetry sync cycle error:', err);
    }
  }, []);

  // Fetch Recommendations with Latency Calculation
  const loadRecommendations = useCallback(async () => {
    const res = await fetchRecommendations();
    setRecommendationLatency(res.duration || 10);

    if (res.ok && res.data) {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setRecommendations(res.data);
        setRecommendationsFallback(false);
      } else if (res.data.status === 'fallback' || res.isFallback) {
        setRecommendations(MOCK_FALLBACK_RECOMMENDATIONS);
        setRecommendationsFallback(true);
      } else {
        setRecommendations(MOCK_LIVE_RECOMMENDATIONS);
        setRecommendationsFallback(false);
      }
    } else {
      // Offline fallback demo
      if (cbState === 'OPEN') {
        setRecommendations(MOCK_FALLBACK_RECOMMENDATIONS);
        setRecommendationsFallback(true);
        setRecommendationLatency(6);
      } else {
        setRecommendations(MOCK_LIVE_RECOMMENDATIONS);
        setRecommendationsFallback(false);
        setRecommendationLatency(42);
      }
    }
  }, [cbState]);

  // Handle Quick Chaos Trigger from Storefront
  const handleTriggerChaos = async (service, type) => {
    addTelemetryLog({ type: 'warning', message: `Triggered ${type} chaos on ${service}-service` });
    if (type === 'delay') {
      await triggerChaosDelay(service, 3000);
    }
    // Update sliding window representation
    setSlidingWindow(prev => ['FAILED', ...prev.slice(0, 9)]);
    await syncClusterState();
    await loadRecommendations();
  };

  // Initial Load & Polling Timer
  useEffect(() => {
    syncClusterState();
    loadRecommendations();
  }, [syncClusterState, loadRecommendations]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      syncClusterState();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, syncClusterState]);

  return (
    <div className="app-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast-banner toast-${toastMessage.type} animate-fade-in`}>
          <div className="toast-content">
            <strong>{toastMessage.title}</strong>
            <p>{toastMessage.message}</p>
          </div>
          <button className="toast-close" onClick={() => setToastMessage(null)}>×</button>
        </div>
      )}

      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cbState={cbState}
        isOnline={isOnline}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        onManualRefresh={() => {
          syncClusterState();
          loadRecommendations();
        }}
        lastUpdated={lastUpdated}
      />

      {/* Main Viewport */}
      <main className="app-container mt-6">
        {activeTab === 'store' && (
          <StorefrontView
            products={products}
            recommendations={recommendations}
            recommendationsFallback={recommendationsFallback || cbState === 'OPEN'}
            recommendationLatency={recommendationLatency}
            cbState={cbState}
            onTriggerChaos={handleTriggerChaos}
            onRefreshRecommendations={loadRecommendations}
          />
        )}

        {activeTab === 'chaos' && (
          <ChaosLabView
            cbState={cbState}
            onManualRefresh={() => {
              syncClusterState();
              loadRecommendations();
            }}
            addTelemetryLog={addTelemetryLog}
          />
        )}

        {activeTab === 'topology' && (
          <TopologyView
            cbState={cbState}
            healthData={healthData}
            slidingWindow={slidingWindow}
          />
        )}

        {activeTab === 'health' && (
          <HealthDiscoveryView
            healthData={healthData}
            isOnline={isOnline}
            cbState={cbState}
            onRefresh={syncClusterState}
          />
        )}

        {activeTab === 'telemetry' && (
          <TelemetryAuditView
            telemetryLogs={telemetryLogs}
            cbEvents={cbEvents}
            onClearLogs={() => setTelemetryLogs([])}
          />
        )}
      </main>

      <style>{`
        .mt-6 {
          margin-top: 24px;
        }
        .toast-banner {
          position: fixed;
          top: 80px;
          right: 24px;
          z-index: 1000;
          padding: 14px 20px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(12px);
          max-width: 420px;
        }
        .toast-danger {
          background: rgba(239, 68, 68, 0.95);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .toast-warning {
          background: rgba(245, 158, 11, 0.95);
          color: #0f172a;
          border: 1px solid rgba(0, 0, 0, 0.2);
        }
        .toast-success {
          background: rgba(16, 185, 129, 0.95);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .toast-content strong {
          display: block;
          font-size: 0.9rem;
          margin-bottom: 2px;
        }
        .toast-content p {
          font-size: 0.775rem;
          opacity: 0.9;
          line-height: 1.3;
        }
        .toast-close {
          background: transparent;
          border: none;
          color: inherit;
          font-size: 1.25rem;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
