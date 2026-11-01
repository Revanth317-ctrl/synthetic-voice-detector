"""
Model Evaluation and Metrics Computation Pipeline
-------------------------------------------------
Computes comprehensive deepfake speech classification metrics:
- Accuracy, Precision, Recall, F1-Score (macro & weighted)
- Area Under the ROC Curve (ROC-AUC)
- Equal Error Rate (EER) via FPR/FNR threshold interpolation
- Confusion Matrix (TP, FP, TN, FN)
- Generates publication-quality Matplotlib figures for web dashboard and reports
"""

import os
import json
import logging
from typing import Dict, Any, Tuple, Optional, List
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix,
    classification_report,
)
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

logger = logging.getLogger(__name__)


def compute_equal_error_rate(labels: np.ndarray, scores: np.ndarray) -> Tuple[float, float]:
    """
    Computes Equal Error Rate (EER) and operating threshold.
    EER is the standard biometric benchmark metric where False Acceptance Rate (FAR)
    equals False Rejection Rate (FRR).
    """
    fpr, tpr, thresholds = roc_curve(labels, scores, pos_label=1)
    fnr = 1.0 - tpr

    # Point where FPR and FNR are closest
    idx = np.nanargmin(np.abs(fpr - fnr))
    eer = float((fpr[idx] + fnr[idx]) / 2.0)
    eer_threshold = float(thresholds[idx]) if idx < len(thresholds) else 0.5
    return round(eer, 4), round(eer_threshold, 4)


def evaluate_model_on_dataloader(
    model: nn.Module,
    dataloader: DataLoader,
    device: torch.device,
) -> Tuple[Dict[str, Any], np.ndarray, np.ndarray, np.ndarray]:
    """
    Evaluates model on unseen test dataloader.
    Returns:
        metrics dict, y_true, y_pred, y_prob_spoof
    """
    model.eval()
    all_preds = []
    all_targets = []
    all_probs = []

    with torch.no_grad():
        for batch_x, batch_y, _ in dataloader:
            batch_x = batch_x.to(device)
            logits = model(batch_x)
            probs = torch.softmax(logits, dim=-1)

            preds = torch.argmax(probs, dim=-1).cpu().numpy()
            spoof_prob = probs[:, 1].cpu().numpy()

            all_preds.extend(preds)
            all_targets.extend(batch_y.numpy())
            all_probs.extend(spoof_prob)

    y_true = np.array(all_targets)
    y_pred = np.array(all_preds)
    y_prob = np.array(all_probs)

    # Calculate metrics
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    try:
        auc = float(roc_auc_score(y_true, y_prob))
    except Exception:
        auc = 0.5

    eer, eer_thresh = compute_equal_error_rate(y_true, y_prob)
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1]).tolist()

    # Classification report
    report = classification_report(
        y_true,
        y_pred,
        target_names=["BONAFIDE", "SPOOF"],
        output_dict=True,
        zero_division=0,
    )

    metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(auc, 4),
        "equal_error_rate": eer,
        "eer_threshold": eer_thresh,
        "confusion_matrix": cm,
        "total_test_samples": len(y_true),
        "bonafide_count": int(np.sum(y_true == 0)),
        "spoof_count": int(np.sum(y_true == 1)),
        "classification_report": report,
    }

    return metrics, y_true, y_pred, y_prob


def plot_and_save_visualizations(
    history: Optional[Dict[str, List[float]]],
    y_true: np.ndarray,
    y_prob: np.ndarray,
    cm: list,
    output_dir: str = "experiments/evaluation_results",
) -> Dict[str, str]:
    """Generates and saves publication-quality evaluation plots."""
    os.makedirs(output_dir, exist_ok=True)
    generated_paths = {}

    # Set dark cybersecurity aesthetic for plots matching dashboard
    plt.style.use("dark_background")

    # 1. Training & Validation Loss/Accuracy Curves
    if history and "train_loss" in history:
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
        epochs = range(1, len(history["train_loss"]) + 1)

        # Loss
        ax1.plot(epochs, history["train_loss"], label="Train Loss", color="#06B6D4", linewidth=2.2)
        ax1.plot(epochs, history["val_loss"], label="Val Loss", color="#F43F5E", linewidth=2.2, linestyle="--")
        ax1.set_title("Cross-Entropy Loss vs. Epochs", fontsize=13, fontweight="bold", color="#F8FAFC")
        ax1.set_xlabel("Epoch", fontsize=11, color="#94A3B8")
        ax1.set_ylabel("Loss", fontsize=11, color="#94A3B8")
        ax1.legend(loc="upper right", frameon=True, facecolor="#1E293B", edgecolor="#334155")
        ax1.grid(True, linestyle=":", alpha=0.3, color="#475569")

        # Accuracy
        ax2.plot(epochs, [a * 100 for a in history["train_acc"]], label="Train Acc", color="#10B981", linewidth=2.2)
        ax2.plot(epochs, [a * 100 for a in history["val_acc"]], label="Val Acc", color="#3B82F6", linewidth=2.2, linestyle="--")
        ax2.set_title("Classification Accuracy (%) vs. Epochs", fontsize=13, fontweight="bold", color="#F8FAFC")
        ax2.set_xlabel("Epoch", fontsize=11, color="#94A3B8")
        ax2.set_ylabel("Accuracy (%)", fontsize=11, color="#94A3B8")
        ax2.legend(loc="lower right", frameon=True, facecolor="#1E293B", edgecolor="#334155")
        ax2.grid(True, linestyle=":", alpha=0.3, color="#475569")

        plt.tight_layout()
        loss_curve_path = os.path.join(output_dir, "training_loss_acc.png")
        plt.savefig(loss_curve_path, dpi=200, facecolor="#0B0F19")
        plt.close(fig)
        generated_paths["training_curves"] = loss_curve_path

    # 2. Confusion Matrix Heatmap
    fig, ax = plt.subplots(figsize=(6, 5))
    cm_arr = np.array(cm)
    cax = ax.matshow(cm_arr, cmap="Blues", alpha=0.85)

    for i in range(2):
        for j in range(2):
            val = cm_arr[i, j]
            color = "white" if val > (cm_arr.max() / 2) else "#94A3B8"
            ax.text(j, i, str(val), va="center", ha="center", fontsize=16, fontweight="bold", color=color)

    fig.colorbar(cax)
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(["BONAFIDE", "SPOOF"], fontsize=11, fontweight="bold")
    ax.set_yticklabels(["BONAFIDE", "SPOOF"], fontsize=11, fontweight="bold")
    ax.set_xlabel("Predicted Class", fontsize=12, labelpad=10, color="#CBD5E1")
    ax.set_ylabel("True Ground Truth", fontsize=12, labelpad=10, color="#CBD5E1")
    ax.set_title("Test Confusion Matrix", fontsize=14, fontweight="bold", pad=20, color="#F8FAFC")

    plt.tight_layout()
    cm_path = os.path.join(output_dir, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=200, facecolor="#0B0F19")
    plt.close(fig)
    generated_paths["confusion_matrix"] = cm_path

    # 3. ROC Curve
    fpr, tpr, _ = roc_curve(y_true, y_prob, pos_label=1)
    auc = roc_auc_score(y_true, y_prob)

    fig, ax = plt.subplots(figsize=(7, 5.5))
    ax.plot(fpr, tpr, color="#06B6D4", linewidth=2.5, label=f"CNN-BiLSTM (AUC = {auc:.3f})")
    ax.plot([0, 1], [0, 1], color="#64748B", linestyle="--", linewidth=1.5, label="Random Guess (AUC = 0.50)")
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel("False Positive Rate (FPR)", fontsize=11, color="#94A3B8")
    ax.set_ylabel("True Positive Rate (TPR / Recall)", fontsize=11, color="#94A3B8")
    ax.set_title("Receiver Operating Characteristic (ROC)", fontsize=13, fontweight="bold", color="#F8FAFC")
    ax.legend(loc="lower right", facecolor="#1E293B", edgecolor="#334155")
    ax.grid(True, linestyle=":", alpha=0.3, color="#475569")

    plt.tight_layout()
    roc_path = os.path.join(output_dir, "roc_curve.png")
    plt.savefig(roc_path, dpi=200, facecolor="#0B0F19")
    plt.close(fig)
    generated_paths["roc_curve"] = roc_path

    return generated_paths
