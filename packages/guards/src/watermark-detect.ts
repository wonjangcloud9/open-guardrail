import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface WatermarkDetectOptions {
  action: 'block' | 'warn';
  sensitivity?: 'low' | 'medium' | 'high';
}

const AI_DISCLOSURE_PATTERNS = [
  /as an AI( language model)?/i,
  /I('m| am) (just )?an? (AI|artificial intelligence|language model)/i,
  /I (cannot|can't) and (will not|won't)/i,
  /my (training|knowledge) (data |cutoff )?/i,
  /I don't have (personal )?(opinions|feelings|experiences)/i,
  /I('m| am) not able to (browse|access|search)/i,
];

const HEDGING_PATTERNS = [
  /it('s| is) (important|worth|crucial) to (note|mention|emphasize|remember)/i,
  /please (be aware|note|remember|keep in mind)/i,
  /for (educational|informational) purposes only/i,
  /I (must|should|need to) emphasize/i,
  /results may vary/i,
  /consult(ing)? (a |with )?(professional|expert|specialist)/i,
];

const FORMULAIC_PATTERNS = [
  /here are (the |some )?(key |main )?(points|steps|things|ways|tips|reasons)/i,
  /in (summary|conclusion|closing)/i,
  /let me (break|help|explain|clarify|elaborate)/i,
  /I hope (this|that) (helps|answers|clarifies)/i,
];

function detectRepetitiveStructure(text: string): boolean {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length < 4) return false;

  const starters = sentences.map((s) => {
    const words = s.trim().split(/\s+/).slice(0, 3).join(' ').toLowerCase();
    return words;
  });

  const counts = new Map<string, number>();
  for (const starter of starters) {
    counts.set(starter, (counts.get(starter) ?? 0) + 1);
  }

  for (const count of counts.values()) {
    if (count >= 3) return true;
  }
  return false;
}

export function watermarkDetect(options: WatermarkDetectOptions): Guard {
  const sensitivity = options.sensitivity ?? 'medium';
  const thresholds = { low: 3, medium: 2, high: 1 };
  const threshold = thresholds[sensitivity];

  return {
    name: 'watermark-detect',
    version: '0.8.0',
    description: 'Detects AI-generated text markers: disclosure phrases, hedging language, formulaic patterns',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const markers: string[] = [];

      for (const pattern of AI_DISCLOSURE_PATTERNS) {
        if (new RegExp(pattern.source, pattern.flags).test(text)) {
          markers.push('ai-disclosure');
          break;
        }
      }

      let hedgingCount = 0;
      for (const pattern of HEDGING_PATTERNS) {
        if (new RegExp(pattern.source, pattern.flags).test(text)) hedgingCount++;
      }
      if (hedgingCount >= 2) markers.push('hedging-cluster');

      for (const pattern of FORMULAIC_PATTERNS) {
        if (new RegExp(pattern.source, pattern.flags).test(text)) {
          markers.push('formulaic');
          break;
        }
      }

      if (detectRepetitiveStructure(text)) {
        markers.push('repetitive-structure');
      }

      const triggered = markers.length >= threshold;
      const score = triggered ? Math.min(markers.length / 4, 1.0) : 0;

      return {
        guardName: 'watermark-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { markers, matchCount: markers.length } : undefined,
      };
    },
  };
}
