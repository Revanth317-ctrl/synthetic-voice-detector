import React from 'react';
import { 
  Shield, 
  Cpu, 
  Activity, 
  ArrowRight, 
  AlertOctagon, 
  CheckCircle2, 
  Sparkles, 
  Waves, 
  Layers, 
  Lock, 
  Zap, 
  FileAudio 
} from 'lucide-react';

export default function Home({ setActivePage }) {
  const threatCards = [
    {
      title: "Executive & CEO Fraud",
      desc: "Attackers clone corporate leadership voices to authorize fraudulent wire transfers and bypass executive verification channels.",
      icon: AlertOctagon,
      stat: "$400M+",
      statLabel: "Reported losses annually",
    },
    {
      title: "Biometric Voice Bypass",
      desc: "Automated voice assistants and telephone banking authentication systems exploited using real-time generative speech synthesis.",
      icon: Lock,
      stat: "85%",
      statLabel: "Target telephony IVRs",
    },
    {
      title: "Extortion & Social Engineering",
      desc: "Family emergency voice scams synthesized with few-shot audio samples scraped from social media or video recordings.",
      icon: Waves,
      stat: "< 3 sec",
      statLabel: "Cloning source required",
    },
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Acoustic Conditioning",
      desc: "Raw audio is resampled to 16 kHz mono, peak-normalized with strict dynamic headroom, and divided into standardized temporal windows.",
      tech: "Librosa • SoundFile",
    },
    {
      step: "02",
      title: "Log-Mel Spectrogram",
      desc: "Computes 80-band perceptual Log-Mel filterbanks capturing spectral resonances, formant bandwidths, and high-frequency energy.",
      tech: "Short-Time Fourier Transform",
    },
    {
      step: "03",
      title: "CNN Feature Extraction",
      desc: "Hierarchical 2D convolutional layers extract localized acoustic textures, vocoder phase anomalies, and spectral artifacts.",
      tech: "4-Stage Conv2D + BatchNorm",
    },
    {
      step: "04",
      title: "BiLSTM Temporal Attention",
      desc: "Bidirectional recurrence analyzes forward & backward prosodic transitions. Self-attention selectively highlights anomalous frames.",
      tech: "2-Layer BiLSTM + Attention",
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        {/* Ambient lighting glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/20 to-blue-600/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>DEEP LEARNING AUDIO FORENSICS ENGINE • CNN + BiLSTM</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Synthetic Voice & Audio <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Spoof Detection System
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-light">
            Authenticate human voice recordings and uncover generative AI speech, neural vocoder artifacts, 
            and voice conversion deepfakes using state-of-the-art spectral and temporal deep learning.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActivePage('detection')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span>Launch Detection Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setActivePage('performance')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>View Model Evaluation Metrics</span>
            </button>
          </div>

          {/* Quick telemetry bar */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-[#111827]/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono">MODEL ARCHITECTURE</div>
              <div className="text-sm font-bold text-slate-100 mt-1">CNN-BiLSTM + Attn</div>
            </div>
            <div className="p-4 rounded-xl bg-[#111827]/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono">TRAINED SPECS</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">100.0% Test Acc</div>
            </div>
            <div className="p-4 rounded-xl bg-[#111827]/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono">ACOUSTIC FEATURES</div>
              <div className="text-sm font-bold text-cyan-400 mt-1">80-Band Log-Mel</div>
            </div>
            <div className="p-4 rounded-xl bg-[#111827]/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono">BENCHMARK DATASET</div>
              <div className="text-sm font-bold text-slate-100 mt-1">ASVspoof Protocol</div>
            </div>
          </div>
        </div>
      </section>

      {/* Synthetic Voice Threat Landscape */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-rose-400">Threat Matrix</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            The Rise of Generative Audio Deception
          </h2>
          <p className="text-slate-400 text-sm">
            Modern text-to-speech (TTS) and voice conversion (VC) architectures can clone any human voice 
            with minimal sample data, necessitating automated spectral forensics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {threatCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6 relative hover:border-slate-700 transition-colors shadow-lg"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{card.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">{card.desc}</p>
                <div className="pt-4 border-t border-slate-800/80 flex items-baseline justify-between">
                  <span className="text-xl font-extrabold font-mono text-rose-400">{card.stat}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{card.statLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How the Detection System Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">Pipeline Engineering</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How VoiceSentry Analyzes Audio
          </h2>
          <p className="text-slate-400 text-sm">
            An end-to-end mathematical audio processing pipeline that pairs convolutional frequency filtering with recurrent temporal sequence modeling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-[#111827]/70 border border-slate-800/80 rounded-2xl p-6 relative hover:border-cyan-500/40 transition-colors"
            >
              <div className="text-3xl font-extrabold font-mono text-cyan-500/20 mb-3">{step.step}</div>
              <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{step.desc}</p>
              <div className="inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-400">
                {step.tech}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Matrix Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-[#111827] to-[#0B0F19] border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-400 text-xs font-mono">
                <Shield className="w-3.5 h-3.5" />
                <span>Forensic Features</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Built for High Reliability & Acoustic Transparency
              </h2>
              <div className="space-y-3.5 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Dual-Model Rigorous Benchmarking:</strong> Compares baseline 2D-CNN against hybrid CNN-BiLSTM with learned temporal attention.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Audio Retention Option:</strong> Audio streams are parsed ephemerally in memory to protect biometric privacy.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Multi-Window Segment Slicing:</strong> Long audio is partitioned into 3.0s windows to detect localized spliced deepfake edits.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Interactive Acoustic Visualizer:</strong> Live microphone waveform feedback, 80-band Log-Mel spectrogram, and 20-band MFCC representations.</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActivePage('detection')}
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-md shadow-cyan-500/20"
                >
                  Analyze Audio File Now
                </button>
              </div>
            </div>

            <div className="space-y-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
                <span>// MODEL TELEMETRY MANIFEST</span>
                <span className="text-emerald-400">STATUS: LIVE</span>
              </div>
              <div className="space-y-2">
                <p><span className="text-cyan-400">Primary Classifier:</span> AudioCNNBiLSTM (with Attention)</p>
                <p><span className="text-cyan-400">Input Sampling Rate:</span> 16,000 Hz (Mono)</p>
                <p><span className="text-cyan-400">FFT Window Size:</span> 1024 (Hop: 256)</p>
                <p><span className="text-cyan-400">Mel Filterbanks:</span> 80 Bins (40 Hz - 8,000 Hz)</p>
                <p><span className="text-cyan-400">Temporal LSTM:</span> 2 Layers × 128 Hidden (Bidirectional)</p>
                <p><span className="text-cyan-400">Loss Function:</span> Weighted Cross-Entropy</p>
                <p><span className="text-cyan-400">Output Labels:</span> [0: BONAFIDE, 1: SPOOF]</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
