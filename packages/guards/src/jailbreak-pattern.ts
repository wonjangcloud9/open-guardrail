import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface JailbreakPatternOptions { action: 'block' | 'warn'; }

const JAILBREAK_PATTERNS: [RegExp, string][] = [
  [/\bignore\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|rules|guidelines|prompts?)\b/gi, 'instruction-override'],
  [/\byou\s+are\s+now\s+(?:a|an|in)\b/gi, 'persona-switch'],
  [/\bDAN\s+mode\b|\bDo\s+Anything\s+Now\b/gi, 'DAN'],
  [/\bdeveloper\s+mode\s+(?:enabled|on|activated)\b/gi, 'dev-mode'],
  [/\bjailbreak(?:ed|ing)?\b/gi, 'jailbreak-mention'],
  [/\bpretend\s+(?:you\s+(?:are|have)|to\s+be|that)\b/gi, 'pretend'],
  [/\b(?:bypass|override|disable|turn\s+off)\s+(?:your|the|all)\s+(?:restrictions|filters|safety|guardrails?|content\s+policy)\b/gi, 'bypass-safety'],
  [/\b(?:evil|unethical|immoral|illegal)\s+(?:mode|version|twin)\b/gi, 'evil-mode'],
  [/\bact\s+(?:as\s+(?:if|though)|like)\s+(?:you\s+(?:have|are)|there\s+(?:are|is))\s+no\s+(?:rules|restrictions|limits)\b/gi, 'no-rules'],
  [/\b(?:respond|answer)\s+without\s+(?:any\s+)?(?:restrictions|limitations|filters|censorship)\b/gi, 'uncensored'],
  [/\bsystem\s*:\s*/gi, 'system-prompt-inject'],
  [/\b\[(?:SYSTEM|INST|SYS)\]/gi, 'bracket-inject'],
  [/\b(?:base64|rot13|hex|reverse)\s+(?:decode|encrypt|encode)\b/gi, 'encoding-evasion'],
  [/\btranslate\s+(?:this|the\s+following)\s+(?:to|into)\s+(?:a\s+)?(?:language|code)\s+(?:that|where)\b/gi, 'translation-evasion'],
];

export function jailbreakPattern(options: JailbreakPatternOptions): Guard {
  return {
    name: 'jailbreak-pattern', version: '0.1.0',
    description: 'Advanced jailbreak detection (14 attack categories)',
    category: 'security', supportedStages: ['input'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const detected: { category: string; match: string }[] = [];
      for (const [pattern, category] of JAILBREAK_PATTERNS) {
        const re = new RegExp(pattern.source, pattern.flags);
        const m = re.exec(text);
        if (m) detected.push({ category, match: m[0] });
      }
      const triggered = detected.length > 0;
      return {
        guardName: 'jailbreak-pattern', passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered ? `Jailbreak attempt (${detected[0].category}): "${detected[0].match}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { detected, reason: 'Input matches known jailbreak attack patterns' } : undefined,
      };
    },
  };
}
