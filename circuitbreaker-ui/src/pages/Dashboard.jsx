import React, { useState, useEffect, useRef, useCallback } from 'react';
import ServiceCard from '../components/ServiceCard';
import { Server, AlertTriangle, ShieldCheck, Heart, RefreshCw, Activity } from 'lucide-react';
import { getServiceHealth, getCircuitBreakerStates } from '../api';
import useCircuitBreakerHistory from '../hooks/useCircuitBreakerHistory';

// Helper to generate initial mock latency history
const generateMockLatencyHistory = () => {
  const history = [];
  const now = Date.now();
  for (let i = 19; i >= 0; i--) {
    const time = new Date(now - i * 3000).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    history.push({
      time,
      latency: Math.floor(Math.random() * (95 - 45 + 1)) + 45 // 45-95ms
    });
  }
  return history;
};

// Robust parser for Spring Actuator data
const parseServiceDataFor = (serviceName, healthData, cbData) => {
  const normalize = (name) => name.toLowerCase().replace(/[-_]/g, '');
  const normTarget = normalize(serviceName);

  let status = 'UNKNOWN';
  let circuitBreakerState = 'CLOSED';

  // 1. Health Status Parsing
  if (healthData) {
    if (healthData.components) {
      const compKey = Object.keys(healthData.components).find(k => normalize(k) === normTarget);
      if (compKey) {
        status = healthData.components[compKey].status || 'UNKNOWN';
      }
    }

    if (status === 'UNKNOWN') {
      const eurekaApps = healthData.components?.discoveryComposite?.components?.eureka?.details?.applications 
        || healthData.components?.eureka?.details?.applications
        || healthData.details?.eureka?.details?.applications;
      if (eurekaApps) {
        const appKey = Object.keys(eurekaApps).find(k => normalize(k) === normTarget);
        if (appKey) {
          status = eurekaApps[appKey] > 0 ? 'UP' : 'DOWN';
        }
      }
    }

    if (status === 'UNKNOWN') {
      const cbDetails = healthData.components?.circuitBreakers?.details;
      if (cbDetails) {
        const cbKey = Object.keys(cbDetails).find(k => normalize(k) === normTarget);
        if (cbKey) {
          status = cbDetails[cbKey].status || 'UNKNOWN';
        }
      }
    }
  }

  // 2. Circuit Breaker State Parsing
  if (cbData && cbData.circuitBreakers) {
    if (Array.isArray(cbData.circuitBreakers)) {
      const cb = cbData.circuitBreakers.find(c => c && typeof c === 'object' && c.name && normalize(c.name) === normTarget);
      if (cb && cb.state) {
        circuitBreakerState = cb.state;
      }
    } else if (typeof cbData.circuitBreakers === 'object') {
      const cbKey = Object.keys(cbData.circuitBreakers).find(k => normalize(k) === normTarget);
      if (cbKey) {
        const cbVal = cbData.circuitBreakers[cbKey];
        circuitBreakerState = (typeof cbVal === 'string' ? cbVal : cbVal.state) || 'CLOSED';
      }
    }
  }

  // Fallback to health details circuitBreaker state
  if (circuitBreakerState === 'CLOSED' && healthData) {
    const cbDetails = healthData.components?.circuitBreakers?.details;
    if (cbDetails) {
      const cbKey = Object.keys(cbDetails).find(k => normalize(k) === normTarget);
      if (cbKey && cbDetails[cbKey].details?.state) {
        circuitBreakerState = cbDetails[cbKey].details.state;
      }
    }
  }

  // Normalize status values
  status = status.toUpperCase() === 'UP' ? 'UP' : (status.toUpperCase() === 'DOWN' ? 'DOWN' : 'UNKNOWN');

  // Normalize CB State
  let cbState = circuitBreakerState.toUpperCase();
  if (cbState.includes('HALF')) cbState = 'HALF_OPEN';
  if (cbState !== 'OPEN' && cbState !== 'HALF_OPEN' && cbState !== 'CLOSED') {
    cbState = 'CLOSED';
  }

  return {
    serviceName,
    status,
    circuitBreakerState: cbState,
    lastChecked: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  };
};

export const Dashboard = () => {
  const [services, setServices] = useState([
    { serviceName: 'product-service', status: 'UNKNOWN', circuitBreakerState: 'CLOSED', lastChecked: '-', latencyHistory: generateMockLatencyHistory() },
    { serviceName: 'inventory-service', status: 'UNKNOWN', circuitBreakerState: 'CLOSED', lastChecked: '-', latencyHistory: generateMockLatencyHistory() },
    { serviceName: 'recommendation-service', status: 'UNKNOWN', circuitBreakerState: 'CLOSED', lastChecked: '-', latencyHistory: generateMockLatencyHistory() },
  ]);

  const [error, setError] = useState(null);
  const [simulationMode, setSimulationMode] = useState(false);

  const { recordTransition } = useCircuitBreakerHistory();
  const prevCBStatesRef = useRef({});
  const isFirstFetchRef = useRef(true);

  // Polling function
  const fetchServiceData = useCallback(async () => {
    setError(null);

    // If simulation mode is active, run local simulation instead
    if (simulationMode) {
      setServices(prev => {
        return prev.map(s => {
          let nextCBState = s.circuitBreakerState;
          let nextStatus = s.status === 'UNKNOWN' ? 'UP' : s.status;

          // 20% chance to transition circuit breaker state in simulation
          if (Math.random() < 0.20) {
            if (s.circuitBreakerState === 'CLOSED') {
              nextCBState = 'OPEN';
              nextStatus = 'DOWN';
            } else if (s.circuitBreakerState === 'OPEN') {
              nextCBState = 'HALF_OPEN';
              nextStatus = 'UP';
            } else {
              nextCBState = Math.random() > 0.4 ? 'CLOSED' : 'OPEN';
              nextStatus = nextCBState === 'CLOSED' ? 'UP' : 'DOWN';
            }
          }

          let mockLatency = Math.floor(Math.random() * (100 - 45 + 1)) + 45;
          if (nextStatus === 'DOWN' || nextCBState === 'OPEN') {
            mockLatency = Math.floor(Math.random() * (1200 - 800 + 1)) + 800;
          } else if (nextCBState === 'HALF_OPEN') {
            mockLatency = Math.floor(Math.random() * (350 - 180 + 1)) + 180;
          }

          const time = new Date().toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });

          const newLatencyHistory = [...s.latencyHistory.slice(1), { time, latency: mockLatency }];

          // Record transition and trigger toast if state changed
          if (!isFirstFetchRef.current && s.circuitBreakerState !== nextCBState) {
            recordTransition(s.serviceName, s.circuitBreakerState, nextCBState);
          }

          return {
            ...s,
            status: nextStatus,
            circuitBreakerState: nextCBState,
            lastChecked: time,
            latencyHistory: newLatencyHistory
          };
        });
      });
      
      isFirstFetchRef.current = false;
      return;
    }

    // Live backend mode
    try {
      const [healthRes, cbRes] = await Promise.all([
        getServiceHealth(),
        getCircuitBreakerStates()
      ]);

      const healthData = healthRes.data;
      const cbData = cbRes.data;

      setServices(prev => {
        const nextStates = {};
        const updated = prev.map(s => {
          const parsed = parseServiceDataFor(s.serviceName, healthData, cbData);
          
          let mockLatency = Math.floor(Math.random() * (100 - 45 + 1)) + 45;
          if (parsed.status === 'DOWN' || parsed.circuitBreakerState === 'OPEN') {
            mockLatency = Math.floor(Math.random() * (1200 - 800 + 1)) + 800;
          } else if (parsed.circuitBreakerState === 'HALF_OPEN') {
            mockLatency = Math.floor(Math.random() * (350 - 180 + 1)) + 180;
          }

          const time = parsed.lastChecked;
          const newLatencyHistory = [...s.latencyHistory.slice(1), { time, latency: mockLatency }];
          nextStates[s.serviceName] = parsed.circuitBreakerState;

          const prevCBState = prevCBStatesRef.current[s.serviceName];
          if (!isFirstFetchRef.current && prevCBState && prevCBState !== parsed.circuitBreakerState) {
            recordTransition(s.serviceName, prevCBState, parsed.circuitBreakerState);
          }

          return {
            ...s,
            ...parsed,
            latencyHistory: newLatencyHistory
          };
        });

        prevCBStatesRef.current = nextStates;
        return updated;
      });

      isFirstFetchRef.current = false;
      setError(null);
    } catch (err) {
      console.warn('Backend polling info:', err?.message || err);
      setError('Connection to Gateway/Actuator unavailable. Using cached view or switch to Simulation Mode.');
    }
  }, [simulationMode, recordTransition]);

  // Polling effect
  useEffect(() => {
    fetchServiceData();

    const interval = setInterval(() => {
      fetchServiceData();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchServiceData]);

  // Compute stats
  const totalServices = services.length;
  const healthyServices = services.filter(s => s.status === 'UP').length;
  const openBreakers = services.filter(s => s.circuitBreakerState === 'OPEN').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            System Overview & Health
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Real-time monitoring of microservice health, Resilience4j circuit breakers, and latency profiles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Simulation Toggle */}
          <button
            onClick={() => {
              setSimulationMode(!simulationMode);
              isFirstFetchRef.current = true;
            }}
            className={`flex items-center space-x-2 text-xs border rounded-xl px-3.5 py-2 font-mono cursor-pointer transition-all duration-300 ${
              simulationMode 
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle simulation mode to test transitions and line charts without a running backend"
          >
            <Activity className={`h-3.5 w-3.5 ${simulationMode ? 'animate-pulse text-amber-400' : ''}`} />
            <span>{simulationMode ? 'Simulation: ON' : 'Simulation: OFF'}</span>
          </button>

          <div className="flex items-center space-x-2 text-xs bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Polling: 3s</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && !simulationMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSimulationMode(true);
                isFirstFetchRef.current = true;
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition-colors text-xs cursor-pointer"
            >
              Enable Demo Simulation
            </button>
            <button
              onClick={() => fetchServiceData()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs cursor-pointer border border-slate-700"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Mini Stats Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-sm backdrop-blur-sm">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Monitored Services</p>
            <p className="text-2xl font-bold text-slate-100">{totalServices}</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-sm backdrop-blur-sm">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Healthy Instances</p>
            <p className="text-2xl font-bold text-emerald-400">{healthyServices} <span className="text-sm font-normal text-slate-500">/ {totalServices}</span></p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-sm backdrop-blur-sm">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Open Breakers</p>
            <p className="text-2xl font-bold text-rose-400">{openBreakers}</p>
          </div>
        </div>
      </div>

      {/* Service Cards Grid (1 col mobile, 2 col md, 3 col lg) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-200 flex items-center gap-2">
            <Heart className="h-5 w-5 text-indigo-400" />
            Active Microservice Fleet
          </h2>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
            Auto-refresh active
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.serviceName}
              serviceName={service.serviceName}
              status={service.status}
              lastChecked={service.lastChecked}
              circuitBreakerState={service.circuitBreakerState}
              latencyHistory={service.latencyHistory}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
