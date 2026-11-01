"""
CLI Audio Preprocessing Wrapper
-------------------------------
Provides command-line audio inspection and preprocessing as specified in Section 5.
"""

import sys
import argparse
import json
from backend.deep_learning.preprocessing import AudioPreprocessor


def main():
    parser = argparse.ArgumentParser(description="Preprocess an audio file into Log-Mel features.")
    parser.add_argument("audio_path", type=str, help="Path to audio file (WAV/MP3/FLAC)")
    parser.add_argument("--output_npy", type=str, default=None, help="Optional path to save feature array (.npy)")
    args = parser.parse_args()

    preprocessor = AudioPreprocessor()
    tensor_input, metadata, log_mel, mfcc = preprocessor.process_for_inference(args.audio_path)

    print("\n--- Audio Preprocessing Diagnostic ---")
    print(f"File: {args.audio_path}")
    print(f"Duration: {metadata['duration']} seconds")
    print(f"Sample Rate: {metadata['sample_rate']} Hz (Mono)")
    print(f"RMS Energy: {metadata['rms_energy']}")
    print(f"Zero Crossing Count: {metadata['zero_crossing_rate']}")
    print(f"Spectral Centroid: {metadata['spectral_centroid_hz']} Hz")
    print(f"Extracted Log-Mel Spectrogram Shape: {log_mel.shape} (mels x frames)")
    print(f"Extracted MFCC Shape: {mfcc.shape} (coeffs x frames)")
    print(f"Tensor Input Shape (NCHW): {tensor_input.shape}")

    if args.output_npy:
        import numpy as np
        np.save(args.output_npy, log_mel)
        print(f"Saved Log-Mel Spectrogram to: {args.output_npy}")


if __name__ == "__main__":
    main()
