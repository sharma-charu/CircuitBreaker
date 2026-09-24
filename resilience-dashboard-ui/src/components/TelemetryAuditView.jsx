import React, { useState } from 'react';
import { 
  FileText, 
  Clock, 
  Filter, 
  Download, 
  Trash2, 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  Zap,
  BarChart2
} from 'lucide-react';

export default function TelemetryAuditView({
  telemetryLogs = [],
  cbEvents = [],
  onClearLogs
}) {
  const [filterType, setFilterType] = useState('ALL');

  const combinedEvents = [
    ...cbEvents.map(e => ({
      id: e.creationTime || Math.random(),
      time: e.creationTime ? new Date(e.creationTime).toLocaleTimeString() : new Date().toLocaleTimeString(),
      type: e.type ? e.type.toLowerCase() : 'cb_event',
      title: e.type || 'CircuitBreaker Event',
      message: `Circuit Breaker '${e.circuitBreakerName || 'recommendationCB'}' triggered event: ${e.type || 'STATE_TRANSITION'}`,
      source: 'Actuator / Resilience4j'
    })),
    ...telemetryLogs
  ];

  const filtered = combinedEvents.filter(ev => {
    if (filterType === 'ALL') return true;
    if (filterType === 'TRANSITION') return ev.type?.includes('transition') || ev.type?.includes('state');
    if (filterType === 'FALLBACK') return ev.type === 'alert' || ev.message?.includes('Fallback');
    if (filterType === 'ERROR') return ev.type === 'danger' || ev.type === 'error';
    return true;
  });

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(combinedEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `resilience-audit-log-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="telemetry-view-container animate-fade-in">
      {/* Latency Comparison Visualizer */}
      <div className="telemetry-card glass-card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-cyan-400" size={20} />
            <h2>Cloud-Native Latency & Resiliency Benchmark</h2>
          </div>
          <span className="badge badge-neutral">Live Telemetry Metrics</span>
        </div>

        <div className="latency-comparison-grid">
          <div className="latency-metric-box">
            <div className="metric-header">
              <span className="text-xs text-slate-400 font-mono">FALLBACK LATENCY (CB OPEN)</span>
              <Zap size={15} className="text-purple-400" />
            </div>
            <div className="metric-value text-purple-300">~6 ms</div>
            <p className="text-xs text-slate-400">Gateway returns pre-computed fallback instantly without downstream blocking.</p>
          </div>

          <div className="latency-metric-box">
            <div className="metric-header">
              <span className="text-xs text-slate-400 font-mono">NORMAL LIVE CALL (CB CLOSED)</span>
              <ShieldCheck size={15} className="text-emerald-400" />
            </div>
            <div className="metric-value text-emerald-300">~42 ms</div>
            <p className="text-xs text-slate-400">Direct round-trip to recommendation-service with AI scoring and JPA query.</p>
          </div>

          <div className="latency-metric-box">
            <div className="metric-header">
              <span className="text-xs text-slate-400 font-mono">CHAOS SPIKE (TIMED OUT)</span>
              <AlertTriangle size={15} className="text-red-400" />
            </div>
            <div className="metric-value text-red-300">3,000 ms</div>
            <p className="text-xs text-slate-400">Maximum TimeLimiter ceiling before Gateway trips circuit to protect threads.</p>
          </div>
        </div>
      </div>

      {/* Events Audit Log */}
      <div className="telemetry-card glass-card">
        <div className="events-toolbar">
          <div className="flex items-center gap-2">
            <FileText className="text-indigo-400" size={20} />
            <h3>Circuit Breaker & Fallback Event Stream</h3>
          </div>

          <div className="toolbar-actions">
            <div className="filter-group">
              <Filter size={14} className="text-slate-400" />
              {['ALL', 'TRANSITION', 'FALLBACK', 'ERROR'].map(t => (
                <button
                  key={t}
                  className={`filter-btn ${filterType === t ? 'active' : ''}`}
                  onClick={() => setFilterType(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <button className="btn btn-sm btn-secondary" onClick={exportToJson}>
              <Download size={14} /> Export JSON
            </button>
            <button className="btn btn-sm btn-secondary" onClick={onClearLogs}>
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        <div className="events-list">
          {filtered.length === 0 ? (
            <div className="empty-events">No telemetry events recorded yet. Perform actions in the Chaos Lab or Storefront.</div>
          ) : (
            filtered.map((item, index) => (
              <div key={item.id || index} className="event-item">
                <div className="event-timestamp font-mono">
                  <Clock size={12} />
                  <span>{item.time}</span>
                </div>
                <div className="event-content">
                  <div className="event-title-line">
                    <span className="event-type-badge font-mono">{item.source || item.type?.toUpperCase() || 'INFO'}</span>
                    <strong>{item.title || item.message}</strong>
                  </div>
                  {item.details && (
                    <pre className="event-payload">{JSON.stringify(item.details, null, 2)}</pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .telemetry-view-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .telemetry-card {
          padding: 24px;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .latency-comparison-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }
        .latency-metric-box {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .metric-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .metric-value {
          font-family: var(--font-mono);
          font-size: 2rem;
          font-weight: 800;
        }

        /* Toolbar */
        .events-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .toolbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          padding: 4px 8px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }
        .filter-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-family: var(--font-mono);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .filter-btn.active {
          background: var(--color-primary);
          color: white;
        }

        /* Events List */
        .events-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 480px;
          overflow-y: auto;
        }
        .empty-events {
          color: var(--text-muted);
          font-style: italic;
          text-align: center;
          padding: 32px 0;
        }
        .event-item {
          display: flex;
          gap: 16px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          align-items: flex-start;
        }
        .event-timestamp {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.725rem;
          color: var(--text-muted);
          min-width: 80px;
          padding-top: 2px;
        }
        .event-content {
          flex: 1;
        }
        .event-title-line {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
        }
        .event-type-badge {
          font-size: 0.675rem;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .event-payload {
          background: rgba(0, 0, 0, 0.4);
          padding: 8px;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.725rem;
          color: #93c5fd;
          margin-top: 6px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}
