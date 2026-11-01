/**
 * VoiceSentry API Client Service
 * ------------------------------
 * Handles all REST communication with the FastAPI deep learning backend.
 */

export function getApiBase() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('voicesentry_api_url');
    if (saved) return saved.replace(/\/$/, '');
    if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  return '/api';
}

export function setApiBase(url) {
  if (typeof window !== 'undefined') {
    if (url) {
      localStorage.setItem('voicesentry_api_url', url.trim());
    } else {
      localStorage.removeItem('voicesentry_api_url');
    }
  }
}

export async function detectAudio(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${getApiBase()}/detect`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error (${res.status})`);
  }

  return await res.json();
}

export async function recordAudio(blob, filename = 'mic_recording.wav') {
  const formData = new FormData();
  formData.append('file', blob, filename);

  const res = await fetch(`${getApiBase()}/record`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error (${res.status})`);
  }

  return await res.json();
}

export async function getHistory({ page = 1, limit = 10, prediction = null, search = null } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (prediction && prediction !== 'ALL') params.append('prediction', prediction);
  if (search) params.append('search', search);

  const res = await fetch(`${getApiBase()}/history?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return await res.json();
}

export async function getHistoryDetail(id) {
  const res = await fetch(`${getApiBase()}/history/${id}`);
  if (!res.ok) throw new Error('Failed to fetch history details');
  return await res.json();
}

export async function deleteHistory(id) {
  const res = await fetch(`${getApiBase()}/history/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete history record');
  return await res.json();
}

export async function getHealth() {
  const res = await fetch(`${getApiBase()}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return await res.json();
}

export async function getModelInfo() {
  const res = await fetch(`${getApiBase()}/model-info`);
  if (!res.ok) throw new Error('Failed to retrieve model info');
  return await res.json();
}

export async function getMetrics() {
  const res = await fetch(`${getApiBase()}/metrics`);
  if (!res.ok) throw new Error('Failed to retrieve metrics');
  return await res.json();
}
