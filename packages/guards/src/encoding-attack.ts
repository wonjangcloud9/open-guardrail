import type { Guard, GuardContext, GuardResult } from 'open-guardrail-core';

interface EncodingAttackOptions {
  action: 'block' | 'warn';
  /** Detection modules to enable. Default: all enabled. */
  detect?: {
    base64?: boolean;
    hex?: boolean;
    unicode?: boolean;
    htmlEntities?: boolean;
  };
}

const BASE64_PATTERN = /(?:[A-Za-z0-9+/]{20,}={0,2})/g;
const HEX_PATTERN = /(?:0x[0-9a-fA-F]{2}\s*){4,}|(?:\\x[0-9a-fA-F]{2}){4,}/g;
const UNICODE_ESCAPE = /(?:\\u[0-9a-fA-F]{4}){3,}|(?:%u[0-9a-fA-F]{4}){3,}/g;
const HTML_ENTITY = /(?:&#(?:x[0-9a-fA-F]+|\d+);){3,}/g;

const SUSPICIOUS_DECODED_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|above|prior)/i,
  /system\s*prompt/i,
  /you\s+are\s+now/i,
  /\beval\s*\(/i,
  /<script/i,
  /javascript:/i,
  /\bexec\s*\(/i,
  /drop\s+table/i,
];

function tryDecodeBase64(s: string): string | null {
  try {
    const decoded = atob(s);
    if (/^[\x20-\x7E\n\r\t]+$/.test(decoded)) return decoded;
  } catch { /* not valid base64 */ }
  return null;
}

function tryDecodeHex(s: string): string {
  return s
    .replace(/0x/g, '')
    .replace(/\\x/g, '')
    .replace(/\s+/g, '')
    .replace(/../g, (h) => {
      const code = parseInt(h, 16);
      return code >= 32 && code < 127 ? String.fromCharCode(code) : '';
    });
}

function tryDecodeUnicode(s: string): string {
  return s.replace(/(?:\\u|%u)([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

function isSuspicious(text: string): boolean {
  return SUSPICIOUS_DECODED_PATTERNS.some((p) => p.test(text));
}

export function encodingAttack(options: EncodingAttackOptions): Guard {
  const detect = {
    base64: true,
    hex: true,
    unicode: true,
    htmlEntities: true,
    ...options.detect,
  };

  return {
    name: 'encoding-attack',
    version: '1.0.0',
    description: 'Detect encoded injection attempts (base64, hex, unicode, HTML entities)',
    category: 'security',
    supportedStages: ['input'],

    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const findings: string[] = [];

      if (detect.base64) {
        const matches = text.match(BASE64_PATTERN) ?? [];
        for (const m of matches) {
          const decoded = tryDecodeBase64(m);
          if (decoded && isSuspicious(decoded)) {
            findings.push(`base64: "${decoded.slice(0, 60)}"`);
          }
        }
      }

      if (detect.hex) {
        const matches = text.match(HEX_PATTERN) ?? [];
        for (const m of matches) {
          const decoded = tryDecodeHex(m);
          if (isSuspicious(decoded)) {
            findings.push(`hex: "${decoded.slice(0, 60)}"`);
          }
        }
      }

      if (detect.unicode) {
        const matches = text.match(UNICODE_ESCAPE) ?? [];
        for (const m of matches) {
          const decoded = tryDecodeUnicode(m);
          if (isSuspicious(decoded)) {
            findings.push(`unicode: "${decoded.slice(0, 60)}"`);
          }
        }
      }

      if (detect.htmlEntities) {
        const matches = text.match(HTML_ENTITY) ?? [];
        if (matches.length > 0) {
          findings.push(`html-entities: ${matches.length} encoded sequences`);
        }
      }

      const detected = findings.length > 0;
      return {
        guardName: 'encoding-attack',
        passed: !detected,
        action: detected ? options.action : 'allow',
        score: detected ? Math.min(findings.length / 3, 1.0) : 0,
        message: detected ? `Encoded attack detected: ${findings.join('; ')}` : undefined,
        details: detected ? { findings } : undefined,
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}
