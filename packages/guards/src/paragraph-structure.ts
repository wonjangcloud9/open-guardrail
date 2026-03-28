import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ParagraphStructureOptions {
  action: 'block' | 'warn';
  maxWords?: number;
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export function paragraphStructure(options: ParagraphStructureOptions): Guard {
  const maxWords = options.maxWords ?? 200;

  return {
    name: 'paragraph-structure',
    version: '0.1.0',
    description: 'Validates paragraph structure',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i].trim();
        if (/^#{1,6}\s/.test(p) || /^[-*+]\s/.test(p) || /^\|/.test(p)) continue;

        const wc = countWords(p);
        if (wc > maxWords) {
          issues.push(`Paragraph ${i + 1} too long (${wc} words, max ${maxWords})`);
        }

        const sentences = p.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
        if (sentences.length === 1 && wc > 10) {
          issues.push(`Paragraph ${i + 1} has only one sentence`);
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'paragraph-structure',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, paragraphCount: paragraphs.length } : undefined,
      };
    },
  };
}
