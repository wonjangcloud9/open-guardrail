import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface HateSpeechOptions {
  action: 'block' | 'warn';
  categories?: ('racial' | 'religious' | 'gender' | 'lgbtq' | 'disability' | 'nationality')[];
}

const HATE_KEYWORDS: Record<string, string[]> = {
  racial: ['white supremacy', 'racial superiority', 'master race', 'ethnic cleansing', 'go back to your country', 'subhuman', 'inferior race', 'racial purity'],
  religious: ['infidel', 'heathen', 'destroy all', 'religious war', 'jihad against', 'crusade against', 'burn in hell'],
  gender: ['women are inferior', 'men are superior', 'stay in the kitchen', 'women belong', 'feminazi', 'male supremacy'],
  lgbtq: ['conversion therapy', 'unnatural lifestyle', 'abomination', 'groomer', 'against nature', 'deviant lifestyle'],
  disability: ['retarded', 'cripple', 'mental case', 'invalid', 'handicapped freak', 'special needs freak'],
  nationality: ['dirty immigrants', 'illegal aliens', 'go back to', 'invasion of immigrants', 'border jumpers'],
};

const ALL_CATS = Object.keys(HATE_KEYWORDS);

export function hateSpeech(options: HateSpeechOptions): Guard {
  const cats = options.categories ?? ALL_CATS;
  return {
    name: 'hate-speech', version: '0.1.0',
    description: 'Detect hate speech across 6 categories',
    category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const triggered: Record<string, string[]> = {};
      for (const cat of cats) {
        const found = (HATE_KEYWORDS[cat] ?? []).filter((kw) => lower.includes(kw));
        if (found.length > 0) triggered[cat] = found;
      }
      const hasMatch = Object.keys(triggered).length > 0;
      return {
        guardName: 'hate-speech', passed: !hasMatch,
        action: hasMatch ? options.action : 'allow',
        message: hasMatch ? `Hate speech detected: ${Object.keys(triggered).join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: hasMatch ? { triggered, reason: 'Text contains hate speech targeting protected groups' } : undefined,
      };
    },
  };
}
