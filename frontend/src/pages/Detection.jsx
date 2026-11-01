import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Mic, 
  Square, 
  FileAudio, 
  Play, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight, 
  Clock, 
  Radio, 
  Sliders, 
  FileCheck 
} from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import ConfidenceMeter from '../components/ConfidenceMeter';
import SpectrogramViewer from '../components/SpectrogramViewer';
import WaveformVisualizer from '../components/WaveformVisualizer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { detectAudio, recordAudio } from '../services/api';

export default function Detection({ setActivePage, setGlobalAnalysisData }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'record'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Microphone recorder hook
  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl: micAudioUrl,
    audioLevels,
    error: micError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setErrorMessage(null);
    setAnalysisResult(null);

    const validExts = ['.wav', '.mp3', '.flac', '.ogg', '.m4a', '.webm'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExts.includes(ext)) {
      setErrorMessage(`Unsupported format '${ext}'. Please choose a WAV, MP3, FLAC, OGG, or M4A file.`);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 15 MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  // Perform Analysis
  const handleAnalyze = async () => {
    setErrorMessage(null);
    setIsAnalyzing(true);

    try {
      let result;
      if (activeTab === 'upload') {
        if (!selectedFile) {
          throw new Error('Please select an audio file first.');
        }
        result = await detectAudio(selectedFile);
      } else {
        if (!audioBlob) {
          throw new Error('Please record audio with your microphone first.');
        }
        result = await recordAudio(audioBlob, 'microphone_recording.wav');
      }

      setAnalysisResult(result);
      if (setGlobalAnalysisData) {
        setGlobalAnalysisData(result);
      }
    } catch (err) {
      console.error('Detection failed:', err);
      setErrorMessage(err.message || 'Detection failed. Please verify audio format and backend connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    resetRecording();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 text-[11px] font-mono mb-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>SPECTRAL FORENSICS DASHBOARD</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Audio Spoof Detection</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload voice recordings or capture live speech to assess synthetic voice probability.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#111827] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('upload');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('record');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'record'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Microphone Stream</span>
          </button>
        </div>
      </div>

      {/* Main Input Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : selectedFile
                  ? 'border-emerald-500/60 bg-emerald-950/10'
                  : 'border-slate-800 bg-[#111827]/70 hover:border-slate-700 hover:bg-[#111827]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".wav,.mp3,.flac,.ogg,.m4a,.webm"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                {selectedFile ? <FileCheck className="w-8 h-8 text-emerald-400" /> : <Upload className="w-8 h-8" />}
              </div>

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="text-base font-bold text-white truncate max-w-md mx-auto">{selectedFile.name}</div>
                  <div className="text-xs text-emerald-400 font-mono">
                    Ready for inspection • {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                  <p className="text-[11px] text-slate-500">Click or drag another file to replace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-base font-bold text-white">Drag & drop your voice recording here</div>
                  <p className="text-xs text-slate-400">or click to browse your local file system</p>
                  <p className="text-[11px] text-slate-500 font-mono pt-2">
                    Supports WAV, MP3, FLAC, OGG, M4A (Max 15 MB)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Microphone Tab */}
          {activeTab === 'record' && (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-8 text-center space-y-6">
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-white">Live Microphone Capture</h3>
                <p className="text-xs text-slate-400">
                  Speak clearly into your microphone for 3 to 5 seconds to evaluate real-time acoustic resonance.
                </p>
              </div>

              {/* Waveform indicator */}
              <div className="max-w-md mx-auto">
                <WaveformVisualizer levels={audioLevels} isRecording={isRecording} height={60} />
              </div>

              {/* Timer & Controls */}
              <div className="flex flex-col items-center gap-4">
                <div className="text-2xl font-mono font-bold text-slate-100 flex items-center gap-2">
                  <Clock className={`w-5 h-5 ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                  <span>
                    00:{recordingTime < 10 ? '0' : ''}{recordingTime}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wide shadow-md shadow-rose-600/30 transition-transform active:scale-95 flex items-center gap-2"
                    >
                      <Mic className="w-4 h-4" />
                      <span>{audioBlob ? 'Record Again' : 'Start Recording'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/40 font-bold text-xs tracking-wide transition-colors flex items-center gap-2"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Stop Recording</span>
                    </button>
                  )}
                </div>

                {audioBlob && !isRecording && (
                  <p className="text-xs text-emerald-400 font-mono">
                    Recording ready for analysis ({recordingTime}s, {(audioBlob.size / 1024).toFixed(1)} KB)
                  </p>
                )}

                {micError && (
                  <p className="text-xs text-rose-400 font-mono bg-rose-950/50 p-2 rounded border border-rose-900">
                    {micError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Audio Player Preview */}
          {((activeTab === 'upload' && selectedFile) || (activeTab === 'record' && micAudioUrl)) && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 font-mono">AUDIO PLAYBACK PREVIEW</div>
              <AudioPlayer
                audioSource={activeTab === 'upload' ? selectedFile : micAudioUrl}
                fileName={activeTab === 'upload' ? selectedFile?.name : 'Microphone Recording'}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (activeTab === 'upload' && !selectedFile) || (activeTab === 'record' && !audioBlob)}
              className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                isAnalyzing || (activeTab === 'upload' && !selectedFile) || (activeTab === 'record' && !audioBlob)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 hover:scale-[1.01] active:scale-95'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Log-Mel Features & Running BiLSTM...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>Analyze Audio Authenticity</span>
                </>
              )}
            </button>

            {(selectedFile || audioBlob || analysisResult) && (
              <button
                onClick={handleReset}
                className="px-4 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold">Analysis Failed</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pre-calibrated Benchmark Audio presets & Quick Tips */}
        <div className="space-y-6">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold font-mono text-cyan-400 uppercase tracking-wider">
              <FileAudio className="w-4 h-4" />
              <span>Quick Test Samples</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Don't have a sample on hand? Test the system using calibrated benchmark recordings:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={async () => {
                  try {
                    setIsAnalyzing(true);
                    const res = await fetch('/static/samples/bonafide/real_human_base_00.wav');
                    const blob = await res.blob();
                    const file = new File([blob], 'benchmark_bonafide_human.wav', { type: 'audio/wav' });
                    setSelectedFile(file);
                    setActiveTab('upload');
                    const r = await detectAudio(file);
                    setAnalysisResult(r);
                    if (setGlobalAnalysisData) setGlobalAnalysisData(r);
                  } catch (e) {
                    setErrorMessage('Failed to load sample: ' + e.message);
                  } finally {
                    setIsAnalyzing(false);
                  }
                }}
                className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-400">Sample 1: Bonafide Human</div>
                  <div className="text-[10px] text-slate-500 font-mono">Natural glottal resonance • 16 kHz</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                  TEST
                </span>
              </button>

              <button
                onClick={async () => {
                  try {
                    setIsAnalyzing(true);
                    const res = await fetch('/static/samples/spoof/tts_clean_000.wav');
                    const blob = await res.blob();
                    const file = new File([blob], 'benchmark_synthetic_vocoder.wav', { type: 'audio/wav' });
                    setSelectedFile(file);
                    setActiveTab('upload');
                    const r = await detectAudio(file);
                    setAnalysisResult(r);
                    if (setGlobalAnalysisData) setGlobalAnalysisData(r);
                  } catch (e) {
                    setErrorMessage('Failed to load sample: ' + e.message);
                  } finally {
                    setIsAnalyzing(false);
                  }
                }}
                className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/40 text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-rose-400">Sample 2: Synthetic Vocoder</div>
                  <div className="text-[10px] text-slate-500 font-mono">Phase perturbation & flat F0</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/80">
                  TEST
                </span>
              </button>
            </div>
          </div>

          <div className="bg-[#111827]/70 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs text-slate-400 leading-relaxed font-mono">
            <div className="text-slate-200 font-semibold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspection Guidelines</span>
            </div>
            <ul className="space-y-2 list-disc list-inside text-[11px] text-slate-400">
              <li>Recordings &ge; 3.0 seconds produce optimal spectral continuity metrics.</li>
              <li>Shorter files are symmetrically padded without pitch distortion.</li>
              <li>Multi-speaker or noisy audio triggers segment-wise window evaluation.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Prediction Results Display */}
      {analysisResult && (
        <section className="space-y-6 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-cyan-400" />
              <span>Model Assessment Results</span>
            </h2>

            <button
              onClick={() => {
                if (setGlobalAnalysisData) setGlobalAnalysisData(analysisResult);
                setActivePage('analysis');
              }}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors font-mono"
            >
              <span>Open Detailed Forensic Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Confidence Meter */}
          <ConfidenceMeter
            prediction={analysisResult.prediction}
            confidence={analysisResult.confidence}
            probabilities={analysisResult.probabilities}
          />

          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono">AUDIO DURATION</div>
              <div className="text-base font-bold text-slate-100 font-mono mt-1">
                {analysisResult.audio_metadata.duration}s
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono">SAMPLING RATE</div>
              <div className="text-base font-bold text-slate-100 font-mono mt-1">
                {analysisResult.audio_metadata.sample_rate} Hz (Mono)
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono">INFERENCE LATENCY</div>
              <div className="text-base font-bold text-cyan-400 font-mono mt-1">
                {analysisResult.analysis_time_ms} ms
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono">SPECTRAL CENTROID</div>
              <div className="text-base font-bold text-slate-100 font-mono mt-1">
                {analysisResult.audio_metadata.spectral_centroid_hz} Hz
              </div>
            </div>
          </div>

          {/* Forensic Explanation */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1.5">
            <div className="text-slate-400 uppercase font-mono text-[10px] tracking-wider font-semibold">
              Forensic Acoustic Explanation
            </div>
            <p className="text-sm text-slate-200">{analysisResult.explanation}</p>
          </div>

          {/* Spectrogram Preview */}
          {analysisResult.visualizations?.mel_spectrogram_preview && (
            <SpectrogramViewer
              matrix={analysisResult.visualizations.mel_spectrogram_preview}
              title="80-Band Log-Mel Spectrogram Representation"
              durationSec={analysisResult.audio_metadata.duration}
              maxFreqHz={8000}
              height={190}
            />
          )}
        </section>
      )}
    </div>
  );
}
