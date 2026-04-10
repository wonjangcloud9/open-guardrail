import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AnswerCompletenessScoreOptions {
  action: 'block' | 'warn';
  minCompleteness?: number;
}

const QUESTION_WORDS =
  /\b(?:what|how|why|when|where|who|which)\b/gi;

function extractSubTopics(question: string): string[] {
  const topics: string[] = [];

  const questionMarks = question.split('?').filter(
    (s) => s.trim().length > 0,
  );
  if (questionMarks.length > 1) {
    for (const q of questionMarks) topics.push(q.trim());
    return topics;
  }

  const numbered = question.match(
    /(?:^|\n)\s*\d+[.)]\s*.+/g,
  );
  if (numbered && numbered.length > 1) {
    for (const item of numbered) {
      topics.push(item.replace(/^\s*\d+[.)]\s*/, '').trim());
    }
    return topics;
  }

  const parts = question.split(/\band\b/i);
  if (parts.length > 1) {
    for (const p of parts) {
      if (p.trim().length > 5) topics.push(p.trim());
    }
    return topics;
  }

  const words = question.match(QUESTION_WORDS);
  if (words && words.length > 1) {
    const idx: number[] = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(QUESTION_WORDS.source, 'gi');
    while ((m = re.exec(question)) !== null) {
      idx.push(m.index);
    }
    for (let i = 0; i < idx.length; i++) {
      const end = i + 1 < idx.length ? idx[i + 1] : undefined;
      topics.push(question.slice(idx[i], end).trim());
    }
    return topics;
  }

  if (question.trim().length > 0) topics.push(question.trim());
  return topics;
}

function topicAddressed(
  topic: string,
  answer: string,
): boolean {
  const words = topic
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 4);
  if (words.length === 0) return true;
  const ansLower = answer.toLowerCase();
  const matched = words.filter((w) =>
    ansLower.includes(w),
  ).length;
  return matched / words.length >= 0.3;
}

export function answerCompletenessScore(
  options: AnswerCompletenessScoreOptions,
): Guard {
  const minComp = options.minCompleteness ?? 0.5;

  return {
    name: 'answer-completeness-score',
    version: '0.1.0',
    description:
      'Evaluate if answer addresses all parts of a question',
    category: 'ai',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();

      const qIdx = text.indexOf('Question:');
      const aIdx = text.indexOf('Answer:');

      if (qIdx === -1 || aIdx === -1 || aIdx <= qIdx) {
        return {
          guardName: 'answer-completeness-score',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const question = text.slice(qIdx + 9, aIdx);
      const answer = text.slice(aIdx + 7);
      const topics = extractSubTopics(question);

      if (topics.length === 0) {
        return {
          guardName: 'answer-completeness-score',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      const addressed = topics.filter((t) =>
        topicAddressed(t, answer),
      ).length;
      const completeness = addressed / topics.length;
      const triggered = completeness < minComp;
      const score = triggered ? 1 - completeness : 0;

      return {
        guardName: 'answer-completeness-score',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              completenessScore:
                Math.round(completeness * 100) / 100,
              addressedTopics: addressed,
              totalTopics: topics.length,
              minCompleteness: minComp,
            }
          : undefined,
      };
    },
  };
}
