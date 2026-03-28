import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ComplianceTimestampOptions {
  action: 'block' | 'warn';
  requireTimestamp?: boolean;
  dateFormat?: string;
}

const ISO_DATE = /\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2})?/;
const US_DATE = /\d{2}\/\d{2}\/\d{4}/;
const EU_DATE = /\d{2}\.\d{2}\.\d{4}/;
const UNIX_TS = /\b\d{10,13}\b/;

function extractDates(text: string): { format: string; value: string }[] {
  const found: { format: string; value: string }[] = [];
  let m: RegExpExecArray | null;
  const iso = new RegExp(ISO_DATE.source, 'g');
  while ((m = iso.exec(text))) found.push({ format: 'iso', value: m[0] });
  const us = new RegExp(US_DATE.source, 'g');
  while ((m = us.exec(text))) found.push({ format: 'us', value: m[0] });
  const eu = new RegExp(EU_DATE.source, 'g');
  while ((m = eu.exec(text))) found.push({ format: 'eu', value: m[0] });
  const unix = new RegExp(UNIX_TS.source, 'g');
  while ((m = unix.exec(text))) found.push({ format: 'unix', value: m[0] });
  return found;
}

function isFutureDate(value: string, format: string): boolean {
  const now = Date.now();
  if (format === 'unix') {
    const ts = Number(value);
    const ms = ts < 1e12 ? ts * 1000 : ts;
    return ms > now + 86_400_000;
  }
  if (format === 'iso') {
    const d = new Date(value);
    return d.getTime() > now + 86_400_000;
  }
  return false;
}

export function complianceTimestamp(options: ComplianceTimestampOptions): Guard {
  const requireTimestamp = options.requireTimestamp ?? false;

  return {
    name: 'compliance-timestamp',
    version: '0.1.0',
    description: 'Ensures AI responses include required timestamps and consistent date formats',
    category: 'compliance',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const dates = extractDates(text);

      if (requireTimestamp && dates.length === 0) {
        issues.push('missing_timestamp');
      }

      if (options.dateFormat) {
        for (const d of dates) {
          if (d.format !== options.dateFormat) {
            issues.push(`inconsistent_format: expected ${options.dateFormat}, got ${d.format}`);
          }
        }
      } else if (dates.length > 1) {
        const formats = new Set(dates.map((d) => d.format));
        if (formats.size > 1) {
          issues.push('mixed_date_formats');
        }
      }

      for (const d of dates) {
        if (isFutureDate(d.value, d.format)) {
          issues.push(`future_date: ${d.value}`);
        }
      }

      const triggered = issues.length > 0;

      return {
        guardName: 'compliance-timestamp',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(issues.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, datesFound: dates.length } : undefined,
      };
    },
  };
}
