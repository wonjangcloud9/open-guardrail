import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DateAccuracyOptions {
  action: 'block' | 'warn';
}

const DATE_PATTERNS = [
  { re: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, order: 'MDY' },
  { re: /\b(\d{4})-(\d{2})-(\d{2})\b/g, order: 'YMD' },
  { re: /\b(\d{1,2})-(\d{1,2})-(\d{4})\b/g, order: 'DMY' },
  { re: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi, order: 'NAMED' },
];

const MONTH_DAYS = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isImpossible(m: number, d: number, y: number): boolean {
  if (m < 1 || m > 12) return true;
  if (d < 1 || d > MONTH_DAYS[m]) return true;
  if (m === 2 && d === 29) {
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (!leap) return true;
  }
  return false;
}

const MONTH_MAP: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

export function dateAccuracy(options: DateAccuracyOptions): Guard {
  return {
    name: 'date-accuracy',
    version: '0.1.0',
    description: 'Validates dates in output',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const formats = new Set<string>();

      for (const { re, order } of DATE_PATTERNS) {
        re.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = re.exec(text)) !== null) {
          let m: number, d: number, y: number;
          if (order === 'MDY') {
            [m, d, y] = [+match[1], +match[2], +match[3]];
            formats.add('MDY');
          } else if (order === 'YMD') {
            [y, m, d] = [+match[1], +match[2], +match[3]];
            formats.add('YMD');
          } else if (order === 'DMY') {
            [d, m, y] = [+match[1], +match[2], +match[3]];
            formats.add('DMY');
          } else {
            const name = match[0].split(/\s/)[0].toLowerCase();
            m = MONTH_MAP[name] ?? 0;
            d = +match[1];
            y = +match[2];
            formats.add('NAMED');
          }
          if (isImpossible(m, d, y)) issues.push(`impossible_date:${match[0]}`);
          if (y > 2030) issues.push(`far_future:${match[0]}`);
        }
      }

      if (formats.size > 2) issues.push('inconsistent_formats');

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'date-accuracy',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
