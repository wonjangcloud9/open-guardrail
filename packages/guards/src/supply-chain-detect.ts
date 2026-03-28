import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface SupplyChainDetectOptions {
  action: 'block' | 'warn';
  extraPatterns?: RegExp[];
}

const SUSPICIOUS_INSTALL: RegExp[] = [
  /npm\s+install\s+--global\s+[a-z0-9@/_-]+\s*&&\s*(curl|wget|bash|sh|eval)/i,
  /pip\s+install\s+--pre\s+[a-z0-9_-]+\s*&&/i,
  /curl\s+-s.*\|\s*(?:bash|sh|node|python)/i,
  /wget\s+-q.*\|\s*(?:bash|sh|node|python)/i,
];

const POSTINSTALL_PATTERNS: RegExp[] = [
  /"(?:pre|post)install"\s*:\s*"[^"]*(?:curl|wget|bash|sh|eval|node\s+-e)/i,
  /"(?:pre|post)install"\s*:\s*"[^"]*https?:\/\//i,
];

const EVAL_EXTERNAL: RegExp[] = [
  /eval\s*\(\s*(?:fetch|require|import)\s*\(\s*['"`]https?:\/\//i,
  /new\s+Function\s*\(\s*(?:await\s+)?fetch\s*\(/i,
  /eval\s*\(\s*Buffer\.from\s*\(/i,
];

const CDN_REQUIRE: RegExp[] = [
  /require\s*\(\s*['"`]https?:\/\/(?!(?:cdn\.jsdelivr|unpkg|cdnjs))/i,
  /import\s+.*from\s+['"`]https?:\/\/(?!(?:cdn\.jsdelivr|unpkg|cdnjs|esm\.sh))/i,
];

const TYPOSQUAT_INDICATORS: RegExp[] = [
  /\b(?:lodasg|lodahs|colros|challk|chalkk|axois|reqeust|espress|momnet)\b/i,
  /\b(?:cross-env\d|cr0ss-env|crossenv|cross_env|cros-env)\b/i,
];

const BASE64_REQUIRE: RegExp[] = [
  /(?:require|import)\s*\(\s*(?:atob|Buffer\.from)\s*\(\s*['"`][A-Za-z0-9+/=]{20,}/i,
  /eval\s*\(\s*(?:atob|Buffer\.from)\s*\(\s*['"`][A-Za-z0-9+/=]{20,}/i,
];

const ALL_GROUPS = [
  { name: 'suspicious_install', patterns: SUSPICIOUS_INSTALL },
  { name: 'postinstall_script', patterns: POSTINSTALL_PATTERNS },
  { name: 'eval_external', patterns: EVAL_EXTERNAL },
  { name: 'unknown_cdn_require', patterns: CDN_REQUIRE },
  { name: 'typosquatting', patterns: TYPOSQUAT_INDICATORS },
  { name: 'base64_require', patterns: BASE64_REQUIRE },
];

export function supplyChainDetect(options: SupplyChainDetectOptions): Guard {
  const extra = options.extraPatterns ?? [];

  return {
    name: 'supply-chain-detect',
    version: '0.1.0',
    description: 'Detects supply chain attack patterns in code and configurations',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const threats: string[] = [];

      for (const group of ALL_GROUPS) {
        for (const p of group.patterns) {
          if (p.test(text)) { threats.push(group.name); break; }
        }
      }

      for (const p of extra) {
        if (p.test(text)) { threats.push('custom_pattern'); break; }
      }

      const triggered = threats.length > 0;
      const score = triggered ? Math.min(threats.length / 3, 1.0) : 0;

      return {
        guardName: 'supply-chain-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { threats } : undefined,
      };
    },
  };
}
