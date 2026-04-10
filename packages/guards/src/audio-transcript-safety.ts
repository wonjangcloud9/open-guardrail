import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AudioTranscriptSafetyOptions {
  action: 'block' | 'warn';
}

const MANIPULATION_PATTERNS: RegExp[] = [
  /\[redacted\]/gi,
  /\[censored\]/gi,
];

const IMPERSONATION_PATTERNS: RegExp[] = [
  /pretending\s+to\s+be/i,
  /imitating\b/i,
  /mimicking\s+the\s+voice/i,
];

const DEEPFAKE_PATTERNS: RegExp[] = [
  /synthetic\s+voice/i,
  /ai[\s-]+generated/i,
  /cloned\s+voice/i,
  /voice\s+clone/i,
];

const THREAT_PATTERNS: RegExp[] = [
  /\bi\s+will\s+(?:kill|hurt|harm|destroy)\b/i,
  /\bgoing\s+to\s+(?:kill|hurt|harm|destroy)\b/i,
  /\bthreat(?:en|ening)\b/i,
  /\bi['']ll\s+(?:kill|hurt|harm|destroy)\b/i,
];

const HARASSMENT_PATTERNS: RegExp[] = [
  /\bstalk(?:ing|er)?\b/i,
  /\bharass(?:ing|ment)?\b/i,
  /\bbully(?:ing)?\b/i,
];

export function audioTranscriptSafety(options: AudioTranscriptSafetyOptions): Guard {
  return {
    name: 'audio-transcript-safety',
    version: '0.1.0',
    description: 'Detects unsafe content in audio transcription output',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      const inaudibleCount = (text.match(/\[inaudible\]/gi) || []).length;
      if (inaudibleCount > 5) {
        issues.push(`Excessive [inaudible] markers: ${inaudibleCount}`);
      }

      for (const p of MANIPULATION_PATTERNS) {
        if (p.test(text)) issues.push('Transcription manipulation artifact detected');
      }

      for (const p of IMPERSONATION_PATTERNS) {
        if (p.test(text)) issues.push('Speaker impersonation detected');
      }

      for (const p of DEEPFAKE_PATTERNS) {
        if (p.test(text)) issues.push('Deepfake indicator detected');
      }

      const uncertainCount = (text.match(/\[(?:uncertain|low confidence)\]/gi) || []).length;
      if (uncertainCount > 5) {
        issues.push(`Low quality markers: ${uncertainCount}`);
      }

      for (const p of THREAT_PATTERNS) {
        if (p.test(text)) issues.push('Threatening language detected');
      }

      for (const p of HARASSMENT_PATTERNS) {
        if (p.test(text)) issues.push('Harassment pattern detected');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 5, 1.0) : 0;

      return {
        guardName: 'audio-transcript-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
