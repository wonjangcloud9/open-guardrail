import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface UrlPhishingOptions {
  action: 'block' | 'warn';
}

const CYRILLIC_LATIN_MAP: Record<string, string> = {
  '\u0430': 'a', '\u0435': 'e', '\u043e': 'o', '\u0440': 'p',
  '\u0441': 'c', '\u0443': 'y', '\u0445': 'x', '\u0456': 'i',
};

const URL_RE = /https?:\/\/[^\s"'<>]+/gi;

function hasHomograph(url: string): boolean {
  for (const char of url) {
    if (CYRILLIC_LATIN_MAP[char]) return true;
  }
  return false;
}

function hasSuspiciousSubdomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    if (parts.length <= 2) return false;
    const suspicious = ['login', 'signin', 'secure', 'account', 'verify', 'update', 'confirm', 'bank'];
    return parts.slice(0, -2).some(p => suspicious.includes(p));
  } catch {
    return false;
  }
}

function isIpBased(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
  } catch {
    return false;
  }
}

function hasExcessiveDepth(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return path.split('/').filter(Boolean).length > 8;
  } catch {
    return false;
  }
}

function isDataUri(text: string): boolean {
  return /data:[^;]+;base64,/i.test(text);
}

export function urlPhishing(options: UrlPhishingOptions): Guard {
  return {
    name: 'url-phishing',
    version: '0.1.0',
    description: 'Detects phishing URLs including homograph attacks and suspicious patterns',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (isDataUri(text)) {
        issues.push('data_uri');
      }

      let match: RegExpExecArray | null;
      const re = new RegExp(URL_RE.source, URL_RE.flags);
      while ((match = re.exec(text)) !== null) {
        const url = match[0];
        if (hasHomograph(url)) issues.push('homograph_attack');
        if (hasSuspiciousSubdomain(url)) issues.push('suspicious_subdomain');
        if (isIpBased(url)) issues.push('ip_based_url');
        if (hasExcessiveDepth(url)) issues.push('excessive_depth');
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'url-phishing',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
