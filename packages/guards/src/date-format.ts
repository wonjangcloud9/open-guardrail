import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface DateFormatOptions {
  action: 'block' | 'warn';
  allowedFormats?: string[];
  detectFuture?: boolean;
  detectPast?: boolean;
  maxYearsAgo?: number;
  maxYearsAhead?: number;
}

const DATE_PATTERNS: [RegExp, string][] = [
  [/\b\d{4}-\d{2}-\d{2}\b/g, 'ISO-8601'],
  [/\b\d{2}\/\d{2}\/\d{4}\b/g, 'MM/DD/YYYY'],
  [/\b\d{2}-\d{2}-\d{4}\b/g, 'DD-MM-YYYY'],
  [/\b\d{2}\.\d{2}\.\d{4}\b/g, 'DD.MM.YYYY'],
  [/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/gi, 'Mon DD, YYYY'],
  [/\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi, 'DD Month YYYY'],
  [/\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g, 'YYYY년 MM월 DD일'],
  [/\d{4}年\d{1,2}月\d{1,2}日/g, 'YYYY年MM月DD日'],
];

interface DateMatch {
  value: string;
  format: string;
  start: number;
  end: number;
}

function detect(text: string): DateMatch[] {
  const matches: DateMatch[] = [];

  for (const [pattern, format] of DATE_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({
        value: m[0],
        format,
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }

  return matches;
}

export function dateFormat(options: DateFormatOptions): Guard {
  return {
    name: 'date-format',
    version: '0.1.0',
    description: 'Detect and validate date formats in text',
    category: 'format',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text);

      let violations: string[] = [];

      if (options.allowedFormats && matches.length > 0) {
        const disallowed = matches.filter(
          (m) => !options.allowedFormats!.includes(m.format),
        );
        violations = disallowed.map(
          (m) => `"${m.value}" is ${m.format}, expected: ${options.allowedFormats!.join(' or ')}`,
        );
      }

      const triggered = violations.length > 0;

      return {
        guardName: 'date-format',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Date format violation: ${violations[0]}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: {
          datesFound: matches.map((m) => ({ value: m.value, format: m.format })),
          violations: triggered ? violations : undefined,
          reason: triggered
            ? 'One or more dates use a format not in the allowed list'
            : undefined,
        },
      };
    },
  };
}
