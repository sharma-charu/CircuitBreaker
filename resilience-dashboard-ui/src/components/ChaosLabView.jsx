import React, { useState } from 'react';
import { 
  Flame, 
  AlertOctagon, 
  Clock, 
  Zap, 
  Play, 
  RotateCcw, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  Send,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { 
  triggerChaosDelay, 
  triggerChaosFault, 
  fireStressBurst, 
  fetchRecommendations,
  fetchHealth
} from '../api/client';

export default function ChaosLabView({
  cbState = 'CLOSED',
  onManualRefresh,
  addTelemetryLog
}) {
  const [selectedService, setSelectedService] = useState('recommendation');
  const [delayDuration, setDelayDuration] = useState(3000);
  const [faultStatus, setFaultStatus] = useState(500);
  const [burstCount, setBurstCount] = useState(10);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [consoleLogs, setConsoleLogs] = useState([
    {
      id: 'init-0',
      time: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Resilience & Chaos Engineering Lab initialized. Ready for simulation experiments.'
    }
  ]);

  const appendLog = (type, message, details = null) => {
    const newEntry = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };
    setConsoleLogs(prev => [newEntry, ...prev.slice(0, 50)]);
    if (addTelemetryLog) {
      addTelemetryLog({ type, message, details });
    }
  };

  const handleTriggerDelay = async () => {
    setIsExecuting(true);
    appendLog('warning', `[CHAOS] Injecting ${delayDuration}ms artificial latency into [${selectedService}-service]...`);

    const result = await triggerChaosDelay(selectedService, delayDuration);
    
    if (result.ok || result.isFallback) {
      appendLog(
        result.isFallback ? 'alert' : 'success',
        `[RESPONSE] Received response in ${result.duration}ms | HTTP ${result.status} | Fallback: ${result.isFallback ? 'YES (Circuit Breaker)' : 'NO (Live)'}`,
        result.data
      );
    } else {
      appendLog('error', `[ERROR] Call failed or timed out after ${result.duration}ms: ${result.error || result.status}`);
    }

    setIsExecuting(false);
    onManualRefresh();
  };

  const handleTriggerFault = async () => {
    setIsExecuting(true);
    appendLog('danger', `[CHAOS] Forcing HTTP ${faultStatus} fault into [${selectedService}-service]...`);

    const result = await triggerChaosFault(selectedService, faultStatus);
    appendLog(
      result.isFallback ? 'alert' : 'error',
      `[RESPONSE] Result after ${result.duration}ms | HTTP ${result.status} | Fallback Active: ${result.isFallback ? 'YES' : 'NO'}`,
      result.data
    );

    setIsExecuting(false);
    onManualRefresh();
  };

  const handleBurstTest = async () => {
    setIsExecuting(true);
    appendLog('warning', `[BURST] Firing ${burstCount} concurrent requests to /api/recommendations through Gateway...`);

    const startTime = performance.now();
    const results = await fireStressBurst('/api/recommendations', burstCount);
    const totalTime = Math.round(performance.now() - startTime);

    const fallbacks = results.filter(r => r.isFallback).length;
    const successes = results.filter(r => r.ok && !r.isFallback).length;
    const errors = results.filter(r => !r.ok).length;

    appendLog(
      'info',
      `[BURST COMPLETED] ${burstCount} requests finished in ${totalTime}ms: 🟢 ${successes} Live, 🟣 ${fallbacks} Fallbacks, 🔴 ${errors} Errors.`
    );

    setIsExecuting(false);
    onManualRefresh();
  };

  const handleTripCircuitSequence = async () => {
    setIsExecuting(true);
    appendLog('danger', `[SCENARIO] Executing Automated Circuit Breaker Tripping Sequence (Black Friday Simulation)...`);
    
    // Step 1: Baseline call
    appendLog('info', `Step 1: Sending baseline normal request...`);
    await fetchRecommendations();

    // Step 2: Inject high latency calls to trigger failure threshold
    appendLog('warning', `Step 2: Sending rapid high-latency burst to exceed 50% failure rate threshold...`);
    await fireStressBurst('/api/recommendations/delay', 6);

    // Step 3: Test fallback
    appendLog('alert', `Step 3: Probing /api/recommendations to verify instant fallback response...`);
    const fallbackTest = await fetchRecommendations();
    
    appendLog(
      fallbackTest.isFallback ? 'success' : 'warning',
      `Step 4: Result -> Fallback active: ${fallbackTest.isFallback ? 'YES (Tripped Successfully)' : 'Probing in progress'} in ${fallbackTest.duration}ms`,
      fallbackTest.data
    );

    setIsExecuting(false);
    onManualRefresh();
  };

  return (
    <div className="chaos-lab-container animate-fade-in">
      {/* Header Banner */}
      <div className="lab-header glass-card">
        <div className="lab-title-group">
          <div className="lab-icon-box">
            <Flame size={28} className="text-orange-400" />
          </div>
          <div>
            <h2>Chaos & Resilience Testing Lab</h2>
            <p className="text-slate-400 text-sm">
              Deliberately inject latency, faults, and traffic spikes to evaluate Spring Cloud Gateway & Resilience4j Circuit Breakers.
            </p>
          </div>
        </div>

        <div className="circuit-summary-box">
          <span className="text-xs text-slate-400 font-mono">LIVE CIRCUIT BREAKER STATUS</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`status-dot ${cbState.toLowerCase()}`}></span>
            <span className="font-mono font-bold text-lg">{cbState}</span>
          </div>
        </div>
      </div>

      {/* Guided Scenario Stepper */}
      <div className="scenario-card glass-card">
        <div className="scenario-header">
          <div className="flex items-center gap-2">
            <Activity className="text-indigo-400" size={18} />
            <h3>Interactive Problem Statement Walkthrough: "Black Friday Surge"</h3>
          </div>
          <button 
            className="btn btn-sm btn-primary"
            onClick={handleTripCircuitSequence}
            disabled={isExecuting}
          >
            <Play size={14} />
            Auto-Run Tripping Scenario
          </button>
        </div>

        <div className="scenario-steps-grid">
          <div className={`step-box ${cbState === 'CLOSED' ? 'step-active' : 'step-done'}`}>
            <div className="step-num">1</div>
            <h4>Healthy Baseline</h4>
            <p>Traffic flows directly to Recommendation Service. Circuit Breaker is <strong>CLOSED</strong>.</p>
          </div>
          <div className={`step-box ${isExecuting ? 'step-active' : ''}`}>
            <div className="step-num">2</div>
            <h4>Traffic Surge / Latency</h4>
            <p>Heavy load causes &gt;3s delays on Recommendation Engine during Black Friday.</p>
          </div>
          <div className={`step-box ${cbState === 'OPEN' ? 'step-active' : ''}`}>
            <div className="step-num">3</div>
            <h4>Circuit Breaker Trips</h4>
            <p>Failure threshold (&gt;50%) exceeded. Gateway trips Circuit to <strong>OPEN</strong>.</p>
          </div>
          <div className={`step-box ${cbState === 'OPEN' ? 'step-active' : ''}`}>
            <div className="step-num">4</div>
            <h4>Instant Fallback</h4>
            <p>Gateway returns cached "Top Sellers" immediately (&lt;10ms) with zero hangs.</p>
          </div>
          <div className={`step-box ${cbState === 'HALF_OPEN' ? 'step-active' : ''}`}>
            <div className="step-num">5</div>
            <h4>Self-Healing (Half-Open)</h4>
            <p>After 10s wait duration, Gateway probes service and closes circuit upon recovery.</p>
          </div>
        </div>
      </div>

      {/* Chaos Control Matrix & Live Terminal */}
      <div className="chaos-matrix-grid">
        {/* Left: Chaos Injection Panel */}
        <div className="controls-panel glass-card">
          <div className="panel-title-bar">
            <Sliders size={18} className="text-cyan-400" />
            <h3>Chaos Injection Controls</h3>
          </div>

          <div className="control-group">
            <label className="control-label">Target Microservice</label>
            <div className="service-selector-row">
              {['recommendation', 'inventory', 'product'].map((svc) => (
                <button
                  key={svc}
                  className={`svc-btn ${selectedService === svc ? 'active' : ''}`}
                  onClick={() => setSelectedService(svc)}
                >
                  <Cpu size={14} />
                  <span>{svc}-service</span>
                </button>
              ))}
            </div>
          </div>

          {/* Latency Injection Control */}
          <div className="chaos-action-box">
            <div className="action-box-header">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                <span className="font-semibold text-sm">Inject Latency (Slow Call)</span>
              </div>
              <span className="font-mono text-xs text-amber-300 font-bold">{delayDuration} ms</span>
            </div>
            <input 
              type="range" 
              min="500" 
              max="5000" 
              step="500"
              value={delayDuration} 
              onChange={(e) => setDelayDuration(Number(e.target.value))}
              className="chaos-slider"
            />
            <button 
              className="btn btn-danger w-full mt-2"
              onClick={handleTriggerDelay}
              disabled={isExecuting}
            >
              <Flame size={15} />
              {isExecuting ? 'Injecting Chaos...' : `Trigger ${delayDuration}ms Latency Spike`}
            </button>
          </div>

          {/* 500 Fault Crash Control */}
          <div className="chaos-action-box">
            <div className="action-box-header">
              <div className="flex items-center gap-2">
                <AlertOctagon size={16} className="text-red-400" />
                <span className="font-semibold text-sm">Inject Service Fault (HTTP Error)</span>
              </div>
              <select 
                value={faultStatus} 
                onChange={(e) => setFaultStatus(Number(e.target.value))}
                className="select-status"
              >
                <option value={500}>HTTP 500 (Internal Error)</option>
                <option value={502}>HTTP 502 (Bad Gateway)</option>
                <option value={503}>HTTP 503 (Service Unavailable)</option>
                <option value={504}>HTTP 504 (Gateway Timeout)</option>
              </select>
            </div>
            <button 
              className="btn btn-secondary w-full mt-2"
              onClick={handleTriggerFault}
              disabled={isExecuting}
            >
              <AlertOctagon size={15} className="text-red-400" />
              Simulate HTTP {faultStatus} Failure
            </button>
          </div>

          {/* Rate Limiting Burst */}
          <div className="chaos-action-box">
            <div className="action-box-header">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-indigo-400" />
                <span className="font-semibold text-sm">Rate Limiting / Bulkhead Stress Burst</span>
              </div>
              <span className="font-mono text-xs text-indigo-300 font-bold">{burstCount} calls</span>
            </div>
            <button 
              className="btn btn-primary w-full mt-2"
              onClick={handleBurstTest}
              disabled={isExecuting}
            >
              <Send size={15} />
              Fire {burstCount} Concurrent Requests
            </button>
          </div>
        </div>

        {/* Right: Live Chaos Execution Console */}
        <div className="terminal-panel glass-card">
          <div className="terminal-header">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-emerald-400" />
              <h3>Real-Time Execution Console & Audit Log</h3>
            </div>
            <button 
              className="btn btn-sm btn-secondary font-mono text-xs"
              onClick={() => setConsoleLogs([])}
            >
              Clear Console
            </button>
          </div>

          <div className="terminal-body">
            {consoleLogs.length === 0 ? (
              <div className="empty-terminal">Waiting for chaos actions...</div>
            ) : (
              consoleLogs.map((log, idx) => (
                <div key={log.id || `log-${idx}`} className={`log-row log-${log.type}`}>
                  <span className="log-time">[{log.time}]</span>
                  <span className="log-msg">{log.message}</span>
                  {log.details && (
                    <pre className="log-details">{JSON.stringify(log.details, null, 2)}</pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .chaos-lab-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .lab-header {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .lab-title-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .lab-icon-box {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .circuit-summary-box {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid var(--border-medium);
          padding: 12px 20px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        /* Guided Stepper */
        .scenario-card {
          padding: 24px;
        }
        .scenario-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }
        .scenario-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }
        .step-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 16px;
          position: relative;
          transition: all var(--transition-normal);
        }
        .step-box.step-active {
          border-color: var(--color-primary);
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
        }
        .step-box.step-done {
          border-color: rgba(16, 185, 129, 0.4);
        }
        .step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--bg-input);
          border: 1px solid var(--border-medium);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--color-accent);
        }
        .step-box h4 {
          font-size: 0.9rem;
          margin-bottom: 4px;
        }
        .step-box p {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        /* Matrix & Terminal */
        .chaos-matrix-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .chaos-matrix-grid {
            grid-template-columns: 1fr;
          }
        }
        .controls-panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .panel-title-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .control-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .service-selector-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .svc-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.775rem;
          font-family: var(--font-mono);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .svc-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }
        .svc-btn.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: var(--color-primary);
          color: #ffffff;
        }
        .chaos-action-box {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .action-box-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .chaos-slider {
          width: 100%;
          accent-color: #ef4444;
          cursor: pointer;
          margin: 6px 0;
        }
        .select-status {
          background: var(--bg-input);
          border: 1px solid var(--border-medium);
          color: white;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-family: var(--font-mono);
        }

        /* Terminal */
        .terminal-panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: #090d16;
          border: 1px solid var(--border-medium);
        }
        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 14px;
        }
        .terminal-body {
          flex: 1;
          height: 420px;
          overflow-y: auto;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 8px;
        }
        .empty-terminal {
          color: var(--text-muted);
          font-style: italic;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .log-row {
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.02);
          border-left: 3px solid transparent;
          line-height: 1.4;
          word-break: break-word;
        }
        .log-time {
          color: var(--text-muted);
          margin-right: 8px;
          font-size: 0.725rem;
        }
        .log-info { border-left-color: #3b82f6; color: #93c5fd; }
        .log-warning { border-left-color: #f59e0b; color: #fde68a; }
        .log-danger, .log-error { border-left-color: #ef4444; color: #fca5a5; }
        .log-success { border-left-color: #10b981; color: #6ee7b7; }
        .log-alert { border-left-color: #a855f7; color: #d8b4fe; }
        .log-details {
          background: rgba(0, 0, 0, 0.4);
          padding: 8px;
          border-radius: var(--radius-sm);
          margin-top: 6px;
          font-size: 0.725rem;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}
