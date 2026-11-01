"""
Automated Unit Tests for Audio Preprocessing Pipeline
-----------------------------------------------------
"""

import os
import io
import numpy as np
import pytest
import soundfile as sf
import torch

from backend.deep_learning.preprocessing import AudioPreprocessor


@pytest.fixture
def preprocessor():
    return AudioPreprocessor(target_sr=16000, duration=3.0, n_mels=80, hop_length=256)


@pytest.fixture
def synthetic_wav_bytes():
    """Generates 2.0s sine wave audio in memory as WAV bytes."""
    sr = 16000
    t = np.linspace(0, 2.0, int(sr * 2.0), endpoint=False)
    y = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)

    buf = io.BytesIO()
    sf.write(buf, y, sr, format="WAV")
    buf.seek(0)
    return buf.read()


def test_audio_loading_and_resampling(preprocessor, synthetic_wav_bytes):
    y, sr, duration = preprocessor.load_audio(synthetic_wav_bytes)

    assert sr == 16000
    assert y.ndim == 1  # Guaranteed mono
    assert 1.95 <= duration <= 2.05
    assert np.max(np.abs(y)) <= 0.96  # Headroom normalization preserved


def test_pad_or_truncate(preprocessor):
    sr = 16000
    # Shorter audio (1.0s = 16000 samples)
    y_short = np.ones(16000, dtype=np.float32)
    y_padded = preprocessor.pad_or_truncate(y_short)
    assert len(y_padded) == preprocessor.target_length  # 48000

    # Longer audio (5.0s = 80000 samples)
    y_long = np.ones(80000, dtype=np.float32)
    y_cropped = preprocessor.pad_or_truncate(y_long)
    assert len(y_cropped) == preprocessor.target_length  # 48000


def test_log_mel_spectrogram_shape(preprocessor, synthetic_wav_bytes):
    y, sr, _ = preprocessor.load_audio(synthetic_wav_bytes)
    y_fixed = preprocessor.pad_or_truncate(y)
    log_mel = preprocessor.compute_log_mel_spectrogram(y_fixed)

    assert log_mel.shape[0] == 80  # n_mels
    expected_frames = int(preprocessor.target_length / preprocessor.hop_length) + 1
    assert abs(log_mel.shape[1] - expected_frames) <= 1
    assert not np.isnan(log_mel).any()


def test_mfcc_extraction(preprocessor, synthetic_wav_bytes):
    y, sr, _ = preprocessor.load_audio(synthetic_wav_bytes)
    y_fixed = preprocessor.pad_or_truncate(y)
    mfcc = preprocessor.compute_mfcc(y_fixed)

    assert mfcc.shape[0] == preprocessor.n_mfcc  # 20 coefficients
    assert not np.isnan(mfcc).any()


def test_inference_preprocessing_pipeline(preprocessor, synthetic_wav_bytes):
    tensor_input, metadata, log_mel, mfcc = preprocessor.process_for_inference(synthetic_wav_bytes)

    assert isinstance(tensor_input, torch.Tensor)
    assert tensor_input.ndim == 4  # (batch=1, channel=1, n_mels=80, time)
    assert tensor_input.shape[0] == 1
    assert tensor_input.shape[1] == 1
    assert tensor_input.shape[2] == 80

    assert metadata["duration"] == 2.0
    assert metadata["sample_rate"] == 16000
    assert metadata["channels"] == 1
    assert "spectral_centroid_hz" in metadata
    assert "rms_energy" in metadata
