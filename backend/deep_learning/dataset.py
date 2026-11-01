"""
PyTorch Dataset and DataLoader for Synthetic Voice & Spoof Detection
--------------------------------------------------------------------
Handles metadata manifests, feature extraction, audio loading, and
on-the-fly acoustic data augmentation (noise, time-shift, SpecAugment).
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from backend.deep_learning.preprocessing import AudioPreprocessor

logger = logging.getLogger(__name__)


class AudioSpoofDataset(Dataset):
    """PyTorch Dataset for audio spoof detection manifest."""

    def __init__(
        self,
        manifest_path_or_items: Any,
        preprocessor: AudioPreprocessor,
        is_training: bool = False,
        augment: bool = False,
    ):
        """
        Args:
            manifest_path_or_items: Path to JSON/CSV manifest, or list of dicts.
            preprocessor: AudioPreprocessor instance.
            is_training: Whether dataset is used for training.
            augment: Whether to apply subtle acoustic data augmentation.
        """
        self.preprocessor = preprocessor
        self.is_training = is_training
        self.augment = augment and is_training

        if isinstance(manifest_path_or_items, str):
            with open(manifest_path_or_items, "r") as f:
                self.items = json.load(f)
        elif isinstance(manifest_path_or_items, list):
            self.items = manifest_path_or_items
        else:
            raise ValueError("Expected filepath or list of sample items.")

        # Validate samples exist
        self.valid_items = []
        for item in self.items:
            if os.path.exists(item["file_path"]):
                self.valid_items.append(item)
            else:
                logger.debug(f"Skipping missing file: {item['file_path']}")

        if len(self.valid_items) == 0:
            logger.warning("AudioSpoofDataset initialized with 0 valid audio files.")

    def __len__(self) -> int:
        return len(self.valid_items)

    def _spec_augment(
        self, mel: np.ndarray, max_mask_f: int = 8, max_mask_t: int = 16
    ) -> np.ndarray:
        """Applies SpecAugment frequency & time masking."""
        augmented = mel.copy()
        # Frequency masking
        f = np.random.randint(0, max_mask_f)
        f0 = np.random.randint(0, max(1, mel.shape[0] - f))
        augmented[f0 : f0 + f, :] = 0.0

        # Time masking
        t = np.random.randint(0, max_mask_t)
        t0 = np.random.randint(0, max(1, mel.shape[1] - t))
        augmented[:, t0 : t0 + t] = 0.0
        return augmented

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str]:
        item = self.valid_items[idx]
        file_path = item["file_path"]
        label = int(item["label"])  # 0: BONAFIDE, 1: SPOOF

        try:
            y, sr, _ = self.preprocessor.load_audio(file_path)
            y_fixed = self.preprocessor.pad_or_truncate(y)

            # Optional subtle audio domain augmentation
            if self.augment:
                # Additive white Gaussian noise (low amplitude)
                if np.random.rand() > 0.5:
                    noise = np.random.normal(0, 0.005, y_fixed.shape).astype(np.float32)
                    y_fixed = y_fixed + noise
                # Time roll (shift)
                if np.random.rand() > 0.5:
                    shift = np.random.randint(-1600, 1600)  # +/- 0.1s
                    y_fixed = np.roll(y_fixed, shift)

            log_mel = self.preprocessor.compute_log_mel_spectrogram(y_fixed)

            if self.augment and np.random.rand() > 0.5:
                log_mel = self._spec_augment(log_mel)

            # Add channel dimension -> (1, n_mels, time_steps)
            tensor = torch.from_numpy(log_mel).unsqueeze(0)
            return tensor, label, item.get("audio_id", os.path.basename(file_path))

        except Exception as e:
            logger.error(f"Error loading {file_path}: {e}")
            # Fallback zero tensor
            zero_tensor = torch.zeros(
                (1, self.preprocessor.n_mels, int(self.preprocessor.target_length / self.preprocessor.hop_length) + 1),
                dtype=torch.float32,
            )
            return zero_tensor, label, item.get("audio_id", "error")

    def get_class_counts(self) -> Dict[str, int]:
        bonafide = sum(1 for it in self.valid_items if it["label"] == 0)
        spoof = sum(1 for it in self.valid_items if it["label"] == 1)
        return {"bonafide": bonafide, "spoof": spoof, "total": len(self.valid_items)}

    def get_class_weights(self) -> torch.Tensor:
        """Computes inverse class frequency weights to balance loss."""
        counts = self.get_class_counts()
        total = counts["total"]
        if total == 0 or counts["bonafide"] == 0 or counts["spoof"] == 0:
            return torch.tensor([1.0, 1.0], dtype=torch.float32)
        w0 = total / (2.0 * counts["bonafide"])
        w1 = total / (2.0 * counts["spoof"])
        return torch.tensor([w0, w1], dtype=torch.float32)


def create_dataloader(
    manifest_path_or_items: Any,
    preprocessor: AudioPreprocessor,
    batch_size: int = 16,
    is_training: bool = False,
    augment: bool = False,
    shuffle: bool = True,
    num_workers: int = 0,
) -> DataLoader:
    """Factory helper to create a PyTorch DataLoader."""
    dataset = AudioSpoofDataset(
        manifest_path_or_items=manifest_path_or_items,
        preprocessor=preprocessor,
        is_training=is_training,
        augment=augment,
    )
    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle if is_training else False,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
    )
