import { Incident, SecurityLog, Threat } from './types';

export interface PredictionResult {
  prediction: string;
  confidence: number;
  risk_score: number;
}

export interface ModelStatus {
  ready: boolean;
  models: Record<string, { ready: boolean; missing: string[] }>;
}

export interface AuthUser {
  name: string;
  email: string;
  role: 'admin' | 'security_user';
}

export interface LoginResult {
  access_token: string;
  token_type: 'bearer';
  user: AuthUser;
}

const TOKEN_KEY = 'securemind_token';

/** Production FastAPI backend (Render). */
const DEFAULT_PRODUCTION_API = 'https://securemindai.onrender.com';

function resolveApiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    // Local dev: Vite proxy handles API routes on the same origin.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '';
    }
    // Vercel / production: always call Render directly (no env var required).
    if (hostname.endsWith('.vercel.app') || protocol === 'https:') {
      return DEFAULT_PRODUCTION_API;
    }
  }

  return '';
}

const API_BASE_URL = resolveApiBaseUrl();

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function getAuthToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    let detail = payload?.detail || response.statusText || 'Request failed';
    throw new Error(detail);
  }

  return response.json();
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path), { headers: authHeaders() });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail || response.statusText || 'Request failed';
    throw new Error(detail);
  }
  return response.json();
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const result = await postJson<LoginResult>('/login', { email, password });
  setAuthToken(result.access_token);
  return result;
}

export function getProfile(): Promise<{ user: AuthUser }> {
  return getJson<{ user: AuthUser }>('/profile');
}

export async function getModelStatus(): Promise<ModelStatus> {
  const response = await fetch(apiUrl('/api/models/status'));
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

export function fetchLogs(): Promise<SecurityLog[]> {
  return getJson<SecurityLog[]>('/logs');
}

export function fetchThreats(): Promise<Threat[]> {
  return getJson<Threat[]>('/threats');
}

export function fetchIncidents(): Promise<Incident[]> {
  return getJson<Incident[]>('/incidents');
}

export function investigateIncident(payload: {
  incident_id: string;
  note?: string;
  action?: string;
}): Promise<Incident> {
  return postJson<Incident>('/investigate', payload);
}
