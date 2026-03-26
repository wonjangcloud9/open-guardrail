import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface UnicodeConfusableOptions { action: 'block' | 'warn'; }

const CONFUSABLE_MAP: Record<string, string> = {
  '\u0430': 'a', '\u0435': 'e', '\u043E': 'o', '\u0440': 'p', '\u0441': 'c',
  '\u0443': 'y', '\u0445': 'x', '\u0456': 'i', '\u0455': 's', '\u0458': 'j',
  '\u04BB': 'h', '\u0501': 'd', '\u051B': 'q',
  '\u0261': 'g', '\u026F': 'm', '\u0270': 'm', '\u0280': 'r',
  '\u1D00': 'a', '\u1D04': 'c', '\u1D05': 'd', '\u1D07': 'e',
  '\uFF41': 'a', '\uFF42': 'b', '\uFF43': 'c', '\uFF44': 'd', '\uFF45': 'e',
  '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2013': '-', '\u2014': '-',
  '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"',
};

function findConfusables(text: string): { char: string; looks_like: string; position: number }[] {
  const found: { char: string; looks_like: string; position: number }[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const mapped = CONFUSABLE_MAP[ch];
    if (mapped) found.push({ char: ch, looks_like: mapped, position: i });
  }
  return found;
}

export function unicodeConfusable(options: UnicodeConfusableOptions): Guard {
  return { name: 'unicode-confusable', version: '0.1.0', description: 'Detect homoglyph/confusable unicode attacks', category: 'security', supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const confusables = findConfusables(text);
      const triggered = confusables.length > 0;
      return { guardName: 'unicode-confusable', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `${confusables.length} confusable character(s) found (homoglyph attack)` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { confusables: confusables.slice(0, 10), reason: 'Text contains visually similar unicode characters that may be used to bypass filters' } : undefined,
      };
    },
  };
}
