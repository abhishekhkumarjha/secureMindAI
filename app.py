from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ai_models.config import ANOMALY_MODEL, LOGIN_MODEL, LOGIN_PREPROCESSOR, THREAT_BEST_MODEL, THREAT_LABEL_ENCODER
from ai_models.services import detect_anomaly, detect_login_behavior, predict_threat

app = FastAPI(title="SecureMind AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UI_DIST_DIR = Path(__file__).resolve().parent / "ui" / "dist"


class ThreatRequest(BaseModel):
    features: List[float]


class AnomalyRequest(BaseModel):
    features: List[float]


class LoginRequest(BaseModel):
    login_time: int
    login_location: str
    device_type: str
    failed_attempts: int
    session_duration: float


def _prediction_error(error: Exception) -> HTTPException:
    if isinstance(error, (FileNotFoundError, ImportError)):
        return HTTPException(status_code=503, detail=str(error))
    if isinstance(error, ValueError):
        return HTTPException(status_code=400, detail=str(error))
    return HTTPException(status_code=500, detail="Prediction service failed. Check server logs for details.")


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "SecureMind AI"}


@app.get("/api/models/status")
def model_status() -> Dict[str, Any]:
    threat_ready = THREAT_BEST_MODEL.exists() and THREAT_LABEL_ENCODER.exists()
    anomaly_ready = ANOMALY_MODEL.exists()
    login_ready = LOGIN_MODEL.exists() and LOGIN_PREPROCESSOR.exists()
    return {
        "ready": threat_ready and anomaly_ready and login_ready,
        "models": {
            "threat": {
                "ready": threat_ready,
                "missing": [str(path) for path in [THREAT_BEST_MODEL, THREAT_LABEL_ENCODER] if not path.exists()],
            },
            "anomaly": {
                "ready": anomaly_ready,
                "missing": [str(ANOMALY_MODEL)] if not anomaly_ready else [],
            },
            "login": {
                "ready": login_ready,
                "missing": [str(path) for path in [LOGIN_MODEL, LOGIN_PREPROCESSOR] if not path.exists()],
            },
        },
    }


@app.post("/api/predict/threat")
def api_predict_threat(request: ThreatRequest) -> Dict[str, Any]:
    try:
        return predict_threat({"features": request.features})
    except Exception as error:
        raise _prediction_error(error) from error


@app.post("/api/predict/anomaly")
def api_detect_anomaly(request: AnomalyRequest) -> Dict[str, Any]:
    try:
        return detect_anomaly({"features": request.features})
    except Exception as error:
        raise _prediction_error(error) from error


@app.post("/api/predict/login")
def api_detect_login(request: LoginRequest) -> Dict[str, Any]:
    try:
        return detect_login_behavior(request.model_dump())
    except Exception as error:
        raise _prediction_error(error) from error


if not UI_DIST_DIR.exists():
    @app.get("/", response_class=HTMLResponse)
    def home() -> str:
        return """
        <!DOCTYPE html>
        <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>SecureMind AI</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 2rem; }
            h1, h2 { color: #1a202c; }
            label { display: block; margin-top: 1rem; font-weight: bold; }
            textarea, input, select { width: 100%; padding: 0.75rem; margin-top: 0.25rem; }
            button { margin-top: 1rem; padding: 0.75rem 1rem; background: #2563eb; color: white; border: none; cursor: pointer; }
            button:hover { background: #1d4ed8; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08); }
            .output { margin-top: 1rem; background: #f8fafc; padding: 1rem; border-radius: 8px; white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <h1>SecureMind AI Demo UI</h1>
        <p>Use the forms below to send requests to the model backend.</p>

        <div class="card">
            <h2>Threat Classification</h2>
            <label for="threat-features">Feature Array (JSON)</label>
            <textarea id="threat-features" rows="4">[0.1, 1.0, 0.0, 5.2]</textarea>
            <button onclick="submitThreat()">Predict Threat</button>
            <div id="threat-result" class="output"></div>
            <p>Note: Threat model expects a numeric feature array with the same order used during training.</p>
        </div>

        <div class="card">
            <h2>Anomaly Detection</h2>
            <label for="anomaly-features">Feature Array (JSON)</label>
            <textarea id="anomaly-features" rows="4">[1.0, 0.5, 10.0, 0.0]</textarea>
            <button onclick="submitAnomaly()">Detect Anomaly</button>
            <div id="anomaly-result" class="output"></div>
            <p>Note: Anomaly model expects a numeric feature array with the same columns as the CICIDS2017 normal training data.</p>
        </div>

        <div class="card">
            <h2>Login Behavior Detection</h2>
            <label for="login-time">Login Time (hour)</label>
            <input id="login-time" type="number" value="14" />
            <label for="login-location">Login Location</label>
            <input id="login-location" type="text" value="US" />
            <label for="device-type">Device Type</label>
            <input id="device-type" type="text" value="desktop" />
            <label for="failed-attempts">Failed Attempts</label>
            <input id="failed-attempts" type="number" value="0" />
            <label for="session-duration">Session Duration (minutes)</label>
            <input id="session-duration" type="number" step="0.1" value="15" />
            <button onclick="submitLogin()">Detect Login Behavior</button>
            <div id="login-result" class="output"></div>
        </div>

        <script>
            async function postJson(url, body) {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`${response.status} - ${text}`);
                }
                return response.json();
            }

            async function submitThreat() {
                const output = document.getElementById('threat-result');
                try {
                    const features = JSON.parse(document.getElementById('threat-features').value);
                    const result = await postJson('/api/predict/threat', { features });
                    output.textContent = JSON.stringify(result, null, 2);
                } catch (error) {
                    output.textContent = `Error: ${error.message}`;
                }
            }

            async function submitAnomaly() {
                const output = document.getElementById('anomaly-result');
                try {
                    const features = JSON.parse(document.getElementById('anomaly-features').value);
                    const result = await postJson('/api/predict/anomaly', { features });
                    output.textContent = JSON.stringify(result, null, 2);
                } catch (error) {
                    output.textContent = `Error: ${error.message}`;
                }
            }

            async function submitLogin() {
                const output = document.getElementById('login-result');
                try {
                    const body = {
                        login_time: Number(document.getElementById('login-time').value),
                        login_location: document.getElementById('login-location').value,
                        device_type: document.getElementById('device-type').value,
                        failed_attempts: Number(document.getElementById('failed-attempts').value),
                        session_duration: Number(document.getElementById('session-duration').value),
                    };
                    const result = await postJson('/api/predict/login', body);
                    output.textContent = JSON.stringify(result, null, 2);
                } catch (error) {
                    output.textContent = `Error: ${error.message}`;
                }
            }
        </script>
    </body>
    </html>
    """
else:
    app.mount("/", StaticFiles(directory=str(UI_DIST_DIR), html=True), name="ui")
