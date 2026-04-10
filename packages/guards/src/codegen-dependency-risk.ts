import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenDependencyRiskOptions {
  action: 'block' | 'warn';
  knownPackages?: string[];
}

const INSTALL_CMD =
  /(?:pip\s+install|npm\s+install|yarn\s+add|pnpm\s+add|gem\s+install|cargo\s+add)\s+(.+)/gi;

const DANGEROUS_FLAGS: RegExp[] = [
  /--force\b/g,
  /--no-verify\b/g,
  /--ignore-scripts\b/g,
  /--unsafe-perm\b/g,
  /--trust-server-names\b/g,
];

const SUSPICIOUS_REGISTRY: RegExp[] = [
  /--registry\s+https?:\/\/(?!registry\.npmjs\.org|pypi\.org)/gi,
  /--index-url\s+https?:\/\/(?!pypi\.org)/gi,
  /--extra-index-url\s+/gi,
];

const KNOWN_TYPOSQUATS: Record<string, string> = {
  requets: 'requests',
  reqeusts: 'requests',
  lodahs: 'lodash',
  lodasg: 'lodash',
  axois: 'axios',
  axos: 'axios',
  expresss: 'express',
  djnago: 'django',
  flaask: 'flask',
  numppy: 'numpy',
  padas: 'pandas',
  tensoflow: 'tensorflow',
  colrs: 'colors',
  chak: 'chalk',
};

function isSuspiciousName(name: string): boolean {
  if (name.length <= 2) return true;
  if (/^[a-z0-9]{10,}$/.test(name) && !/[aeiou]{2}/i.test(name))
    return true;
  if (/^\d/.test(name)) return true;
  return false;
}

export function codegenDependencyRisk(
  options: CodegenDependencyRiskOptions,
): Guard {
  const known = options.knownPackages
    ? new Set(options.knownPackages.map((p) => p.toLowerCase()))
    : undefined;

  return {
    name: 'codegen-dependency-risk',
    version: '0.1.0',
    description:
      'Detect risky or hallucinated package dependencies',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      const cmdRe = new RegExp(INSTALL_CMD.source, INSTALL_CMD.flags);
      let cm: RegExpExecArray | null;
      while ((cm = cmdRe.exec(text)) !== null) {
        const args = cm[1].trim().split(/\s+/);
        for (const arg of args) {
          if (arg.startsWith('-')) continue;
          const pkg = arg.replace(/@[^@]*$/, '').toLowerCase();
          if (!pkg) continue;

          if (KNOWN_TYPOSQUATS[pkg]) {
            issues.push(
              `typosquat "${pkg}" (did you mean "${KNOWN_TYPOSQUATS[pkg]}"?)`,
            );
          }
          if (isSuspiciousName(pkg)) {
            issues.push(`suspicious package name "${pkg}"`);
          }
          if (known && !known.has(pkg)) {
            issues.push(`unknown package "${pkg}"`);
          }
        }
      }

      for (const flag of DANGEROUS_FLAGS) {
        const fre = new RegExp(flag.source, flag.flags);
        const fm = fre.exec(text);
        if (fm) issues.push(`dangerous flag: ${fm[0]}`);
      }

      for (const reg of SUSPICIOUS_REGISTRY) {
        const rre = new RegExp(reg.source, reg.flags);
        const rm = rre.exec(text);
        if (rm) issues.push(`suspicious registry: ${rm[0].trim()}`);
      }

      const unique = [...new Set(issues)];
      const triggered = unique.length > 0;

      return {
        guardName: 'codegen-dependency-risk',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Dependency risk: ${unique.slice(0, 3).join('; ')}${unique.length > 3 ? ` (+${unique.length - 3} more)` : ''}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              issues: unique,
              reason:
                'Code references risky or suspicious package dependencies',
            }
          : undefined,
      };
    },
  };
}
