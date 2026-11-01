import React from 'react';
import { Shield, Lock, Terminal, ExternalLink } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-[#0B0F19] text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight">VOICESENTRY.AI</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Industrial-grade deep learning audio forensic system trained on genuine acoustic speech
              and synthetic voice conversion artifacts. Designed to counter voice-cloning fraud, social engineering,
              and unauthorized deepfake audio generation.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[11px] text-cyan-400/80 font-mono">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero audio retention by default • Client-side audio processing option</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActivePage('detection')} className="hover:text-cyan-400 transition-colors">
                  Detection Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('analysis')} className="hover:text-cyan-400 transition-colors">
                  Acoustic Forensics Lab
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('performance')} className="hover:text-cyan-400 transition-colors">
                  Model Evaluation & ROC
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('about')} className="hover:text-cyan-400 transition-colors">
                  Dataset Protocols & ASVspoof
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Architecture</h4>
            <div className="space-y-1.5 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>PyTorch 2.15 • 2D-CNN</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>BiLSTM + Temporal Attention</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>Librosa Log-Mel Spectrogram</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>FastAPI + SQLite Async</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 VoiceSentry AI Forensics. All model assessments are algorithmic risk probabilities, not guaranteed proof.</p>
          <div className="mt-2 sm:mt-0 flex gap-4">
            <span className="hover:text-slate-300">ASVspoof 2019/2021 Benchmark</span>
            <span>•</span>
            <span className="hover:text-slate-300">Open-Access Research</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
