import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface AccessibilityCheckOptions { action: 'block' | 'warn'; maxReadingLevel?: number; maxJargonRatio?: number; }
const JARGON_WORDS = new Set(['aforementioned', 'henceforth', 'notwithstanding', 'heretofore', 'pursuant', 'whereby', 'therein', 'thereof', 'inasmuch', 'vis-a-vis', 'paradigm', 'synergy', 'leverage', 'actionable', 'granular', 'holistic', 'ecosystem', 'disruptive', 'scalable', 'deliverable', 'bandwidth']);
function avgWordLength(text: string): number {
  const words = text.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  if (words.length === 0) return 0;
  return words.reduce((sum, w) => sum + w.length, 0) / words.length;
}
export function accessibilityCheck(options: AccessibilityCheckOptions): Guard {
  const maxReading = options.maxReadingLevel ?? 12;
  const maxJargon = options.maxJargonRatio ?? 0.05;
  return { name: 'accessibility-check', version: '0.1.0', description: 'Check response accessibility (reading level, jargon)', category: 'content', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const violations: string[] = [];
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const jargonCount = words.filter(w => JARGON_WORDS.has(w)).length;
      const jargonRatio = words.length > 0 ? jargonCount / words.length : 0;
      if (jargonRatio > maxJargon) violations.push(`Jargon ratio ${Math.round(jargonRatio * 100)}% (max: ${Math.round(maxJargon * 100)}%)`);
      const avgLen = avgWordLength(text);
      if (avgLen > maxReading * 0.5) violations.push(`Avg word length ${avgLen.toFixed(1)} chars (complex vocabulary)`);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgSentLen = words.length / (sentences.length || 1);
      if (avgSentLen > 25) violations.push(`Avg sentence length ${Math.round(avgSentLen)} words (max ~25)`);
      const triggered = violations.length > 0;
      return { guardName: 'accessibility-check', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? violations[0] : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { jargonRatio: Math.round(jargonRatio * 100) / 100, avgWordLength: Math.round(avgLen * 10) / 10, avgSentenceLength: Math.round(avgSentLen), violations: triggered ? violations : undefined },
      };
    },
  };
}
