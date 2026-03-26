import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SocialEngineeringOptions { action: 'block' | 'warn'; }

const SE_PATTERNS: RegExp[] = [
  /\b(?:verify|confirm)\s+your\s+(?:account|identity|password|credentials|SSN|bank)\b/gi,
  /\b(?:your\s+account\s+(?:has been|will be)\s+(?:suspended|locked|closed|compromised))\b/gi,
  /\b(?:click\s+(?:here|this\s+link)|open\s+(?:this|the)\s+(?:attachment|file))\s+(?:to|and)\b/gi,
  /\b(?:urgent|immediate)\s+(?:action\s+required|attention\s+needed|response\s+needed)\b/gi,
  /\b(?:you(?:'ve| have)\s+won|congratulations.*(?:winner|prize|lottery|reward))\b/gi,
  /\b(?:send|transfer|wire)\s+(?:money|funds|payment|bitcoin|crypto)\s+(?:to|now|immediately)\b/gi,
  /\b(?:I am|I'm)\s+(?:a\s+)?(?:prince|royalty|diplomat|government\s+official)\b/gi,
  /\b(?:limited\s+time|act\s+(?:now|fast)|don'?t\s+miss|expires?\s+(?:today|soon|in\s+\d+))\b/gi,
  /\b(?:share|give\s+me|send\s+me)\s+your\s+(?:password|pin|code|OTP|verification)\b/gi,
];

export function socialEngineering(options: SocialEngineeringOptions): Guard {
  return { name: 'social-engineering', version: '0.1.0', description: 'Detect social engineering and phishing tactics', category: 'security', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const matched: string[] = [];
      for (const p of SE_PATTERNS) { const re = new RegExp(p.source, p.flags); const m = re.exec(text); if (m) matched.push(m[0]); }
      const triggered = matched.length > 0;
      return { guardName: 'social-engineering', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Social engineering: "${matched[0]}"` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched, reason: 'Text contains social engineering or phishing tactics' } : undefined,
      };
    },
  };
}
