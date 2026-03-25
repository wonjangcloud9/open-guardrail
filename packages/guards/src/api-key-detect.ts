import type { Guard, GuardContext, GuardResult } from 'open-guardrail-core';

interface ApiKeyDetectOptions {
  action: 'block' | 'warn' | 'override';
  /** Additional custom patterns to detect. */
  extraPatterns?: RegExp[];
}

interface KeyPattern {
  name: string;
  pattern: RegExp;
  mask: string;
}

const KEY_PATTERNS: KeyPattern[] = [
  { name: 'openai', pattern: /sk-[A-Za-z0-9]{20,}/g, mask: '[OPENAI_KEY]' },
  { name: 'anthropic', pattern: /sk-ant-[A-Za-z0-9\-]{20,}/g, mask: '[ANTHROPIC_KEY]' },
  { name: 'aws-access', pattern: /AKIA[0-9A-Z]{16}/g, mask: '[AWS_ACCESS_KEY]' },
  { name: 'aws-secret', pattern: /(?:aws.{0,10}secret.{0,10})[A-Za-z0-9/+=]{40}/gi, mask: '[AWS_SECRET]' },
  { name: 'github-token', pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g, mask: '[GITHUB_TOKEN]' },
  { name: 'google-api', pattern: /AIza[0-9A-Za-z\-_]{35}/g, mask: '[GOOGLE_API_KEY]' },
  { name: 'stripe', pattern: /sk_(?:live|test)_[0-9a-zA-Z]{24,}/g, mask: '[STRIPE_KEY]' },
  { name: 'slack-token', pattern: /xox[baprs]-[0-9A-Za-z\-]{10,}/g, mask: '[SLACK_TOKEN]' },
  { name: 'jwt', pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, mask: '[JWT_TOKEN]' },
  { name: 'generic-secret', pattern: /(?:api[_-]?key|secret[_-]?key|access[_-]?token|private[_-]?key)\s*[:=]\s*["']?([A-Za-z0-9\-_./+=]{16,})["']?/gi, mask: '[REDACTED_SECRET]' },
];

export function apiKeyDetect(options: ApiKeyDetectOptions): Guard {
  const allPatterns = [...KEY_PATTERNS];
  if (options.extraPatterns) {
    options.extraPatterns.forEach((p, i) => {
      allPatterns.push({ name: `custom-${i}`, pattern: p, mask: '[REDACTED]' });
    });
  }

  return {
    name: 'api-key-detect',
    version: '1.0.0',
    description: 'Detect leaked API keys, tokens, and secrets in text',
    category: 'security',
    supportedStages: ['output'],

    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const findings: Array<{ type: string; count: number }> = [];
      let masked = text;

      for (const kp of allPatterns) {
        kp.pattern.lastIndex = 0;
        const matches = text.match(kp.pattern);
        if (matches && matches.length > 0) {
          findings.push({ type: kp.name, count: matches.length });
          if (options.action === 'override') {
            kp.pattern.lastIndex = 0;
            masked = masked.replace(kp.pattern, kp.mask);
          }
        }
      }

      const detected = findings.length > 0;
      const isMask = detected && options.action === 'override';

      return {
        guardName: 'api-key-detect',
        passed: !detected || isMask,
        action: detected ? (isMask ? 'override' : options.action) : 'allow',
        overrideText: isMask ? masked : undefined,
        score: detected ? Math.min(findings.reduce((s, f) => s + f.count, 0) / 5, 1.0) : 0,
        message: detected ? `Detected: ${findings.map((f) => `${f.type}(${f.count})`).join(', ')}` : undefined,
        details: detected ? { findings } : undefined,
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}
