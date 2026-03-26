import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ProfanityEnOptions {
  action: 'block' | 'warn';
  severity?: 'mild' | 'moderate' | 'severe';
  detectObfuscation?: boolean;
}

const SEVERE: string[] = [
  'fuck', 'shit', 'cunt', 'nigger', 'faggot', 'retard',
  'motherfucker', 'cocksucker',
];

const MODERATE: string[] = [
  'ass', 'asshole', 'bitch', 'bastard', 'dick', 'piss',
  'whore', 'slut', 'bullshit', 'crap', 'dumbass',
];

const MILD: string[] = [
  'damn', 'hell', 'crap', 'suck', 'screw', 'jerk',
  'idiot', 'stupid', 'dumb', 'fool',
];

const OBFUSCATION_PATTERNS: [RegExp, string][] = [
  [/f[*#@$!]+k/gi, 'fuck'],
  [/sh[*#@$!]+t/gi, 'shit'],
  [/b[*#@$!]+ch/gi, 'bitch'],
  [/a[*#@$!]+s/gi, 'ass'],
  [/d[*#@$!]+ck/gi, 'dick'],
  [/f\s*u\s*c\s*k/gi, 'fuck'],
  [/s\s*h\s*i\s*t/gi, 'shit'],
  [/fvck/gi, 'fuck'],
  [/sh1t/gi, 'shit'],
  [/b1tch/gi, 'bitch'],
  [/a\$\$/gi, 'ass'],
];

export function profanityEn(options: ProfanityEnOptions): Guard {
  const severity = options.severity ?? 'moderate';
  const detectObfuscation = options.detectObfuscation ?? true;

  const wordList: string[] = [...SEVERE];
  if (severity === 'moderate' || severity === 'mild') wordList.push(...MODERATE);
  if (severity === 'mild') wordList.push(...MILD);

  return {
    name: 'profanity-en',
    version: '0.1.0',
    description: 'English profanity detection with severity levels and obfuscation',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const matched: string[] = [];

      for (const word of wordList) {
        const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (re.test(lower)) matched.push(word);
      }

      if (detectObfuscation) {
        for (const [pattern, label] of OBFUSCATION_PATTERNS) {
          const re = new RegExp(pattern.source, pattern.flags);
          if (re.test(text)) matched.push(`${label} (obfuscated)`);
        }
      }

      const unique = [...new Set(matched)];
      const triggered = unique.length > 0;

      return {
        guardName: 'profanity-en',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Profanity detected: ${unique.slice(0, 3).join(', ')}${unique.length > 3 ? ' ...' : ''}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { matched: unique, severity, reason: 'Text contains profane language' }
          : undefined,
      };
    },
  };
}
