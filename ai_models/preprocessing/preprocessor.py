from __future__ import annotations
import os
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
            # If the provided scaler hasn't been fitted yet, fit it first.
            if not hasattr(scaler, "mean_"):
                scaler = scaler.fit(X)
                X_scaled = scaler.transform(X)
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
        # Check if SMOTE can be applied (need at least n_neighbors samples per class)
        unique_classes, class_counts = np.unique(y_train, return_counts=True)
        min_class_count = class_counts.min()
        
        # SMOTE requires at least 6 neighbors by default, so we need at least 6+1 samples per class
        if min_class_count < 7:
            logger.warning(
                "Skipping SMOTE balancing: minimum class count (%d) is less than required (7)",
                min_class_count
            )
            return X_train, y_train
        
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

    def preprocess_cicids2017(self, df: pd.DataFrame) -> PreprocessingResult:
        df = self.clean_dataframe(df)
        if "Label" not in df.columns and "label" not in df.columns:
            raise ValueError("CICIDS2017 dataset requires a 'Label' or 'label' column")

        label_column = "Label" if "Label" in df.columns else "label"
        y = df[label_column].astype(str)
        X = df.drop(columns=[label_column], errors="ignore")
        X = X.select_dtypes(include=["number"]).fillna(0)

        scaler = StandardScaler()
        X_scaled, scaler = self.normalize_features(X, scaler)
        label_encoder = LabelEncoder().fit(y)
        y_encoded = label_encoder.transform(y)
        X_train, X_val, X_test, y_train, y_val, y_test = self.split_dataset(X_scaled, y_encoded)
        X_train, y_train = self.balance_dataset(X_train, y_train)
        logger.info("Prepared CICIDS2017 multiclass data: %s rows", X_scaled.shape[0])
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

    def preprocess_unsw_nb15_for_anomaly(self, df: pd.DataFrame) -> Tuple[np.ndarray, StandardScaler]:
        df = self.clean_dataframe(df)
        if "attack_cat" in df.columns:
            y = df["attack_cat"].astype(str)
        elif "label" in df.columns:
            y = df["label"].astype(str)
        else:
            raise ValueError("UNSW-NB15 dataset requires 'attack_cat' or 'label' target column")

        normal_mask = y.str.lower().isin(["normal"])
        drop_columns = [col for col in ["attack_cat", "label", "id", "timestamp"] if col in df.columns]
        X = df.drop(columns=drop_columns, errors="ignore")

        categorical = [col for col in X.select_dtypes(include="object").columns if col != "srcip"]
        if categorical:
            X = pd.get_dummies(X, columns=categorical, drop_first=True)
        X = X.select_dtypes(include=["number"]).fillna(0)

        X_normal = X[normal_mask]
        scaler = StandardScaler()
        X_normal_scaled, scaler = self.normalize_features(X_normal, scaler)
        logger.info("Prepared UNSW-NB15 normal training data: %s rows", X_normal_scaled.shape[0])
        return X_normal_scaled, scaler

    def preprocess_user_behavior(self, df: pd.DataFrame) -> PreprocessingResult:
        max_rows = int(os.getenv("LOGIN_MAX_ROWS", "50000"))
        if max_rows > 0 and len(df) > max_rows:
            logger.info("Downsampling login dataset from %s to %s rows before cleaning", len(df), max_rows)
            df = df.sample(n=max_rows, random_state=self.random_state)

        df = self.clean_dataframe(df)

        if "login_time" not in df.columns and "Login Timestamp" in df.columns:
            df["login_time"] = pd.to_datetime(df["Login Timestamp"], errors="coerce")
        if "login_location" not in df.columns:
            if "Country" in df.columns:
                df["login_location"] = df["Country"].astype(str)
            elif "City" in df.columns:
                df["login_location"] = df["City"].astype(str)
        if "device_type" not in df.columns and "Device Type" in df.columns:
            df["device_type"] = df["Device Type"].astype(str)
        if "failed_attempts" not in df.columns and "Login Successful" in df.columns:
            success = df["Login Successful"]
            if success.dtype == bool:
                df["failed_attempts"] = (~success).astype(int)
            else:
                success_bool = success.astype(str).str.lower().isin(["true", "1", "yes", "y", "t"])
                df["failed_attempts"] = (~success_bool).astype(int)
        if "session_duration" not in df.columns and "Round-Trip Time [ms]" in df.columns:
            df["session_duration"] = df["Round-Trip Time [ms]"].fillna(0)

        if "label" not in df.columns and "status" not in df.columns:
            if "Is Attack IP" in df.columns or "Is Account Takeover" in df.columns:
                suspicious = pd.Series(False, index=df.index)
                if "Is Attack IP" in df.columns:
                    suspicious = suspicious | df["Is Attack IP"].astype(bool)
                if "Is Account Takeover" in df.columns:
                    suspicious = suspicious | df["Is Account Takeover"].astype(bool)
                df["status"] = suspicious.map({False: "normal", True: "suspicious"})
            else:
                raise ValueError("User behavior dataset requires a 'label' or 'status' column")

        required_features = ["login_time", "login_location", "device_type", "failed_attempts", "session_duration"]
        missing = [feature for feature in required_features if feature not in df.columns]
        if missing:
            raise ValueError(f"User behavior dataset is missing columns: {missing}")

        target_column = "label" if "label" in df.columns else "status"
        y = df[target_column].astype(str).str.replace(" ", "_")
        y = y.replace({"normal": "Normal Login", "suspicious": "Suspicious Login"})

        df = df[required_features + [target_column]].copy()
        max_rows = int(os.getenv("LOGIN_MAX_ROWS", "50000"))
        if max_rows > 0 and len(df) > max_rows:
            logger.warning(
                "Sampling login dataset from %s to %s rows for memory-safe training",
                len(df),
                max_rows,
            )
            df = df.sample(n=max_rows, random_state=self.random_state)
            y = y.loc[df.index]

        df["login_time"] = pd.to_datetime(df["login_time"], errors="coerce").dt.hour.fillna(0)

        categorical_features = ["login_location", "device_type"]
        for feature in categorical_features:
            df[feature] = df[feature].astype(str)
        max_categories = int(os.getenv("LOGIN_MAX_CATEGORIES", "200"))
        if max_categories > 0:
            for feature in categorical_features:
                top_values = df[feature].value_counts().nlargest(max_categories).index
                df.loc[~df[feature].isin(top_values), feature] = "Other"

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
