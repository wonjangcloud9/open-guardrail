import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface NumericConsistencyOptions {
  action: 'block' | 'warn';
}

const PCT_RE = /(-?\d+(?:\.\d+)?)\s*%/g;
const INCREASE_CONTEXT =
  /(?:increase|growth|rise|gain|up|boost|jump|surge|grew|rose)\b[^.]{0,30}(-?\d+(?:\.\d+)?)\s*%/gi;
const NEGATIVE_COUNT_RE =
  /(?:negative\s+\d+|(?<!\w)-\d+)\s+(?:users?|items?|people|records?|entries|results?|rows?|customers?|orders?|employees?|members?)/gi;
const YEAR_RE = /\b(\d{4})\b/g;
const NUM_CLAIM_RE =
  /\b(?:there\s+(?:are|were|is|was)|(?:has|have|had)\s+|(?:total(?:ing)?|count(?:ing)?|about|approximately|around|exactly|only|over|under)\s+)(\d+(?:,\d{3})*(?:\.\d+)?)\s+(\w+)/gi;

function extractNumericClaims(
  text: string,
): Array<{ value: number; entity: string; offset: number }> {
  const claims: Array<{ value: number; entity: string; offset: number }> = [];
  const re = new RegExp(NUM_CLAIM_RE.source, NUM_CLAIM_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1].replace(/,/g, '');
    claims.push({
      value: parseFloat(raw),
      entity: m[2].toLowerCase(),
      offset: m.index,
    });
  }
  return claims;
}

export function numericConsistency(options: NumericConsistencyOptions): Guard {
  return {
    name: 'numeric-consistency',
    version: '0.1.0',
    description: 'Detect unreasonable or inconsistent numeric claims',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      // 1. Invalid percentages (skip "increase/growth" contexts)
      const increaseSpans: Array<[number, number]> = [];
      const incRe = new RegExp(INCREASE_CONTEXT.source, INCREASE_CONTEXT.flags);
      let im: RegExpExecArray | null;
      while ((im = incRe.exec(text)) !== null) {
        increaseSpans.push([im.index, im.index + im[0].length]);
      }

      const pctRe = new RegExp(PCT_RE.source, PCT_RE.flags);
      let pm: RegExpExecArray | null;
      while ((pm = pctRe.exec(text)) !== null) {
        const val = parseFloat(pm[1]);
        const inIncrease = increaseSpans.some(
          ([s, e]) => pm!.index >= s && pm!.index <= e,
        );
        if (inIncrease) continue;
        if (val > 100) issues.push(`Percentage ${val}% exceeds 100`);
        if (val < 0) issues.push(`Negative percentage ${val}%`);
      }

      // 2. Negative counts
      const negRe = new RegExp(NEGATIVE_COUNT_RE.source, NEGATIVE_COUNT_RE.flags);
      if (negRe.test(text)) {
        issues.push('Negative count detected for a countable entity');
      }

      // 3. Contradictory numbers for same entity
      const claims = extractNumericClaims(text);
      const grouped = new Map<string, number[]>();
      for (const c of claims) {
        const existing = grouped.get(c.entity) ?? [];
        existing.push(c.value);
        grouped.set(c.entity, existing);
      }
      for (const [entity, values] of grouped) {
        const unique = [...new Set(values)];
        if (unique.length > 1) {
          issues.push(
            `Contradictory values for "${entity}": ${unique.join(' vs ')}`,
          );
        }
      }

      // 4. Unreasonable dates
      const yrRe = new RegExp(YEAR_RE.source, YEAR_RE.flags);
      let ym: RegExpExecArray | null;
      while ((ym = yrRe.exec(text)) !== null) {
        const yr = parseInt(ym[1], 10);
        if (yr > 2030) issues.push(`Unreasonable future year: ${yr}`);
        if (yr < 1900 && yr > 100) issues.push(`Unreasonable past year: ${yr}`);
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'numeric-consistency',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? issues.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
