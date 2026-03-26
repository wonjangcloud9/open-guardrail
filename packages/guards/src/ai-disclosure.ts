import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';
interface AiDisclosureOptions { action: 'block' | 'warn'; requireDisclosure?: boolean; }
const DISCLOSURE_PATTERNS: RegExp[] = [
  /\b(?:generated\s+by\s+(?:AI|artificial\s+intelligence|a\s+(?:language\s+)?model))\b/gi,
  /\b(?:AI[- ]generated|machine[- ]generated|auto[- ]generated)\b/gi,
  /\b(?:this\s+(?:was|is)\s+(?:written|created|generated)\s+(?:by|using)\s+(?:AI|an?\s+AI))\b/gi,
  /\b(?:disclaimer:\s+(?:AI|artificial))\b/gi,
  /\b(?:powered\s+by\s+(?:AI|GPT|Claude|LLM|Gemini))\b/gi,
];
export function aiDisclosure(options: AiDisclosureOptions): Guard {
  const requireDisclosure = options.requireDisclosure ?? true;
  return { name: 'ai-disclosure', version: '0.1.0', description: 'Detect or require AI-generated content disclosure (EU AI Act)', category: 'locale', supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const found: string[] = [];
      for (const p of DISCLOSURE_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) found.push(m[0]); }
      const hasDisclosure = found.length > 0;
      const triggered = requireDisclosure ? !hasDisclosure : hasDisclosure;
      return { guardName: 'ai-disclosure', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? (requireDisclosure ? 'AI-generated content lacks disclosure statement' : `AI disclosure found: "${found[0]}"`) : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: { disclosureFound: found, requireDisclosure, reason: triggered ? (requireDisclosure ? 'EU AI Act requires AI-generated content to be labeled' : 'Text contains AI disclosure') : undefined },
      };
    },
  };
}
