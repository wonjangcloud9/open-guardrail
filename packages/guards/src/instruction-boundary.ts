import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface InstructionBoundaryOptions {
  action: 'block' | 'warn';
  /** System instructions that should not leak */
  systemInstructions?: string[];
  /** Detect attempts to extract system prompt */
  detectExtraction?: boolean;
}

const EXTRACTION_PATTERNS = [
  /\b(?:what|show|reveal|display|print|output|repeat|echo)\s+(?:your|the)\s+(?:system|initial|original)\s+(?:prompt|instruction|message)/i,
  /\b(?:tell|give|share)\s+me\s+(?:your|the)\s+(?:system|initial|original)\s+(?:prompt|instruction)/i,
  /\bsystem\s*prompt\s*[:=]/i,
  /\b(?:above|previous|prior|initial)\s+(?:instructions?|prompt|context)\b/i,
  /\brepeat\s+(?:everything|all|the\s+text)\s+(?:above|before|from\s+the\s+beginning)/i,
  /\bwhat\s+(?:were|are)\s+you\s+(?:told|instructed|programmed)/i,
];

export function instructionBoundary(options: InstructionBoundaryOptions): Guard {
  const detectExtraction = options.detectExtraction ?? true;
  const systemInstructions = (options.systemInstructions ?? []).map((s) => s.toLowerCase());

  return {
    name: 'instruction-boundary',
    version: '0.1.0',
    description: 'Prevents system instruction leakage and extraction attempts',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      if (detectExtraction) {
        for (const pat of EXTRACTION_PATTERNS) {
          const m = text.match(pat);
          if (m) {
            violations.push(`Extraction attempt: ${m[0]}`);
          }
        }
      }

      if (systemInstructions.length > 0) {
        const lower = text.toLowerCase();
        for (const instr of systemInstructions) {
          if (lower.includes(instr)) {
            violations.push('System instruction content detected in text');
            break;
          }
        }
      }

      const triggered = violations.length > 0;
      return {
        guardName: 'instruction-boundary',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations } : undefined,
      };
    },
  };
}
