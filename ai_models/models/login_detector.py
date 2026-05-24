from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, Optional

import numpy as np
from sklearn.preprocessing import LabelEncoder

from ..config import LOGIN_MODEL, LOGIN_PREPROCESSOR, DEFAULT_RANDOM_STATE
from ..utils.logger import get_logger
from ..utils.persistence import load_pickle, save_pickle

logger = get_logger(__name__)


def _load_keras():
    try:
        from tensorflow.keras.layers import Dense, LSTM
        from tensorflow.keras.models import Sequential, load_model
        from tensorflow.keras.optimizers import Adam
        from tensorflow.keras.callbacks import EarlyStopping
        return Dense, LSTM, Sequential, load_model, Adam, EarlyStopping
    except ImportError as error:
        raise ImportError("TensorFlow is required for the login behavior LSTM model.") from error


class LoginBehaviorDetector:
    def __init__(self) -> None:
        self.model: Optional[Any] = None
        self.preprocessor: Optional[Dict[str, Any]] = None

    def build_model(self, input_shape: tuple[int, int], num_classes: int) -> Any:
        Dense, LSTM, Sequential, _, Adam, _ = _load_keras()
        model = Sequential(
            [
                LSTM(64, input_shape=input_shape, return_sequences=False),
                Dense(32, activation="relu"),
                Dense(num_classes, activation="softmax"),
            ]
        )
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss="sparse_categorical_crossentropy",
            metrics=["accuracy"],
        )
        logger.info("Built LSTM model with input shape %s", input_shape)
        return model

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
        num_classes = len(label_encoder.classes_)
        input_shape = (X_train.shape[1], 1)
        X_train_reshaped = X_train.reshape((-1, X_train.shape[1], 1))
        X_val_reshaped = X_val.reshape((-1, X_val.shape[1], 1))

        self.model = self.build_model(input_shape, num_classes)
        _, _, _, _, _, EarlyStopping = _load_keras()
        callback = EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True)
        self.model.fit(
            X_train_reshaped,
            y_train,
            validation_data=(X_val_reshaped, y_val),
            epochs=50,
            batch_size=32,
            callbacks=[callback],
            verbose=0,
        )
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
        self.model.save(LOGIN_MODEL)
        logger.info("Saved login LSTM model to %s", LOGIN_MODEL)

    def load(self) -> None:
        if not LOGIN_MODEL.exists() or not LOGIN_PREPROCESSOR.exists():
            raise FileNotFoundError("Login behavior model or preprocessor not found. Train the model before inference.")
        _, _, _, load_model, _, _ = _load_keras()
        self.model = load_model(LOGIN_MODEL)
        self.preprocessor = load_pickle(LOGIN_PREPROCESSOR)
        logger.info("Loaded login detector and preprocessor from disk")

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        if self.model is None or self.preprocessor is None:
            self.load()

        scalar = self.preprocessor["scaler"]
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

        processed = scalar.transform(feature_vector)
        processed = processed.reshape((1, processed.shape[1], 1))

        probabilities = self.model.predict(processed, verbose=0)
        best_index = int(np.argmax(probabilities, axis=1)[0])
        prediction = label_encoder.inverse_transform([best_index])[0]
        confidence = float(probabilities[0, best_index])
        logger.info("Login behavior prediction=%s confidence=%.4f", prediction, confidence)
        return {
            "prediction": prediction,
            "confidence": confidence,
            "risk_score": int(confidence * 100) if prediction != "Normal Login" else max(0, 100 - int(confidence * 100)),
        }
