import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ViolenceDetectOptions {
  action: 'block' | 'warn';
  categories?: ('physical' | 'weapon' | 'threat' | 'gore' | 'animal-abuse')[];
}

const VIOLENCE_KEYWORDS: Record<string, string[]> = {
  physical: ['punch', 'kick', 'stab', 'beat up', 'attack', 'assault', 'choke', 'strangle', 'murder', 'slaughter', 'massacre', 'torture', 'mutilate'],
  weapon: ['gun', 'knife', 'bomb', 'explosive', 'grenade', 'firearm', 'sword', 'machete', 'sniper', 'AK-47', 'AR-15', 'rifle', 'shotgun', 'ammunition'],
  threat: ['kill you', 'hurt you', 'destroy you', 'find where you live', 'come after you', 'watch your back', 'you will pay', 'death threat', 'i will end you'],
  gore: ['blood everywhere', 'dismember', 'decapitate', 'disembowel', 'severed', 'mutilated body', 'entrails', 'gore'],
  'animal-abuse': ['kick the dog', 'hurt the cat', 'animal cruelty', 'abuse animals', 'torture animals', 'kill the pet'],
};

const ALL_CATS = Object.keys(VIOLENCE_KEYWORDS);

export function violenceDetect(options: ViolenceDetectOptions): Guard {
  const cats = options.categories ?? ALL_CATS;
  return {
    name: 'violence-detect', version: '0.1.0',
    description: 'Detect violent content (physical, weapons, threats, gore)',
    category: 'content', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const triggered: Record<string, string[]> = {};
      for (const cat of cats) {
        const kws = VIOLENCE_KEYWORDS[cat] ?? [];
        const found = kws.filter((kw) => lower.includes(kw));
        if (found.length > 0) triggered[cat] = found;
      }
      const hasMatch = Object.keys(triggered).length > 0;
      return {
        guardName: 'violence-detect', passed: !hasMatch,
        action: hasMatch ? options.action : 'allow',
        message: hasMatch ? `Violence detected: ${Object.keys(triggered).join(', ')}` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: hasMatch ? { triggered, reason: 'Text contains violent content' } : undefined,
      };
    },
  };
}
