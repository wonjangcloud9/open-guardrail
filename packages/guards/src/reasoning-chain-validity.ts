import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ReasoningChainValidityOptions {
  action: 'block' | 'warn';
}

const STEP_RE = /\bstep\s+(\d+)\b/gi;
const CONCLUSION_RE =
  /\b(?:therefore|thus|hence|in\s+conclusion|consequently)\b/i;
const REASON_RE = /\b(?:because|since|as\s+a\s+result)\b/i;
const SEQUENCE_RE =
  /\b(?:first|second|third|then|next|finally)\b/i;

function checkStepGaps(text: string): string[] {
  const issues: string[] = [];
  const steps: number[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(STEP_RE.source, 'gi');
  while ((m = re.exec(text)) !== null) {
    steps.push(parseInt(m[1], 10));
  }

  if (steps.length >= 2) {
    const sorted = [...new Set(steps)].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1) {
        const missing: number[] = [];
        for (
          let n = sorted[i - 1] + 1;
          n < sorted[i];
          n++
        ) {
          missing.push(n);
        }
        issues.push(
          `Missing step(s): ${missing.join(', ')}`,
        );
      }
    }
  }
  return issues;
}

function checkUnsupportedConclusions(
  text: string,
): string[] {
  const issues: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if (!CONCLUSION_RE.test(s)) continue;

    const prior = sentences.slice(0, i).join(' ');
    const hasReasoning =
      REASON_RE.test(prior) ||
      SEQUENCE_RE.test(prior) ||
      STEP_RE.test(prior);

    if (!hasReasoning && i > 0) {
      issues.push(
        'Conclusion without preceding reasoning steps',
      );
    }
  }
  return issues;
}

function checkCircularReasoning(text: string): string[] {
  const issues: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const s of sentences) {
    const becauseIdx = s.toLowerCase().indexOf('because');
    if (becauseIdx === -1) continue;

    const before = s
      .slice(0, becauseIdx)
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length >= 4);
    const after = s
      .slice(becauseIdx + 7)
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length >= 4);

    if (before.length === 0 || after.length === 0) continue;

    const beforeSet = new Set(before);
    const overlap = after.filter((w) => beforeSet.has(w));
    if (
      overlap.length >= 3 &&
      overlap.length / after.length >= 0.7
    ) {
      issues.push(
        'Circular reasoning: conclusion restated as reason',
      );
    }
  }
  return issues;
}

function checkEmptyReasoning(text: string): string[] {
  const issues: string[] = [];
  const hasConclusion = CONCLUSION_RE.test(text);
  const hasSequence = SEQUENCE_RE.test(text);
  const hasSteps = STEP_RE.test(text);
  const hasReason = REASON_RE.test(text);

  if (hasConclusion && !hasSequence && !hasSteps && !hasReason) {
    issues.push(
      'Empty reasoning: conclusion without any steps',
    );
  }
  return issues;
}

export function reasoningChainValidity(
  options: ReasoningChainValidityOptions,
): Guard {
  return {
    name: 'reasoning-chain-validity',
    version: '0.1.0',
    description:
      'Validate logical coherence of chain-of-thought reasoning',
    category: 'ai',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();

      const markers = [
        STEP_RE,
        CONCLUSION_RE,
        REASON_RE,
        SEQUENCE_RE,
      ];
      const hasReasoning = markers.some((r) =>
        new RegExp(r.source, r.flags).test(text),
      );

      if (!hasReasoning) {
        return {
          guardName: 'reasoning-chain-validity',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const issues = [
        ...checkStepGaps(text),
        ...checkUnsupportedConclusions(text),
        ...checkCircularReasoning(text),
        ...checkEmptyReasoning(text),
      ];

      const triggered = issues.length > 0;

      return {
        guardName: 'reasoning-chain-validity',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered
          ? Math.min(issues.length / 3, 1.0)
          : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { issues, issueCount: issues.length }
          : undefined,
      };
    },
  };
}
