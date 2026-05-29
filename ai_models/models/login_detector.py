from __future__ import annotations
from typing import Any, Dict, Optional

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

from ..config import LOGIN_MODEL, LOGIN_PREPROCESSOR, DEFAULT_RANDOM_STATE
from ..utils.logger import get_logger
from ..utils.persistence import load_joblib, load_pickle, save_joblib, save_pickle

logger = get_logger(__name__)


class LoginBehaviorDetector:
    def __init__(self) -> None:
        self.model: Optional[RandomForestClassifier] = None
        self.preprocessor: Optional[Dict[str, Any]] = None

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        label_encoder: LabelEncoder,
        scaler: Any,
        feature_columns: list[str],
    ) -> None:
        self.model = RandomForestClassifier(
            n_estimators=100,
            n_jobs=-1,
            random_state=DEFAULT_RANDOM_STATE,
        )
        self.model.fit(X_train, y_train)

        self.preprocessor = {
            "label_encoder": label_encoder,
            "scaler": scaler,
            "feature_columns": feature_columns,
        }
        self.save()
        save_pickle(self.preprocessor, LOGIN_PREPROCESSOR)
        logger.info("Completed training login behavior model")

    def save(self) -> None:
        if self.model is None:
            raise ValueError("No model available to save")
        save_joblib(self.model, LOGIN_MODEL)
        logger.info("Saved login model to %s", LOGIN_MODEL)

    def load(self) -> None:
        if not LOGIN_MODEL.exists() or not LOGIN_PREPROCESSOR.exists():
            raise FileNotFoundError("Login behavior model or preprocessor not found. Train the model before inference.")
        self.model = load_joblib(LOGIN_MODEL)
        self.preprocessor = load_pickle(LOGIN_PREPROCESSOR)
        logger.info("Loaded login detector and preprocessor from disk")

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        if self.model is None or self.preprocessor is None:
            self.load()

        scaler = self.preprocessor["scaler"]
        label_encoder = self.preprocessor["label_encoder"]
        feature_columns = self.preprocessor.get("feature_columns", [])

        feature_vector = np.zeros((1, len(feature_columns)), dtype=float)
        for index, column in enumerate(feature_columns):
            if column == "login_time":
                feature_vector[0, index] = features.get("login_time", 0)
            elif column == "failed_attempts":
                feature_vector[0, index] = features.get("failed_attempts", 0)
            elif column == "session_duration":
                feature_vector[0, index] = features.get("session_duration", 0)
            elif column.startswith("login_location_"):
                label = column.replace("login_location_", "")
                feature_vector[0, index] = 1.0 if features.get("login_location", "").strip() == label else 0.0
            elif column.startswith("device_type_"):
                label = column.replace("device_type_", "")
                feature_vector[0, index] = 1.0 if features.get("device_type", "").strip() == label else 0.0
            else:
                feature_vector[0, index] = 0.0

        processed = scaler.transform(feature_vector)
        probabilities = self.model.predict_proba(processed)
        best_index = int(np.argmax(probabilities, axis=1)[0])
        prediction = label_encoder.inverse_transform([best_index])[0]
        confidence = float(probabilities[0, best_index])
        logger.info("Login behavior prediction=%s confidence=%.4f", prediction, confidence)
        return {
            "prediction": prediction,
            "confidence": confidence,
            "risk_score": int(confidence * 100) if prediction != "Normal Login" else max(0, 100 - int(confidence * 100)),
        }
