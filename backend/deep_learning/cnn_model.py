"""
Baseline 2D Convolutional Neural Network (CNN) for Audio Spoof Detection
------------------------------------------------------------------------
Operates directly on Log-Mel Spectrogram inputs:
- 4 hierarchical 2D Convolutional blocks with Batch Normalization
- Max Pooling and progressive Spatial Dropout
- Adaptive Global Average Pooling
- Dense Classification MLP with 2 output classes: [0: BONAFIDE, 1: SPOOF]
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any


class BaselineAudioCNN(nn.Module):
    """Deep 2D-CNN baseline model for spectral acoustic pattern recognition."""

    def __init__(
        self,
        in_channels: int = 1,
        num_classes: int = 2,
        dropout_rate: float = 0.3,
    ):
        super().__init__()
        self.in_channels = in_channels
        self.num_classes = num_classes
        self.dropout_rate = dropout_rate

        # Block 1: 1 -> 32 channels
        self.conv1 = nn.Sequential(
            nn.Conv2d(in_channels, 32, kernel_size=3, stride=1, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Dropout2d(0.2),
        )

        # Block 2: 32 -> 64 channels
        self.conv2 = nn.Sequential(
            nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Dropout2d(0.25),
        )

        # Block 3: 64 -> 128 channels
        self.conv3 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Dropout2d(0.25),
        )

        # Block 4: 128 -> 256 channels
        self.conv4 = nn.Sequential(
            nn.Conv2d(128, 256, kernel_size=3, stride=1, padding=1, bias=False),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Dropout2d(0.3),
        )

        # Adaptive pooling to fixed spatial size (4, 4)
        self.adaptive_pool = nn.AdaptiveAvgPool2d((4, 4))

        # Classification MLP
        self.classifier = nn.Sequential(
            nn.Linear(256 * 4 * 4, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout_rate),
            nn.Linear(256, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout_rate * 0.75),
            nn.Linear(64, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        Args:
            x: Input tensor of shape (batch, 1, n_mels, time_steps)
        Returns:
            Logits of shape (batch, num_classes)
        """
        x = self.conv1(x)
        x = self.conv2(x)
        x = self.conv3(x)
        x = self.conv4(x)
        x = self.adaptive_pool(x)
        x = torch.flatten(x, 1)
        logits = self.classifier(x)
        return logits

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Computes normalized probabilities via Softmax."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            return F.softmax(logits, dim=-1)

    def get_config(self) -> Dict[str, Any]:
        return {
            "model_architecture": "BaselineAudioCNN",
            "in_channels": self.in_channels,
            "num_classes": self.num_classes,
            "dropout_rate": self.dropout_rate,
            "feature_extractor": "4-Layer 2D-CNN with BatchNorm",
            "classifier": "AdaptiveAvgPool2d + 2-layer MLP",
        }
