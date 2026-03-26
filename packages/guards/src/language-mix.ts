import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface LanguageMixOptions {
  action: 'block' | 'warn';
  maxLanguages?: number;
}

const SCRIPTS: Record<string, [number, number][]> = {
  latin: [[0x0041, 0x024F]],
  hangul: [[0xAC00, 0xD7AF], [0x1100, 0x11FF], [0x3130, 0x318F]],
  hiragana: [[0x3040, 0x309F]],
  katakana: [[0x30A0, 0x30FF]],
  cjk: [[0x4E00, 0x9FFF]],
  arabic: [[0x0600, 0x06FF]],
  devanagari: [[0x0900, 0x097F]],
  cyrillic: [[0x0400, 0x04FF]],
  thai: [[0x0E00, 0x0E7F]],
};

function detectScripts(text: string): string[] {
  const found = new Set<string>();
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    for (const [script, ranges] of Object.entries(SCRIPTS)) {
      for (const [lo, hi] of ranges) {
        if (code >= lo && code <= hi) { found.add(script); break; }
      }
    }
  }
  return [...found];
}

export function languageMix(options: LanguageMixOptions): Guard {
  const maxLangs = options.maxLanguages ?? 1;

  return {
    name: 'language-mix',
    version: '0.1.0',
    description: 'Detect mixed-language/script content',
    category: 'locale',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const scripts = detectScripts(text);
      const triggered = scripts.length > maxLangs;

      return {
        guardName: 'language-mix',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `${scripts.length} scripts detected (max: ${maxLangs}): ${scripts.join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { scripts, count: scripts.length, reason: triggered ? 'Text mixes multiple writing systems' : undefined },
      };
    },
  };
}
