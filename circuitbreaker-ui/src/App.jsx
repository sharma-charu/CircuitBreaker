import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import ToastContainer from './components/Toast';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        {/* Navigation Bar */}
        <Navbar />

        {/* Global Auto-Dismissing Toast Notifications */}
        <ToastContainer />

        {/* Main Content Area */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>

        {/* Polished Modern Footer */}
        <footer className="bg-slate-950/80 border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; {new Date().getFullYear()} CircuitBreaker Monitor • Microservice Reliability Suite</span>
            <span className="text-slate-600">Spring Cloud Gateway • Resilience4j • Eureka</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
