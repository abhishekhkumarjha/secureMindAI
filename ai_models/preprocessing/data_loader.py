from __future__ import annotations
from pathlib import Path
import pandas as pd
from ..config import CICIDS2017_CSV, UNSW_NB15_CSV, USER_BEHAVIOR_CSV
from ..utils.logger import get_logger

logger = get_logger(__name__)


def load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        logger.error("Dataset file not found: %s", path)
        raise FileNotFoundError(f"Dataset file not found: {path}")
    logger.info("Loading dataset from %s", path)
    df = pd.read_csv(path)
    logger.info("Loaded %s rows and %s columns", df.shape[0], df.shape[1])
    return df


def load_unsw_nb15() -> pd.DataFrame:
    return load_csv(UNSW_NB15_CSV)


def load_cicids2017() -> pd.DataFrame:
    return load_csv(CICIDS2017_CSV)


def load_user_behavior() -> pd.DataFrame:
    return load_csv(USER_BEHAVIOR_CSV)
