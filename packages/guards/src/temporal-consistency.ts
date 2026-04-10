import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface TemporalConsistencyOptions {
  action: 'block' | 'warn';
  currentYear?: number;
}

const YEAR_CLAIM_RE =
  /\b(?:founded|established|created|started|launched|built|born|died|opened)\s+(?:in\s+)?(\d{4})\b/gi;
const YEAR_RE = /\bin\s+(\d{4})\b/gi;
const BEFORE_AFTER_RE =
  /\b(before|after|prior\s+to|following)\s+([^,.\n]{3,60})/gi;
const RELATIVE_TIME: Record<string, number> = {
  yesterday: -1,
  today: 0,
  tomorrow: 1,
};
const RELATIVE_RE = /\b(yesterday|today|tomorrow)\b/gi;

interface YearClaim {
  entity: string;
  year: number;
  offset: number;
}

function extractYearClaims(text: string): YearClaim[] {
  const claims: YearClaim[] = [];
  const re = new RegExp(YEAR_CLAIM_RE.source, YEAR_CLAIM_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const verb = m[0].split(/\s+/)[0].toLowerCase();
    claims.push({
      entity: verb,
      year: parseInt(m[1], 10),
      offset: m.index,
    });
  }
  return claims;
}

function extractBeforeAfterPairs(
  text: string,
): Array<{ rel: string; event: string; offset: number }> {
  const pairs: Array<{ rel: string; event: string; offset: number }> = [];
  const re = new RegExp(BEFORE_AFTER_RE.source, BEFORE_AFTER_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    pairs.push({
      rel: m[1].toLowerCase().trim(),
      event: m[2].trim().toLowerCase(),
      offset: m.index,
    });
  }
  return pairs;
}

export function temporalConsistency(
  options: TemporalConsistencyOptions,
): Guard {
  const currentYear = options.currentYear ?? new Date().getFullYear();

  return {
    name: 'temporal-consistency',
    version: '0.1.0',
    description: 'Detect conflicting dates/times within a response',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      // 1. Unreasonable years
      const yrRe = new RegExp(YEAR_RE.source, YEAR_RE.flags);
      let ym: RegExpExecArray | null;
      while ((ym = yrRe.exec(text)) !== null) {
        const yr = parseInt(ym[1], 10);
        if (yr > 2030) issues.push(`Unreasonable future year: ${yr}`);
        if (yr < 1900 && yr > 100)
          issues.push(`Unreasonable past year: ${yr}`);
      }

      // 2. Contradictory year claims for similar verbs
      const claims = extractYearClaims(text);
      const grouped = new Map<string, number[]>();
      for (const c of claims) {
        const key = c.entity;
        const vals = grouped.get(key) ?? [];
        vals.push(c.year);
        grouped.set(key, vals);
      }
      for (const [entity, years] of grouped) {
        const unique = [...new Set(years)];
        if (unique.length > 1) {
          issues.push(
            `Conflicting "${entity}" years: ${unique.join(' vs ')}`,
          );
        }
      }

      // 3. Temporal impossibilities (completed before started)
      const completedRe =
        /\b(?:completed|finished|ended)\s+in\s+(\d{4})\b/gi;
      const startedRe =
        /\b(?:started|began|commenced)\s+in\s+(\d{4})\b/gi;
      const cRe = new RegExp(completedRe.source, completedRe.flags);
      const sRe = new RegExp(startedRe.source, startedRe.flags);
      let cm: RegExpExecArray | null;
      let sm: RegExpExecArray | null;
      const completedYears: number[] = [];
      const startedYears: number[] = [];
      while ((cm = cRe.exec(text)) !== null)
        completedYears.push(parseInt(cm[1], 10));
      while ((sm = sRe.exec(text)) !== null)
        startedYears.push(parseInt(sm[1], 10));
      for (const cy of completedYears) {
        for (const sy of startedYears) {
          if (cy < sy) {
            issues.push(
              `Temporal impossibility: completed in ${cy} before starting in ${sy}`,
            );
          }
        }
      }

      // 4. "yesterday" and "tomorrow" for same event
      const relRe = new RegExp(RELATIVE_RE.source, RELATIVE_RE.flags);
      const relativeRefs: string[] = [];
      let rm: RegExpExecArray | null;
      while ((rm = relRe.exec(text)) !== null) {
        relativeRefs.push(rm[1].toLowerCase());
      }
      if (
        relativeRefs.includes('yesterday') &&
        relativeRefs.includes('tomorrow')
      ) {
        issues.push(
          'Mixed "yesterday" and "tomorrow" references may conflict',
        );
      }

      // 5. Before/after contradictions
      const pairs = extractBeforeAfterPairs(text);
      for (let i = 0; i < pairs.length; i++) {
        for (let j = i + 1; j < pairs.length; j++) {
          const a = pairs[i];
          const b = pairs[j];
          if (a.event === b.event) {
            const aIsBefore =
              a.rel === 'before' || a.rel === 'prior to';
            const bIsBefore =
              b.rel === 'before' || b.rel === 'prior to';
            if (aIsBefore !== bIsBefore) {
              issues.push(
                `Contradictory "before/after" for: "${a.event}"`,
              );
            }
          }
        }
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'temporal-consistency',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? issues.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
