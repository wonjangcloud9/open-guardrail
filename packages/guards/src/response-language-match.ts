import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseLanguageMatchOptions {
  action: 'block' | 'warn';
  allowedLanguages?: string[];
}

type ScriptName = 'latin' | 'cjk' | 'cyrillic' | 'arabic' | 'devanagari';

function detectScript(text: string): ScriptName | 'unknown' {
  const counts: Record<ScriptName, number> = {
    latin: 0, cjk: 0, cyrillic: 0, arabic: 0, devanagari: 0,
  };
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if ((code >= 0x0041 && code <= 0x024F)) counts.latin++;
    else if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3040 && code <= 0x30FF) || (code >= 0xAC00 && code <= 0xD7AF)) counts.cjk++;
    else if (code >= 0x0400 && code <= 0x04FF) counts.cyrillic++;
    else if (code >= 0x0600 && code <= 0x06FF) counts.arabic++;
    else if (code >= 0x0900 && code <= 0x097F) counts.devanagari++;
  }
  let max: ScriptName = 'latin';
  let maxCount = 0;
  for (const [script, count] of Object.entries(counts) as [ScriptName, number][]) {
    if (count > maxCount) { max = script; maxCount = count; }
  }
  return maxCount === 0 ? 'unknown' : max;
}

export function responseLanguageMatch(options: ResponseLanguageMatchOptions): Guard {
  return {
    name: 'response-language-match',
    version: '0.1.0',
    description: 'Verifies response language script matches the input language script',
    category: 'locale',
    supportedStages: ['output'],
    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const input = (ctx as unknown as Record<string, unknown>).inputText as string | undefined;

      if (!input) {
        return {
          guardName: 'response-language-match',
          passed: true,
          action: 'allow',
          score: 0,
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const inputScript = detectScript(input);
      const outputScript = detectScript(text);

      let triggered = false;
      if (options.allowedLanguages && options.allowedLanguages.length > 0) {
        triggered = outputScript !== 'unknown' && !options.allowedLanguages.includes(outputScript);
      } else {
        triggered = inputScript !== 'unknown' && outputScript !== 'unknown' && inputScript !== outputScript;
      }

      return {
        guardName: 'response-language-match',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? 1.0 : 0,
        latencyMs: Math.round(performance.now() - start),
        details: { inputScript, outputScript },
      };
    },
  };
}
