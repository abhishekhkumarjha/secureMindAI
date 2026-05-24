from __future__ import annotations
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("AI_DATASET_DIR", BASE_DIR / "datasets"))
MODEL_DIR = Path(os.getenv("AI_MODELS_DIR", BASE_DIR / "trained_models"))
EVAL_DIR = Path(os.getenv("AI_EVAL_DIR", BASE_DIR / "evaluation"))
LOG_DIR = Path(os.getenv("AI_LOG_DIR", MODEL_DIR / "logs"))

DATA_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)
EVAL_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

UNSW_NB15_CSV = Path(os.getenv("UNSW_NB15_CSV", DATA_DIR / "UNSW-NB15.csv"))
CICIDS2017_CSV = Path(os.getenv("CICIDS2017_CSV", DATA_DIR / "CICIDS2017.csv"))
USER_BEHAVIOR_CSV = Path(os.getenv("USER_BEHAVIOR_CSV", DATA_DIR / "user_behavior.csv"))

THREAT_RF_MODEL = MODEL_DIR / "threat_rf_model.joblib"
THREAT_XGB_MODEL = MODEL_DIR / "threat_xgb_model.joblib"
THREAT_BEST_MODEL = MODEL_DIR / "threat_best_model.joblib"
THREAT_LABEL_ENCODER = MODEL_DIR / "threat_label_encoder.joblib"
ANOMALY_MODEL = MODEL_DIR / "anomaly_isolation_forest.joblib"
LOGIN_MODEL = MODEL_DIR / "login_lstm.h5"
LOGIN_PREPROCESSOR = MODEL_DIR / "login_preprocessor.pkl"

DEFAULT_RANDOM_STATE = int(os.getenv("AI_RANDOM_STATE", "42"))

CLASS_LABELS = [
    "Normal",
    "DoS",
    "Exploits",
    "Reconnaissance",
    "Backdoor",
    "Worms",
    "Shellcode",
    "Fuzzers",
]
