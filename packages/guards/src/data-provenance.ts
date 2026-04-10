import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface DataProvenanceOptions { action: 'block' | 'warn'; }
const DATA_REF = /\b(?:dataset|training\s+data|data\s+source|collected\s+from|data\s+from|sourced\s+from)\b/gi;
const SOURCE_ID = /(?:https?:\/\/\S+|(?:database|db|api|org(?:anization)?)\s*[:=]\s*\S+|\bfrom\s+(?:the\s+)?[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\b)/i;
const DATE_REF = /\b(?:\d{4}[-/]\d{2}(?:[-/]\d{2})?|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|Q[1-4]\s+\d{4}|collected\s+(?:on|in|during)\s+\d{4})\b/i;
export function dataProvenance(options: DataProvenanceOptions): Guard {
  return { name: 'data-provenance', version: '0.1.0', description: 'Check that data sources are properly documented (EU AI Act Art. 10)', category: 'compliance', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const hasDataRef = DATA_REF.test(text); DATA_REF.lastIndex = 0;
      if (!hasDataRef) {
        return { guardName: 'data-provenance', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }
      const hasSource = SOURCE_ID.test(text); const hasDate = DATE_REF.test(text);
      const missing: string[] = [];
      if (!hasSource) missing.push('source identification');
      if (!hasDate) missing.push('collection date/timestamp');
      const triggered = missing.length > 0;
      return { guardName: 'data-provenance', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Data reference lacks provenance details: ${missing.join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { missingFields: missing, sourceFound: hasSource, dateFound: hasDate, reason: 'EU AI Act Art. 10 requires proper data provenance documentation' } : undefined,
      };
    },
  };
}
