from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, Optional

import numpy as np
from sklearn.ensemble import IsolationForest

from ..config import ANOMALY_MODEL, DEFAULT_RANDOM_STATE
from ..utils.logger import get_logger
from ..utils.persistence import load_joblib, save_joblib

logger = get_logger(__name__)


class AnomalyDetector:
    def __init__(self) -> None:
        self.model: Optional[IsolationForest] = None

    def train(self, X_normal: np.ndarray) -> None:
        logger.info("Training Isolation Forest for anomaly detection")
        self.model = IsolationForest(
            contamination=0.05,
            random_state=DEFAULT_RANDOM_STATE,
            n_estimators=200,
        )
        self.model.fit(X_normal)
        save_joblib(self.model, ANOMALY_MODEL)
        logger.info("Saved anomaly model to %s", ANOMALY_MODEL)

    def load(self) -> None:
        if ANOMALY_MODEL.exists():
            self.model = load_joblib(ANOMALY_MODEL)
            logger.info("Loaded anomaly detector from %s", ANOMALY_MODEL)
        else:
            raise FileNotFoundError("Anomaly detection model not found. Train the model before inference.")

    def predict(self, X: np.ndarray) -> Dict[str, Any]:
        if self.model is None:
            self.load()
        score = self.model.decision_function(X)[0]
        anomaly_label = self.model.predict(X)[0]
        risk_score = int(np.clip((1.0 - score) * 50.0, 0, 100))
        prediction = "Suspicious" if anomaly_label == -1 else "Normal"
        logger.info("Anomaly prediction=%s score=%.4f risk=%s", prediction, score, risk_score)
        return {
            "prediction": prediction,
            "risk_score": risk_score,
            "anomaly_score": float(score),
        }
