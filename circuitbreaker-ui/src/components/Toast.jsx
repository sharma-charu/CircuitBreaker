import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCw, X } from 'lucide-react';

/**
 * ToastContainer component
 * Listens for circuit breaker state change events and renders floating, auto-dismissing toast notifications.
 */
export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleStateChange = (event) => {
      const { serviceName, newState, previousState } = event.detail || {};
      if (!serviceName || !newState) return;

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newToast = {
        id,
        serviceName,
        newState,
        previousState,
        timestamp: new Date().toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after 4 seconds (4000ms)
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener('cb-history-state-change', handleStateChange);
    return () => {
      window.removeEventListener('cb-history-state-change', handleStateChange);
    };
  }, []);

  const handleClose = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => handleClose(toast.id)} />
      ))}
    </div>
  );
};

/**
 * Individual Toast Notification Item
 */
const ToastItem = ({ toast, onClose }) => {
  const normalizedState = (toast.newState || '').toUpperCase();

  let borderColor = 'border-slate-700';
  let badgeColor = 'bg-slate-800 text-slate-300';
  let icon = <RefreshCw className="h-4 w-4 text-slate-400" />;
  let stateTitleColor = 'text-slate-200';

  if (normalizedState === 'CLOSED') {
    borderColor = 'border-emerald-500/40 shadow-emerald-500/10';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    icon = <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />;
    stateTitleColor = 'text-emerald-400';
  } else if (normalizedState === 'OPEN') {
    borderColor = 'border-rose-500/40 shadow-rose-500/10';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    icon = <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 animate-bounce" />;
    stateTitleColor = 'text-rose-400';
  } else if (normalizedState === 'HALF_OPEN') {
    borderColor = 'border-amber-500/40 shadow-amber-500/10';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    icon = <RefreshCw className="h-4 w-4 text-amber-400 flex-shrink-0 animate-spin" />;
    stateTitleColor = 'text-amber-400';
  }

  return (
    <div
      className={`pointer-events-auto bg-slate-900/95 border ${borderColor} rounded-xl p-3.5 shadow-2xl backdrop-blur-lg flex items-start gap-3 transform transition-all duration-300 animate-slideUp`}
      role="alert"
    >
      <div className="mt-0.5">{icon}</div>

      <div className="flex-grow min-w-0">
        <p className="text-xs font-semibold text-slate-200">
          State Transition Detected
        </p>
        <p className="text-xs text-slate-300 mt-0.5 leading-snug break-words">
          <span className="font-bold text-white">{toast.serviceName}</span> is now{' '}
          <span className={`font-mono font-bold ${stateTitleColor}`}>{toast.newState}</span>
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {toast.newState}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{toast.timestamp}</span>
        </div>
      </div>

      <button
        onClick={onClose}
        className="text-slate-500 hover:text-slate-300 p-1 rounded-md transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default ToastContainer;
