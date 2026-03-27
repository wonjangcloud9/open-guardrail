import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface HipaaDetectOptions {
  action: 'block' | 'warn' | 'mask';
}

const PHI_PATTERNS: { type: string; pattern: RegExp; mask: string }[] = [
  { type: 'medical-record', pattern: /\b(?:MRN|medical\s+record)\s*[#:]?\s*\d{6,}/i, mask: '[MRN]' },
  { type: 'diagnosis', pattern: /\b(?:diagnos(?:is|ed)|ICD-?\d{1,2})\s*[:\-]?\s*[\w.\-]+/i, mask: '[DIAGNOSIS]' },
  { type: 'medication', pattern: /\b(?:prescri(?:bed|ption)|medication|dosage)\s*[:\-]?\s*[\w\s]+\d+\s*(?:mg|ml|mcg)/i, mask: '[MEDICATION]' },
  { type: 'treatment', pattern: /\b(?:treatment|procedure|surgery)\s*[:\-]?\s*[A-Za-z\s]{3,30}(?:on|at|in)\b/i, mask: '[TREATMENT]' },
  { type: 'health-plan', pattern: /\b(?:health\s+(?:plan|insurance)|policy)\s*(?:#|number|id)\s*[:\-]?\s*\w{6,}/i, mask: '[HEALTH-PLAN]' },
  { type: 'lab-result', pattern: /\b(?:lab|test)\s+(?:result|value)\s*[:\-]?\s*[\d.]+\s*(?:mg|mmol|g|%)/i, mask: '[LAB-RESULT]' },
];

export function hipaaDetect(options: HipaaDetectOptions): Guard {
  return {
    name: 'hipaa-detect',
    version: '0.1.0',
    description: 'Detects HIPAA-protected health information (PHI)',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches: { type: string; value: string; start: number; end: number; mask: string }[] = [];

      for (const { type, pattern, mask } of PHI_PATTERNS) {
        const m = text.match(pattern);
        if (m && m.index !== undefined) {
          matches.push({ type, value: m[0], start: m.index, end: m.index + m[0].length, mask });
        }
      }

      if (matches.length === 0) {
        return { guardName: 'hipaa-detect', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }

      if (options.action === 'mask') {
        let masked = text;
        const sorted = [...matches].sort((a, b) => b.start - a.start);
        for (const m of sorted) {
          masked = masked.slice(0, m.start) + m.mask + masked.slice(m.end);
        }
        return {
          guardName: 'hipaa-detect', passed: true, action: 'override', overrideText: masked,
          latencyMs: Math.round(performance.now() - start),
          details: { detected: matches.map((m) => ({ type: m.type })) },
        };
      }

      return {
        guardName: 'hipaa-detect', passed: false, action: options.action,
        latencyMs: Math.round(performance.now() - start),
        details: { detected: matches.map((m) => ({ type: m.type, value: m.value })), count: matches.length },
      };
    },
  };
}
