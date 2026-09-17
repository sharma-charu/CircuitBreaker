import React from 'react';
import CircuitBreakerBadge from '../components/CircuitBreakerBadge';
import { History as HistoryIcon, Clock, Trash2, ArrowRight } from 'lucide-react';
import useCircuitBreakerHistory from '../hooks/useCircuitBreakerHistory';

export const History = () => {
  const { history, clearHistory } = useCircuitBreakerHistory();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            State Transition History
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Chronological log of service circuit breaker transitions, trip events, and recovery logs.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center space-x-1.5 text-xs bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500 hover:text-white text-rose-400 font-semibold px-3.5 py-2 rounded-xl cursor-pointer transition-all duration-300 self-start sm:self-center shadow-sm shadow-rose-500/5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Transition Logs</span>
          </button>
        )}
      </div>

      {/* History Log Container */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5 text-slate-200 font-semibold text-base sm:text-lg">
            <HistoryIcon className="h-5 w-5 text-indigo-400" />
            <span>Recorded State Events</span>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-full">
            {history.length} {history.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {history.length === 0 ? (
          /* Friendly Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-500 mb-4 shadow-xl">
              <HistoryIcon className="h-10 w-10 text-slate-600 animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-200">No transitions recorded yet</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-sm">
              Circuit breaker states are currently unchanged. Trigger simulated failures on the{' '}
              <span className="text-indigo-400 font-semibold">Dashboard</span> or inject latency to observe transitions.
            </p>
          </div>
        ) : (
          /* Transition Table */
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800/90 text-slate-400 uppercase tracking-wider font-mono text-[11px] font-semibold">
                  <th className="py-3 px-4 sm:px-6">Timestamp</th>
                  <th className="py-3 px-4 sm:px-6">Target Microservice</th>
                  <th className="py-3 px-4 sm:px-6">Initial State</th>
                  <th className="py-3 px-2 sm:px-4 text-center w-8"></th>
                  <th className="py-3 px-4 sm:px-6">Transitioned State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {history.map((event) => (
                  <tr 
                    key={event.id} 
                    className="hover:bg-slate-800/30 transition-colors duration-150 text-slate-300"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-xs text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                        <span>{event.timestamp}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-100">
                      {event.serviceName}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <CircuitBreakerBadge state={event.previousState} />
                    </td>
                    <td className="py-3.5 px-2 sm:px-4 text-center text-slate-500">
                      <ArrowRight className="h-4 w-4 mx-auto text-indigo-400/70" />
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <CircuitBreakerBadge state={event.newState} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
