import React from 'react';
import { 
  Info, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Layers, 
  AlertTriangle, 
  ExternalLink,
  Code2,
  Lock,
  GitBranch
} from 'lucide-react';

export default function About() {
  const techStack = [
    { name: "PyTorch 2.15", category: "Deep Learning Engine", desc: "Powers the CNN-BiLSTM architecture with GPU/CPU auto-dispatch." },
    { name: "Librosa 0.11", category: "Acoustic Signal Processing", desc: "Calculates 80-band Log-Mel filterbanks, STFT, and MFCC representations." },
    { name: "SoundFile 0.14", category: "Audio I/O", desc: "Lossless PCM audio streaming and validation across WAV, FLAC, and OGG." },
    { name: "FastAPI & Uvicorn", category: "High-Performance Backend", desc: "Async ASGI REST API with Pydantic validation and CORS management." },
    { name: "SQLite & SQLAlchemy", category: "Database Layer", desc: "Async ORM persistence for audit history and telemetry logs." },
    { name: "React 18 & Vite", category: "Frontend Framework", desc: "Modular, reactive interface with Web Audio API real-time recording." },
    { name: "Tailwind CSS", category: "Cybersecurity UI", desc: "Dark navy and electric cyan high-contrast visual ergonomics." },
    { name: "Scikit-Learn", category: "Model Evaluation", desc: "Computes ROC-AUC, Confusion Matrix, and Equal Error Rate (EER)." },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pb-6 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 text-xs font-mono">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>TECHNICAL SPECIFICATION & PROJECT OVERVIEW</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          AI-Based Synthetic Voice & Audio Spoof Detection
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Comprehensive research-backed system engineered to defend against modern deepfake speech synthesis,
          generative voice conversion, and biometric spoofing attacks.
        </p>
      </div>

      {/* Problem Statement & Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Problem Statement</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The proliferation of neural vocoders (HiFi-GAN, WaveGlow, Diffusion Vocoders) and zero-shot voice cloning
            tools allows threat actors to mimic any individual's voice with under three seconds of reference audio. 
            This enables scalable executive impersonation, biometric authorization bypass in financial call centers,
            and targeted social engineering scams.
          </p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Project Objectives</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            1. Formulate a genuine deep learning pipeline combining spectral CNN feature extractors with BiLSTM temporal recurrence.<br />
            2. Extract 80-band Log-Mel and 20-band MFCC acoustic features that expose subtle vocoder phase discrepancies.<br />
            3. Implement an end-to-end web dashboard with live microphone capture, immediate inference, and persistent audit logs.<br />
            4. Provide transparent, rule-guided acoustic explanations rather than black-box labels.
          </p>
        </div>
      </div>

      {/* Neural Network Architecture */}
      <section className="bg-[#111827] border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-cyan-400">
          <Layers className="w-4 h-4" />
          <span>Deep Learning Architecture: CNN-BiLSTM with Attention</span>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            The system pairs a <strong>4-Stage 2D-Convolutional Neural Network (CNN)</strong> front-end with a 
            <strong> 2-Layer Bidirectional Long Short-Term Memory (BiLSTM)</strong> recurrent backbone and a 
            <strong> Learned Self-Attention Pooling Layer</strong>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-mono text-[11px]">
            <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-1.5">
              <span className="text-cyan-400 font-bold">1. 2D-CNN Front-End</span>
              <p className="text-slate-400 font-sans">
                Applies 2D convolutions with Batch Normalization and asymmetric frequency pooling, reducing the 80 Mel bins to 5 high-level spectral feature maps while preserving full temporal resolution.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-1.5">
              <span className="text-cyan-400 font-bold">2. BiLSTM Backbone</span>
              <p className="text-slate-400 font-sans">
                Processes the sequential spectral frames in both forward and backward temporal directions, learning long-range prosodic trajectories and sudden unnatural diphone transitions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-1.5">
              <span className="text-cyan-400 font-bold">3. Self-Attention Head</span>
              <p className="text-slate-400 font-sans">
                Computes energy weights across time frames, automatically directing higher attention to anomalous vocoder glitch boundaries and outputting final binary logits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dataset Protocols */}
      <section className="bg-[#111827] border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-cyan-400">
          <Database className="w-4 h-4" />
          <span>Dataset Integration & Protocols</span>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            The detection system is designed around standard international voice anti-spoofing benchmarks:
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
              <div className="flex items-center justify-between text-white font-bold mb-1">
                <span>ASVspoof 2019 Logical Access (LA)</span>
                <span className="text-cyan-400 text-[10px]">Primary Benchmark</span>
              </div>
              <p className="text-slate-400 font-sans text-[11px]">
                Contains genuine human speech and spoofed recordings from 17 distinct speech synthesis (TTS) and voice conversion (VC) algorithms (A01 through A19).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
              <div className="flex items-center justify-between text-white font-bold mb-1">
                <span>ASVspoof 2021 Deepfake (DF) & WaveFake</span>
                <span className="text-slate-400 text-[10px]">Cross-Dataset Protocol</span>
              </div>
              <p className="text-slate-400 font-sans text-[11px]">
                Evaluates detection generalization across lossy MP3/AAC compression codecs, MelGAN, HiFi-GAN, WaveGlow, and Parallel WaveGAN vocoders.
              </p>
            </div>
          </div>

          <p className="text-slate-400 text-[11px] pt-1">
            To prevent data leakage, all dataset manifests are split using <strong>strict speaker-disjoint partitioning</strong>, ensuring that training, validation, and test splits contain zero overlapping speakers.
          </p>
        </div>
      </section>

      {/* Technologies Used Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <span>Technologies & Libraries</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techStack.map((tech, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400">{tech.category}</div>
              <div className="text-sm font-bold text-white">{tech.name}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Limitations and Future Scope */}
      <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-3 leading-relaxed">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">
          Forensic Limitations & Future Scope
        </h3>
        <ul className="list-disc list-inside space-y-1.5 text-slate-400">
          <li><strong>Audio Compression Effects:</strong> Heavy telephony encoding (e.g., AMR 8 kHz) can strip high-frequency vocoder cues; future models will integrate multi-resolution wav2vec 2.0 self-supervised representations.</li>
          <li><strong>Adversarial Perturbations:</strong> Sub-perceptual adversarial noise added to deepfake audio can mislead CNN classifiers; future work will incorporate adversarial training and certified defense bounds.</li>
          <li><strong>Diffusion Vocoders:</strong> Rapidly emerging flow-matching and score-based diffusion vocoders require ongoing dataset retraining to maintain optimal detection margins.</li>
        </ul>
      </section>
    </div>
  );
}
