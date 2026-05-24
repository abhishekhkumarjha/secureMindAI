export interface PredictionResult {
  prediction: string;
  confidence: number;
  risk_score: number;
}

export interface ModelStatus {
  ready: boolean;
  models: Record<string, { ready: boolean; missing: string[] }>;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail || response.statusText || 'Request failed';
    throw new Error(detail);
  }

  return response.json();
}

export async function getModelStatus(): Promise<ModelStatus> {
  const response = await fetch('/api/models/status');
  if (!response.ok) {
    throw new Error('Unable to load model status');
  }
  return response.json();
}

export function predictThreat(features: number[]): Promise<PredictionResult> {
  return postJson<PredictionResult>('/api/predict/threat', { features });
}

export function detectAnomaly(features: number[]): Promise<PredictionResult> {
  return postJson<PredictionResult>('/api/predict/anomaly', { features });
}

export function detectLoginBehavior(payload: {
  login_time: number;
  login_location: string;
  device_type: string;
  failed_attempts: number;
  session_duration: number;
}): Promise<PredictionResult> {
  return postJson<PredictionResult>('/api/predict/login', payload);
}
