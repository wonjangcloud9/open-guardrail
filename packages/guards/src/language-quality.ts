import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface LanguageQualityOptions {
  action: 'block' | 'warn';
  checks?: ('capitalization' | 'punctuation' | 'spacing' | 'repeated-words')[];
}

const ALL_CHECKS = ['capitalization', 'punctuation', 'spacing', 'repeated-words'] as const;

function checkCapitalization(text: string): string[] {
  const issues: string[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  for (const s of sentences) {
    const trimmed = s.trim();
    if (trimmed.length > 0 && /^[a-z]/.test(trimmed)) {
      issues.push(`Sentence not capitalized: "${trimmed.slice(0, 30)}..."`);
    }
  }
  return issues;
}

function checkPunctuation(text: string): string[] {
  const issues: string[] = [];
  const trimmed = text.trim();
  if (trimmed.length > 20 && !/[.!?]$/.test(trimmed)) {
    issues.push('Text does not end with punctuation');
  }
  if (/[.!?]{3,}/.test(text)) issues.push('Excessive punctuation');
  if (/\s[,.]/.test(text)) issues.push('Space before punctuation');
  return issues;
}

function checkSpacing(text: string): string[] {
  const issues: string[] = [];
  if (/\s{3,}/.test(text)) issues.push('Multiple consecutive spaces');
  if (/\n{4,}/.test(text)) issues.push('Excessive blank lines');
  return issues;
}

function checkRepeatedWords(text: string): string[] {
  const issues: string[] = [];
  const re = /\b(\w{3,})\s+\1\b/gi;
  const m = re.exec(text);
  if (m) issues.push(`Repeated word: "${m[1]}"`);
  return issues;
}

export function languageQuality(options: LanguageQualityOptions): Guard {
  const checks = options.checks ?? [...ALL_CHECKS];
  return {
    name: 'language-quality', version: '0.1.0',
    description: 'Check text quality (capitalization, punctuation, spacing, repeated words)',
    category: 'content', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      if (checks.includes('capitalization')) issues.push(...checkCapitalization(text));
      if (checks.includes('punctuation')) issues.push(...checkPunctuation(text));
      if (checks.includes('spacing')) issues.push(...checkSpacing(text));
      if (checks.includes('repeated-words')) issues.push(...checkRepeatedWords(text));
      const triggered = issues.length > 0;
      return {
        guardName: 'language-quality', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? issues[0] : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, reason: 'Text has quality issues' } : undefined,
      };
    },
  };
}
