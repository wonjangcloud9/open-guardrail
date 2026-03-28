import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ResponseStructureOptions {
  action: 'block' | 'warn';
}

function checkBalanced(text: string): string[] {
  const issues: string[] = [];

  const stack: string[] = [];
  const pairs: Record<string, string> = { '{': '}', '[': ']', '(': ')' };
  const closers = new Set(Object.values(pairs));
  for (const ch of text) {
    if (pairs[ch]) stack.push(pairs[ch]);
    else if (closers.has(ch)) {
      if (stack.length === 0 || stack.pop() !== ch) {
        issues.push('unbalanced_brackets');
        break;
      }
    }
  }
  if (stack.length > 0 && !issues.includes('unbalanced_brackets')) {
    issues.push('unbalanced_brackets');
  }

  const headings = text.match(/^#{1,6}\s/gm);
  if (headings && headings.length >= 2) {
    let prevLevel = headings[0].trim().length;
    for (let i = 1; i < headings.length; i++) {
      const level = headings[i].trim().length;
      if (level > prevLevel + 1) {
        issues.push('heading_hierarchy_skip');
        break;
      }
      prevLevel = level;
    }
  }

  const codeBlocks = (text.match(/```/g) || []).length;
  if (codeBlocks % 2 !== 0) {
    issues.push('unclosed_code_block');
  }

  const xmlOpen = text.match(/<([a-zA-Z][\w-]*)[^>]*>(?!.*<\/\1>)/g);
  if (xmlOpen && xmlOpen.length > 0) {
    issues.push('unclosed_xml_tag');
  }

  return issues;
}

export function responseStructure(options: ResponseStructureOptions): Guard {
  return {
    name: 'response-structure',
    version: '0.1.0',
    description: 'Validates response structure for balanced brackets and formatting',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues = checkBalanced(text);

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'response-structure',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
