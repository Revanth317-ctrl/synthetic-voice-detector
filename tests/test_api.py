"""
Automated Integration Tests for FastAPI Backend Endpoints
---------------------------------------------------------
Uses Starlette/FastAPI TestClient for synchronous, reliable HTTP lifecycle testing.
"""

import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
import io
import pytest
import soundfile as sf
import numpy as np
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_wav_bytes():
    sr = 16000
    t = np.linspace(0, 1.0, sr, endpoint=False)
    y = (0.4 * np.sin(2 * np.pi * 300 * t)).astype(np.float32)
    buf = io.BytesIO()
    sf.write(buf, y, sr, format="WAV")
    buf.seek(0)
    return buf.read()


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["model_loaded"] is True
    assert "AudioCNNBiLSTM" in data["model_name"]


def test_model_info_endpoint(client):
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_architecture"] == "AudioCNNBiLSTM"
    assert "classes" in data
    assert "BONAFIDE" in data["classes"]
    assert "SPOOF" in data["classes"]


def test_metrics_endpoint(client):
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "test_metrics" in data
    assert "accuracy" in data["test_metrics"]
    assert "equal_error_rate" in data["test_metrics"]


def test_detect_endpoint_valid_audio(client, sample_wav_bytes):
    files = {"file": ("test_sample.wav", sample_wav_bytes, "audio/wav")}
    response = client.post("/api/detect", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] in ["BONAFIDE", "SPOOF"]
    assert 0.0 <= data["confidence"] <= 1.0
    assert "probabilities" in data
    assert "audio_metadata" in data
    assert "explanation" in data
    assert "disclaimer" in data


def test_detect_endpoint_empty_file(client):
    files = {"file": ("empty.wav", b"", "audio/wav")}
    response = client.post("/api/detect", files=files)
    assert response.status_code == 400


def test_detect_endpoint_unsupported_format(client):
    files = {"file": ("doc.txt", b"plain text", "text/plain")}
    response = client.post("/api/detect", files=files)
    assert response.status_code == 415


def test_history_flow(client, sample_wav_bytes):
    # 1. Post detection
    files = {"file": ("history_test.wav", sample_wav_bytes, "audio/wav")}
    post_res = client.post("/api/detect", files=files)
    assert post_res.status_code == 200
    created_id = post_res.json().get("id")

    # 2. Get history
    hist_res = client.get("/api/history?page=1&limit=10")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert hist_data["total"] >= 1
    assert any(item["file_name"] == "history_test.wav" for item in hist_data["items"])

    # 3. Delete history item
    if created_id:
        del_res = client.delete(f"/api/history/{created_id}")
        assert del_res.status_code == 200
        assert del_res.json()["deleted_id"] == created_id
