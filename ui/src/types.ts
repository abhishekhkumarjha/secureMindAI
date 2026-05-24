export type SeverityType = 'critical' | 'high' | 'medium' | 'low';

export interface Threat {
  id: string;
  title: string;
  category: string;
  riskScore: number;
  severity: SeverityType;
  timestamp: string;
  source: string;
  destination?: string;
  status: 'Active' | 'Investigating' | 'Mitigated' | 'Suppressed';
  attackVector: string;
  affectedAssets: string[];
  cve?: string;
  description: string;
  aiExplanation?: string;
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  source: string;
  type: 'alert' | 'action' | 'system' | 'note';
}

export interface IncidentGraphNode {
  id: string;
  label: string;
  type: 'attacker' | 'firewall' | 'server' | 'database' | 'user' | 'cloud' | 'ai';
  status: 'danger' | 'warning' | 'secure' | 'neutral';
  ip?: string;
}

export interface IncidentGraphEdge {
  from: string;
  to: string;
  type: 'blocked' | 'active' | 'compromised' | 'normal';
  label?: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: SeverityType;
  riskScore: number;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Closed';
  category: string;
  assignedTo: string;
  timestamp: string;
  rootCause: string;
  description: string;
  timeline: IncidentTimelineEvent[];
  nodes: IncidentGraphNode[];
  edges: IncidentGraphEdge[];
  recommendations: string[];
  notes: string[];
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  message: string;
  source: string;
  destination: string;
  severity: SeverityType;
  type: 'Firewall' | 'VPC Flows' | 'EDR Agent' | 'SSO Auth' | 'Kubernetes Audit' | 'WAF';
  action: 'BLOCKED' | 'ALLOWED' | 'ALERTED' | 'QUARANTINED';
  payload: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  insights?: {
    type: 'threat' | 'remediation' | 'code' | 'summary';
    title: string;
    items: string[];
  };
}

export type ActiveView = 
  | 'dashboard' 
  | 'threats' 
  | 'incident' 
  | 'logs' 
  | 'assistant' 
  | 'reports' 
  | 'settings';
