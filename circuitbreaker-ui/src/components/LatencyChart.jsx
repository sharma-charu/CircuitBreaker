import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

/**
 * Custom Tooltip component for dark theme consistency
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-xs text-slate-500 font-mono mb-0.5">{payload[0].payload.time}</p>
        <p className="text-sm font-semibold text-slate-200">
          Latency: <span className="text-indigo-400 font-mono">{payload[0].value} ms</span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * LatencyChart component
 * Renders a premium, dark-themed line/area chart showing service latency trends over the last 20 polls.
 * 
 * @param {Object} props
 * @param {string} props.serviceName
 * @param {Array<{time: string, latency: number}>} props.data
 */
export const LatencyChart = ({ serviceName, data }) => {
  // Safe fallback if data is not provided or empty
  const chartData = data || [];

  return (
    <div className="w-full h-32 mt-4 select-none">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Latency Profile (Last 20 Polls)</span>
        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
          Avg: {chartData.length ? Math.round(chartData.reduce((acc, curr) => acc + curr.latency, 0) / chartData.length) : 0} ms
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
        >
          <defs>
            <linearGradient id={`colorLatency-${serviceName}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.4} />
          <XAxis 
            dataKey="time" 
            hide={true} 
          />
          <YAxis 
            domain={[0, 'auto']} 
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Area
            type="monotone"
            dataKey="latency"
            stroke="#6366f1"
            strokeWidth={1.5}
            fillOpacity={1}
            fill={`url(#colorLatency-${serviceName})`}
            activeDot={{ r: 4, stroke: '#93c5fd', strokeWidth: 1 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LatencyChart;
