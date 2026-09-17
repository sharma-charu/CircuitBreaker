import React from 'react';

/**
 * CircuitBreakerBadge component
 * Displays status badge for circuit breakers with smooth CSS transitions:
 * - CLOSED (Green / Emerald)
 * - OPEN (Red / Rose)
 * - HALF_OPEN (Yellow / Amber)
 * 
 * @param {Object} props
 * @param {'CLOSED' | 'OPEN' | 'HALF_OPEN' | string} props.state
 */
export const CircuitBreakerBadge = ({ state }) => {
  const normalizedState = (state || '').toUpperCase();

  let styles = {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/30',
    dot: 'bg-zinc-400',
    shadow: 'shadow-zinc-500/10',
    label: state || 'UNKNOWN'
  };

  if (normalizedState === 'CLOSED') {
    styles = {
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400 shadow-emerald-400/50',
      shadow: 'shadow-emerald-500/10',
      label: 'CLOSED'
    };
  } else if (normalizedState === 'OPEN') {
    styles = {
      bg: 'bg-rose-500/10 hover:bg-rose-500/20',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-400 shadow-rose-400/50',
      shadow: 'shadow-rose-500/10',
      label: 'OPEN'
    };
  } else if (normalizedState === 'HALF_OPEN') {
    styles = {
      bg: 'bg-amber-500/10 hover:bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400 shadow-amber-400/50',
      shadow: 'shadow-amber-500/10',
      label: 'HALF OPEN'
    };
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${styles.bg} ${styles.text} ${styles.border} ${styles.shadow} transition-all duration-300 ease-in-out shadow-sm select-none`}
    >
      <span className="relative flex h-2 w-2 mr-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${styles.dot} opacity-75 transition-colors duration-300`}
        ></span>
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot} transition-colors duration-300`}
        ></span>
      </span>
      <span className="tracking-wide transition-colors duration-300">
        {styles.label}
      </span>
    </span>
  );
};

export default CircuitBreakerBadge;
