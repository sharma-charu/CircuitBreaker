import React, { useState } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Settings, 
  ShoppingBag, 
  Flame, 
  Network, 
  Cpu, 
  FileText,
  Radio,
  Server,
  Zap,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import { getGatewayUrl, setGatewayUrl } from '../api/client';

export default function Header({
  activeTab,
  setActiveTab,
  cbState = 'CLOSED',
  isOnline = false,
  autoRefresh = true,
  setAutoRefresh,
  refreshInterval = 2000,
  setRefreshInterval,
  onManualRefresh,
  lastUpdated
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [gatewayInput, setGatewayInput] = useState(getGatewayUrl());

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setGatewayUrl(gatewayInput);
    setShowConfig(false);
    onManualRefresh();
  };

  const getCBStateBadge = () => {
    switch (cbState.toUpperCase()) {
      case 'OPEN':
        return (
          <div className="badge badge-open" title="Circuit Breaker is OPEN: Instant fallback is active">
            <AlertOctagon size={14} className="animate-spin" />
            <span>CIRCUIT OPEN (FALLBACK)</span>
          </div>
        );
      case 'HALF_OPEN':
        return (
          <div className="badge badge-half-open" title="Circuit Breaker is HALF-OPEN: Testing trial requests">
            <Radio size={14} />
            <span>HALF-OPEN (PROBING)</span>
          </div>
        );
      case 'CLOSED':
      default:
        return (
          <div className="badge badge-closed" title="Circuit Breaker is CLOSED: All traffic passing normally">
            <ShieldCheck size={14} />
            <span>CIRCUIT CLOSED (HEALTHY)</span>
          </div>
        );
    }
  };

  const navItems = [
    { id: 'store', label: 'Black Friday Store', icon: ShoppingBag, badge: 'Demo' },
    { id: 'chaos', label: 'Chaos & Resilience Lab', icon: Flame, badge: 'Live' },
    { id: 'topology', label: 'Architecture & Matrix', icon: Network },
    { id: 'health', label: 'Service Discovery & Health', icon: Cpu },
    { id: 'telemetry', label: 'Telemetry & Logs', icon: FileText }
  ];

  return (
    <header className="header-wrapper">
      {/* Top Banner Bar */}
      <div className="top-banner">
        <div className="top-banner-content">
          <div className="brand-group">
            <div className="brand-icon-wrapper">
              <Zap className="brand-icon" size={22} />
            </div>
            <div>
              <div className="brand-title">
                RESILIENCE<span className="brand-accent">MESH</span>
              </div>
              <div className="brand-subtitle">
                Cloud-Native API Gateway & Chaos Engineering Platform
              </div>
            </div>
          </div>

          {/* Status Indicators & Quick Controls */}
          <div className="header-controls">
            {/* Gateway Health Indicator */}
            <div className={`gateway-status-pill ${isOnline ? 'online' : 'offline'}`}>
              <span className={`status-dot ${isOnline ? 'closed' : 'open'}`}></span>
              <span className="pill-text">
                {isOnline ? 'Gateway Connected' : 'Gateway Offline (Demo Mode)'}
              </span>
            </div>

            {/* Circuit Breaker Status */}
            {getCBStateBadge()}

            {/* Auto-Refresh Toggle */}
            <div className="refresh-controls">
              <button 
                className={`icon-btn ${autoRefresh ? 'active' : ''}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={autoRefresh ? 'Pause Auto-Telemetry' : 'Resume Auto-Telemetry'}
              >
                <RefreshCw size={15} className={autoRefresh ? 'spin-slow' : ''} />
                <span className="refresh-label">{autoRefresh ? `${refreshInterval / 1000}s` : 'Paused'}</span>
              </button>

              <button 
                className="icon-btn"
                onClick={onManualRefresh}
                title="Force Refresh Now"
              >
                <Activity size={15} />
              </button>

              <button 
                className="icon-btn"
                onClick={() => setShowConfig(!showConfig)}
                title="Configure Gateway Endpoint"
              >
                <Settings size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="nav-bar">
        <div className="nav-items-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} className="tab-icon" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`tab-tag ${item.id === 'chaos' ? 'tag-danger' : 'tag-accent'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Settings Modal */}
      {showConfig && (
        <div className="modal-backdrop" onClick={() => setShowConfig(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Settings size={20} className="modal-icon" />
                <h3>Gateway Endpoint Configuration</h3>
              </div>
              <button className="close-btn" onClick={() => setShowConfig(false)}>×</button>
            </div>
            <form onSubmit={handleSaveConfig}>
              <div className="form-group">
                <label>Spring Cloud Gateway Base URL</label>
                <input
                  type="text"
                  value={gatewayInput}
                  onChange={(e) => setGatewayInput(e.target.value)}
                  placeholder="http://localhost:8080"
                  className="input-field"
                />
                <span className="form-hint">Default: http://localhost:8080 (Eureka + Resilience4j)</span>
              </div>
              <div className="form-group">
                <label>Telemetry Polling Frequency</label>
                <select 
                  value={refreshInterval} 
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="input-field"
                >
                  <option value={1000}>1 Second (Ultra-Fast Real-Time)</option>
                  <option value={2000}>2 Seconds (Recommended)</option>
                  <option value={5000}>5 Seconds (Low Network Load)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfig(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Apply & Reconnect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .header-wrapper {
          background: rgba(10, 13, 20, 0.95);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .top-banner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 14px 24px;
        }
        .top-banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .brand-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: var(--color-accent-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
        }
        .brand-title {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: 0.05em;
          color: #ffffff;
        }
        .brand-accent {
          color: var(--color-accent);
          margin-left: 2px;
        }
        .brand-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }
        .header-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .gateway-status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          font-size: 0.775rem;
          font-family: var(--font-mono);
        }
        .gateway-status-pill.online {
          border-color: rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
        }
        .gateway-status-pill.offline {
          border-color: rgba(245, 158, 11, 0.3);
          color: #fcd34d;
        }
        .refresh-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .icon-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.775rem;
          font-family: var(--font-mono);
          transition: all var(--transition-fast);
        }
        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          border-color: var(--border-medium);
        }
        .icon-btn.active {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.4);
          color: #a5b4fc;
        }
        .spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .nav-bar {
          border-top: 1px solid var(--border-subtle);
          background: rgba(15, 23, 42, 0.4);
        }
        .nav-items-list {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          gap: 8px;
          overflow-x: auto;
        }
        .nav-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .nav-tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.03);
        }
        .nav-tab-btn.active {
          color: #ffffff;
          border-bottom-color: var(--color-primary);
          background: rgba(99, 102, 241, 0.08);
        }
        .tab-tag {
          font-size: 0.675rem;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .tag-danger {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }
        .tag-accent {
          background: rgba(6, 182, 212, 0.2);
          color: #67e8f9;
          border: 1px solid rgba(6, 182, 212, 0.4);
        }
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }
        .modal-content {
          max-width: 480px;
          width: 100%;
          padding: 24px;
          background: #111827;
          border: 1px solid var(--border-medium);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modal-icon {
          color: var(--color-accent);
        }
        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.5rem;
          cursor: pointer;
        }
        .form-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .input-field {
          background: var(--bg-input);
          border: 1px solid var(--border-medium);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          color: white;
          font-family: var(--font-mono);
          font-size: 0.875rem;
          outline: none;
        }
        .input-field:focus {
          border-color: var(--color-primary);
        }
        .form-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
        }
      `}</style>
    </header>
  );
}
