import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type Tone = 'formal' | 'casual' | 'professional' | 'friendly';

interface ToneCheckOptions {
  action: 'block' | 'warn';
  expected: Tone;
}

const FORMAL_INDICATORS = [
  'please', 'kindly', 'regarding', 'therefore', 'furthermore',
  'consequently', 'accordingly', 'nevertheless', 'hereby',
  'sincerely', 'respectfully', 'would you', 'I would like',
];

const CASUAL_INDICATORS = [
  'hey', 'yeah', 'nah', 'gonna', 'wanna', 'gotta',
  'lol', 'omg', 'btw', 'tbh', 'imo', 'ngl',
  'dude', 'bro', 'yo', "what's up", 'cool',
  '!!', '???', 'haha', 'lmao',
];

const PROFESSIONAL_INDICATORS = [
  'I recommend', 'based on', 'analysis shows', 'data indicates',
  'in conclusion', 'to summarize', 'key takeaway', 'action item',
  'deliverable', 'stakeholder', 'optimize', 'leverage',
];

const FRIENDLY_INDICATORS = [
  'great question', 'happy to help', 'glad you asked',
  'absolutely', 'of course', "don't worry", 'no problem',
  'feel free', "let's", 'together', 'awesome',
];

const TONE_MAP: Record<Tone, string[]> = {
  formal: FORMAL_INDICATORS,
  casual: CASUAL_INDICATORS,
  professional: PROFESSIONAL_INDICATORS,
  friendly: FRIENDLY_INDICATORS,
};

function scoreTone(text: string): Record<Tone, number> {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [tone, indicators] of Object.entries(TONE_MAP)) {
    let hits = 0;
    for (const ind of indicators) {
      if (lower.includes(ind.toLowerCase())) hits++;
    }
    scores[tone] = hits;
  }
  return scores as Record<Tone, number>;
}

function detectTone(scores: Record<Tone, number>): Tone {
  let best: Tone = 'formal';
  let bestScore = 0;
  for (const [tone, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = tone as Tone;
      bestScore = score;
    }
  }
  return best;
}

export function toneCheck(options: ToneCheckOptions): Guard {
  return {
    name: 'tone-check',
    version: '0.1.0',
    description: 'Validate response tone (formal/casual/professional/friendly)',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const scores = scoreTone(text);
      const detected = detectTone(scores);
      const triggered = detected !== options.expected && scores[options.expected] === 0;

      return {
        guardName: 'tone-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Tone mismatch: detected "${detected}", expected "${options.expected}"`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: {
          detectedTone: detected,
          expectedTone: options.expected,
          scores,
          reason: triggered ? 'Response tone does not match the expected communication style' : undefined,
        },
      };
    },
  };
}
