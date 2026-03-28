import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface KnowledgeBoundaryOptions {
  action: 'block' | 'warn';
}

const PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'certain_knowledge', re: /I\s+know\s+for\s+(certain|a fact|sure)\s+that/i },
  { name: 'latest_data_claim', re: /the\s+latest\s+(data|statistics|numbers|figures)\s+show/i },
  { name: 'real_time_claim', re: /(real[- ]time|live|current)\s+(data|price|stock|weather|status)\s+(shows?|is|are)/i },
  { name: 'post_cutoff_event', re: /(as\s+of|in)\s+(today|now|this\s+moment|right\s+now),?\s+(the|we|it)/i },
  { name: 'browsing_claim', re: /I\s+(just\s+)?(checked|browsed|looked\s+up|searched|visited)/i },
  { name: 'confirmed_fact', re: /I\s+can\s+confirm\s+that\s+this\s+is\s+(true|accurate|correct)/i },
  { name: 'definitive_future', re: /will\s+definitely\s+(happen|occur|take\s+place)/i },
  { name: 'absolute_claim', re: /there\s+is\s+no\s+doubt\s+that/i },
  { name: 'current_price', re: /the\s+(current|today'?s)\s+(price|rate|value)\s+(of|for|is)/i },
  { name: 'just_announced', re: /(just|recently)\s+(announced|released|published)\s+(today|this)/i },
];

export function knowledgeBoundary(options: KnowledgeBoundaryOptions): Guard {
  return {
    name: 'knowledge-boundary',
    version: '0.1.0',
    description: 'Detects when AI claims knowledge beyond its training boundaries',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const p of PATTERNS) {
        if (p.re.test(text)) {
          matched.push(p.name);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'knowledge-boundary',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
