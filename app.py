from __future__ import annotations
from datetime import datetime, timezone
import hashlib
import hmac
import os
from pathlib import Path
import secrets
from typing import Any, Dict, List, Literal, Optional
import uuid

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from ai_models.config import (
    ANOMALY_MODEL,
    ANOMALY_SCALER,
    LOGIN_MODEL,
    LOGIN_PREPROCESSOR,
    THREAT_BEST_MODEL,
    THREAT_LABEL_ENCODER,
    THREAT_SCALER,
)
from ai_models.services import detect_anomaly, detect_login_behavior, predict_threat
from logging_config import get_logger

# Load configuration
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ALLOWED_ORIGINS = [
    origin.strip().rstrip("/") for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost,http://127.0.0.1").split(",")
]
# Add wildcard as fallback for development/preview deployments
if "*" not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append("*")
CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app")
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_PERIOD = int(os.getenv("RATE_LIMIT_PERIOD", "3600"))

logger = get_logger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address) if RATE_LIMIT_ENABLED else None

# Initialize FastAPI app
app = FastAPI(
    title="SecureMind AI",
    version="1.0.0",
    description="AI-Powered Cybersecurity Threat Detection Platform",
    debug=DEBUG,
)

# CORS Middleware (allow all Vercel preview/production URLs via regex)
cors_config = {
    "allow_origins": ALLOWED_ORIGINS,
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "DELETE"],
    "allow_headers": ["Authorization", "Content-Type"],
}
# Always add regex for Vercel domains
if CORS_ORIGIN_REGEX:
    cors_config["allow_origin_regex"] = CORS_ORIGIN_REGEX
app.add_middleware(CORSMiddleware, **cors_config)

# Rate limiting
if RATE_LIMIT_ENABLED:
    app.state.limiter = limiter
    app.add_exception_handler(Exception, lambda request, exc: HTTPException(status_code=429, detail="Rate limit exceeded"))

UI_DIST_DIR = Path(__file__).resolve().parent / "ui" / "dist"


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    return response


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID for tracing."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


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


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Literal["admin", "security_user"] = "security_user"


class AuthRequest(BaseModel):
    email: str
    password: str


class SecurityLogRequest(BaseModel):
    message: str
    source: str
    destination: str
    severity: Literal["critical", "high", "medium", "low"]
    type: Literal["Firewall", "VPC Flows", "EDR Agent", "SSO Auth", "Kubernetes Audit", "WAF"]
    action: Literal["BLOCKED", "ALLOWED", "ALERTED", "QUARANTINED"]
    payload: Dict[str, Any] = {}


class DetectRequest(BaseModel):
    features: Optional[List[float]] = None
    log: Optional[SecurityLogRequest] = None


class InvestigateRequest(BaseModel):
    incident_id: str
    note: Optional[str] = None
    action: Optional[str] = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _auth_error() -> HTTPException:
    return HTTPException(status_code=401, detail="Authentication required")


USERS: Dict[str, Dict[str, Any]] = {
    "abhishek.jha@securemind.ai": {
        "name": "Abhishek Kumar Jha",
        "email": "abhishek.jha@securemind.ai",
        "role": "admin",
        "password_hash": _hash_password("SOCOperational@2026!"),
    }
}
SESSIONS: Dict[str, str] = {}

LOGS: List[Dict[str, Any]] = [
    {
        "id": "LOG-882201",
        "timestamp": "2026-05-24T08:01:45Z",
        "message": "WAF detected Signature Injection in customer API query: union-based extract attempts detected",
        "source": "185.220.101.44",
        "destination": "10.140.50.15",
        "severity": "critical",
        "type": "WAF",
        "action": "BLOCKED",
        "payload": {"ruleID": "942100-SQLi-Union", "relevanceScore": 98},
    },
    {
        "id": "LOG-882204",
        "timestamp": "2026-05-24T07:59:15Z",
        "message": "IP Address blocked due to excessive SSH login trials",
        "source": "45.143.203.111",
        "destination": "10.140.10.8",
        "severity": "medium",
        "type": "Firewall",
        "action": "BLOCKED",
        "payload": {"port": 22, "firewallRule": "BlockBruteForceSSH_EdgeGlobal"},
    },
]

THREATS: List[Dict[str, Any]] = [
    {
        "id": "THR-782",
        "title": "Distributed SQL Injection & Data Extraction",
        "category": "Web Application Attack",
        "riskScore": 94,
        "severity": "critical",
        "timestamp": "2026-05-24T07:44:12Z",
        "source": "185.220.101.44 (Tor Exit Node)",
        "destination": "customer-db-primary.prod.securemind.ai",
        "status": "Active",
        "attackVector": "CVE-2025-4421",
        "affectedAssets": ["db-server-01a", "billing-api-v2"],
        "cve": "CVE-2025-4421",
        "description": "Union-based SQL injection attempts are targeting the customer billing endpoint.",
        "aiExplanation": "Block Tor-associated CIDRs and apply strict query sanitization on billing-api-v2.",
    },
    {
        "id": "THR-294",
        "title": "SSH Hard Bruteforce on Public Jump-Host",
        "category": "Credential Cracking",
        "riskScore": 64,
        "severity": "medium",
        "timestamp": "2026-05-24T07:59:00Z",
        "source": "45.143.203.111",
        "destination": "jump.prod.securemind.ai",
        "status": "Active",
        "attackVector": "SSH Dictionary Attack",
        "affectedAssets": ["jump-host-external-01"],
        "description": "High-volume failed SSH authentication attempts were detected.",
        "aiExplanation": "Blacklist the source IP and keep MFA enforced on the jump host.",
    },
]

INCIDENTS: List[Dict[str, Any]] = [
    {
        "id": "INC-2026-0041",
        "title": "Multi-Stage Intrusion Investigation (APT-39)",
        "severity": "critical",
        "riskScore": 96,
        "status": "Open",
        "category": "Targeted Attack / Intrusion",
        "assignedTo": "SecOps Team Lead",
        "timestamp": "2026-05-24T07:44:12Z",
        "rootCause": "Compromised credentials followed by lateral movement and SQL injection.",
        "description": "A correlated incident joining SSO, endpoint, WAF, and database telemetry.",
        "timeline": [
            {
                "id": "t-1",
                "timestamp": "06:12:05",
                "title": "Initial SSO Access",
                "description": "Suspicious login from a Tor-associated source.",
                "source": "AzureAD SSO Logs",
                "type": "alert",
            }
        ],
        "nodes": [
            {"id": "1", "label": "Tor Operator", "type": "attacker", "status": "danger", "ip": "185.220.101.44"},
            {"id": "2", "label": "Cloud Gateway Edge", "type": "firewall", "status": "warning", "ip": "10.140.10.1"},
        ],
        "edges": [{"from": "1", "to": "2", "type": "blocked", "label": "WAF Rate Limit"}],
        "recommendations": [
            "Revoke active SSO refresh tokens.",
            "Deploy WAF rule for union-select payloads.",
            "Quarantine the suspected workstation.",
        ],
        "notes": ["AI Bot: Incident opened from correlated high-risk telemetry."],
    }
]


def _current_user(authorization: str | None) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise _auth_error()
    token = authorization.removeprefix("Bearer ").strip()
    email = SESSIONS.get(token)
    if email is None or email not in USERS:
        raise _auth_error()
    user = USERS[email].copy()
    user.pop("password_hash", None)
    return user


def _classify_log_risk(log: SecurityLogRequest) -> Dict[str, Any]:
    severity_score = {"critical": 95, "high": 82, "medium": 58, "low": 25}[log.severity]
    action_modifier = {"QUARANTINED": 5, "BLOCKED": 0, "ALERTED": 8, "ALLOWED": -10}[log.action]
    risk_score = max(0, min(100, severity_score + action_modifier))
    prediction = "Malicious" if risk_score >= 80 else "Suspicious" if risk_score >= 50 else "Normal"
    return {"prediction": prediction, "confidence": round(risk_score / 100, 2), "risk_score": risk_score}


def _prediction_error(error: Exception) -> HTTPException:
    if isinstance(error, (FileNotFoundError, ImportError)):
        return HTTPException(status_code=503, detail=str(error))
    if isinstance(error, ValueError):
        return HTTPException(status_code=400, detail=str(error))
    return HTTPException(status_code=500, detail="Prediction service failed. Check server logs for details.")


@app.get("/api/health")
def health() -> Dict[str, Any]:
    """Production health check endpoint with model status."""
    threat_ready = THREAT_BEST_MODEL.exists() and THREAT_LABEL_ENCODER.exists() and THREAT_SCALER.exists()
    anomaly_ready = ANOMALY_MODEL.exists() and ANOMALY_SCALER.exists()
    login_ready = LOGIN_MODEL.exists() and LOGIN_PREPROCESSOR.exists()
    
    all_ready = threat_ready and anomaly_ready and login_ready
    
    response = {
        "status": "healthy" if all_ready else "degraded",
        "timestamp": _now_iso(),
        "models": {
            "threat": {"ready": threat_ready},
            "anomaly": {"ready": anomaly_ready},
            "login": {"ready": login_ready},
        },
    }
    
    logger.info(f"Health check - Status: {response['status']}")
    
    if not all_ready:
        logger.warning(f"Missing models: threat={not threat_ready}, anomaly={not anomaly_ready}, login={not login_ready}")
    
    return response


@app.post("/register")
def register(request: RegisterRequest) -> Dict[str, Any]:
    """User registration endpoint."""
    email = request.email.strip().lower()
    if email in USERS:
        logger.warning(f"Registration attempt with existing email: {email}")
        raise HTTPException(status_code=409, detail="User already exists")
    USERS[email] = {
        "name": request.name.strip(),
        "email": email,
        "role": request.role,
        "password_hash": _hash_password(request.password),
    }
    logger.info(f"User registered: {email} with role {request.role}")
    return {"message": "User registered", "email": email, "role": request.role}


@app.post("/login")
def login(request: AuthRequest) -> Dict[str, Any]:
    """User login endpoint with token generation."""
    email = request.email.strip().lower()
    user = USERS.get(email)
    if user is None or not hmac.compare_digest(user["password_hash"], _hash_password(request.password)):
        logger.warning(f"Failed login attempt for email: {email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = email
    profile = user.copy()
    profile.pop("password_hash", None)
    logger.info(f"User logged in: {email}")
    return {"access_token": token, "token_type": "bearer", "user": profile}


@app.get("/profile")
def profile(authorization: str | None = Header(default=None)) -> Dict[str, Any]:
    return {"user": _current_user(authorization)}


@app.get("/api/models/status")
def model_status() -> Dict[str, Any]:
    threat_files = [THREAT_BEST_MODEL, THREAT_LABEL_ENCODER, THREAT_SCALER]
    anomaly_files = [ANOMALY_MODEL, ANOMALY_SCALER]
    login_files = [LOGIN_MODEL, LOGIN_PREPROCESSOR]
    threat_ready = all(path.exists() for path in threat_files)
    anomaly_ready = all(path.exists() for path in anomaly_files)
    login_ready = LOGIN_MODEL.exists() and LOGIN_PREPROCESSOR.exists()
    return {
        "ready": threat_ready and anomaly_ready and login_ready,
        "models": {
            "threat": {
                "ready": threat_ready,
                "missing": [str(path) for path in threat_files if not path.exists()],
            },
            "anomaly": {
                "ready": anomaly_ready,
                "missing": [str(path) for path in anomaly_files if not path.exists()],
            },
            "login": {
                "ready": login_ready,
                "missing": [str(path) for path in login_files if not path.exists()],
            },
        },
    }


@app.get("/logs")
def get_logs(authorization: str | None = Header(default=None)) -> List[Dict[str, Any]]:
    # Allow public access for demo purposes
    try:
        _current_user(authorization)
    except HTTPException:
        # Return demo logs if not authenticated
        pass
    return LOGS


@app.post("/logs")
def create_log(request: SecurityLogRequest, authorization: str | None = Header(default=None)) -> Dict[str, Any]:
    _current_user(authorization)
    row = request.model_dump()
    row["id"] = f"LOG-{secrets.randbelow(900000) + 100000}"
    row["timestamp"] = _now_iso()
    LOGS.insert(0, row)
    return row


@app.delete("/logs")
def delete_logs(authorization: str | None = Header(default=None)) -> Dict[str, Any]:
    user = _current_user(authorization)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete logs")
    count = len(LOGS)
    LOGS.clear()
    return {"deleted": count}


@app.get("/threats")
def get_threats(authorization: str | None = Header(default=None)) -> List[Dict[str, Any]]:
    # Allow public access for demo purposes
    try:
        _current_user(authorization)
    except HTTPException:
        pass
    return THREATS


@app.post("/detect")
def detect(request: DetectRequest, authorization: str | None = Header(default=None)) -> Dict[str, Any]:
    _current_user(authorization)
    if request.features is not None:
        return api_predict_threat(ThreatRequest(features=request.features))
    if request.log is not None:
        result = _classify_log_risk(request.log)
        return {
            **result,
            "recommendation": "Investigate immediately" if result["risk_score"] >= 80 else "Monitor and correlate",
        }
    raise HTTPException(status_code=400, detail="Provide either features or log for detection")


@app.get("/incidents")
def get_incidents(authorization: str | None = Header(default=None)) -> List[Dict[str, Any]]:
    # Allow public access for demo purposes
    try:
        _current_user(authorization)
    except HTTPException:
        pass
    return INCIDENTS


@app.post("/investigate")
def investigate(request: InvestigateRequest, authorization: str | None = Header(default=None)) -> Dict[str, Any]:
    user = _current_user(authorization)
    incident = next((item for item in INCIDENTS if item["id"] == request.incident_id), None)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    if request.note:
        incident["notes"].insert(0, f"{_now_iso()} - {user['email']}: {request.note}")
    if request.action:
        incident["timeline"].append(
            {
                "id": f"t-{len(incident['timeline']) + 1}",
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "title": "Investigation Action",
                "description": request.action,
                "source": user["email"],
                "type": "action",
            }
        )
    return incident


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
            <p>Note: Threat model expects 40 numeric features in the same order used during training.</p>
        </div>

        <div class="card">
            <h2>Anomaly Detection</h2>
            <label for="anomaly-features">Feature Array (JSON)</label>
            <textarea id="anomaly-features" rows="4">[1.0, 0.5, 10.0, 0.0]</textarea>
            <button onclick="submitAnomaly()">Detect Anomaly</button>
            <div id="anomaly-result" class="output"></div>
            <p>Note: Anomaly model expects 39 numeric features in the same columns and order as the CICIDS2017 normal training data.</p>
        </div>

        <div class="card">
            <h2>Login Behavior Detection</h2>
            <label for="login-time">Login Time (hour)</label>
            <input id="login-time" type="number" value="14" />
            <label for="login-location">Login Location</label>
            <input id="login-location" type="text" value="India" />
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
