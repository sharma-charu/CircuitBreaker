import { useState, useCallback } from 'react';

/**
 * Custom hook useCircuitBreakerHistory
 * Manages the state transition history of circuit breakers, persisting to localStorage
 * and broadcasting state transitions to listeners (such as toast notifications).
 */
export const useCircuitBreakerHistory = () => {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('cb_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse circuit breaker history from localStorage', e);
      return [];
    }
  });

  const recordTransition = useCallback((serviceName, previousState, newState) => {
    // If the states are identical, do not record a transition
    if (!serviceName || !newState || previousState === newState) return;

    const timestamp = new Date().toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');

    const newEntry = {
      id: `${serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      serviceName,
      previousState,
      newState,
      timestamp,
    };

    setHistory((prevHistory) => {
      const updated = [newEntry, ...prevHistory];
      try {
        localStorage.setItem('cb_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save circuit breaker history to localStorage', e);
      }
      return updated;
    });

    // Broadcast event for Toast notifications
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cb-history-state-change', {
          detail: {
            serviceName,
            previousState,
            newState,
            timestamp,
          },
        })
      );
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem('cb_history');
    } catch (e) {
      console.error('Failed to clear circuit breaker history from localStorage', e);
    }
  }, []);

  return {
    history,
    recordTransition,
    clearHistory,
  };
};

export default useCircuitBreakerHistory;
