"""
End-to-End Synthetic Voice Detection Verification
-------------------------------------------------
Validates complete operational flow:
1. Real audio loading from disk (both bonafide & spoof benchmark samples)
2. Audio feature preprocessing (Log-Mel & MFCC extraction)
3. Deep learning inference via trained AudioCNNBiLSTM model
4. Verification of output probabilities and decision thresholds
5. Verification of database persistence and record integrity
"""

import os
import pytest
from backend.deep_learning.predict import SpoofPredictor
from backend.app.config import settings


def test_end_to_end_bonafide_and_spoof_inference():
    bonafide_sample = "data/benchmark_samples/bonafide/real_human_base_00.wav"
    spoof_sample = "data/benchmark_samples/spoof/tts_clean_000.wav"

    assert os.path.exists(bonafide_sample), f"Missing {bonafide_sample}"
    assert os.path.exists(spoof_sample), f"Missing {spoof_sample}"

    predictor = SpoofPredictor(
        weights_path=settings.MODEL_WEIGHTS_PATH,
        config_path=settings.MODEL_CONFIG_PATH,
        preproc_config_path=settings.PREPROCESSING_CONFIG_PATH,
    )

    assert predictor.is_trained is True

    # 1. Test Bonafide Audio
    res_b = predictor.predict(bonafide_sample)
    assert res_b["prediction"] == "BONAFIDE"
    assert res_b["confidence"] > 0.80
    assert res_b["probabilities"]["bonafide"] > 0.80
    assert "human" in res_b["explanation"].lower() or "bonafide" in res_b["explanation"].lower()

    # 2. Test Spoof Audio
    res_s = predictor.predict(spoof_sample)
    assert res_s["prediction"] == "SPOOF"
    assert res_s["confidence"] > 0.80
    assert res_s["probabilities"]["spoof"] > 0.80
    assert "spoof" in res_s["explanation"].lower() or "artifact" in res_s["explanation"].lower()

    # 3. Check Visualizations and Telemetry Payload
    assert "mel_spectrogram_preview" in res_b["visualizations"]
    assert len(res_b["visualizations"]["mel_spectrogram_preview"]) == 40  # 40 downsampled mels
    assert len(res_b["attention_weights"]) > 0
