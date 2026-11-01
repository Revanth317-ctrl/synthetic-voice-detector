"""
Automated Unit Tests for Deep Learning Architectures
---------------------------------------------------
"""

import pytest
import torch
from backend.deep_learning.cnn_model import BaselineAudioCNN
from backend.deep_learning.cnn_bilstm_model import AudioCNNBiLSTM


def test_baseline_cnn_forward():
    model = BaselineAudioCNN(in_channels=1, num_classes=2)
    # Dummy tensor: batch=2, channel=1, n_mels=80, time_steps=188
    dummy_x = torch.randn(2, 1, 80, 188)

    model.eval()
    with torch.no_grad():
        logits = model(dummy_x)

    assert logits.shape == (2, 2)
    probs = model.predict_proba(dummy_x)
    assert probs.shape == (2, 2)
    assert torch.allclose(probs.sum(dim=-1), torch.ones(2), atol=1e-5)


def test_cnn_bilstm_forward_and_attention():
    model = AudioCNNBiLSTM(in_channels=1, n_mels=80, num_classes=2)
    dummy_x = torch.randn(3, 1, 80, 188)

    model.eval()
    with torch.no_grad():
        logits = model(dummy_x)
        logits_attn, attn_weights = model.forward_with_attention(dummy_x)

    assert logits.shape == (3, 2)
    assert logits_attn.shape == (3, 2)
    # Attention weights: (batch, time_steps)
    assert attn_weights.shape[0] == 3
    assert attn_weights.shape[1] > 0
    # Attention weights must sum to 1.0 along temporal dimension
    assert torch.allclose(attn_weights.sum(dim=-1), torch.ones(3), atol=1e-5)

    probs = model.predict_proba(dummy_x)
    assert probs.shape == (3, 2)
    assert torch.allclose(probs.sum(dim=-1), torch.ones(3), atol=1e-5)
