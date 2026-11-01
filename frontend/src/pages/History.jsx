import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Filter, 
  FileAudio, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight,
  X
} from 'lucide-react';
import { getHistory, getHistoryDetail, deleteHistory } from '../services/api';

export default function History({ setActivePage, setGlobalAnalysisData }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [predictionFilter, setPredictionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getHistory({
        page,
        limit: 10,
        prediction: predictionFilter,
        search: searchQuery || null,
      });
      setHistoryItems(data.items || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, predictionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis record?')) return;
    setIsDeleting(id);
    try {
      await deleteHistory(id);
      setHistoryItems((prev) => prev.filter((it) => it.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      if (selectedRecord?.id === id) setSelectedRecord(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const detail = await getHistoryDetail(id);
      setSelectedRecord(detail);
    } catch (err) {
      alert('Failed to load detail: ' + err.message);
    }
  };

  const handleInspectInLab = (record) => {
    if (setGlobalAnalysisData) {
      setGlobalAnalysisData({
        id: record.id,
        file_name: record.file_name,
        prediction: record.prediction,
        confidence: record.confidence,
        probabilities: record.probabilities,
        audio_metadata: {
          duration: record.duration_seconds,
          sample_rate: record.sample_rate,
          spectral_centroid_hz: record.acoustic_metadata?.spectral_centroid_hz,
          zero_crossing_rate: record.acoustic_metadata?.zero_crossing_rate,
          rms_energy: record.acoustic_metadata?.rms_energy,
          segment_count: record.segment_results?.length || 1,
        },
        analysis_time_ms: record.analysis_time_ms,
        explanation: record.explanation,
        visualizations: {
          mel_spectrogram_preview: record.spectrogram_preview,
          mfcc_preview: record.mfcc_preview,
        },
        segment_predictions: record.segment_results || [],
      });
      setActivePage('analysis');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 text-[11px] font-mono mb-2">
            <HistoryIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>AUDIT LOG & PERSISTENT DATABASE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Analysis History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, and review previous forensic voice authenticity evaluations.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#111827] p-4 rounded-2xl border border-slate-800">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by audio filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
          <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-slate-800 text-xs">
            {['ALL', 'BONAFIDE', 'SPOOF'].map((filt) => (
              <button
                key={filt}
                onClick={() => {
                  setPredictionFilter(filt);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
                  predictionFilter === filt
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Loading database records...</span>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <FileAudio className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No matching analysis records found</p>
            <p className="text-xs text-slate-500">Run an audio analysis in the Detection Dashboard to create log entries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0F19] text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Audio File</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Assessment</th>
                  <th className="py-3.5 px-4">Confidence</th>
                  <th className="py-3.5 px-4">Analyzed At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {historyItems.map((item) => {
                  const isBonafide = item.prediction === 'BONAFIDE';
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleViewDetail(item.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-white max-w-xs truncate">
                        {item.file_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono uppercase text-slate-400">
                        {item.file_format}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {item.duration_seconds.toFixed(2)}s
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border ${
                            isBonafide
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                              : 'bg-rose-950/80 text-rose-400 border-rose-800'
                          }`}
                        >
                          {isBonafide ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          <span>{item.prediction}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        {(item.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(item.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          disabled={isDeleting === item.id}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-900 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalCount > 10 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {historyItems.length} of {totalCount} records
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 py-1 font-mono text-cyan-400">Page {page}</span>
              <button
                disabled={page * 10 >= totalCount}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">Record Inspection #{selectedRecord.id}</div>
              <h2 className="text-xl font-bold text-white truncate max-w-md">{selectedRecord.file_name}</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono">ASSESSMENT</span>
                <div className={`font-bold font-mono mt-0.5 ${selectedRecord.prediction === 'BONAFIDE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedRecord.prediction}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono">CONFIDENCE</span>
                <div className="font-bold font-mono text-cyan-400 mt-0.5">
                  {(selectedRecord.confidence * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono">DURATION</span>
                <div className="font-bold font-mono text-slate-200 mt-0.5">
                  {selectedRecord.duration_seconds.toFixed(2)}s
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono">LATENCY</span>
                <div className="font-bold font-mono text-slate-200 mt-0.5">
                  {selectedRecord.analysis_time_ms} ms
                </div>
              </div>
            </div>

            {selectedRecord.explanation && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="text-slate-400 uppercase font-mono text-[10px] block mb-1">Diagnostic Explanation</span>
                {selectedRecord.explanation}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => handleInspectInLab(selectedRecord)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Inspect in Forensic Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
