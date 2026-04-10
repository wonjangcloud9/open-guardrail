import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CircularReasoningOptions {
  action: 'block' | 'warn';
}

const TAUTOLOGY_PATTERNS: RegExp[] = [
  /\bthe reason (?:is |why .{0,40}is )because\b/i,
  /\bthis is true because it is true\b/i,
  /\bby definition\b/i,
  /\bit is what it is\b/i,
  /\bbecause (?:it |that )?(?:just )?is\b/i,
];

const BEGGING_PATTERNS: RegExp[] = [
  /\b(?:obviously|clearly|evidently|undeniably|unquestionably)\b/i,
];

function trigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const set = new Set<string>();
  for (let i = 0; i <= words.length - 3; i++) {
    set.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return set;
}

function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection++;
  }
  return intersection / Math.min(ta.size, tb.size);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

function checkBecauseRestatement(text: string): string | null {
  const becauseRe = /([^.!?]{10,})[.!?]\s*[^.!?]*\bbecause\s+([^.!?]{10,})/gi;
  let m: RegExpExecArray | null;
  const re = new RegExp(becauseRe.source, becauseRe.flags);
  while ((m = re.exec(text)) !== null) {
    const claim = m[1];
    const reason = m[2];
    if (trigramSimilarity(claim, reason) > 0.5) {
      return `"because" clause restates the claim`;
    }
  }
  return null;
}

function checkThereforeRepetition(text: string): string | null {
  const thereforeRe =
    /([^.!?]{10,})[.!?][\s\S]{0,200}\b(?:therefore|thus|hence|so)\s*,?\s*([^.!?]{10,})/gi;
  let m: RegExpExecArray | null;
  const re = new RegExp(thereforeRe.source, thereforeRe.flags);
  while ((m = re.exec(text)) !== null) {
    const premise = m[1];
    const conclusion = m[2];
    if (trigramSimilarity(premise, conclusion) > 0.5) {
      return `"therefore" conclusion restates earlier premise`;
    }
  }
  return null;
}

export function circularReasoning(options: CircularReasoningOptions): Guard {
  return {
    name: 'circular-reasoning',
    version: '0.1.0',
    description: 'Detect circular reasoning where conclusion restates premise',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      // 1. Tautological patterns
      for (const p of TAUTOLOGY_PATTERNS) {
        if (p.test(text)) {
          issues.push('Tautological pattern detected');
          break;
        }
      }

      // 2. "because" restatement
      const becauseIssue = checkBecauseRestatement(text);
      if (becauseIssue) issues.push(becauseIssue);

      // 3. "therefore" repetition
      const thereforeIssue = checkThereforeRepetition(text);
      if (thereforeIssue) issues.push(thereforeIssue);

      // 4. Begging the question (only flag if no evidence nearby)
      const sentences = splitSentences(text);
      for (const s of sentences) {
        const hasBegging = BEGGING_PATTERNS.some((p) => p.test(s));
        if (hasBegging) {
          const hasEvidence =
            /\b(?:because|since|according|study|research|data|evidence|source|found that)\b/i.test(
              s,
            );
          if (!hasEvidence) {
            issues.push('Unsupported certainty claim without evidence');
            break;
          }
        }
      }

      // 5. First vs last sentence similarity
      if (sentences.length >= 3) {
        const sim = trigramSimilarity(
          sentences[0],
          sentences[sentences.length - 1],
        );
        if (sim > 0.7) {
          issues.push(
            `First and last sentences are very similar (${(sim * 100).toFixed(0)}% trigram overlap)`,
          );
        }
      }

      const triggered = issues.length > 0;
      return {
        guardName: 'circular-reasoning',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? issues.join('; ') : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
