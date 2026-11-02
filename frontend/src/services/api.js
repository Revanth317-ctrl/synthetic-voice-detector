/**
 * VoiceSentry API Client Service
 * ------------------------------
 * Handles all REST communication with the FastAPI deep learning backend.
 * Features smart origin detection, local PNA bridging for cloud frontends (Vercel),
 * and transparent fallback error handling.
 */

const DEFAULT_LOCAL_BACKEND = 'http://127.0.0.1:8000/api';

export function getApiBase() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('voicesentry_api_url');
    if (saved) return saved.replace(/\/$/, '');

    if (import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
    }

    const isLocalhost = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.hostname === '';

    // If deployed on Vercel or cloud domain without a custom URL,
    // default to local backend bridge (http://127.0.0.1:8000/api)
    if (!isLocalhost) {
      return DEFAULT_LOCAL_BACKEND;
    }
  }
  return '/api';
}

export function setApiBase(url) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('voicesentry_api_url', url.trim().replace(/\/$/, ''));
    } else {
      localStorage.removeItem('voicesentry_api_url');
    }
  }
}

async function handleResponse(res, context = 'API request') {
  if (!res.ok) {
    let errorDetail = '';
    try {
      const errorData = await res.json();
      errorDetail = errorData.detail || errorData.message || '';
    } catch (_) {
      // not JSON
    }

    if (res.status === 404 || res.status === 405) {
      throw new Error(
        `Backend endpoint not found (${res.status}). If using Vercel, please connect your backend server (e.g. http://127.0.0.1:8000/api) in Backend Settings.`
      );
    }

    if (res.status === 500) {
      throw new Error(
        errorDetail || `Server error (500). Please check that the backend model service is running on ${getApiBase()}.`
      );
    }

    throw new Error(errorDetail || `${context} failed with status ${res.status}`);
  }

  return await res.json();
}

export async function detectAudio(file) {
  const formData = new FormData();
  formData.append('file', file);

  const base = getApiBase();
  try {
    const res = await fetch(`${base}/detect`, {
      method: 'POST',
      body: formData,
    });
    return await handleResponse(res, 'Audio detection');
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error(
        `Unable to reach backend server at ${base}. Please ensure your backend is running at http://127.0.0.1:8000 or click Backend Settings in the top bar.`
      );
    }
    throw err;
  }
}

export async function recordAudio(blob, filename = 'mic_recording.wav') {
  const formData = new FormData();
  formData.append('file', blob, filename);

  const base = getApiBase();
  try {
    const res = await fetch(`${base}/record`, {
      method: 'POST',
      body: formData,
    });
    return await handleResponse(res, 'Microphone recording analysis');
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error(
        `Unable to reach backend server at ${base}. Please verify backend connection.`
      );
    }
    throw err;
  }
}

export async function getHistory({ page = 1, limit = 10, prediction = null, search = null } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (prediction && prediction !== 'ALL') params.append('prediction', prediction);
  if (search) params.append('search', search);

  const res = await fetch(`${getApiBase()}/history?${params.toString()}`);
  return await handleResponse(res, 'Fetch history');
}

export async function getHistoryDetail(id) {
  const res = await fetch(`${getApiBase()}/history/${id}`);
  return await handleResponse(res, 'Fetch history detail');
}

export async function deleteHistory(id) {
  const res = await fetch(`${getApiBase()}/history/${id}`, {
    method: 'DELETE',
  });
  return await handleResponse(res, 'Delete history record');
}

export async function getHealth(customBase) {
  const base = (customBase || getApiBase()).replace(/\/$/, '');
  const res = await fetch(`${base}/health`, {
    signal: AbortSignal.timeout(6000),
  });
  return await handleResponse(res, 'Health check');
}

export async function getModelInfo() {
  const res = await fetch(`${getApiBase()}/model-info`);
  return await handleResponse(res, 'Model info');
}

export async function getMetrics() {
  const res = await fetch(`${getApiBase()}/metrics`);
  return await handleResponse(res, 'Metrics');
}
