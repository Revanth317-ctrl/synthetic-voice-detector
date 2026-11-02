import React, { useState, useEffect } from 'react';
import { Shield, Cpu, Activity, History, Info, Menu, X, BarChart3, Radio, Server, Settings2 } from 'lucide-react';
import { getHealth } from '../services/api';
import BackendConfigModal from './BackendConfigModal';

export default function Navbar({ activePage, setActivePage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', device: 'cpu' });

  const checkHealth = async () => {
    try {
      const res = await getHealth();
      setBackendHealth({ status: res.status, device: res.device, model: res.model_name });
    } catch (e) {
      setBackendHealth({ status: 'offline', device: 'offline' });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 12000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Activity },
    { id: 'detection', label: 'Detection Dashboard', icon: Radio },
    { id: 'analysis', label: 'Audio Analysis', icon: Cpu },
    { id: 'history', label: 'History', icon: History },
    { id: 'performance', label: 'Model Performance', icon: BarChart3 },
    { id: 'about', label: 'About Project', icon: Info },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div 
              onClick={() => setActivePage('home')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                    VOICESENTRY<span className="text-cyan-400">.AI</span>
                  </span>
                  <span className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-widest font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded">
                    Forensics
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">AI Synthetic Voice & Audio Spoof Detection</p>
              </div>
            </div>

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Backend Status Pill & Settings */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfigModalOpen(true)}
                title="Click to configure backend API connection"
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                  backendHealth.status === 'healthy'
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                    : backendHealth.status === 'checking'
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/40'
                    : 'bg-rose-950/50 border-rose-800/80 text-rose-300 hover:bg-rose-900/50 animate-pulse'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  backendHealth.status === 'healthy'
                    ? 'bg-emerald-400 animate-pulse'
                    : backendHealth.status === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`} />
                <span className="font-mono text-[11px]">
                  {backendHealth.status === 'healthy' 
                    ? `MODEL READY (${backendHealth.device.toUpperCase()})` 
                    : backendHealth.status === 'checking'
                    ? 'CONNECTING...'
                    : 'CONNECT BACKEND'}
                </span>
                <Settings2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setConfigModalOpen(true)}
                className={`p-2 rounded-lg border text-xs ${
                  backendHealth.status === 'healthy'
                    ? 'border-emerald-800/80 text-emerald-400 bg-emerald-950/30'
                    : 'border-rose-800/80 text-rose-400 bg-rose-950/40'
                }`}
                title="Backend Settings"
              >
                <Server className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#0B0F19] px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      <BackendConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConnected={(data) => {
          setBackendHealth({ status: data.status, device: data.device, model: data.model_name });
        }}
      />
    </>
  );
}
