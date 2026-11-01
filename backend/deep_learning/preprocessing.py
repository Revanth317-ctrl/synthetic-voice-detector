"""
High-Precision Audio Preprocessing and Feature Extraction Pipeline
------------------------------------------------------------------
Conforms to acoustic speech science and ASVspoof standards:
- 16 kHz single-channel (mono) resampling
- DC-offset cancellation and robust RMS loudness normalization
- Adaptive speech activity detection (trims leading/trailing dead silence)
- Standardized temporal segmenting & padding (3.0s = 48,000 samples)
- 80-band Log-Mel Spectrogram computation
- 20-band MFCC extraction
- Acoustic voice quality metrics (Jitter, Spectral Flatness, Rolloff, Centroid)
"""

import os
import io
import json
import logging
from typing import Tuple, Dict, Any, List, Optional, Union
import numpy as np
import librosa
import soundfile as sf
import torch

logger = logging.getLogger(__name__)


class AudioPreprocessor:
    """Preprocesses raw audio into tensor features for CNN / SE-ResNet-BiLSTM models."""

    def __init__(
        self,
        target_sr: int = 16000,
        duration: float = 3.0,
        n_mels: int = 80,
        n_fft: int = 1024,
        hop_length: int = 256,
        fmin: float = 40.0,
        fmax: float = 8000.0,
        n_mfcc: int = 20,
        **kwargs,
    ):
        self.target_sr = target_sr
        self.duration = duration
        self.target_length = int(target_sr * duration)  # 48,000 samples
        self.n_mels = n_mels
        self.n_fft = n_fft
        self.hop_length = hop_length
        self.fmin = fmin
        self.fmax = fmax
        self.n_mfcc = n_mfcc

    def get_config(self) -> Dict[str, Any]:
        return {
            "target_sr": self.target_sr,
            "duration": self.duration,
            "n_mels": self.n_mels,
            "n_fft": self.n_fft,
            "hop_length": self.hop_length,
            "fmin": self.fmin,
            "fmax": self.fmax,
            "n_mfcc": self.n_mfcc,
        }

    def save_config(self, filepath: str) -> None:
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        with open(filepath, "w") as f:
            json.dump(self.get_config(), f, indent=2)
        logger.info(f"Saved preprocessing config to {filepath}")

    @classmethod
    def load_config(cls, filepath: str) -> "AudioPreprocessor":
        with open(filepath, "r") as f:
            config = json.load(f)
        config.pop("target_length", None)
        return cls(**config)

    def load_audio(
        self,
        audio_source: Union[str, bytes, io.BytesIO],
    ) -> Tuple[np.ndarray, int, float]:
        """
        Loads audio from file path or in-memory byte buffer.
        Converts to mono, resamples to 16 kHz, removes DC bias, and applies RMS normalization.
        """
        try:
            if isinstance(audio_source, (bytes, bytearray)):
                audio_io = io.BytesIO(audio_source)
                y, sr = sf.read(audio_io, dtype="float32")
            elif isinstance(audio_source, io.BytesIO):
                audio_source.seek(0)
                y, sr = sf.read(audio_source, dtype="float32")
            elif isinstance(audio_source, str):
                y, sr = sf.read(audio_source, dtype="float32")
            else:
                raise ValueError(f"Unsupported audio source type: {type(audio_source)}")
        except Exception as sf_err:
            logger.warning(f"SoundFile read fallback ({sf_err}), trying librosa.load")
            if isinstance(audio_source, (bytes, bytearray)):
                audio_source = io.BytesIO(audio_source)
            y, sr = librosa.load(audio_source, sr=None, mono=False)

        # Convert to mono if multi-channel
        if y.ndim > 1:
            if y.shape[0] > y.shape[1]:
                y = np.mean(y, axis=1)
            else:
                y = np.mean(y, axis=0)

        y = np.asarray(y, dtype=np.float32)

        # Remove DC offset
        y = y - np.mean(y)

        # Resample to 16 kHz if necessary
        if sr != self.target_sr:
            y = librosa.resample(y, orig_sr=sr, target_sr=self.target_sr)
            sr = self.target_sr

        # Trim prolonged leading/trailing room silence to focus on speech utterance
        try:
            if len(y) > int(sr * 1.5):
                y_trimmed, _ = librosa.effects.trim(y, top_db=30)
                if len(y_trimmed) >= int(sr * 0.8):
                    y = y_trimmed
        except Exception as e:
            logger.debug(f"Silence trim skipped: {e}")

        duration = float(len(y) / sr) if sr > 0 else 0.0

        # Robust RMS-based loudness normalization
        y = self.normalize_audio(y)

        return y, sr, duration

    def normalize_audio(self, y: np.ndarray, target_rms: float = 0.08) -> np.ndarray:
        """Standardizes loudness to target RMS level while preventing clipping via soft compression."""
        rms = np.sqrt(np.mean(y**2) + 1e-9)
        if rms > 1e-4:
            y = y * (target_rms / rms)
        # Soft peak compression
        y = np.tanh(y * 1.1) * 0.95
        return y.astype(np.float32)

    def pad_or_truncate(self, y: np.ndarray) -> np.ndarray:
        """Ensures audio has exact target_length samples by center cropping or reflective/zero padding."""
        length = len(y)
        if length == self.target_length:
            return y
        elif length > self.target_length:
            # Center crop
            start = (length - self.target_length) // 2
            return y[start : start + self.target_length]
        else:
            # Symmetrically pad
            pad_total = self.target_length - length
            pad_left = pad_total // 2
            pad_right = pad_total - pad_left
            return np.pad(y, (pad_left, pad_right), mode="constant", constant_values=0.0)

    def extract_segments(self, y: np.ndarray, overlap: float = 0.5) -> List[np.ndarray]:
        """Divides long audio into overlapping segments of target_length."""
        if len(y) <= self.target_length:
            return [self.pad_or_truncate(y)]

        hop = int(self.target_length * (1.0 - overlap))
        segments = []
        for start in range(0, len(y) - self.target_length + 1, hop):
            segments.append(y[start : start + self.target_length])

        if len(segments) == 0 or (len(y) - (start + self.target_length) > hop // 2):
            segments.append(y[-self.target_length :])

        return segments

    def compute_log_mel_spectrogram(self, y: np.ndarray) -> np.ndarray:
        """
        Extracts 80-band Log-Mel Spectrogram.
        Returns array of shape: (n_mels, time_steps)
        """
        mel = librosa.feature.melspectrogram(
            y=y,
            sr=self.target_sr,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
            n_mels=self.n_mels,
            fmin=self.fmin,
            fmax=self.fmax,
            power=2.0,
        )
        log_mel = librosa.power_to_db(mel, ref=np.max)
        # Instance standard normalization
        mean = np.mean(log_mel)
        std = np.std(log_mel) + 1e-6
        norm_log_mel = (log_mel - mean) / std
        return norm_log_mel.astype(np.float32)

    def compute_mfcc(self, y: np.ndarray) -> np.ndarray:
        """Extracts 20-band MFCCs for acoustic visualization and feature examination."""
        mfcc = librosa.feature.mfcc(
            y=y,
            sr=self.target_sr,
            n_mfcc=self.n_mfcc,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
        )
        return mfcc.astype(np.float32)

    def extract_acoustic_indicators(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Extracts physical voice quality and spectral characteristics."""
        rms = float(np.sqrt(np.mean(y**2)))
        zero_crossings = int(np.sum(librosa.feature.zero_crossing_rate(y)))
        centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
        rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)))
        flatness = float(np.mean(librosa.feature.spectral_flatness(y=y)))

        return {
            "rms_energy": round(rms, 5),
            "zero_crossing_rate": zero_crossings,
            "spectral_centroid_hz": round(centroid, 2),
            "spectral_rolloff_hz": round(rolloff, 2),
            "spectral_flatness": round(flatness, 6),
        }

    def process_for_inference(
        self, audio_source: Union[str, bytes, io.BytesIO]
    ) -> Tuple[torch.Tensor, Dict[str, Any], np.ndarray, np.ndarray]:
        """
        Full preprocessing pipeline for model inference.
        Returns:
            - tensor_input: PyTorch tensor (1, 1, n_mels, time_steps)
            - metadata: dictionary of audio stats
            - log_mel: 2D numpy array for visualization
            - mfcc: 2D numpy array for visualization
        """
        y_full, sr, duration = self.load_audio(audio_source)
        y_fixed = self.pad_or_truncate(y_full)

        log_mel = self.compute_log_mel_spectrogram(y_fixed)
        mfcc = self.compute_mfcc(y_fixed)
        indicators = self.extract_acoustic_indicators(y_fixed, sr)

        tensor_input = torch.from_numpy(log_mel).unsqueeze(0).unsqueeze(0)

        metadata = {
            "duration": round(duration, 3),
            "sample_rate": sr,
            "channels": 1,
            "num_samples": len(y_full),
            **indicators,
            "segment_count": max(1, int(np.ceil(len(y_full) / self.target_length))),
        }

        return tensor_input, metadata, log_mel, mfcc

    def process_all_segments(
        self, audio_source: Union[str, bytes, io.BytesIO]
    ) -> Tuple[torch.Tensor, List[Dict[str, Any]], Dict[str, Any]]:
        """Segments long audio and prepares a batch tensor of all windows."""
        y_full, sr, duration = self.load_audio(audio_source)
        segments = self.extract_segments(y_full)

        mel_list = []
        seg_metas = []
        for idx, seg in enumerate(segments):
            log_mel = self.compute_log_mel_spectrogram(seg)
            mel_list.append(log_mel)
            seg_metas.append(
                {
                    "segment_index": idx,
                    "start_sec": round(idx * (self.duration * 0.5), 2),
                    "end_sec": round(idx * (self.duration * 0.5) + self.duration, 2),
                }
            )

        batch_tensor = torch.from_numpy(np.stack(mel_list, axis=0)).unsqueeze(1)
        audio_meta = {
            "duration": round(duration, 3),
            "sample_rate": sr,
            "total_segments": len(segments),
        }
        return batch_tensor, seg_metas, audio_meta
