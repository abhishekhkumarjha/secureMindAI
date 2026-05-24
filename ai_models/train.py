from __future__ import annotations
import logging
from typing import Dict

from .config import CLASS_LABELS
from .evaluation import save_classification_report, save_confusion_matrix, save_roc_curve
from .models.anomaly_detector import AnomalyDetector
from .models.login_detector import LoginBehaviorDetector
from .models.threat_classifier import ThreatClassifier
from .preprocessing import DataPreprocessor, load_cicids2017, load_unsw_nb15, load_user_behavior
from .utils.logger import get_logger

logger = get_logger(__name__)


def train_threat_model() -> Dict[str, object]:
    logger.info("Starting threat classification training")
    df = load_unsw_nb15()
    preprocessor = DataPreprocessor()
    dataset = preprocessor.preprocess_unsw_nb15(df)

    classifier = ThreatClassifier()
    results = classifier.train(dataset.X_train, dataset.y_train, dataset.X_val, dataset.y_val, dataset.label_encoder)
    if classifier.best_model is None:
        raise RuntimeError("Threat classification model training failed")

    y_pred = classifier.best_model.predict(dataset.X_test)
    save_confusion_matrix(dataset.y_test, y_pred, CLASS_LABELS, "threat_confusion_matrix.png")
    save_classification_report(dataset.y_test, y_pred, CLASS_LABELS, "threat_classification_report.txt")
    if hasattr(classifier.best_model, "predict_proba"):
        proba = classifier.best_model.predict_proba(dataset.X_test)
        if proba.shape[1] == 2:
            save_roc_curve(dataset.y_test, proba[:, 1], "Threat Classifier", "threat_roc_curve.png")
        else:
            logger.warning("Skipping ROC curve generation for multiclass threat classification")
    logger.info("Completed threat classification training")
    return {"results": results}


def train_anomaly_model() -> None:
    logger.info("Starting anomaly detection training")
    df = load_cicids2017()
    preprocessor = DataPreprocessor()
    X_normal, _, _ = preprocessor.preprocess_cicids2017(df)

    detector = AnomalyDetector()
    detector.train(X_normal)
    logger.info("Completed anomaly detection training")


def train_login_model() -> None:
    logger.info("Starting login behavior training")
    df = load_user_behavior()
    preprocessor = DataPreprocessor()
    dataset = preprocessor.preprocess_user_behavior(df)

    detector = LoginBehaviorDetector()
    detector.train(
        dataset.X_train,
        dataset.y_train,
        dataset.X_val,
        dataset.y_val,
        dataset.label_encoder,
        dataset.scaler,
        dataset.feature_columns or ["login_time", "failed_attempts", "session_duration"],
    )
    logger.info("Completed login behavior training")


def main() -> None:
    try:
        train_threat_model()
    except Exception as exc:
        logger.exception("Threat model training failed: %s", exc)
    try:
        train_anomaly_model()
    except Exception as exc:
        logger.exception("Anomaly model training failed: %s", exc)
    try:
        train_login_model()
    except Exception as exc:
        logger.exception("Login behavior model training failed: %s", exc)


if __name__ == "__main__":
    main()
