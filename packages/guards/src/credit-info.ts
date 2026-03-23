import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

type CreditEntity =
  | 'bank-account'
  | 'card-number'
  | 'credit-score';

interface CreditInfoOptions {
  entities: CreditEntity[];
  action: 'block' | 'warn' | 'mask';
}

interface CreditMatch {
  type: CreditEntity;
  value: string;
  start: number;
  end: number;
}

const BANK_ACCOUNT_RE =
  /\d{3,6}-\d{2,6}-\d{4,6}/g;

const CARD_NUMBER_RE =
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;

const CREDIT_SCORE_RE =
  /(?:신용등급|신용점수|크레딧스코어).{0,30}/g;

const MASK_LABELS: Record<CreditEntity, string> = {
  'bank-account': '[계좌번호]',
  'card-number': '[카드번호]',
  'credit-score': '[신용정보]',
};

function detect(
  text: string,
  entities: CreditEntity[],
): CreditMatch[] {
  const matches: CreditMatch[] = [];

  for (const entity of entities) {
    let re: RegExp;
    switch (entity) {
      case 'bank-account':
        re = new RegExp(BANK_ACCOUNT_RE.source, 'g');
        break;
      case 'card-number':
        re = new RegExp(CARD_NUMBER_RE.source, 'g');
        break;
      case 'credit-score':
        re = new RegExp(CREDIT_SCORE_RE.source, 'g');
        break;
    }

    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({
        type: entity,
        value: m[0],
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskText(
  text: string,
  matches: CreditMatch[],
): string {
  let result = text;
  for (const m of matches) {
    result =
      result.slice(0, m.start) +
      MASK_LABELS[m.type] +
      result.slice(m.end);
  }
  return result;
}

export function creditInfo(
  options: CreditInfoOptions,
): Guard {
  return {
    name: 'credit-info',
    version: '0.1.0',
    description: 'Korean financial info detection',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, options.entities);
      const triggered = matches.length > 0;

      if (!triggered) {
        return {
          guardName: 'credit-info',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'credit-info',
          passed: true,
          action: 'override',
          overrideText: maskText(text, matches),
          latencyMs: Math.round(performance.now() - start),
          details: {
            detected: matches.map(({ type, value }) => ({
              type,
              value,
            })),
          },
        };
      }

      return {
        guardName: 'credit-info',
        passed: false,
        action: options.action,
        latencyMs: Math.round(performance.now() - start),
        details: {
          detected: matches.map(({ type, value }) => ({
            type,
            value,
          })),
        },
      };
    },
  };
}
