from __future__ import annotations
from typing import Any, Dict

import numpy as np
import pandas as pd

from ..models import AnomalyDetector, LoginBehaviorDetector, ThreatClassifier
from ..utils.logger import get_logger

logger = get_logger(__name__)

_threat_classifier: ThreatClassifier | None = None
_anomaly_detector: AnomalyDetector | None = None
_login_detector: LoginBehaviorDetector | None = None


def _get_threat_classifier() -> ThreatClassifier:
    global _threat_classifier
    if _threat_classifier is None:
        _threat_classifier = ThreatClassifier()
    return _threat_classifier


def _get_anomaly_detector() -> AnomalyDetector:
    global _anomaly_detector
    if _anomaly_detector is None:
        _anomaly_detector = AnomalyDetector()
    return _anomaly_detector


def _get_login_detector() -> LoginBehaviorDetector:
    global _login_detector
    if LoginBehaviorDetector is None:
        raise ImportError("LoginBehaviorDetector requires TensorFlow. Install tensorflow to use this feature.")
    if _login_detector is None:
        _login_detector = LoginBehaviorDetector()
    return _login_detector


def _build_numeric_matrix(data: Any) -> np.ndarray:
    if isinstance(data, dict):
        if "features" in data:
            values = data["features"]
        else:
            raise ValueError("Expected request body with a 'features' list for numeric model input.")
    else:
        values = data

    array = np.asarray(values, dtype=float)
    if array.ndim == 1:
        array = array.reshape(1, -1)
    return array


def predict_threat(data: Any) -> Dict[str, Any]:
    classifier = _get_threat_classifier()
    try:
        X = _build_numeric_matrix(data)
    except ValueError as exc:
        logger.error("Threat prediction preprocessing failed: %s", exc)
        raise

    result = classifier.predict(X)
    logger.info("Threat prediction result=%s", result)
    return {
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "risk_score": result["risk_score"],
    }


def detect_anomaly(data: Any) -> Dict[str, Any]:
    detector = _get_anomaly_detector()
    try:
        X = _build_numeric_matrix(data)
    except ValueError as exc:
        logger.error("Anomaly detection preprocessing failed: %s", exc)
        raise

    result = detector.predict(X)
    logger.info("Anomaly detection result=%s", result)
    confidence = float(np.clip(1.0 - result["anomaly_score"], 0.0, 1.0))
    return {
        "prediction": result["prediction"],
        "confidence": confidence,
        "risk_score": result["risk_score"],
    }


def detect_login_behavior(data: Dict[str, Any]) -> Dict[str, Any]:
    detector = _get_login_detector()
    result = detector.predict(data)
    logger.info("Login behavior detection result=%s", result)
    return {
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "risk_score": result["risk_score"],
    }
