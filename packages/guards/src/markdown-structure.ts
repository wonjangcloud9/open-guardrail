import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MarkdownStructureOptions {
  action: 'block' | 'warn';
  requireHeading?: boolean;
  requireList?: boolean;
  requireCodeBlock?: boolean;
  maxHeadingLevel?: number;
  minSections?: number;
}

export function markdownStructure(options: MarkdownStructureOptions): Guard {
  return {
    name: 'markdown-structure', version: '0.1.0',
    description: 'Validate markdown structure (headings, lists, code blocks)',
    category: 'format', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      const headings = text.match(/^#{1,6}\s.+$/gm) ?? [];
      const lists = text.match(/^[-*+]\s.+$|^\d+\.\s.+$/gm) ?? [];
      const codeBlocks = text.match(/```[\s\S]*?```/g) ?? [];

      if (options.requireHeading && headings.length === 0) violations.push('Missing heading');
      if (options.requireList && lists.length === 0) violations.push('Missing list');
      if (options.requireCodeBlock && codeBlocks.length === 0) violations.push('Missing code block');
      if (options.maxHeadingLevel) {
        for (const h of headings) {
          const level = h.match(/^(#+)/)?.[1].length ?? 0;
          if (level > options.maxHeadingLevel) violations.push(`Heading level ${level} exceeds max ${options.maxHeadingLevel}`);
        }
      }
      if (options.minSections !== undefined && headings.length < options.minSections) {
        violations.push(`${headings.length} section(s), minimum ${options.minSections}`);
      }

      const triggered = violations.length > 0;
      return {
        guardName: 'markdown-structure', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? violations.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { headingCount: headings.length, listCount: lists.length, codeBlockCount: codeBlocks.length, violations: triggered ? violations : undefined },
      };
    },
  };
}
