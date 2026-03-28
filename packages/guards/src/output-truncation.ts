import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface OutputTruncationOptions {
  action: 'block' | 'warn';
}

function endsMidSentence(text: string): boolean {
  const trimmed = text.trimEnd();
  if (trimmed.length === 0) return false;
  const last = trimmed[trimmed.length - 1];
  return /[a-zA-Z,;:\-]/.test(last);
}

function hasUnclosedBrackets(text: string): boolean {
  const opens = { '(': ')', '[': ']', '{': '}' };
  const stack: string[] = [];
  for (const ch of text) {
    if (ch in opens) stack.push(opens[ch as keyof typeof opens]);
    if ([')', ']', '}'].includes(ch)) {
      if (stack.length > 0 && stack[stack.length - 1] === ch) stack.pop();
    }
  }
  return stack.length > 0;
}

function hasUnclosedQuotes(text: string): boolean {
  let single = 0;
  let double = 0;
  for (const ch of text) {
    if (ch === "'") single++;
    if (ch === '"') double++;
  }
  return single % 2 !== 0 || double % 2 !== 0;
}

function hasIncompleteCodeBlock(text: string): boolean {
  const opens = (text.match(/```/g) || []).length;
  return opens % 2 !== 0;
}

function endsWithEllipsis(text: string): boolean {
  const trimmed = text.trimEnd();
  return trimmed.endsWith('...') || trimmed.endsWith('\u2026');
}

function hasIncompleteList(text: string): boolean {
  const lines = text.trimEnd().split('\n');
  const last = lines[lines.length - 1]?.trim() ?? '';
  return /^\d+\.\s*$/.test(last) || /^[-*]\s*$/.test(last);
}

export function outputTruncation(options: OutputTruncationOptions): Guard {
  return {
    name: 'output-truncation',
    version: '0.1.0',
    description: 'Detects if output was likely truncated or incomplete',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const signals: string[] = [];

      if (endsMidSentence(text)) signals.push('ends-mid-sentence');
      if (hasUnclosedBrackets(text)) signals.push('unclosed-brackets');
      if (hasUnclosedQuotes(text)) signals.push('unclosed-quotes');
      if (hasIncompleteCodeBlock(text)) signals.push('incomplete-code-block');
      if (endsWithEllipsis(text)) signals.push('ends-with-ellipsis');
      if (hasIncompleteList(text)) signals.push('incomplete-list');

      const triggered = signals.length > 0;
      const score = triggered ? Math.min(signals.length / 3, 1.0) : 0;

      return {
        guardName: 'output-truncation',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { signals } : undefined,
      };
    },
  };
}
