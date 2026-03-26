import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ContactInfoOptions {
  action: 'block' | 'warn' | 'mask';
  detect?: ('email' | 'phone' | 'url' | 'social' | 'messenger')[];
}

const SOCIAL_RE = /(?:@[\w.]+|(?:twitter|instagram|facebook|tiktok|linkedin|youtube)\.com\/[\w.]+)/gi;
const MESSENGER_RE = /(?:(?:telegram|whatsapp|kakao|line|wechat|signal)[\s:]+[@\w.+]+)/gi;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
const URL_RE = /https?:\/\/[^\s<>"']+/gi;

const ALL_TYPES = ['email', 'phone', 'url', 'social', 'messenger'] as const;

const PATTERNS: Record<string, RegExp> = {
  email: EMAIL_RE, phone: PHONE_RE, url: URL_RE,
  social: SOCIAL_RE, messenger: MESSENGER_RE,
};

interface ContactMatch { type: string; value: string; start: number; end: number; }

function detect(text: string, types: readonly string[]): ContactMatch[] {
  const matches: ContactMatch[] = [];
  for (const type of types) {
    const re = new RegExp(PATTERNS[type].source, PATTERNS[type].flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ type, value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function mask(text: string, matches: ContactMatch[]): string {
  let r = text;
  for (const m of matches) {
    r = r.slice(0, m.start) + `[${m.type.toUpperCase()}]` + r.slice(m.end);
  }
  return r;
}

export function contactInfo(options: ContactInfoOptions): Guard {
  const types = options.detect ?? ALL_TYPES;
  return {
    name: 'contact-info',
    version: '0.1.0',
    description: 'Detect contact info: email, phone, URL, social, messenger',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text, types);
      const triggered = matches.length > 0;
      if (!triggered) return { guardName: 'contact-info', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') {
        return { guardName: 'contact-info', passed: true, action: 'override', overrideText: mask(text, matches), message: `${matches.length} contact(s) masked`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type }) => type) } };
      }
      return { guardName: 'contact-info', passed: false, action: options.action, message: `Contact info detected: ${[...new Set(matches.map((m) => m.type))].join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected: matches.map(({ type, value }) => ({ type, value })), reason: 'Text contains contact information that may be private' } };
    },
  };
}
