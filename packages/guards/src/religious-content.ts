import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface ReligiousContentOptions { action: 'block' | 'warn'; }
const RELIGIOUS_PATTERNS: RegExp[] = [
  /\b(?:god|allah|jesus|buddha|krishna|yahweh)\s+(?:says?|commands?|wants?|demands?|requires?)\b/gi,
  /\b(?:the\s+(?:bible|quran|torah|vedas?|gita))\s+(?:says?|teaches?|proves?|states?)\b/gi,
  /\b(?:sinful?|haram|blasphemy|heresy|infidel|heathen|apostate)\b/gi,
  /\b(?:pray\s+(?:to|for)|accept\s+(?:jesus|christ|islam)|convert\s+to)\b/gi,
  /\b(?:religious\s+(?:war|persecution|extremism)|holy\s+war|jihad|crusade)\b/gi,
  /\b(?:one\s+true\s+(?:god|religion|faith)|only\s+(?:god|religion|path)\s+is)\b/gi,
];
export function religiousContent(options: ReligiousContentOptions): Guard {
  return { name: 'religious-content', version: '0.1.0', description: 'Detect sensitive religious content and proselytizing', category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of RELIGIOUS_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'religious-content', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Religious content: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains sensitive religious content or proselytizing' } : undefined,
      };
    },
  };
}
