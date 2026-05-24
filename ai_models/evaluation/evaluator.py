from __future__ import annotations
import os
from pathlib import Path
from typing import Any, Iterable, List

import numpy as np
from sklearn.metrics import ConfusionMatrixDisplay, classification_report, roc_curve, auc

from ..config import EVAL_DIR
from ..utils.logger import get_logger

logger = get_logger(__name__)


def ensure_directory(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def save_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray, labels: Iterable[str], filename: str) -> Path:
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(8, 6))
    ConfusionMatrixDisplay.from_predictions(y_true, y_pred, display_labels=list(labels), ax=ax, cmap="Blues")
    ax.set_title("Confusion Matrix")
    output = EVAL_DIR / filename
    ensure_directory(output)
    fig.savefig(output, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved confusion matrix to %s", output)
    return output


def save_classification_report(y_true: np.ndarray, y_pred: np.ndarray, labels: List[str], filename: str) -> Path:
    report = classification_report(y_true, y_pred, target_names=labels, zero_division=0)
    output = EVAL_DIR / filename
    ensure_directory(output)
    with output.open("w", encoding="utf-8") as handle:
        handle.write(report)
    logger.info("Saved classification report to %s", output)
    return output


def save_roc_curve(y_true: np.ndarray, y_score: np.ndarray, label: str, filename: str) -> Path:
    import matplotlib.pyplot as plt

    fpr, tpr, _ = roc_curve(y_true, y_score)
    roc_auc = auc(fpr, tpr)
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.plot(fpr, tpr, lw=2, label=f"ROC curve (area = {roc_auc:.2f})")
    ax.plot([0, 1], [0, 1], color="navy", lw=1, linestyle="--")
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title(f"ROC Curve - {label}")
    ax.legend(loc="lower right")
    output = EVAL_DIR / filename
    ensure_directory(output)
    fig.savefig(output, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved ROC curve to %s", output)
    return output


def save_accuracy_graph(history: Any, filename: str) -> Path:
    import matplotlib.pyplot as plt

    if not hasattr(history, "history"):
        raise ValueError("History object must have a history attribute")
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.plot(history.history.get("accuracy", []), label="train_accuracy")
    ax.plot(history.history.get("val_accuracy", []), label="val_accuracy")
    ax.set_title("Training Accuracy")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Accuracy")
    ax.legend()
    output = EVAL_DIR / filename
    ensure_directory(output)
    fig.savefig(output, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved accuracy graph to %s", output)
    return output
