import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AccessibilityOutputOptions { action: 'block' | 'warn'; maxReadingLevel?: number; }

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const vowelGroups = w.match(/[aeiouy]{1,2}/g);
  return vowelGroups ? Math.max(vowelGroups.length, 1) : 1;
}

function estimateGradeLevel(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  const words = text.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  if (words.length === 0) return 0;
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;
  const grade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

function checkImageAltText(text: string): string[] {
  const issues: string[] = [];
  const imgRegex = /!\[([^\]]*)\]\([^)]+\)/g;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(text)) !== null) {
    const alt = m[1].trim();
    if (!alt) { issues.push('missing_alt_text'); }
    else if (alt.length < 5 || /^(?:image|photo|picture|img|screenshot)$/i.test(alt)) { issues.push('non_descriptive_alt_text'); }
  }
  return issues;
}

function checkColorOnly(text: string): boolean {
  return /\b(?:the\s+)?(?:red|green|blue|yellow|orange|purple|pink)\s+(?:items?|buttons?|sections?|areas?|text|elements?|boxes?|markers?|indicators?)\b/i.test(text)
    && !/\b(?:labeled|marked|titled|numbered|named|with\s+(?:icon|symbol|label|text))\b/i.test(text);
}

function checkLinkText(text: string): string[] {
  const issues: string[] = [];
  const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(text)) !== null) {
    const linkText = m[1].trim().toLowerCase();
    if (/^(?:click\s+here|here|read\s+more|more|link|this)$/i.test(linkText)) { issues.push(`inaccessible_link_text: "${m[1]}"`); }
  }
  return issues;
}

function checkAbbreviations(text: string): string[] {
  const issues: string[] = [];
  const abbrRegex = /\b([A-Z]{2,6})\b/g;
  const defined: Record<string, boolean> = {};
  const parenDef = /\(([A-Z]{2,6})\)/g;
  let m: RegExpExecArray | null;
  while ((m = parenDef.exec(text)) !== null) defined[m[1]] = true;
  const colonDef = /([A-Z]{2,6})\s*[-–:]\s*[A-Z][a-z]/g;
  while ((m = colonDef.exec(text)) !== null) defined[m[1]] = true;
  const common: Record<string, boolean> = { US: true, UK: true, EU: true, AI: true, IT: true, OK: true, AM: true, PM: true, ID: true, TV: true, PC: true, OS: true, VS: true, OR: true, AN: true, IF: true, IS: true, IN: true, ON: true, TO: true, DO: true, GO: true, NO: true, SO: true, UP: true, AT: true, BY: true, AS: true, OF: true };
  while ((m = abbrRegex.exec(text)) !== null) {
    if (!defined[m[1]] && !common[m[1]]) { issues.push(`undefined_abbreviation: ${m[1]}`); defined[m[1]] = true; }
  }
  return issues;
}

function checkTableHeaders(text: string): boolean {
  const tableRegex = /\|[^\n]+\|\n/;
  const headerSep = /\|[\s:]*-+[\s:]*\|/;
  if (tableRegex.test(text) && !headerSep.test(text)) return true;
  return false;
}

export function accessibilityOutput(options: AccessibilityOutputOptions): Guard {
  const maxGrade = options.maxReadingLevel ?? 12;
  return { name: 'accessibility-output', version: '0.1.0', description: 'Verify output meets accessibility standards (WCAG 2.2 inspired)', category: 'content', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const issues: string[] = [];
      const grade = estimateGradeLevel(text);
      if (grade > maxGrade) issues.push(`reading_level_too_high: grade ${grade} > ${maxGrade}`);
      issues.push(...checkImageAltText(text));
      if (checkColorOnly(text)) issues.push('color_only_information');
      issues.push(...checkLinkText(text));
      issues.push(...checkAbbreviations(text));
      if (checkTableHeaders(text)) issues.push('table_missing_header_row');
      const triggered = issues.length > 0;
      return { guardName: 'accessibility-output', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Accessibility issues found: ${issues.length}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, gradeLevel: grade, maxReadingLevel: maxGrade } : undefined,
      };
    },
  };
}
