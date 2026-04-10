import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface ClassificationMarkingOptions { action: 'block' | 'warn'; }
const MARKINGS: Record<string, RegExp> = {
  topSecret: /\bTOP\s+SECRET\b/g, secret: /\bSECRET\b/g, confidential: /\bCONFIDENTIAL\b/g,
  cui: /\bCUI\b/g, fouo: /\bFOUO\b/g, sbu: /\bSBU\b/g, noforn: /\bNOFORN\b/g,
  relTo: /\bREL\s+TO\b/g, classified: /\bCLASSIFIED\b/g,
  ufouo: /\bUNCLASSIFIED\/\/FOR\s+OFFICIAL\s+USE\s+ONLY\b/g,
};
const SENSITIVE_TOPICS = /\b(?:intelligence\s+(?:report|briefing)|military\s+operation|weapons?\s+system|covert|surveillance\s+program|nuclear\s+capability)\b/gi;
export function classificationMarking(options: ClassificationMarkingOptions): Guard {
  return { name: 'classification-marking', version: '0.1.0', description: 'Detect and enforce classification markings in AI outputs', category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const issues: string[] = []; const found: string[] = [];
      for (const [label, re] of Object.entries(MARKINGS)) { const r = new RegExp(re.source, re.flags); if (r.test(text)) found.push(label); }
      const hasSecret = found.some(f => ['topSecret', 'secret'].includes(f));
      const hasUnclassified = text.includes('UNCLASSIFIED') && !text.includes('UNCLASSIFIED//FOR OFFICIAL USE ONLY');
      if (hasSecret && hasUnclassified) issues.push('classification downgrade detected');
      const lines = text.split('\n').filter(l => l.trim());
      if (found.length > 0 && lines.length > 2) {
        const top = lines[0].toUpperCase(); const bottom = lines[lines.length - 1].toUpperCase();
        const hasTopMark = found.some(f => { const re = new RegExp(MARKINGS[f].source, 'i'); return re.test(top); });
        const hasBottomMark = found.some(f => { const re = new RegExp(MARKINGS[f].source, 'i'); return re.test(bottom); });
        if (!hasTopMark || !hasBottomMark) issues.push('classified content missing proper top/bottom marking');
      }
      SENSITIVE_TOPICS.lastIndex = 0;
      if (SENSITIVE_TOPICS.test(text) && found.length === 0) issues.push('sensitive content appears unmarked');
      const triggered = issues.length > 0;
      return { guardName: 'classification-marking', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Classification issue: ${issues.join('; ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues, markingsFound: found } : undefined };
    },
  };
}
