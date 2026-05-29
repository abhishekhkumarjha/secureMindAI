from __future__ import annotations
import os
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
    usecols = [
        "Login Timestamp",
        "Country",
        "Region",
        "City",
        "Device Type",
        "Round-Trip Time [ms]",
        "Login Successful",
        "Is Attack IP",
        "Is Account Takeover",
    ]
    if not USER_BEHAVIOR_CSV.exists():
        logger.error("Dataset file not found: %s", USER_BEHAVIOR_CSV)
        raise FileNotFoundError(f"Dataset file not found: {USER_BEHAVIOR_CSV}")

    max_rows = int(os.getenv("LOGIN_MAX_ROWS", "50000"))
    read_kwargs = {"usecols": usecols}
    if max_rows > 0:
        read_kwargs["nrows"] = max_rows
        logger.info("Loading first %s rows from %s", max_rows, USER_BEHAVIOR_CSV)
    else:
        logger.info("Loading full dataset from %s", USER_BEHAVIOR_CSV)

    try:
        df = pd.read_csv(USER_BEHAVIOR_CSV, **read_kwargs)
    except ValueError:
        logger.warning(
            "Expected login behavior columns not present for selective loading; falling back to full CSV load"
        )
        df = pd.read_csv(USER_BEHAVIOR_CSV)
    logger.info("Loaded %s rows and %s columns", df.shape[0], df.shape[1])
    return df
