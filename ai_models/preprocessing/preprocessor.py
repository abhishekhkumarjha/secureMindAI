from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split

from ..config import DEFAULT_RANDOM_STATE
from ..utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class PreprocessingResult:
    X_train: np.ndarray
    X_val: np.ndarray
    X_test: np.ndarray
    y_train: np.ndarray
    y_val: np.ndarray
    y_test: np.ndarray
    scaler: StandardScaler
    feature_columns: Optional[List[str]] = None
    encoder: Optional[OneHotEncoder] = None
    label_encoder: Optional[LabelEncoder] = None


class DataPreprocessor:
    def __init__(self, random_state: int = DEFAULT_RANDOM_STATE) -> None:
        self.random_state = random_state

    def clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df.drop_duplicates(inplace=True)
        df.dropna(axis=0, how="any", inplace=True)
        logger.info("Cleaned dataframe; shape after drop: %s", df.shape)
        return df

    def encode_categorical(self, df: pd.DataFrame, categorical_features: Iterable[str]) -> pd.DataFrame:
        df = df.copy()
        for column in categorical_features:
            if column not in df.columns:
                continue
            if df[column].dtype == "object":
                df[column] = df[column].astype(str)
            df[column] = LabelEncoder().fit_transform(df[column])
        logger.info("Encoded categorical columns: %s", list(categorical_features))
        return df

    def normalize_features(
        self,
        X: pd.DataFrame,
        scaler: Optional[StandardScaler] = None,
    ) -> Tuple[np.ndarray, StandardScaler]:
        if scaler is None:
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
        else:
            X_scaled = scaler.transform(X)
        return X_scaled, scaler

    def split_dataset(
        self,
        X: np.ndarray,
        y: np.ndarray,
        test_size: float = 0.15,
        val_size: float = 0.15,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        train_size = 1.0 - test_size
        X_train_full, X_test, y_train_full, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            stratify=y,
            random_state=self.random_state,
        )
        relative_val = val_size / train_size
        X_train, X_val, y_train, y_val = train_test_split(
            X_train_full,
            y_train_full,
            test_size=relative_val,
            stratify=y_train_full,
            random_state=self.random_state,
        )
        logger.info(
            "Split dataset: train=%s, val=%s, test=%s",
            X_train.shape,
            X_val.shape,
            X_test.shape,
        )
        return X_train, X_val, X_test, y_train, y_val, y_test

    def balance_dataset(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        smote = SMOTE(random_state=self.random_state)
        X_resampled, y_resampled = smote.fit_resample(X_train, y_train)
        logger.info(
            "Balanced dataset with SMOTE: original=%s, resampled=%s",
            X_train.shape[0],
            X_resampled.shape[0],
        )
        return X_resampled, y_resampled

    def preprocess_unsw_nb15(self, df: pd.DataFrame) -> PreprocessingResult:
        df = self.clean_dataframe(df)
        if "attack_cat" in df.columns:
            y = df["attack_cat"].astype(str)
        elif "label" in df.columns:
            y = df["label"].astype(str)
        else:
            raise ValueError("UNSW-NB15 dataset requires 'attack_cat' or 'label' target column")

        y = y.replace("Normal", "Normal")
        y = y.fillna("Normal")

        drop_columns = [col for col in ["attack_cat", "label", "id", "timestamp"] if col in df.columns]
        X = df.drop(columns=drop_columns, errors="ignore")

        categorical = [col for col in X.select_dtypes(include="object").columns if col != "srcip"]
        if categorical:
            X = pd.get_dummies(X, columns=categorical, drop_first=True)
        X = X.select_dtypes(include=["number"]).fillna(0)

        scaler = StandardScaler()
        X_scaled, scaler = self.normalize_features(X, scaler)

        label_encoder = LabelEncoder().fit(y)
        y_encoded = label_encoder.transform(y)

        X_train, X_val, X_test, y_train, y_val, y_test = self.split_dataset(X_scaled, y_encoded)
        X_train, y_train = self.balance_dataset(X_train, y_train)
        return PreprocessingResult(
            X_train=X_train,
            X_val=X_val,
            X_test=X_test,
            y_train=y_train,
            y_val=y_val,
            y_test=y_test,
            scaler=scaler,
            label_encoder=label_encoder,
        )

    def preprocess_cicids2017(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, StandardScaler]:
        df = self.clean_dataframe(df)
        if "Label" not in df.columns and "label" not in df.columns:
            raise ValueError("CICIDS2017 dataset requires a 'Label' or 'label' column")

        label_column = "Label" if "Label" in df.columns else "label"
        y = df[label_column].astype(str)
        X = df.drop(columns=[label_column], errors="ignore")
        X = X.select_dtypes(include=["number"]).fillna(0)

        normal_mask = y.str.lower().isin(["benign", "normal"])
        X_normal = X[normal_mask]

        scaler = StandardScaler()
        X_normal_scaled, scaler = self.normalize_features(X_normal, scaler)
        logger.info("Prepared CICIDS2017 normal training data: %s rows", X_normal_scaled.shape[0])
        y_binary = np.where(normal_mask, 0, 1)
        return X_normal_scaled, y_binary, scaler

    def preprocess_user_behavior(self, df: pd.DataFrame) -> PreprocessingResult:
        df = self.clean_dataframe(df)

        required_features = ["login_time", "login_location", "device_type", "failed_attempts", "session_duration"]
        missing = [feature for feature in required_features if feature not in df.columns]
        if missing:
            raise ValueError(f"User behavior dataset is missing columns: {missing}")

        if "label" not in df.columns and "status" not in df.columns:
            raise ValueError("User behavior dataset requires a 'label' or 'status' column")

        target_column = "label" if "label" in df.columns else "status"
        y = df[target_column].astype(str).str.replace(" ", "_")
        y = y.replace({"normal": "Normal Login", "suspicious": "Suspicious Login"})

        df = df[required_features + [target_column]].copy()
        df["login_time"] = pd.to_datetime(df["login_time"], errors="coerce").dt.hour.fillna(0)

        categorical_features = ["login_location", "device_type"]
        for feature in categorical_features:
            df[feature] = df[feature].astype(str)

        X = pd.get_dummies(df[required_features], columns=categorical_features, drop_first=True)
        X = X.fillna(0)

        scaler = StandardScaler()
        X_scaled, scaler = self.normalize_features(X, scaler)

        label_encoder = LabelEncoder().fit(y)
        y_encoded = label_encoder.transform(y)

        X_train, X_val, X_test, y_train, y_val, y_test = self.split_dataset(X_scaled, y_encoded)
        X_train, y_train = self.balance_dataset(X_train, y_train)
        return PreprocessingResult(
            X_train=X_train,
            X_val=X_val,
            X_test=X_test,
            y_train=y_train,
            y_val=y_val,
            y_test=y_test,
            scaler=scaler,
            feature_columns=X.columns.tolist(),
            label_encoder=label_encoder,
        )
