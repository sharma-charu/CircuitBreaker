import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Activity, LayoutDashboard, History } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 border-b border-slate-900/90 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/15 transition-all duration-300 shadow-sm">
              <Activity className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300 group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent group-hover:from-indigo-200 group-hover:to-white transition-all duration-300 tracking-tight">
                CircuitBreaker Monitor
              </span>
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline-block">
                Resilience4j Dashboard
              </span>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                }`
              }
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
