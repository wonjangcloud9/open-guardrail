import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ConsentDetectOptions { action: 'block' | 'warn'; requireConsent?: boolean; }

const CONSENT_PATTERNS: RegExp[] = [
  /\b(?:I\s+(?:consent|agree|accept|authorize)|by\s+(?:clicking|proceeding|continuing))\b/gi,
  /\b(?:opt[- ]?in|opt[- ]?out|unsubscribe|withdraw\s+consent)\b/gi,
  /\b(?:consent\s+(?:form|agreement|notice|policy))\b/gi,
  /\b(?:data\s+(?:processing|collection)\s+(?:consent|agreement))\b/gi,
  /\b(?:right\s+to\s+(?:be\s+forgotten|erasure|deletion|withdraw))\b/gi,
];

const CONSENT_REQUIRED_PATTERNS: RegExp[] = [
  /\b(?:collect|process|store|share|transfer)\s+(?:your|personal|user)\s+(?:data|information)\b/gi,
  /\b(?:tracking|analytics|cookies?|fingerprint)\b/gi,
  /\b(?:marketing\s+(?:emails?|communications?))\b/gi,
];

export function consentDetect(options: ConsentDetectOptions): Guard {
  const requireConsent = options.requireConsent ?? false;
  return { name: 'consent-detect', version: '0.1.0', description: 'Detect consent-related language (GDPR compliance)', category: 'locale', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const consentFound: string[] = []; const consentNeeded: string[] = [];
      for (const p of CONSENT_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) consentFound.push(m[0]); }
      for (const p of CONSENT_REQUIRED_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) consentNeeded.push(m[0]); }
      let triggered = false;
      if (requireConsent && consentNeeded.length > 0 && consentFound.length === 0) triggered = true;
      if (!requireConsent && consentFound.length > 0) triggered = true;
      return { guardName: 'consent-detect', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? (requireConsent ? `Consent needed for: ${consentNeeded.join(', ')}` : `Consent language found: ${consentFound[0]}`) : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { consentFound, consentNeeded, reason: triggered ? 'Text involves data processing that requires explicit consent' : undefined },
      };
    },
  };
}
