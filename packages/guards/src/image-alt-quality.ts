import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ImageAltQualityOptions {
  action: 'block' | 'warn';
  minLength?: number;
}

const ALT_PATTERNS: RegExp[] = [
  /alt=["']([^"']*)["']/gi,
  /alt\s+text:\s*(.+?)(?:\n|$)/gi,
  /image\s+description:\s*(.+?)(?:\n|$)/gi,
  /describes\s+image:\s*(.+?)(?:\n|$)/gi,
  /\[image\]\s*(.+?)(?:\n|$)/gi,
  /!\[([^\]]*)\]/g,
];

const GENERIC_DESCS: RegExp[] = [
  /^an?\s+image$/i,
  /^an?\s+photo$/i,
  /^picture$/i,
  /^screenshot$/i,
  /^image$/i,
  /^photo$/i,
  /^photo\s+of\s+something$/i,
  /^an?\s+picture$/i,
  /^img$/i,
  /^untitled$/i,
  /^placeholder$/i,
];

const FILE_EXT_PATTERN = /^\S+\.\w{2,4}$/;

function extractAltTexts(text: string): string[] {
  const results: string[] = [];
  for (const pattern of ALT_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[1] !== undefined) results.push(m[1].trim());
    }
  }
  return results;
}

export function imageAltQuality(options: ImageAltQualityOptions): Guard {
  const minLength = options.minLength ?? 10;

  return {
    name: 'image-alt-quality',
    version: '0.1.0',
    description: 'Detects low-quality image alt-text or descriptions',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const alts = extractAltTexts(text);

      if (alts.length === 0) {
        return {
          guardName: 'image-alt-quality',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const issues: string[] = [];

      for (const alt of alts) {
        if (alt.length === 0) {
          issues.push('Empty alt text');
          continue;
        }
        if (alt.length < minLength) {
          issues.push(`Alt text too short: "${alt}"`);
          continue;
        }
        if (GENERIC_DESCS.some((p) => p.test(alt))) {
          issues.push(`Generic alt text: "${alt}"`);
          continue;
        }
        if (FILE_EXT_PATTERN.test(alt)) {
          issues.push(`Filename as alt text: "${alt}"`);
          continue;
        }
        const wordCount = alt.split(/\s+/).filter(Boolean).length;
        if (wordCount < 3) {
          issues.push(`Too few words in alt text: "${alt}"`);
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / alts.length, 1.0) : 0;

      return {
        guardName: 'image-alt-quality',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, totalAlts: alts.length } : undefined,
      };
    },
  };
}
