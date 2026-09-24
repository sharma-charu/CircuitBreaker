import React, { useState } from 'react';
import { 
  Cpu, 
  Server, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Send, 
  Terminal, 
  Database, 
  ShieldCheck,
  Zap,
  XCircle
} from 'lucide-react';
import { getGatewayUrl } from '../api/client';

export default function HealthDiscoveryView({
  healthData = {},
  isOnline = false,
  cbState = 'CLOSED',
  onRefresh
}) {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/actuator/circuitbreakers');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const predefinedEndpoints = [
    { label: 'Circuit Breakers Actuator', path: '/actuator/circuitbreakers', method: 'GET' },
    { label: 'Rate Limiters Actuator', path: '/actuator/ratelimiters', method: 'GET' },
    { label: 'Bulkheads Actuator', path: '/actuator/bulkheads', method: 'GET' },
    { label: 'Health Status Actuator', path: '/actuator/health', method: 'GET' },
    { label: 'Gateway Routes Registry', path: '/actuator/gateway/routes', method: 'GET' },
    { label: 'Circuit Breaker Events Log', path: '/actuator/circuitbreakerevents', method: 'GET' },
    { label: 'Products Service Catalog', path: '/products', method: 'GET' },
    { label: 'Recommendation Service', path: '/api/recommendations', method: 'GET' },
    { label: 'Inventory SKU Lookup (LAP-QX-90)', path: '/inventory/LAP-QX-90', method: 'GET' },
    { label: 'Inventory Latency Simulation (3s)', path: '/inventory/simulate/delay?durationMs=3000', method: 'GET' },
    { label: 'Product Latency Simulation (3s)', path: '/products/simulate/delay?durationMs=3000', method: 'GET' },
    { label: 'Recommendation Fallback Directly', path: '/fallback/recommendations', method: 'GET' }
  ];

  // Helper to extract Eureka instance count dynamically from Actuator health payload
  const getEurekaInstanceCount = (serviceName) => {
    if (!healthData) return 0;
    
    // Check eureka applications details
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

    // Check reactive discovery client services list
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

  const isEurekaUp = healthData?.components?.discoveryComposite?.status === 'UP' || isOnline;
  const recInstances = getEurekaInstanceCount('RECOMMENDATION-SERVICE');
  const prodInstances = getEurekaInstanceCount('PRODUCT-SERVICE');
  const invInstances = getEurekaInstanceCount('INVENTORY-SERVICE');
  const gwInstances = isOnline ? 1 : 0;

  const servicesList = [
    {
      name: 'API-GATEWAY',
      port: 8080,
      description: 'Spring Cloud Gateway & Resilience4j Central Entry Point',
      status: isOnline ? 'UP' : 'DOWN',
      instances: gwInstances,
      eurekaRegistered: isOnline,
      routes: ['/products/**', '/api/recommendations/**', '/inventory/**']
    },
    {
      name: 'RECOMMENDATION-SERVICE',
      port: 8083,
      description: 'AI Personalized Recommendations with Fallback Protection',
      status: recInstances > 0 ? 'UP' : 'DOWN',
      instances: recInstances,
      eurekaRegistered: recInstances > 0,
      circuitBreaker: 'recommendationCB'
    },
    {
      name: 'PRODUCT-SERVICE',
      port: 8081,
      description: 'E-Commerce Product Catalog and JPA Database',
      status: prodInstances > 0 ? 'UP' : 'DOWN',
      instances: prodInstances,
      eurekaRegistered: prodInstances > 0,
      database: 'MySQL / H2'
    },
    {
      name: 'INVENTORY-SERVICE',
      port: 8082,
      description: 'Real-time Stock Management & Simulation Controller',
      status: invInstances > 0 ? 'UP' : 'DOWN',
      instances: invInstances,
      eurekaRegistered: invInstances > 0,
      endpoints: ['/inventory/**', '/inventory/simulate/**']
    },
    {
      name: 'EUREKA-SERVER',
      port: 8761,
      description: 'Netflix Eureka Dynamic Microservice Service Registry',
      status: isEurekaUp ? 'UP' : 'DOWN',
      instances: isEurekaUp ? 1 : 0,
      eurekaRegistered: true
    }
  ];

  const handleTestEndpoint = async () => {
    setTesting(true);
    const gateway = getGatewayUrl();
    const startTime = performance.now();
    try {
      const res = await fetch(`${gateway}${selectedEndpoint}`, {
        headers: { 'Accept': 'application/json' }
      });
      const duration = Math.round(performance.now() - startTime);
      const text = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch { parsed = text; }

      setTestResult({
        ok: res.ok,
        status: res.status,
        duration,
        data: parsed,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      setTestResult({
        ok: false,
        status: 0,
        duration,
        error: err.message,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    setTesting(false);
  };

  return (
    <div className="health-discovery-container animate-fade-in">
      {/* Services Grid */}
      <div className="section-header-box">
        <div className="flex items-center gap-2">
          <Server className="text-indigo-400" size={20} />
          <h2>Microservices & Eureka Discovery Registry</h2>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={onRefresh}>
          <RefreshCw size={14} /> Refresh Cluster Health
        </button>
      </div>

      {recInstances === 0 && isOnline && (
        <div className="alert-down-banner">
          <AlertTriangle size={18} className="text-amber-400" />
          <div>
            <strong>Recommendation Service is Currently Offline / Deregistered from Eureka:</strong>
            <p className="text-xs text-amber-200 mt-0.5">
              The API Gateway detects that <code>RECOMMENDATION-SERVICE</code> is unreachable and will automatically invoke the Resilience4j Fallback route (<code>/fallback/recommendations</code>) without blocking other services.
            </p>
          </div>
        </div>
      )}

      <div className="services-grid">
        {servicesList.map((svc) => (
          <div key={svc.name} className={`service-health-card glass-card ${svc.status === 'DOWN' ? 'service-card-down' : ''}`}>
            <div className="svc-top-row">
              <div className="svc-name-group">
                <span className={`status-dot ${svc.status === 'UP' ? 'closed' : 'open'}`}></span>
                <span className="font-mono font-bold text-sm">{svc.name}</span>
              </div>
              <span className={`badge ${svc.status === 'UP' ? 'badge-closed' : 'badge-open'}`}>
                {svc.status}
              </span>
            </div>

            <p className="svc-desc">{svc.description}</p>

            <div className="svc-details-list">
              <div className="detail-item">
                <span className="text-slate-400">Port:</span>
                <span className="font-mono text-white font-semibold">:{svc.port}</span>
              </div>
              <div className="detail-item">
                <span className="text-slate-400">Eureka Instances:</span>
                <span className={`font-mono text-xs flex items-center gap-1 font-bold ${svc.instances > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {svc.instances > 0 ? (
                    <>
                      <Radio size={11} /> {svc.instances} Registered
                    </>
                  ) : (
                    <>
                      <XCircle size={11} /> 0 Instances (Offline)
                    </>
                  )}
                </span>
              </div>
              {svc.circuitBreaker && (
                <div className="detail-item">
                  <span className="text-slate-400">Circuit Breaker:</span>
                  <span className={`font-mono text-xs font-bold ${cbState === 'OPEN' ? 'text-red-400' : cbState === 'HALF_OPEN' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {cbState}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Gateway Endpoint Inspector */}
      <div className="endpoint-tester-card glass-card">
        <div className="tester-header">
          <div className="flex items-center gap-2">
            <Zap className="text-cyan-400" size={18} />
            <h3>Live Gateway Endpoint Inspector & Probe</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Test direct routing & Actuators</span>
        </div>

        <div className="tester-controls-row">
          <select
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            className="endpoint-select"
          >
            {predefinedEndpoints.map((ep) => (
              <option key={ep.path} value={ep.path}>
                {ep.method} {ep.path} — ({ep.label})
              </option>
            ))}
          </select>
          <button 
            className="btn btn-primary"
            onClick={handleTestEndpoint}
            disabled={testing}
          >
            <Send size={15} />
            {testing ? 'Probing...' : 'Send Request'}
          </button>
        </div>

        {/* Test Result Display */}
        {testResult && (
          <div className="test-result-wrapper">
            <div className="result-meta-bar">
              <span className={`status-code ${testResult.ok ? 'code-ok' : 'code-err'}`}>
                HTTP {testResult.status || 'ERROR'}
              </span>
              <span className="duration-pill font-mono text-xs">
                <Clock size={12} /> {testResult.duration} ms
              </span>
              <span className="timestamp font-mono text-xs text-slate-400">
                {testResult.timestamp}
              </span>
            </div>

            <pre className="json-preview">
              {JSON.stringify(testResult.data || testResult.error, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <style>{`
        .health-discovery-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .section-header-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .alert-down-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: var(--radius-md);
          color: #fde68a;
          font-size: 0.85rem;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .service-health-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .service-card-down {
          border-color: rgba(239, 68, 68, 0.35);
          background: rgba(239, 68, 68, 0.04);
        }
        .svc-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .svc-name-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .svc-desc {
          font-size: 0.775rem;
          color: var(--text-secondary);
          line-height: 1.4;
          flex: 1;
        }
        .svc-details-list {
          border-top: 1px solid var(--border-subtle);
          padding-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.75rem;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Endpoint Tester */
        .endpoint-tester-card {
          padding: 24px;
        }
        .tester-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .tester-controls-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .endpoint-select {
          flex: 1;
          background: var(--bg-input);
          border: 1px solid var(--border-medium);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          color: white;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          outline: none;
        }
        .test-result-wrapper {
          background: #090d16;
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          padding: 16px;
        }
        .result-meta-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .status-code {
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 0.85rem;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }
        .code-ok {
          background: rgba(16, 185, 129, 0.2);
          color: #6ee7b7;
        }
        .code-err {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }
        .duration-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary);
        }
        .json-preview {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: #93c5fd;
          max-height: 280px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
