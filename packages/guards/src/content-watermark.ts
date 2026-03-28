import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ContentWatermarkOptions {
  action: 'allow' | 'warn';
  /** Unique identifier embedded in the watermark */
  watermarkId: string;
  /** If true, only checks if watermark exists (default false) */
  verifyOnly?: boolean;
}

const ZWJ = '\u200D';
const ZWNJ = '\u200C';
const ZWS = '\u200B';

function encodeToBinary(str: string): string {
  return Array.from(str)
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
}

function encodeWatermark(id: string): string {
  const marker = `WM:${id}`;
  const bits = encodeToBinary(marker);
  return bits
    .split('')
    .map((b) => (b === '1' ? ZWJ : ZWNJ))
    .join(ZWS);
}

function extractWatermark(text: string): string | null {
  const zwChars = text.replace(/[^\u200B\u200C\u200D]/g, '');
  if (zwChars.length < 8) return null;
  const bits = zwChars
    .replace(/\u200B/g, '')
    .split('')
    .map((c) => (c === ZWJ ? '1' : '0'))
    .join('');
  const chars: string[] = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    chars.push(String.fromCharCode(parseInt(bits.slice(i, i + 8), 2)));
  }
  const decoded = chars.join('');
  if (decoded.startsWith('WM:')) return decoded.slice(3);
  return null;
}

export function contentWatermark(options: ContentWatermarkOptions): Guard {
  const verifyOnly = options.verifyOnly ?? false;

  return {
    name: 'content-watermark',
    version: '0.1.0',
    description: 'Embeds or verifies invisible watermarks in AI-generated content',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      if (verifyOnly) {
        const found = extractWatermark(text);
        const hasWatermark = found !== null;
        return {
          guardName: 'content-watermark',
          passed: hasWatermark,
          action: hasWatermark ? 'allow' : options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { verified: hasWatermark, watermarkId: found },
        };
      }

      const watermark = encodeWatermark(options.watermarkId);
      const watermarkedText = text + watermark;

      return {
        guardName: 'content-watermark',
        passed: true,
        action: 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: { embedded: true, watermarkId: options.watermarkId },
        overrideText: watermarkedText,
      };
    },
  };
}
