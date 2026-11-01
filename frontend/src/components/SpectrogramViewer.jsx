import React, { useRef, useEffect } from 'react';

/**
 * Maps a normalized float value (-2.0 to 2.0 or 0.0 to 1.0) to an RGB color.
 * Uses a cybernetic Magma-Viridis palette (deep navy -> purple -> red -> yellow -> white).
 */
function valueToColor(val, minVal, maxVal) {
  const norm = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal + 1e-6)));

  // Cyber Magma Colormap
  let r, g, b;
  if (norm < 0.25) {
    const t = norm / 0.25;
    r = Math.floor(15 + 40 * t);
    g = Math.floor(20 + 30 * t);
    b = Math.floor(45 + 110 * t);
  } else if (norm < 0.5) {
    const t = (norm - 0.25) / 0.25;
    r = Math.floor(55 + 120 * t);
    g = Math.floor(50 + 20 * t);
    b = Math.floor(155 - 30 * t);
  } else if (norm < 0.75) {
    const t = (norm - 0.5) / 0.25;
    r = Math.floor(175 + 70 * t);
    g = Math.floor(70 + 80 * t);
    b = Math.floor(125 - 90 * t);
  } else {
    const t = (norm - 0.75) / 0.25;
    r = Math.floor(245 + 10 * t);
    g = Math.floor(150 + 95 * t);
    b = Math.floor(35 + 180 * t);
  }

  return [r, g, b];
}

export default function SpectrogramViewer({
  matrix,
  title = "Log-Mel Spectrogram",
  durationSec = 3.0,
  maxFreqHz = 8000,
  height = 180,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix || matrix.length === 0) return;

    const ctx = canvas.getContext('2d');
    const rows = matrix.length; // Frequency bins
    const cols = matrix[0].length; // Time frames

    // Set internal resolution
    canvas.width = cols;
    canvas.height = rows;

    // Find min and max for scaling
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = matrix[r][c];
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }

    const imgData = ctx.createImageData(cols, rows);
    const data = imgData.data;

    // Notice: row 0 is lowest frequency in matrix, but canvas top (y=0) is top.
    // So invert y axis so high frequencies appear at the top.
    for (let r = 0; r < rows; r++) {
      const targetRow = rows - 1 - r;
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];
        const [red, green, blue] = valueToColor(val, minVal, maxVal);
        const idx = (targetRow * cols + c) * 4;
        data[idx] = red;
        data[idx + 1] = green;
        data[idx + 2] = blue;
        data[idx + 3] = 255; // Alpha
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [matrix]);

  if (!matrix || matrix.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center bg-[#0B0F19] rounded-xl border border-slate-800 text-xs text-slate-500 font-mono">
        No spectral data available
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase font-mono">{title}</h4>
        <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
          {matrix.length} Bins × {matrix[0].length} Frames
        </span>
      </div>

      <div className="relative">
        {/* Y-axis label */}
        <div className="absolute -left-1 top-1 bottom-6 flex flex-col justify-between text-[9px] font-mono text-slate-400 pointer-events-none select-none">
          <span>{maxFreqHz >= 1000 ? `${maxFreqHz / 1000}k` : maxFreqHz}Hz</span>
          <span>{Math.round(maxFreqHz / 2000)}kHz</span>
          <span>40Hz</span>
        </div>

        {/* Canvas Display */}
        <div className="ml-7 mr-2">
          <canvas
            ref={canvasRef}
            className="w-full rounded border border-slate-800"
            style={{ height: `${height}px`, imageRendering: 'auto' }}
          />
        </div>

        {/* X-axis labels */}
        <div className="ml-7 mr-2 flex justify-between text-[9px] font-mono text-slate-400 mt-1 select-none">
          <span>0.0s</span>
          <span>{(durationSec / 2).toFixed(1)}s</span>
          <span>{durationSec.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}
