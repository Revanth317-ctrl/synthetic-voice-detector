import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ConfidenceMeter({ prediction, confidence, probabilities }) {
  const isBonafide = prediction === 'BONAFIDE';
  const bonafidePct = Math.round((probabilities?.bonafide ?? (isBonafide ? confidence : 1 - confidence)) * 100);
  const spoofPct = Math.round((probabilities?.spoof ?? (!isBonafide ? confidence : 1 - confidence)) * 100);

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isBonafide ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              isBonafide
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/10'
            }`}
          >
            {isBonafide ? (
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            ) : (
              <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
            )}
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">Model Classification</span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isBonafide ? 'text-emerald-400 drop-shadow' : 'text-rose-400 drop-shadow'
                }`}
              >
                {prediction}
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                  isBonafide
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950/80 text-rose-300 border-rose-800'
                }`}
              >
                {isBonafide ? 'Genuine Human Voice' : 'AI Synthetic / Cloned'}
              </span>
            </div>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 text-right">
          <div className="text-[10px] uppercase font-mono text-slate-400">Assessment Confidence</div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {(confidence * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Probability Bars */}
      <div className="mt-5 space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1 font-mono">
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              BONAFIDE (Human Probability)
            </span>
            <span className="text-emerald-300 font-bold">{bonafidePct}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${bonafidePct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1 font-mono">
            <span className="text-rose-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              SPOOF (Synthetic / Cloned Probability)
            </span>
            <span className="text-rose-300 font-bold">{spoofPct}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${spoofPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Disclaimers & Info */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px]">
          <strong className="text-slate-300">Forensic Notice:</strong> Model confidence score represents the statistical probability computed by the CNN-BiLSTM neural network on 80-band acoustic Log-Mel features. Results represent algorithmic assessments and should be evaluated alongside contextual audio provenance.
        </p>
      </div>
    </div>
  );
}
