import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CreditCardLuhnOptions {
  action: 'block' | 'warn';
  maskCard?: boolean;
}

const CARD_PATTERN = /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6(?:011|5\d{2}))[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{1,4}\b/g;

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function creditCardLuhn(options: CreditCardLuhnOptions): Guard {
  const maskCard = options.maskCard ?? true;

  return {
    name: 'credit-card-luhn',
    version: '0.1.0',
    description: 'Detects credit card numbers with Luhn validation',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = text.match(CARD_PATTERN) ?? [];
      const validated = matches.filter((m) => luhnCheck(m));
      const triggered = validated.length > 0;

      return {
        guardName: 'credit-card-luhn',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? 1.0 : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              cardCount: validated.length,
              masked: maskCard
                ? validated.map((c) => {
                    const d = c.replace(/\D/g, '');
                    return `****${d.slice(-4)}`;
                  })
                : undefined,
            }
          : undefined,
      };
    },
  };
}
