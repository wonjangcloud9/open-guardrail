import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface IpGuardOptions {
  action: 'block' | 'warn' | 'mask';
  detectPrivate?: boolean;
  allowList?: string[];
  denyList?: string[];
}

const IPV4_RE = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g;
const IPV6_RE = /\b([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){7})\b/g;
const IPV6_SHORT_RE = /\b([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{0,4}){2,7})\b/g;

interface IpMatch {
  ip: string;
  type: 'ipv4' | 'ipv6';
  isPrivate: boolean;
  start: number;
  end: number;
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.some((p) => p < 0 || p > 255)) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 0) return true;
  return false;
}

function isValidIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  return parts.length === 4 && parts.every((p) => p >= 0 && p <= 255);
}

function detect(text: string): IpMatch[] {
  const matches: IpMatch[] = [];
  const re4 = new RegExp(IPV4_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re4.exec(text)) !== null) {
    if (!isValidIpv4(m[1])) continue;
    matches.push({
      ip: m[1],
      type: 'ipv4',
      isPrivate: isPrivateIpv4(m[1]),
      start: m.index,
      end: m.index + m[0].length,
    });
  }

  const re6 = new RegExp(IPV6_RE.source, 'g');
  while ((m = re6.exec(text)) !== null) {
    matches.push({
      ip: m[1],
      type: 'ipv6',
      isPrivate: m[1].startsWith('fe80') || m[1].startsWith('fc') || m[1].startsWith('fd'),
      start: m.index,
      end: m.index + m[0].length,
    });
  }

  return matches.sort((a, b) => b.start - a.start);
}

function maskIps(text: string, matches: IpMatch[]): string {
  let result = text;
  for (const m of matches) {
    result =
      result.slice(0, m.start) + '[IP_ADDRESS]' + result.slice(m.end);
  }
  return result;
}

export function ipGuard(options: IpGuardOptions): Guard {
  const detectPrivate = options.detectPrivate ?? true;

  return {
    name: 'ip-guard',
    version: '0.1.0',
    description: 'IP address detection, validation, and filtering',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      let matches = detect(text);

      if (!detectPrivate) {
        matches = matches.filter((m) => !m.isPrivate);
      }

      if (options.denyList) {
        matches = matches.filter((m) => options.denyList!.includes(m.ip));
      }

      if (options.allowList) {
        matches = matches.filter((m) => !options.allowList!.includes(m.ip));
      }

      const triggered = matches.length > 0;

      if (!triggered) {
        return {
          guardName: 'ip-guard',
          passed: true,
          action: 'allow',
          latencyMs: Math.round(performance.now() - start),
        };
      }

      if (options.action === 'mask') {
        return {
          guardName: 'ip-guard',
          passed: true,
          action: 'override',
          overrideText: maskIps(text, matches),
          latencyMs: Math.round(performance.now() - start),
          details: {
            detected: matches.map(({ ip, type, isPrivate }) => ({
              ip, type, isPrivate,
            })),
          },
        };
      }

      return {
        guardName: 'ip-guard',
        passed: false,
        action: options.action,
        latencyMs: Math.round(performance.now() - start),
        details: {
          detected: matches.map(({ ip, type, isPrivate }) => ({
            ip, type, isPrivate,
          })),
        },
      };
    },
  };
}
