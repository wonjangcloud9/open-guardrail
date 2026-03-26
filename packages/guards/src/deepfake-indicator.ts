import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface DeepfakeIndicatorOptions { action: 'block' | 'warn'; }
const DEEPFAKE_PATTERNS: RegExp[] = [
  /\b(?:deepfake|deep\s*fake|face\s*swap|voice\s*clone|ai[- ]generated\s+(?:video|image|photo|voice|audio))\b/gi,
  /\b(?:create|generate|make)\s+(?:a\s+)?(?:fake|synthetic|ai)\s+(?:video|image|photo|voice|audio)\s+(?:of|featuring|with)\b/gi,
  /\b(?:impersonate|imitate)\s+(?:someone|a\s+person|celebrity|politician)\b/gi,
  /\b(?:realistic\s+fake|fake\s+(?:news|media|video|photo))\b/gi,
  /\b(?:manipulate|alter|doctor)\s+(?:a\s+)?(?:photo|image|video|recording)\b/gi,
  /\b(?:put\s+(?:my|someone'?s?)\s+face\s+on)\b/gi,
];
export function deepfakeIndicator(options: DeepfakeIndicatorOptions): Guard {
  return { name: 'deepfake-indicator', version: '0.1.0', description: 'Detect requests for or references to deepfake/synthetic media', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of DEEPFAKE_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'deepfake-indicator', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Deepfake/synthetic media reference: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text references or requests creation of deepfake/synthetic media' } : undefined,
      };
    },
  };
}
