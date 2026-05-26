from __future__ import annotations
from dataclasses import dataclass
from importlib import import_module
from typing import Any, Dict, Optional, cast

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.preprocessing import LabelEncoder

from ..config import DEFAULT_RANDOM_STATE, THREAT_BEST_MODEL, THREAT_LABEL_ENCODER, THREAT_RF_MODEL, THREAT_XGB_MODEL
from ..utils.logger import get_logger
from ..utils.persistence import load_joblib, save_joblib

logger = get_logger(__name__)

try:
    XGBClassifier: Any = getattr(import_module("xgboost"), "XGBClassifier")
except ImportError:  # pragma: no cover
    XGBClassifier = None


@dataclass
class ThreatModelResult:
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: np.ndarray
    report: str


class ThreatClassifier:
    def __init__(self) -> None:
        self.rf_model: Optional[RandomForestClassifier] = None
        self.xgb_model: Any | None = None
        self.best_model: Any | None = None
        self.label_encoder: Optional[LabelEncoder] = None

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        label_encoder: LabelEncoder,
    ) -> Dict[str, ThreatModelResult]:
        logger.info("Training Random Forest classifier")
        self.rf_model = RandomForestClassifier(n_estimators=200, random_state=DEFAULT_RANDOM_STATE)
        self.rf_model.fit(X_train, y_train)

        self.label_encoder = label_encoder
        results: Dict[str, ThreatModelResult] = {}
        rf_result = self.evaluate_model(self.rf_model, X_val, y_val, "RandomForest")
        results["RandomForest"] = rf_result
        save_joblib(self.rf_model, THREAT_RF_MODEL)
        save_joblib(self.label_encoder, THREAT_LABEL_ENCODER)

        if XGBClassifier is not None:
            logger.info("Training XGBoost classifier")
            xgb_model = XGBClassifier(
                use_label_encoder=False,
                objective="multi:softprob",
                eval_metric="mlogloss",
                random_state=DEFAULT_RANDOM_STATE,
            )
            xgb_model.fit(X_train, y_train)
            self.xgb_model = xgb_model
            xgb_result = self.evaluate_model(xgb_model, X_val, y_val, "XGBoost")
            results["XGBoost"] = xgb_result
            save_joblib(xgb_model, THREAT_XGB_MODEL)
        else:
            logger.warning("XGBoost is not installed. Skipping XGBoost training.")

        self.best_model = self.select_best_model(results)
        if self.best_model is not None:
            save_joblib(self.best_model, THREAT_BEST_MODEL)
        return results

    def evaluate_model(
        self,
        model,
        X_val: np.ndarray,
        y_val: np.ndarray,
        model_name: str,
    ) -> ThreatModelResult:
        y_pred = model.predict(X_val)
        accuracy = float(accuracy_score(y_val, y_pred))
        precision = float(precision_score(y_val, y_pred, average="weighted", zero_division=0))
        recall = float(recall_score(y_val, y_pred, average="weighted", zero_division=0))
        f1 = float(f1_score(y_val, y_pred, average="weighted", zero_division=0))
        cm = confusion_matrix(y_val, y_pred)
        if self.label_encoder is None:
            raise RuntimeError("Threat label encoder is required before model evaluation")
        labels = np.arange(len(self.label_encoder.classes_))
        report = cast(
            str,
            classification_report(
                y_val,
                y_pred,
                labels=labels,
                target_names=self.label_encoder.classes_,
                zero_division=0,
                output_dict=False,
            ),
        )
        logger.info(
            "%s evaluation: accuracy=%.4f precision=%.4f recall=%.4f f1=%.4f",
            model_name,
            accuracy,
            precision,
            recall,
            f1,
        )
        return ThreatModelResult(
            model_name=model_name,
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            confusion_matrix=cm,
            report=report,
        )

    def select_best_model(self, results: Dict[str, ThreatModelResult]):
        if not results:
            return None
        best_name = max(results, key=lambda name: results[name].f1_score)
        logger.info("Selected best threat model: %s", best_name)
        if best_name == "RandomForest":
            return self.rf_model
        if best_name == "XGBoost":
            return self.xgb_model
        return self.rf_model

    def load_best_model(self) -> None:
        if THREAT_BEST_MODEL.exists():
            self.best_model = load_joblib(THREAT_BEST_MODEL)
            logger.info("Loaded best threat model from %s", THREAT_BEST_MODEL)
        else:
            raise FileNotFoundError("Threat model not found. Train the model before inference.")

        if THREAT_LABEL_ENCODER.exists():
            self.label_encoder = load_joblib(THREAT_LABEL_ENCODER)
            logger.info("Loaded threat label encoder from %s", THREAT_LABEL_ENCODER)
        else:
            raise FileNotFoundError("Threat label encoder not found. Train the model before inference.")

    def predict(self, X: np.ndarray) -> Dict[str, Any]:
        if self.best_model is None:
            self.load_best_model()

        model = self.best_model
        label_encoder = self.label_encoder
        if model is None:
            raise RuntimeError("Threat model is not loaded for prediction")
        if label_encoder is None:
            raise RuntimeError("Threat label encoder is not loaded for prediction")

        X = np.atleast_2d(X)
        y_pred = np.asarray(model.predict(X))
        if y_pred.size == 0:
            raise ValueError("Input data for prediction is empty")

        predicted_class = int(y_pred[0])
        label = label_encoder.inverse_transform([predicted_class])[0]
        confidence = 1.0
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(X)
            model_classes = getattr(model, "classes_", np.arange(probabilities.shape[1]))
            class_matches = np.where(model_classes == predicted_class)[0]
            if class_matches.size == 0:
                raise ValueError(f"Predicted class {predicted_class} was not found in model probability classes.")
            confidence = float(probabilities[0, class_matches[0]])

        return {
            "prediction": label,
            "confidence": confidence,
            "risk_score": int(confidence * 100),
        }
