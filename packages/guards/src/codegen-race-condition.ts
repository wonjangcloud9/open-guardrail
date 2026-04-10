import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenRaceConditionOptions {
  action: 'block' | 'warn';
}

const TOCTOU_PAIRS: Array<{ check: RegExp; act: RegExp; label: string }> = [
  {
    check: /fs\.existsSync\s*\(/,
    act: /fs\.(?:readFileSync|writeFileSync|unlinkSync)\s*\(/,
    label: 'fs_toctou',
  },
  {
    check: /fs\.access\s*\(/,
    act: /fs\.(?:readFile|writeFile|unlink)\s*\(/,
    label: 'fs_async_toctou',
  },
  {
    check: /os\.path\.exists\s*\(/,
    act: /open\s*\(/,
    label: 'python_toctou',
  },
  {
    check: /os\.path\.isfile\s*\(/,
    act: /open\s*\(/,
    label: 'python_isfile_toctou',
  },
];

const SHARED_STATE_PATTERNS: RegExp[] = [
  /\bglobal\s+\w+/,
  /\bstatic\s+mut\s+/,
  /\blet\s+\w+\s*=\s*\{\};\s*[\s\S]*?async\s+function\b/,
];

const SELECT_UPDATE_PATTERN =
  /SELECT\b[\s\S]{1,300}?UPDATE\b/i;

const LOCK_INDICATORS: RegExp[] = [
  /mutex/i,
  /\.lock\s*\(/,
  /synchronized/i,
  /atomic/i,
  /BEGIN\s+TRANSACTION/i,
  /\.transaction\s*\(/i,
  /FOR\s+UPDATE/i,
  /asyncio\.Lock/i,
  /threading\.Lock/i,
  /Semaphore/i,
];

/**
 * Detects potential race condition patterns in generated code (CWE-362).
 * Flags TOCTOU, shared mutable state, and non-atomic operations.
 */
export function codegenRaceCondition(
  options: CodegenRaceConditionOptions,
): Guard {
  return {
    name: 'codegen-race-condition',
    version: '0.1.0',
    description:
      'Detect race condition patterns in generated code (CWE-362)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const findings: string[] = [];

      const hasLock = LOCK_INDICATORS.some((p) =>
        p.test(text),
      );

      for (const pair of TOCTOU_PAIRS) {
        if (pair.check.test(text) && pair.act.test(text)) {
          findings.push(`toctou:${pair.label}`);
        }
      }

      if (!hasLock) {
        for (const pattern of SHARED_STATE_PATTERNS) {
          if (pattern.test(text)) {
            findings.push(
              `shared_state:${pattern.source}`,
            );
          }
        }

        if (SELECT_UPDATE_PATTERN.test(text)) {
          findings.push(
            'non_atomic:SELECT_then_UPDATE_without_transaction',
          );
        }
      }

      const triggered = findings.length > 0;

      return {
        guardName: 'codegen-race-condition',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Race condition risk: ${findings.length} pattern(s) found`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              matchCount: findings.length,
              findings,
              reason:
                'CWE-362: Potential race condition or TOCTOU vulnerability',
            }
          : undefined,
      };
    },
  };
}
