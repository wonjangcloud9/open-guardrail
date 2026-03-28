import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SensitiveTopicOptions {
  action: 'block' | 'warn';
  topics?: string[];
}

const ALL_TOPICS: Record<string, RegExp[]> = {
  religion: [
    /\b(religion|religious|church|mosque|temple|synagogue|bible|quran|torah|buddhis[mt]|hindu|islam|christian|jewish|atheis[mt]|prayer|worship)\b/i,
  ],
  politics: [
    /\b(politic|democrat|republican|liberal|conservative|election|vote|congress|parliament|senator|president|governor|legislation|partisan)\b/i,
  ],
  race: [
    /\b(racial|racism|racist|ethnicity|ethnic\s+group|racial\s+profiling|white\s+supremac|segregation|discrimination)\b/i,
  ],
  disability: [
    /\b(disabilit|disabled|handicap|wheelchair|impairment|accessibility|special\s+needs|neurodiverg)\b/i,
  ],
  mental_health: [
    /\b(mental\s+health|depression|anxiety|bipolar|schizophren|ptsd|therapy|psychiatr|suicid|self[- ]harm)\b/i,
  ],
  substance_abuse: [
    /\b(substance\s+abuse|addiction|alcoholis[mt]|drug\s+abuse|rehab|overdose|narcotic|opioid)\b/i,
  ],
  eating_disorders: [
    /\b(eating\s+disorder|anorexi|bulimi|binge\s+eating|body\s+dysmorphi)\b/i,
  ],
  domestic_violence: [
    /\b(domestic\s+violence|abuse|batter|intimate\s+partner|restraining\s+order)\b/i,
  ],
  terrorism: [
    /\b(terroris[mt]|extremis[mt]|radicali[sz]|jihad|bomb\s+threat|insurgent)\b/i,
  ],
};

export function sensitiveTopic(options: SensitiveTopicOptions): Guard {
  const selectedTopics = options.topics ?? Object.keys(ALL_TOPICS);

  return {
    name: 'sensitive-topic',
    version: '0.1.0',
    description: 'Detects sensitive discussion topics',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const found: string[] = [];

      for (const topic of selectedTopics) {
        const patterns = ALL_TOPICS[topic];
        if (!patterns) continue;
        for (const pattern of patterns) {
          if (pattern.test(text)) {
            found.push(topic);
            break;
          }
        }
      }

      const triggered = found.length > 0;
      const score = triggered ? Math.min(found.length / 3, 1.0) : 0;

      return {
        guardName: 'sensitive-topic',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        message: triggered ? `Sensitive topics detected: ${found.join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { topics: found } : undefined,
      };
    },
  };
}
