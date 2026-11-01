"""
State-of-the-Art SE-ResNet-BiLSTM with Multi-Head Attention for Voice Spoof Detection
-----------------------------------------------------------------------------------
Gold standard audio spoof detection architecture combining:
1. Squeeze-and-Excitation Residual Blocks (SE-ResNet):
   Dynamically recalibrates spectral channel responses, highlighting vocoder
   phase anomalies while suppressing background acoustic noise.
2. Bidirectional LSTM (BiLSTM):
   Captures long-range temporal prosodic contours, formant trajectories, and
   unnatural phonemic transitions.
3. Multi-Head Temporal Self-Attention:
   4 attention heads concurrently scanning for localized synthetic speech glitches.
4. Fully Connected Classification Head:
   Maps attention context to calibrated binary logits [0: BONAFIDE, 1: SPOOF].
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any, Tuple, Optional


class SqueezeExcitation(nn.Module):
    """Channel-wise Squeeze-and-Excitation attention block."""

    def __init__(self, channels: int, reduction: int = 8):
        super().__init__()
        self.fc = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(channels, max(4, channels // reduction), bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(max(4, channels // reduction), channels, bias=False),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, c, _, _ = x.shape
        w = self.fc(x).view(b, c, 1, 1)
        return x * w


class SEResBlock(nn.Module):
    """Residual Convolutional Block with Squeeze-and-Excitation."""

    def __init__(self, in_channels: int, out_channels: int, stride=(1, 1), pool_stride=None):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.se = SqueezeExcitation(out_channels)
        self.act = nn.GELU()

        # Shortcut projection
        if in_channels != out_channels or stride != (1, 1):
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels),
            )
        else:
            self.shortcut = nn.Identity()

        self.pool = nn.MaxPool2d(kernel_size=pool_stride) if pool_stride else nn.Identity()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        res = self.shortcut(x)
        out = self.act(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out = self.se(out)
        out = self.act(out + res)
        out = self.pool(out)
        return out


class MultiHeadTemporalAttention(nn.Module):
    """Multi-Head Self-Attention over sequential acoustic time steps."""

    def __init__(self, hidden_dim: int, num_heads: int = 4):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = hidden_dim // num_heads
        assert hidden_dim % num_heads == 0, "hidden_dim must be divisible by num_heads"

        self.q_proj = nn.Linear(hidden_dim, hidden_dim)
        self.k_proj = nn.Linear(hidden_dim, hidden_dim)
        self.v_proj = nn.Linear(hidden_dim, hidden_dim)
        self.out_proj = nn.Linear(hidden_dim, hidden_dim)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            x: (batch, time_steps, hidden_dim)
        Returns:
            context: (batch, hidden_dim)
            mean_weights: (batch, time_steps)
        """
        b, t, d = x.shape
        q = self.q_proj(x).view(b, t, self.num_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(x).view(b, t, self.num_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(x).view(b, t, self.num_heads, self.head_dim).transpose(1, 2)

        # Scaled dot-product attention
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)
        weights = F.softmax(scores, dim=-1)

        attended = torch.matmul(weights, v)  # (b, heads, t, head_dim)
        attended = attended.transpose(1, 2).contiguous().view(b, t, d)
        out = self.out_proj(attended)

        # Temporal pooling
        pooled_context = torch.mean(out, dim=1)  # (b, d)
        mean_weights = torch.mean(weights, dim=(1, 2))  # (b, t)

        return pooled_context, mean_weights


class AudioCNNBiLSTM(nn.Module):
    """SE-ResNet-BiLSTM with Multi-Head Attention for Voice Spoof Detection."""

    def __init__(
        self,
        in_channels: int = 1,
        n_mels: int = 80,
        lstm_hidden: int = 128,
        lstm_layers: int = 2,
        num_classes: int = 2,
        dropout_rate: float = 0.35,
    ):
        super().__init__()
        self.in_channels = in_channels
        self.n_mels = n_mels
        self.lstm_hidden = lstm_hidden
        self.lstm_layers = lstm_layers
        self.num_classes = num_classes
        self.dropout_rate = dropout_rate

        # Initial Conv stem
        self.stem = nn.Sequential(
            nn.Conv2d(in_channels, 32, kernel_size=5, stride=1, padding=2, bias=False),
            nn.BatchNorm2d(32),
            nn.GELU(),
        )

        # Stage 1: 32 -> 48 channels, pool frequency by 2 (keeps time)
        self.stage1 = SEResBlock(32, 48, pool_stride=(2, 1))
        # Stage 2: 48 -> 64 channels, pool frequency by 2
        self.stage2 = SEResBlock(48, 64, pool_stride=(2, 1))
        # Stage 3: 64 -> 96 channels, pool frequency by 2
        self.stage3 = SEResBlock(64, 96, pool_stride=(2, 1))
        # Stage 4: 96 -> 128 channels, pool frequency by 2 and time by 2
        self.stage4 = SEResBlock(96, 128, pool_stride=(2, 2))

        # Remaining frequency bins: 80 // 16 = 5 bins
        # Total CNN feature dimension: 128 channels * 5 bins = 640
        self.feature_dim = 128 * 5

        # Feature normalization
        self.pre_lstm_norm = nn.LayerNorm(self.feature_dim)
        self.dropout = nn.Dropout(dropout_rate)

        # Bidirectional LSTM (2 layers, 128 hidden -> 256 bidirectional output)
        self.bilstm = nn.LSTM(
            input_size=self.feature_dim,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout_rate if lstm_layers > 1 else 0.0,
        )

        # Multi-Head Attention (hidden_dim = 256, 4 heads)
        self.attention = MultiHeadTemporalAttention(hidden_dim=lstm_hidden * 2, num_heads=4)

        # Classification Head
        self.classifier = nn.Sequential(
            nn.Linear(lstm_hidden * 2, 128),
            nn.LayerNorm(128),
            nn.GELU(),
            nn.Dropout(dropout_rate),
            nn.Linear(128, 64),
            nn.GELU(),
            nn.Dropout(dropout_rate * 0.7),
            nn.Linear(64, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        Args:
            x: Input tensor of shape (batch, 1, n_mels=80, time_steps)
        Returns:
            logits: (batch, num_classes)
        """
        x = self.stem(x)
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.stage4(x)  # (batch, 128, 5, T')

        b, c, f, t = x.shape
        x = x.permute(0, 3, 1, 2).contiguous().view(b, t, c * f)  # (batch, t, 640)
        x = self.pre_lstm_norm(x)
        x = self.dropout(x)

        lstm_out, _ = self.bilstm(x)  # (batch, t, 256)
        context, _ = self.attention(lstm_out)  # (batch, 256)

        logits = self.classifier(context)
        return logits

    def forward_with_attention(
        self, x: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """Returns both logits and temporal attention weights."""
        x = self.stem(x)
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.stage4(x)

        b, c, f, t = x.shape
        x = x.permute(0, 3, 1, 2).contiguous().view(b, t, c * f)
        x = self.pre_lstm_norm(x)

        lstm_out, _ = self.bilstm(x)
        context, weights = self.attention(lstm_out)
        logits = self.classifier(context)
        return logits, weights

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Normalized probabilities [P(Bonafide), P(Spoof)]."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            return F.softmax(logits, dim=-1)

    def get_config(self) -> Dict[str, Any]:
        return {
            "model_architecture": "AudioCNNBiLSTM",
            "backbone": "SE-ResNet-BiLSTM",
            "in_channels": self.in_channels,
            "n_mels": self.n_mels,
            "attention": "4-Head Multi-Head Temporal Self-Attention",
            "lstm_hidden": self.lstm_hidden,
            "lstm_layers": self.lstm_layers,
            "bidirectional": True,
            "num_classes": self.num_classes,
            "classes": ["BONAFIDE", "SPOOF"],
            "dropout_rate": self.dropout_rate,
        }
