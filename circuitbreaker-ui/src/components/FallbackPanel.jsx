import React from 'react';
import { Layers, Sparkles } from 'lucide-react';

/**
 * FallbackPanel component
 * Displayed on a ServiceCard when its circuitBreakerState is 'OPEN'.
 * Informs the user that cached fallback data is being served rather than failing requests.
 */
export const FallbackPanel = () => {
  return (
    <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 mt-3 transition-all duration-300 animate-fadeIn">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-amber-400 flex-shrink-0 animate-pulse" />
          <span className="text-xs font-semibold text-amber-300 tracking-wide uppercase">
            Fallback Mode Active
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400/90 bg-amber-500/20 px-2 py-0.5 rounded-full font-medium">
          <Sparkles className="h-2.5 w-2.5" />
          Resilience4j
        </span>
      </div>
      <p className="text-xs font-medium text-amber-200/90 leading-relaxed pl-6">
        Serving cached fallback: <span className="font-bold text-amber-100 underline decoration-amber-400/40 underline-offset-2">Top Sellers</span>
      </p>
    </div>
  );
};

export default FallbackPanel;
