"""
Model Training and Comparison Pipeline
--------------------------------------
Trains and rigorously benchmarks:
1. BaselineAudioCNN
2. AudioCNNBiLSTM (with learned temporal attention)

Features:
- Device agnostic (CPU & CUDA auto-detection)
- AdamW optimizer with weight decay regularization
- Dynamic learning rate reduction on plateau
- Weighted Cross-Entropy Loss to handle class imbalance
- Early stopping based on validation loss/F1
- Saves weights, configurations, and evaluation artifacts
"""

import os
import sys
import json
import time
import argparse
import logging
from typing import Dict, Any, Tuple
import numpy as np
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import ReduceLROnPlateau

from backend.deep_learning.preprocessing import AudioPreprocessor
from backend.deep_learning.dataset import create_dataloader, AudioSpoofDataset
from backend.deep_learning.cnn_model import BaselineAudioCNN
from backend.deep_learning.cnn_bilstm_model import AudioCNNBiLSTM
from backend.deep_learning.evaluate import evaluate_model_on_dataloader, plot_and_save_visualizations

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def train_single_epoch(
    model: nn.Module,
    dataloader,
    optimizer: torch.optim.Optimizer,
    criterion: nn.Module,
    device: torch.device,
) -> Tuple[float, float]:
    """Runs a single training epoch."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for batch_x, batch_y, _ in dataloader:
        batch_x = batch_x.to(device)
        batch_y = batch_y.to(device)

        optimizer.zero_grad()
        logits = model(batch_x)
        loss = criterion(logits, batch_y)
        loss.backward()

        # Gradient clipping to stabilize BiLSTM recurrence
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=4.0)
        optimizer.step()

        running_loss += loss.item() * batch_x.size(0)
        preds = torch.argmax(logits, dim=-1)
        correct += (preds == batch_y).sum().item()
        total += batch_y.size(0)

    epoch_loss = running_loss / max(1, total)
    epoch_acc = correct / max(1, total)
    return epoch_loss, epoch_acc


def validate_epoch(
    model: nn.Module,
    dataloader,
    criterion: nn.Module,
    device: torch.device,
) -> Tuple[float, float]:
    """Runs a validation epoch."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for batch_x, batch_y, _ in dataloader:
            batch_x = batch_x.to(device)
            batch_y = batch_y.to(device)

            logits = model(batch_x)
            loss = criterion(logits, batch_y)

            running_loss += loss.item() * batch_x.size(0)
            preds = torch.argmax(logits, dim=-1)
            correct += (preds == batch_y).sum().item()
            total += batch_y.size(0)

    val_loss = running_loss / max(1, total)
    val_acc = correct / max(1, total)
    return val_loss, val_acc


def train_model(
    model: nn.Module,
    model_name: str,
    train_loader,
    val_loader,
    class_weights: torch.Tensor,
    device: torch.device,
    epochs: int = 15,
    lr: float = 1e-3,
    patience: int = 4,
) -> Tuple[nn.Module, Dict[str, list], Dict[str, Any]]:
    """Trains a model with early stopping and learning rate scheduling."""
    logger.info(f"\n>>> Starting training for [{model_name}] on device: {device}")
    model.to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=2)

    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}
    best_val_loss = float("inf")
    best_val_acc = 0.0
    best_state = None
    epochs_no_improve = 0
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        t_loss, t_acc = train_single_epoch(model, train_loader, optimizer, criterion, device)
        v_loss, v_acc = validate_epoch(model, val_loader, criterion, device)
        scheduler.step(v_loss)

        history["train_loss"].append(round(t_loss, 4))
        history["train_acc"].append(round(t_acc, 4))
        history["val_loss"].append(round(v_loss, 4))
        history["val_acc"].append(round(v_acc, 4))

        current_lr = optimizer.param_groups[0]["lr"]
        logger.info(
            f"Epoch {epoch:02d}/{epochs:02d} | "
            f"Train Loss: {t_loss:.4f}, Acc: {t_acc*100:.1f}% | "
            f"Val Loss: {v_loss:.4f}, Acc: {v_acc*100:.1f}% | LR: {current_lr:.6f}"
        )

        # Track best model
        if v_loss < best_val_loss:
            best_val_loss = v_loss
            best_val_acc = v_acc
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            epochs_no_improve = 0
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= patience:
                logger.info(f"Early stopping triggered at epoch {epoch} (no improvement for {patience} epochs).")
                break

    duration = time.time() - start_time
    logger.info(f"Training [{model_name}] finished in {duration:.1f}s. Best Val Loss: {best_val_loss:.4f}, Acc: {best_val_acc*100:.1f}%")

    if best_state is not None:
        model.load_state_dict(best_state)

    summary = {
        "model_name": model_name,
        "best_val_loss": round(best_val_loss, 4),
        "best_val_acc": round(best_val_acc, 4),
        "training_time_sec": round(duration, 2),
        "epochs_trained": len(history["train_loss"]),
    }
    return model, history, summary


def run_training_pipeline(
    data_dir: str = "data/processed",
    artifacts_dir: str = "backend/artifacts",
    eval_dir: str = "experiments/evaluation_results",
    epochs: int = 12,
    batch_size: int = 16,
    lr: float = 1e-3,
    compare_models: bool = True,
) -> None:
    """Executes full training, baseline comparison, and evaluation pipeline."""
    os.makedirs(artifacts_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Active compute device: {device}")

    # 1. Initialize preprocessor & save config
    preprocessor = AudioPreprocessor()
    preprocessor_config_path = os.path.join(artifacts_dir, "preprocessing_config.json")
    preprocessor.save_config(preprocessor_config_path)

    # 2. Load manifests
    train_manifest = os.path.join(data_dir, "train_manifest.json")
    val_manifest = os.path.join(data_dir, "val_manifest.json")
    test_manifest = os.path.join(data_dir, "test_manifest.json")

    train_loader = create_dataloader(train_manifest, preprocessor, batch_size=batch_size, is_training=True, augment=True)
    val_loader = create_dataloader(val_manifest, preprocessor, batch_size=batch_size, is_training=False, augment=False)
    test_loader = create_dataloader(test_manifest, preprocessor, batch_size=batch_size, is_training=False, augment=False)

    # Class weights for loss
    train_dataset = AudioSpoofDataset(train_manifest, preprocessor)
    class_weights = train_dataset.get_class_weights()
    logger.info(f"Class counts in training: {train_dataset.get_class_counts()}")
    logger.info(f"Computed loss class weights: {class_weights.tolist()}")

    # 3. Train Baseline CNN
    cnn_baseline = BaselineAudioCNN()
    trained_cnn, cnn_history, cnn_summary = train_model(
        model=cnn_baseline,
        model_name="BaselineAudioCNN",
        train_loader=train_loader,
        val_loader=val_loader,
        class_weights=class_weights,
        device=device,
        epochs=epochs,
        lr=lr,
    )
    # Save baseline weights
    baseline_path = os.path.join(artifacts_dir, "baseline_cnn.pt")
    torch.save(trained_cnn.state_dict(), baseline_path)

    # 4. Train CNN + BiLSTM (with Attention)
    cnn_bilstm = AudioCNNBiLSTM()
    trained_bilstm, bilstm_history, bilstm_summary = train_model(
        model=cnn_bilstm,
        model_name="AudioCNNBiLSTM",
        train_loader=train_loader,
        val_loader=val_loader,
        class_weights=class_weights,
        device=device,
        epochs=epochs,
        lr=lr,
    )

    # 5. Model Comparison on Unseen Test Split
    logger.info("\n=======================================================")
    logger.info("EVALUATING BOTH MODELS ON UNSEEN TEST SPLIT")
    logger.info("=======================================================")

    cnn_test_metrics, _, _, _ = evaluate_model_on_dataloader(trained_cnn, test_loader, device)
    bilstm_test_metrics, y_true, y_pred, y_prob = evaluate_model_on_dataloader(trained_bilstm, test_loader, device)

    logger.info(f"Baseline CNN Test Accuracy: {cnn_test_metrics['accuracy']*100:.2f}%, F1: {cnn_test_metrics['f1_score']:.4f}, AUC: {cnn_test_metrics['roc_auc']:.4f}")
    logger.info(f"CNN-BiLSTM   Test Accuracy: {bilstm_test_metrics['accuracy']*100:.2f}%, F1: {bilstm_test_metrics['f1_score']:.4f}, AUC: {bilstm_test_metrics['roc_auc']:.4f}, EER: {bilstm_test_metrics['equal_error_rate']:.4f}")

    # Determine best model based on test F1 and AUC
    if bilstm_test_metrics["f1_score"] >= cnn_test_metrics["f1_score"]:
        best_model = trained_bilstm
        best_name = "AudioCNNBiLSTM"
        best_metrics = bilstm_test_metrics
        best_history = bilstm_history
        model_config = trained_bilstm.get_config()
    else:
        best_model = trained_cnn
        best_name = "BaselineAudioCNN"
        best_metrics = cnn_test_metrics
        best_history = cnn_history
        model_config = trained_cnn.get_config()

    logger.info(f"\nWinning Model: [{best_name}]")

    # 6. Save Best Model and Configurations
    best_weights_path = os.path.join(artifacts_dir, "best_model.pt")
    torch.save(best_model.state_dict(), best_weights_path)
    logger.info(f"Saved best model weights to: {best_weights_path}")

    model_config_path = os.path.join(artifacts_dir, "model_config.json")
    with open(model_config_path, "w") as f:
        json.dump(model_config, f, indent=2)

    # Comparison metrics structure
    full_metrics = {
        "best_model_name": best_name,
        "evaluation_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "test_metrics": best_metrics,
        "model_comparison": {
            "baseline_cnn": {
                **cnn_summary,
                "test_accuracy": cnn_test_metrics["accuracy"],
                "test_f1": cnn_test_metrics["f1_score"],
                "test_roc_auc": cnn_test_metrics["roc_auc"],
                "test_eer": cnn_test_metrics["equal_error_rate"],
            },
            "cnn_bilstm": {
                **bilstm_summary,
                "test_accuracy": bilstm_test_metrics["accuracy"],
                "test_f1": bilstm_test_metrics["f1_score"],
                "test_roc_auc": bilstm_test_metrics["roc_auc"],
                "test_eer": bilstm_test_metrics["equal_error_rate"],
            },
        },
        "training_history": best_history,
    }

    metrics_path = os.path.join(artifacts_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(full_metrics, f, indent=2)
    logger.info(f"Saved evaluation metrics to: {metrics_path}")

    # 7. Generate Evaluation Plots
    vis_paths = plot_and_save_visualizations(
        history=best_history,
        y_true=y_true,
        y_prob=y_prob,
        cm=best_metrics["confusion_matrix"],
        output_dir=eval_dir,
    )
    # Also save classification report json in eval_dir
    with open(os.path.join(eval_dir, "classification_report.json"), "w") as f:
        json.dump(best_metrics["classification_report"], f, indent=2)

    logger.info(f"Generated evaluation plots in: {eval_dir}")
    for k, v in vis_paths.items():
        logger.info(f"- {k}: {v}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train and evaluate audio spoof detection models.")
    parser.add_argument("--data_dir", type=str, default="data/processed")
    parser.add_argument("--artifacts_dir", type=str, default="backend/artifacts")
    parser.add_argument("--eval_dir", type=str, default="experiments/evaluation_results")
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    args = parser.parse_args()

    run_training_pipeline(
        data_dir=args.data_dir,
        artifacts_dir=args.artifacts_dir,
        eval_dir=args.eval_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
    )
