import React from 'react';

export default function WaveformVisualizer({ levels = [], isRecording = false, height = 50 }) {
  // If levels empty, show passive baseline bars
  const bars = levels && levels.length > 0 ? levels : Array.from({ length: 28 }, (_, i) => 0.15 + 0.1 * Math.sin(i * 0.4));

  return (
    <div className="flex items-center justify-center gap-1 w-full bg-[#0B0F19] rounded-xl p-3 border border-slate-800/80">
      {bars.map((lvl, idx) => {
        const heightPercent = Math.max(12, Math.min(100, lvl * 100));
        return (
          <div
            key={idx}
            className={`w-1.5 rounded-full transition-all duration-75 ${
              isRecording
                ? 'bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse'
                : 'bg-gradient-to-t from-cyan-600 to-cyan-400'
            }`}
            style={{
              height: `${heightPercent}%`,
              maxHeight: `${height}px`,
              opacity: isRecording ? 0.9 : 0.65,
            }}
          />
        );
      })}
    </div>
  );
}
