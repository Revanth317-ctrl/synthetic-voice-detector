import React, { useState } from 'react';
import { 
  Cpu, 
  Activity, 
  Layers, 
  FileAudio, 
  Sliders, 
  BarChart, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Clock,
  Compass
} from 'lucide-react';
import SpectrogramViewer from '../components/SpectrogramViewer';
import AudioPlayer from '../components/AudioPlayer';

export default function Analysis({ analysisData, setActivePage }) {
  const [activeVizTab, setActiveVizTab] = useState('mel'); // 'mel' or 'mfcc'

  if (!analysisData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto">
          <Cpu className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">No Audio Sample Analyzed Yet</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Please run a detection first from the Detection Dashboard to inspect the deep spectral features, 
          MFCC coefficients, and segment-wise predictions.
        </p>
        <button
          onClick={() => setActivePage('detection')}
          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-colors shadow-lg shadow-cyan-500/20"
        >
          Go to Detection Dashboard
        </button>
      </div>
    );
  }

  const meta = analysisData.audio_metadata || {};
  const isBonafide = analysisData.prediction === 'BONAFIDE';
  const melMatrix = analysisData.visualizations?.mel_spectrogram_preview;
  const mfccMatrix = analysisData.visualizations?.mfcc_preview;
  const segments = analysisData.segment_predictions || [];
  const attentionWeights = analysisData.attention_weights || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 text-[11px] font-mono mb-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>SPECTRAL & TEMPORAL ACOUSTIC LAB</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Audio Forensics Inspection</h1>
          <p className="text-sm text-slate-400 mt-1">
            In-depth analysis of Log-Mel filterbanks, Cepstral coefficients, and temporal BiLSTM attention.
          </p>
        </div>

        {/* Status pill */}
        <div
          className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold ${
            isBonafide
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
              : 'bg-rose-950/80 border-rose-800 text-rose-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isBonafide ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span>{analysisData.prediction} ({(analysisData.confidence * 100).toFixed(1)}%)</span>
        </div>
      </div>

      {/* Acoustic Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono">DURATION</span>
          <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">{meta.duration}s</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono">SAMPLING RATE</span>
          <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">{meta.sample_rate} Hz</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono">RMS ENERGY</span>
          <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">{meta.rms_energy || 'N/A'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono">ZERO CROSSINGS</span>
          <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">{meta.zero_crossing_rate || 0}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono">SPECTRAL CENTROID</span>
          <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">{meta.spectral_centroid_hz} Hz</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono">WINDOWS ANALYZED</span>
          <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">{meta.segment_count || 1}</div>
        </div>
      </div>

      {/* Main Feature Visualizations */}
      <div className="space-y-4">
        {/* Toggle between Mel Spectrogram and MFCC */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-[#111827] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveVizTab('mel')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeVizTab === 'mel'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              80-Band Log-Mel Spectrogram
            </button>
            <button
              onClick={() => setActiveVizTab('mfcc')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeVizTab === 'mfcc'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              20-Band MFCC (Cepstrum)
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Colormap: Magma Spectral Energy (dB)
          </span>
        </div>

        {activeVizTab === 'mel' && (
          <SpectrogramViewer
            matrix={melMatrix}
            title="Log-Mel Energy Filterbanks (40 Hz - 8000 Hz)"
            durationSec={meta.duration || 3.0}
            maxFreqHz={8000}
            height={220}
          />
        )}

        {activeVizTab === 'mfcc' && (
          <SpectrogramViewer
            matrix={mfccMatrix}
            title="Mel-Frequency Cepstral Coefficients (MFCC 1 to 20)"
            durationSec={meta.duration || 3.0}
            maxFreqHz={20}
            height={200}
          />
        )}
      </div>

      {/* Temporal Attention Weight Distribution (from BiLSTM) */}
      {attentionWeights && attentionWeights.length > 0 && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Learned Temporal Attention Curve</span>
              </h3>
              <p className="text-xs text-slate-400">
                Shows audio time frames where the BiLSTM recurrent network discovered anomalous acoustic artifacts.
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800/80">
              {attentionWeights.length} Temporal Steps
            </span>
          </div>

          {/* Attention bar visualizer */}
          <div className="h-20 flex items-end gap-0.5 bg-[#0B0F19] rounded-xl p-3 border border-slate-800/80">
            {attentionWeights.map((w, i) => {
              const maxW = Math.max(...attentionWeights, 1e-4);
              const heightPct = Math.max(10, Math.min(100, (w / maxW) * 100));
              const isPeak = heightPct > 70;
              return (
                <div
                  key={i}
                  title={`Step ${i}: ${(w * 100).toFixed(2)}% attention`}
                  className={`flex-1 rounded-t transition-all ${
                    isPeak
                      ? 'bg-rose-400 shadow-sm shadow-rose-400/50'
                      : 'bg-cyan-500/70 hover:bg-cyan-400'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0.0s (Audio Start)</span>
            <span>Normalized Attention Density Over Utterance</span>
            <span>{meta.duration}s (Audio End)</span>
          </div>
        </div>
      )}

      {/* Segment-wise Predictions (For Longer Audio) */}
      {segments && segments.length > 0 && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Segment-Wise Temporal Windowing</span>
              </h3>
              <p className="text-xs text-slate-400">
                Evaluation across overlapping 3.0s sliding windows to detect localized voice conversions or spliced deepfake inserts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {segments.map((seg, idx) => {
              const isSegBonafide = seg.prediction === 'BONAFIDE';
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border ${
                    isSegBonafide
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-rose-950/20 border-rose-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-400">Window #{seg.segment_index + 1}</span>
                    <span className="text-slate-500">{seg.start_sec}s - {seg.end_sec}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-bold font-mono ${
                        isSegBonafide ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {seg.prediction}
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      {(seg.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Forensic Acoustic Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-[#111827] border border-emerald-800/30 space-y-2">
          <div className="text-emerald-400 font-bold text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>Human Acoustic Signatures</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Authentic human speech exhibits continuous formant transitions, micro-jitter in fundamental frequency (F0),
            and turbulent aspiration noise during unvoiced consonants with organic subglottal pressure decay.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-rose-800/30 space-y-2">
          <div className="text-rose-400 font-bold text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Synthetic Vocoder Artifacts</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Neural vocoders (e.g. MelGAN, HiFi-GAN) often display transposed periodicity ripples, phase cancellation 
            in upper harmonics, and unnatural step-like silence transitions between synthesized diphones.
          </p>
        </div>
      </div>
    </div>
  );
}
