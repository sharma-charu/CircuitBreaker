import React from 'react';
import { 
  Network, 
  Server, 
  ShieldCheck, 
  ShieldAlert, 
  Radio, 
  ArrowRight, 
  Cpu, 
  Layers, 
  Database,
  CheckCircle,
  AlertTriangle,
  Zap,
  Clock,
  Gauge,
  XCircle
} from 'lucide-react';

export default function TopologyView({
  cbState = 'CLOSED',
  healthData = {},
  slidingWindow = []
}) {
  // Helper to extract Eureka instance count dynamically from Actuator health payload
  const getEurekaInstanceCount = (serviceName) => {
    if (!healthData) return 0;
    
    const eurekaApps = 
      healthData.components?.discoveryComposite?.components?.eureka?.details?.applications ||
      healthData.components?.eureka?.details?.applications ||
      healthData.details?.eureka?.details?.applications;
      
    if (eurekaApps) {
      const matchKey = Object.keys(eurekaApps).find(
        k => k.toUpperCase().replace(/[-_]/g, '') === serviceName.toUpperCase().replace(/[-_]/g, '')
      );
      if (matchKey) {
        return eurekaApps[matchKey] || 0;
      }
    }

    const reactiveServices = 
      healthData.components?.reactiveDiscoveryClients?.components?.['Spring Cloud Eureka Reactive Discovery Client']?.details?.services ||
      healthData.components?.discoveryComposite?.components?.discoveryClient?.details?.services;
      
    if (Array.isArray(reactiveServices)) {
      const isFound = reactiveServices.some(
        s => s.toUpperCase().replace(/[-_]/g, '') === serviceName.toUpperCase().replace(/[-_]/g, '')
      );
      if (isFound) return 1;
    }

    return 0;
  };

  const recInstances = getEurekaInstanceCount('RECOMMENDATION-SERVICE');
  const prodInstances = getEurekaInstanceCount('PRODUCT-SERVICE');
  const invInstances = getEurekaInstanceCount('INVENTORY-SERVICE');

  // 10-slot sliding window buffer
  const bufferSlots = Array(10).fill(null).map((_, idx) => {
    if (slidingWindow && slidingWindow[idx]) {
      return slidingWindow[idx];
    }
    if (cbState === 'OPEN') {
      return idx < 6 ? 'FAILED' : 'SUCCESS';
    } else if (cbState === 'HALF_OPEN') {
      return idx < 2 ? 'PROBING' : 'EMPTY';
    }
    return 'SUCCESS';
  });

  const failureCount = bufferSlots.filter(s => s === 'FAILED' || s === 'SLOW').length;
  const failureRatePercent = Math.round((failureCount / 10) * 100);

  return (
    <div className="topology-container animate-fade-in">
      {/* Top Section: Live Architecture Map */}
      <div className="topology-card glass-card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Network className="text-cyan-400" size={20} />
            <h2>Cloud-Native Resilience Architecture Map</h2>
          </div>
          <span className="badge badge-neutral">Dynamic Discovery & Routing</span>
        </div>

        {/* Visual Map Flow */}
        <div className="diagram-flow-wrapper">
          {/* Client Node */}
          <div className="diagram-node client-node">
            <div className="node-icon">💻</div>
            <div className="node-info">
              <span className="node-title">React Client</span>
              <span className="node-sub">Port 5173</span>
            </div>
          </div>

          <div className="flow-arrow">
            <ArrowRight size={20} className="text-slate-500" />
            <span className="flow-label">HTTP / REST</span>
          </div>

          {/* API Gateway Node */}
          <div className="diagram-node gateway-node">
            <div className="node-header-badge">
              <Zap size={14} className="text-indigo-400" />
              <span>Spring Cloud Gateway (:8080)</span>
            </div>
            <div className="gateway-features">
              <span className="feature-pill">Resilience4j CB</span>
              <span className="feature-pill">TimeLimiter (3s)</span>
              <span className="feature-pill">LoadBalancer</span>
              <span className="feature-pill">Fallback URI</span>
            </div>
          </div>

          <div className="flow-arrow-split">
            <div className="split-line-top"></div>
            <div className="split-line-mid"></div>
            <div className="split-line-bot"></div>
          </div>

          {/* Backend Microservices Cluster */}
          <div className="services-cluster">
            {/* Service 1: Product */}
            <div className="microservice-box">
              <div className="svc-header">
                <div className="flex items-center gap-2">
                  <Database size={15} className="text-blue-400" />
                  <span className="svc-name">PRODUCT-SERVICE</span>
                </div>
                <span className={`badge ${prodInstances > 0 ? 'badge-closed' : 'badge-open'}`}>
                  {prodInstances > 0 ? 'UP' : 'DOWN'}
                </span>
              </div>
              <div className="svc-details">
                <span>Port: 8081</span>
                <span>Eureka: {prodInstances} instance</span>
              </div>
            </div>

            {/* Service 2: Inventory */}
            <div className="microservice-box">
              <div className="svc-header">
                <div className="flex items-center gap-2">
                  <Cpu size={15} className="text-emerald-400" />
                  <span className="svc-name">INVENTORY-SERVICE</span>
                </div>
                <span className={`badge ${invInstances > 0 ? 'badge-closed' : 'badge-open'}`}>
                  {invInstances > 0 ? 'UP' : 'DOWN'}
                </span>
              </div>
              <div className="svc-details">
                <span>Port: 8082</span>
                <span>Eureka: {invInstances} instance</span>
              </div>
            </div>

            {/* Service 3: Recommendation (Protected by CB) */}
            <div className={`microservice-box protected-box ${recInstances === 0 ? 'open' : cbState.toLowerCase()}`}>
              <div className="svc-header">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-orange-400" />
                  <span className="svc-name">RECOMMENDATION-SERVICE</span>
                </div>
                <span className={`badge ${recInstances === 0 ? 'badge-open' : `badge-${cbState.toLowerCase()}`}`}>
                  {recInstances === 0 ? 'DOWN (OFFLINE)' : cbState}
                </span>
              </div>
              <div className="svc-details">
                <span>Port: 8083</span>
                <span>Eureka: {recInstances} instances</span>
              </div>
              {(recInstances === 0 || cbState === 'OPEN') && (
                <div className="fallback-route-pill">
                  ⚡ Fallback Active: /fallback/recommendations
                </div>
              )}
            </div>
          </div>

          {/* Eureka Server */}
          <div className="eureka-floating-box glass-card">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-purple-400" />
              <span className="font-bold text-sm">Netflix Eureka Registry</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">http://localhost:8761</span>
          </div>
        </div>
      </div>

      {/* Resilience4j Circuit Breaker Matrix & Sliding Window */}
      <div className="cb-matrix-grid">
        {/* Sliding Window Visualizer */}
        <div className="matrix-card glass-card">
          <div className="matrix-header">
            <div className="flex items-center gap-2">
              <Gauge className="text-indigo-400" size={18} />
              <h3>10-Call Sliding Window Buffer</h3>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Threshold: <strong>50%</strong> | Current: <strong className={failureRatePercent >= 50 ? 'text-red-400' : 'text-emerald-400'}>{failureRatePercent}%</strong>
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Resilience4j records the outcome of the last 10 requests in a circular buffer to calculate real-time failure & slow-call rates.
          </p>

          <div className="buffer-slots-row">
            {bufferSlots.map((slot, index) => {
              let dotClass = 'slot-success';
              let label = 'OK';
              if (slot === 'FAILED' || slot === 'SLOW') {
                dotClass = 'slot-failed';
                label = 'ERR';
              } else if (slot === 'PROBING') {
                dotClass = 'slot-probing';
                label = 'TEST';
              } else if (slot === 'EMPTY') {
                dotClass = 'slot-empty';
                label = '-';
              }

              return (
                <div key={index} className={`buffer-slot ${dotClass}`} title={`Call #${index + 1}: ${slot}`}>
                  <span className="slot-index">#{index + 1}</span>
                  <span className="slot-badge">{label}</span>
                </div>
              );
            })}
          </div>

          <div className="buffer-legend">
            <div className="legend-item"><span className="legend-dot bg-emerald-500"></span> Successful Request (&lt;3s)</div>
            <div className="legend-item"><span className="legend-dot bg-red-500"></span> Timeout / 500 Error</div>
            <div className="legend-item"><span className="legend-dot bg-amber-500"></span> Half-Open Probe</div>
          </div>
        </div>

        {/* Resilience4j Configuration Matrix */}
        <div className="matrix-card glass-card">
          <div className="matrix-header">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={18} />
              <h3>Active Resilience4j Parameters</h3>
            </div>
            <span className="badge badge-neutral">recommendationCB</span>
          </div>

          <div className="params-list">
            <div className="param-item">
              <span className="param-name">Sliding Window Size</span>
              <span className="param-value">10 calls</span>
            </div>
            <div className="param-item">
              <span className="param-name">Failure Rate Threshold</span>
              <span className="param-value">50%</span>
            </div>
            <div className="param-item">
              <span className="param-name">Wait Duration in OPEN State</span>
              <span className="param-value">10 seconds</span>
            </div>
            <div className="param-item">
              <span className="param-name">Permitted Calls in HALF-OPEN</span>
              <span className="param-value">3 canary calls</span>
            </div>
            <div className="param-item">
              <span className="param-name">TimeLimiter Timeout</span>
              <span className="param-value">3.0 seconds</span>
            </div>
            <div className="param-item">
              <span className="param-name">Rate Limiter (Anti-DDoS)</span>
              <span className="param-value text-cyan-400">20 req/sec</span>
            </div>
            <div className="param-item">
              <span className="param-name">Bulkhead (Concurrency Limit)</span>
              <span className="param-value text-amber-400">25 concurrent threads</span>
            </div>
            <div className="param-item">
              <span className="param-name">Distributed Tracing</span>
              <span className="param-value text-emerald-400">Micrometer + Zipkin (:9411)</span>
            </div>
            <div className="param-item">
              <span className="param-name">Fallback Route</span>
              <span className="param-value text-purple-400">/fallback/recommendations</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .topology-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .topology-card {
          padding: 24px;
          position: relative;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .diagram-flow-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 30px 10px;
          overflow-x: auto;
          position: relative;
        }
        @media (max-width: 1024px) {
          .diagram-flow-wrapper {
            flex-direction: column;
          }
        }
        .diagram-node {
          background: rgba(17, 24, 39, 0.9);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: var(--shadow-md);
        }
        .client-node .node-icon {
          font-size: 1.8rem;
        }
        .node-info {
          display: flex;
          flex-direction: column;
        }
        .node-title {
          font-weight: 700;
          font-size: 0.95rem;
        }
        .node-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .gateway-node {
          flex-direction: column;
          align-items: flex-start;
          border-color: rgba(99, 102, 241, 0.4);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(17, 24, 39, 0.95) 100%);
        }
        .node-header-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 0.85rem;
          margin-bottom: 8px;
          color: #c7d2fe;
        }
        .gateway-features {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .feature-pill {
          font-size: 0.7rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          color: #a5b4fc;
        }
        .flow-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .flow-label {
          font-size: 0.675rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .services-cluster {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 260px;
        }
        .microservice-box {
          background: rgba(17, 24, 39, 0.85);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .protected-box {
          border-left: 3px solid var(--color-primary);
        }
        .protected-box.open {
          border-left-color: var(--color-open);
          background: rgba(239, 68, 68, 0.06);
        }
        .svc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .svc-name {
          font-size: 0.8rem;
          font-weight: 700;
          font-family: var(--font-mono);
        }
        .svc-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .fallback-route-pill {
          margin-top: 4px;
          padding: 4px 8px;
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.4);
          border-radius: var(--radius-sm);
          font-size: 0.675rem;
          color: #d8b4fe;
          font-family: var(--font-mono);
        }
        .eureka-floating-box {
          position: absolute;
          top: 10px;
          right: 20px;
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          border-color: rgba(168, 85, 247, 0.3);
        }

        /* CB Matrix & Sliding Window */
        .cb-matrix-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
        }
        @media (max-width: 900px) {
          .cb-matrix-grid {
            grid-template-columns: 1fr;
          }
        }
        .matrix-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
        }
        .matrix-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .buffer-slots-row {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .buffer-slot {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-family: var(--font-mono);
        }
        .slot-index {
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        .slot-badge {
          font-size: 0.75rem;
          font-weight: 700;
        }
        .slot-success {
          border-color: rgba(16, 185, 129, 0.4);
          background: rgba(16, 185, 129, 0.1);
          color: #6ee7b7;
        }
        .slot-failed {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
        }
        .slot-probing {
          border-color: rgba(245, 158, 11, 0.5);
          background: rgba(245, 158, 11, 0.15);
          color: #fde68a;
        }
        .slot-empty {
          color: var(--text-muted);
        }
        .buffer-legend {
          display: flex;
          gap: 16px;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .params-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .param-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-sm);
          font-size: 0.825rem;
        }
        .param-name {
          color: var(--text-secondary);
        }
        .param-value {
          font-family: var(--font-mono);
          font-weight: 600;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
