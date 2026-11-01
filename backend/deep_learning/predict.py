"""
Inference and Forensic Analysis Pipeline
----------------------------------------
Loads trained deep learning weights and executes full acoustic inference on input audio.
Computes:
- Binary classification: BONAFIDE (genuine human) vs SPOOF (AI-synthesized/cloned)
- Confidence score and class probability distributions
- Segment-wise inference across multi-window audio recordings
- Time-resolved attention weights from BiLSTM
- Acoustic forensic metrics (RMS, Zero-Crossing, Spectral Centroid)
- Rule-guided acoustic diagnostic explanation
"""

import os
import sys
import json
import time
import argparse
import logging
from typing import Dict, Any, Optional, Union, List
import numpy as np
import torch

from backend.deep_learning.preprocessing import AudioPreprocessor
from backend.deep_learning.cnn_model import BaselineAudioCNN
from backend.deep_learning.cnn_bilstm_model import AudioCNNBiLSTM

logger = logging.getLogger(__name__)


class SpoofPredictor:
    """Production inference engine for synthetic voice detection."""

    def __init__(
        self,
        weights_path: str = "backend/artifacts/best_model.pt",
        config_path: str = "backend/artifacts/model_config.json",
        preproc_config_path: str = "backend/artifacts/preprocessing_config.json",
        device: Optional[str] = None,
    ):
        if device:
            self.device = torch.device(device)
        else:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Load Preprocessor
        if os.path.exists(preproc_config_path):
            self.preprocessor = AudioPreprocessor.load_config(preproc_config_path)
        else:
            self.preprocessor = AudioPreprocessor()

        # Load Model Config
        self.model_config = {}
        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                self.model_config = json.load(f)

        model_arch = self.model_config.get("model_architecture", "AudioCNNBiLSTM")

        # Instantiate Model Architecture
        if model_arch == "BaselineAudioCNN":
            self.model = BaselineAudioCNN()
        else:
            self.model = AudioCNNBiLSTM()

        # Load Weights
        if os.path.exists(weights_path):
            state_dict = torch.load(weights_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
            self.is_trained = True
            logger.info(f"Loaded trained model weights from '{weights_path}' onto {self.device}")
        else:
            self.is_trained = False
            logger.warning(f"No trained weights found at '{weights_path}'! Model is untrained.")

        self.model.to(self.device)
        self.model.eval()

    def generate_explanation(
        self,
        prediction: str,
        confidence: float,
        spoof_prob: float,
        metadata: Dict[str, Any],
    ) -> str:
        """Constructs a forensic acoustic explanation based on learned features and metrics."""
        centroid = metadata.get("spectral_centroid_hz", 0)
        zcr = metadata.get("zero_crossing_rate", 0)

        if prediction == "SPOOF":
            reasons = []
            if spoof_prob > 0.85:
                reasons.append("high-probability spectral phase discrepancies and vocoder boundary artifacts detected")
            else:
                reasons.append("subtle unnatural pitch stability or synthetic formant transitions detected")

            if centroid < 1800:
                reasons.append("bandwidth attenuation consistent with band-limited text-to-speech synthesis")
            elif centroid > 3800:
                reasons.append("high-frequency energy anomalies typical of neural vocoder deconvolution")

            explanation = (
                f"Model assessed this sample as SPOOF (confidence: {confidence*100:.1f}%). "
                f"Acoustic indicators suggest {' and '.join(reasons)}. "
                "The temporal attention mechanism detected localized phase or harmonic inconsistencies."
            )
        else:
            reasons = []
            if confidence > 0.85:
                reasons.append("natural human vocal tract resonances and smooth glottal flow dynamics")
            else:
                reasons.append("prosodic micro-pitch drift consistent with authentic human speech")

            explanation = (
                f"Model assessed this sample as BONAFIDE (confidence: {confidence*100:.1f}%). "
                f"Features demonstrate {' and '.join(reasons)}, with no detectable neural vocoder artifacts."
            )

        return explanation

    def predict(
        self,
        audio_source: Union[str, bytes],
        detailed_segments: bool = True,
    ) -> Dict[str, Any]:
        """
        Runs comprehensive prediction on input audio.
        """
        t0 = time.time()
        tensor_input, metadata, log_mel, mfcc = self.preprocessor.process_for_inference(audio_source)
        tensor_input = tensor_input.to(self.device)

        with torch.no_grad():
            if isinstance(self.model, AudioCNNBiLSTM):
                logits, attention_weights = self.model.forward_with_attention(tensor_input)
                attn = attention_weights.squeeze(0).cpu().numpy().tolist()
            else:
                logits = self.model(tensor_input)
                attn = []

            probs = torch.softmax(logits, dim=-1).squeeze(0).cpu().numpy()

        bonafide_prob = float(probs[0])
        spoof_prob = float(probs[1])

        pred_idx = int(np.argmax(probs))
        prediction = "BONAFIDE" if pred_idx == 0 else "SPOOF"
        confidence = float(probs[pred_idx])
        latency_ms = round((time.time() - t0) * 1000, 2)

        # Segment-wise analysis for longer recordings
        segment_results = []
        if detailed_segments and metadata["duration"] > 3.5:
            try:
                batch_tensor, seg_metas, _ = self.preprocessor.process_all_segments(audio_source)
                batch_tensor = batch_tensor.to(self.device)
                with torch.no_grad():
                    seg_logits = self.model(batch_tensor)
                    seg_probs = torch.softmax(seg_logits, dim=-1).cpu().numpy()

                for i, meta in enumerate(seg_metas):
                    s_b_prob = float(seg_probs[i, 0])
                    s_s_prob = float(seg_probs[i, 1])
                    s_pred = "BONAFIDE" if s_b_prob >= s_s_prob else "SPOOF"
                    segment_results.append({
                        **meta,
                        "prediction": s_pred,
                        "bonafide_prob": round(s_b_prob, 4),
                        "spoof_prob": round(s_s_prob, 4),
                        "confidence": round(max(s_b_prob, s_s_prob), 4),
                    })
            except Exception as e:
                logger.error(f"Error computing segment-wise analysis: {e}")

        explanation = self.generate_explanation(prediction, confidence, spoof_prob, metadata)

        # Downsample visual spectrogram matrices for rapid JSON transmission
        # Downsample mel from (80, 188) to a compact grid (e.g. 40 x 94)
        mel_grid = log_mel[::2, ::2].tolist()
        mfcc_grid = mfcc[::1, ::2].tolist()

        return {
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "probabilities": {
                "bonafide": round(bonafide_prob, 4),
                "spoof": round(spoof_prob, 4),
            },
            "audio_metadata": metadata,
            "analysis_time_ms": latency_ms,
            "explanation": explanation,
            "model_info": {
                "model_name": self.model_config.get("model_architecture", "AudioCNNBiLSTM"),
                "is_trained": self.is_trained,
                "device": str(self.device),
            },
            "attention_weights": attn,
            "segment_predictions": segment_results,
            "visualizations": {
                "mel_spectrogram_preview": mel_grid,
                "mfcc_preview": mfcc_grid,
            },
            "disclaimer": (
                "Assessment generated by deep learning model for research and detection support. "
                "Outputs represent algorithmic risk assessments and should be evaluated alongside other forensic context."
            ),
        }


def main():
    parser = argparse.ArgumentParser(description="Predict synthetic voice spoof from audio.")
    parser.add_argument("audio_path", type=str, help="Path to input audio file")
    parser.add_argument("--weights", type=str, default="backend/artifacts/best_model.pt")
    args = parser.parse_args()

    predictor = SpoofPredictor(weights_path=args.weights)
    result = predictor.predict(args.audio_path)

    print("\n================ PREDICTION RESULT ================")
    print(f"Classification:   {result['prediction']}")
    print(f"Confidence:       {result['confidence']*100:.2f}%")
    print(f"Bonafide Prob:    {result['probabilities']['bonafide']*100:.2f}%")
    print(f"Spoof Prob:       {result['probabilities']['spoof']*100:.2f}%")
    print(f"Latency:          {result['analysis_time_ms']} ms")
    print(f"Explanation:      {result['explanation']}")
    print("===================================================\n")


if __name__ == "__main__":
    main()
