import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface AddressDetectOptions {
  action: 'block' | 'warn' | 'mask';
}

const ADDRESS_PATTERNS: [RegExp, string][] = [
  [/\d{1,5}\s+[\w\s]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Way|Pl|Place)\b\.?/gi, 'us-street'],
  [/\b\d{5}(?:-\d{4})?\b/g, 'us-zip'],
  [/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/g, 'ca-postal'],
  [/\b[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}\b/g, 'uk-postal'],
  [/\b\d{3}-\d{4}\b/g, 'jp-postal'],
  [/\b\d{5}\b/g, 'kr-postal'],
  [/(?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)(?:특별시|광역시|도|특별자치시|특별자치도)?\s*[\w가-힣]+(?:구|시|군)\s*[\w가-힣]+(?:동|읍|면|리|로|길)/g, 'kr-address'],
  [/(?:東京|大阪|京都|北海道|神奈川|千葉|埼玉|愛知|福岡)(?:都|府|道|県)\s*[\w\u3000-\u9FFF]+/g, 'jp-address'],
];

interface AddressMatch {
  type: string;
  value: string;
  start: number;
  end: number;
}

function detect(text: string): AddressMatch[] {
  const matches: AddressMatch[] = [];
  for (const [pattern, type] of ADDRESS_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ type, value: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return matches.sort((a, b) => b.start - a.start);
}

function maskAddresses(text: string, matches: AddressMatch[]): string {
  let result = text;
  for (const m of matches) {
    result = result.slice(0, m.start) + '[ADDRESS]' + result.slice(m.end);
  }
  return result;
}

export function addressDetect(options: AddressDetectOptions): Guard {
  return {
    name: 'address-detect',
    version: '0.1.0',
    description: 'Detect physical addresses (US/UK/KR/JP/CA)',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = detect(text);
      const triggered = matches.length > 0;
      if (!triggered) {
        return { guardName: 'address-detect', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }
      if (options.action === 'mask') {
        return {
          guardName: 'address-detect', passed: true, action: 'override',
          overrideText: maskAddresses(text, matches),
          message: `${matches.length} address(es) masked`,
          latencyMs: Math.round(performance.now() - start),
          details: { detected: matches.map(({ type }) => ({ type })), reason: 'Physical addresses detected in text' },
        };
      }
      return {
        guardName: 'address-detect', passed: false, action: options.action,
        message: `${matches.length} address(es) detected: ${[...new Set(matches.map((m) => m.type))].join(', ')}`,
        latencyMs: Math.round(performance.now() - start),
        details: { detected: matches.map(({ type, value }) => ({ type, value })), reason: 'Physical addresses should not be exposed' },
      };
    },
  };
}
