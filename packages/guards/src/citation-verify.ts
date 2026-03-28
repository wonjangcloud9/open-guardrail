import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CitationVerifyOptions {
  action: 'block' | 'warn';
  requiredFormat?: 'number' | 'author-year' | 'any';
}

const NUMBER_REF = /\[(\d+)\]/g;
const AUTHOR_YEAR_REF = /\(([A-Z][a-zA-Z]+(?:\s+(?:et\s+al\.|&\s+[A-Z][a-zA-Z]+))?),?\s*(\d{4})\)/g;
const DOI_PATTERN = /10\.\d{4,}\/[^\s]+/g;
const URL_PATTERN = /https?:\/\/[^\s)]+/g;

function validateDoi(doi: string): boolean {
  return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(doi);
}

function validateUrl(url: string): boolean {
  return /^https?:\/\/[a-zA-Z0-9]/.test(url) && url.length > 10;
}

export function citationVerify(options: CitationVerifyOptions): Guard {
  const fmt = options.requiredFormat ?? 'any';

  return {
    name: 'citation-verify',
    version: '0.1.0',
    description: 'Verifies citation format quality',
    category: 'ai',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      const numberRefs = [...text.matchAll(NUMBER_REF)];
      const authorYearRefs = [...text.matchAll(AUTHOR_YEAR_REF)];
      const dois = [...text.matchAll(DOI_PATTERN)];
      const urls = [...text.matchAll(URL_PATTERN)];

      if (fmt === 'number' && numberRefs.length === 0 && text.length > 50) {
        issues.push('no-number-refs-found');
      }
      if (fmt === 'author-year' && authorYearRefs.length === 0 && text.length > 50) {
        issues.push('no-author-year-refs-found');
      }

      if (numberRefs.length > 0) {
        const nums = numberRefs.map(m => parseInt(m[1], 10)).sort((a, b) => a - b);
        for (let i = 0; i < nums.length - 1; i++) {
          if (nums[i + 1] - nums[i] > 1) {
            issues.push('non-sequential-number-refs');
            break;
          }
        }
      }

      if (numberRefs.length > 0 && authorYearRefs.length > 0) {
        issues.push('mixed-citation-formats');
      }

      for (const doi of dois) {
        if (!validateDoi(doi[0])) {
          issues.push('invalid-doi-format');
          break;
        }
      }

      for (const url of urls) {
        if (!validateUrl(url[0])) {
          issues.push('incomplete-url');
          break;
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'citation-verify',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
