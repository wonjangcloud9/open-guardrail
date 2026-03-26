import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface SelfHarmDetectOptions {
  action: 'block' | 'warn';
}

const SELF_HARM_PATTERNS: RegExp[] = [
  /\b(?:kill|hurt|harm)\s+(?:myself|yourself|themselves)\b/gi,
  /\bsuicid(?:e|al)\b/gi,
  /\bself[- ]harm\b/gi,
  /\bwant(?:s|ing)?\s+to\s+die\b/gi,
  /\bend(?:ing)?\s+(?:my|their|your)\s+life\b/gi,
  /\b(?:cut|cutting)\s+(?:myself|yourself|themselves|my wrist)\b/gi,
  /\bdon'?t\s+want\s+to\s+(?:live|be alive|exist)\b/gi,
  /\bbetter\s+off\s+dead\b/gi,
  /\bno\s+(?:reason|point)\s+(?:to|in)\s+(?:live|living|go on)\b/gi,
  /\boverdos(?:e|ing)\b/gi,
  /\bjump(?:ing)?\s+(?:off|from)\s+(?:a|the)\s+(?:bridge|building|roof)\b/gi,
];

const CRISIS_RESOURCES = {
  US: '988 Suicide & Crisis Lifeline: call/text 988',
  KR: '자살예방상담전화: 1393',
  JP: 'いのちの電話: 0570-783-556',
  UK: 'Samaritans: 116 123',
  international: 'Crisis Text Line: text HOME to 741741',
};

export function selfHarmDetect(options: SelfHarmDetectOptions): Guard {
  return {
    name: 'self-harm-detect',
    version: '0.1.0',
    description: 'Detect self-harm and suicidal content with crisis resources',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of SELF_HARM_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0]);
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'self-harm-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? 'Self-harm or suicidal content detected. Please seek help.'
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              matched,
              crisisResources: CRISIS_RESOURCES,
              reason: 'Content contains self-harm indicators. Crisis resources are provided.',
            }
          : undefined,
      };
    },
  };
}
