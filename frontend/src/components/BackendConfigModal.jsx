import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, Globe, Laptop, HelpCircle } from 'lucide-react';
import { getApiBase, setApiBase, getHealth } from '../services/api';

export default function BackendConfigModal({ isOpen, onClose, onConnected }) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = getApiBase();
      setCurrentUrl(active);
      setInputUrl(active);
      runTest(active);
    }
  }, [isOpen]);

  const runTest = async (urlToTest) => {
    setIsTesting(true);
    setTestResult(null);
    const startTime = performance.now();
    try {
      // Temporarily test the endpoint
      const target = urlToTest.replace(/\/$/, '');
      const healthUrl = `${target}/health`;
      const res = await fetch(healthUrl, { method: 'GET', signal: AbortSignal.timeout(5000) });
      const latency = Math.round(performance.now() - startTime);

      if (!res.ok) {
        throw new Error(`Server responded with HTTP ${res.status}`);
      }
      const data = await res.json();
      setTestResult({
        success: true,
        latency,
        data,
      });
      if (onConnected) onConnected(data);
    } catch (err) {
      const latency = Math.round(performance.now() - startTime);
      setTestResult({
        success: false,
        latency,
        error: err.message || 'Connection refused or timeout',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleApply = (url) => {
    const clean = url.trim().replace(/\/$/, '');
    setApiBase(clean);
    setCurrentUrl(clean);
    setInputUrl(clean);
    runTest(clean);
  };

  const handleResetDefault = () => {
    setApiBase('');
    const fallback = getApiBase();
    setCurrentUrl(fallback);
    setInputUrl(fallback);
    runTest(fallback);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Backend API Connection</h3>
              <p className="text-xs text-slate-400">Configure or verify the deep learning backend server</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Active Status Banner */}
          <div className={`p-4 rounded-xl border transition-all ${
            testResult?.success
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              : testResult && !testResult.success
              ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                {testResult?.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : testResult && !testResult.success ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                )}
                <div>
                  <div className="font-medium text-sm">
                    {testResult?.success
                      ? 'Backend Connected & Model Loaded'
                      : testResult && !testResult.success
                      ? 'Backend Disconnected'
                      : 'Testing Connection...'}
                  </div>
                  <div className="text-xs font-mono opacity-80 mt-0.5 break-all">
                    Active URL: {currentUrl || '/api'}
                  </div>
                </div>
              </div>
              {testResult?.latency && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-400">
                  {testResult.latency} ms
                </span>
              )}
            </div>

            {testResult?.success && (
              <div className="mt-3 pt-3 border-t border-emerald-800/40 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Model:</span>{' '}
                  <span className="font-semibold text-emerald-200">{testResult.data.model_name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Compute Device:</span>{' '}
                  <span className="font-semibold text-emerald-200 uppercase">{testResult.data.device}</span>
                </div>
              </div>
            )}

            {testResult && !testResult.success && (
              <div className="mt-2 text-xs text-rose-300/90 leading-relaxed">
                Error: {testResult.error}. Make sure the backend server is running or configure the correct API URL below.
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Quick Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleApply('http://127.0.0.1:8000/api')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  currentUrl === 'http://127.0.0.1:8000/api'
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold">Localhost (Port 8000)</div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">http://127.0.0.1:8000/api</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleResetDefault}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  currentUrl === '/api'
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold">Default / Same-Origin</div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">/api (Vite Proxy / Cloud)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Custom URL Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Custom Backend URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="e.g. http://127.0.0.1:8000/api or https://backend.onrender.com/api"
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => handleApply(inputUrl)}
                disabled={isTesting || !inputUrl.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-2 shrink-0"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Apply & Test'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Enter your backend URL if hosted on Render, Hugging Face Spaces, Ngrok, or a custom server.
            </p>
          </div>

          {/* Deployment / Setup Guide Toggle */}
          <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-cyan-400 font-medium"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                How to run or deploy the backend server
              </span>
              <span>{showGuide ? 'Hide' : 'Show'}</span>
            </button>

            {showGuide && (
              <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-2 leading-relaxed">
                <p>
                  <strong>1. Run locally on your machine:</strong>
                </p>
                <div className="p-2 rounded bg-black/50 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  $env:DISABLE_SQLALCHEMY_CEXT="1"; .venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
                </div>
                <p>
                  <strong>2. Connecting from Vercel:</strong> Click <code className="text-cyan-300">Localhost (Port 8000)</code> above. Your browser will securely connect to your locally running model via Private Network Access (PNA).
                </p>
                <p>
                  <strong>3. Deploying to Render / Cloud:</strong> Connect your GitHub repo <code className="text-cyan-300">Revanth317-ctrl/synthetic-voice-detector</code> to Render as a Web Service and set the start command to:
                </p>
                <div className="p-2 rounded bg-black/50 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={() => runTest(currentUrl)}
            disabled={isTesting}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>Re-check Health</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
