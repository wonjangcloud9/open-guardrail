import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ErrorMessageSafetyOptions {
  action: 'block' | 'warn';
}

const PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'stack_trace', re: /at\s+\S+\s+\(\S+:\d+:\d+\)/i },
  { name: 'stack_trace_py', re: /File\s+"[^"]+",\s+line\s+\d+/i },
  { name: 'file_path_unix', re: /\/(?:home|usr|var|etc|opt|tmp)\/\S+/i },
  { name: 'file_path_win', re: /[A-Z]:\\(?:Users|Windows|Program\s?Files)\\\S+/i },
  { name: 'db_connection', re: /(?:mysql|postgres|mongodb|redis):\/\/\S+/i },
  { name: 'internal_ip', re: /(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})/i },
  { name: 'server_version', re: /(?:apache|nginx|iis|tomcat|express)\/\d+\.\d+/i },
  { name: 'debug_info', re: /(?:DEBUG|TRACE|stack\s*trace|traceback)\s*[:=]/i },
  { name: 'env_variable', re: /(?:DB_PASSWORD|SECRET_KEY|API_KEY|AWS_SECRET)\s*[=:]/i },
  { name: 'sql_error', re: /(?:ORA-\d{5}|ERROR\s+\d+\s+\(\d+\)|syntax\s+error\s+at\s+or\s+near)/i },
];

export function errorMessageSafety(options: ErrorMessageSafetyOptions): Guard {
  return {
    name: 'error-message-safety',
    version: '0.1.0',
    description: 'Ensures error messages do not leak sensitive information',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const p of PATTERNS) {
        if (p.re.test(text)) {
          matched.push(p.name);
        }
      }

      const triggered = matched.length > 0;
      const score = triggered ? Math.min(matched.length / 3, 1.0) : 0;

      return {
        guardName: 'error-message-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matched } : undefined,
      };
    },
  };
}
