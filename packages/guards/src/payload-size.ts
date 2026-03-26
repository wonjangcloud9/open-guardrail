import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface PayloadSizeOptions { action: 'block' | 'warn'; maxBytes?: number; maxBase64Bytes?: number; }

const BASE64_RE = /[A-Za-z0-9+/=]{100,}/g;

export function payloadSize(options: PayloadSizeOptions): Guard {
  const maxBytes = options.maxBytes ?? 100_000;
  const maxBase64 = options.maxBase64Bytes ?? 10_000;
  return { name: 'payload-size', version: '0.1.0', description: 'Detect oversized or encoded payloads', category: 'security', supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const violations: string[] = [];
      const byteSize = new TextEncoder().encode(text).length;
      if (byteSize > maxBytes) violations.push(`Payload ${byteSize} bytes (max: ${maxBytes})`);
      const base64Matches = text.match(BASE64_RE) ?? [];
      const base64Total = base64Matches.reduce((sum, m) => sum + m.length, 0);
      if (base64Total > maxBase64) violations.push(`Base64 content ${base64Total} chars (max: ${maxBase64})`);
      const triggered = violations.length > 0;
      return { guardName: 'payload-size', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? violations.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { byteSize, base64Chars: base64Total, reason: triggered ? 'Input payload exceeds size limits or contains large encoded data' : undefined },
      };
    },
  };
}
