from __future__ import annotations
import pickle
from pathlib import Path
import joblib
from typing import Any


def ensure_directory(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def save_joblib(obj: Any, path: Path) -> None:
    ensure_directory(path)
    joblib.dump(obj, path)


def load_joblib(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Joblib file not found: {path}")
    return joblib.load(path)


def save_pickle(obj: Any, path: Path) -> None:
    ensure_directory(path)
    with path.open("wb") as handle:
        pickle.dump(obj, handle)


def load_pickle(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Pickle file not found: {path}")
    with path.open("rb") as handle:
        return pickle.load(handle)
