import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface FileSystemGuardOptions {
  action: 'block' | 'warn';
  allowedPaths?: string[];
  deniedExtensions?: string[];
}

const DANGEROUS_PATHS = [
  '/etc/passwd',
  '/etc/shadow',
  '~/.ssh',
  '/root',
  '/proc',
  '/sys',
  'C:\\Windows\\System32',
];

const DANGEROUS_OPS = ['unlink', 'rmdir', 'chmod 777', 'chown root', 'mkfs', 'fdisk'];

const DEFAULT_DENIED_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.dll', '.so', '.dylib'];

const PATH_PATTERN = /(?:\/[\w.~-]+){2,}|[A-Z]:\\[\w.~\\-]+/gi;

export function fileSystemGuard(options: FileSystemGuardOptions): Guard {
  const deniedExtensions = options.deniedExtensions ?? DEFAULT_DENIED_EXTENSIONS;
  const allowedPaths = options.allowedPaths;

  return {
    name: 'file-system-guard',
    version: '0.1.0',
    description: 'Detects dangerous file system operations',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const lower = text.toLowerCase();
      const reasons: string[] = [];

      for (const dp of DANGEROUS_PATHS) {
        if (lower.includes(dp.toLowerCase())) {
          reasons.push(`dangerous path: ${dp}`);
        }
      }

      for (const op of DANGEROUS_OPS) {
        if (lower.includes(op.toLowerCase())) {
          reasons.push(`dangerous operation: ${op}`);
        }
      }

      for (const ext of deniedExtensions) {
        const re = new RegExp(`\\S+${ext.replace('.', '\\.')}\\b`, 'gi');
        if (re.test(text)) {
          reasons.push(`denied extension: ${ext}`);
        }
      }

      if (allowedPaths && allowedPaths.length > 0) {
        const detectedPaths = text.match(PATH_PATTERN) || [];
        for (const detected of detectedPaths) {
          const withinAllowed = allowedPaths.some((ap) => detected.startsWith(ap));
          if (!withinAllowed) {
            reasons.push(`path outside allowed: ${detected}`);
          }
        }
      }

      const triggered = reasons.length > 0;
      return {
        guardName: 'file-system-guard',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { reasons } : undefined,
      };
    },
  };
}
