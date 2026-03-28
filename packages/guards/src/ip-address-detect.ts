import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface IpAddressDetectOptions {
  action: 'block' | 'warn';
  allowPrivate?: boolean;
}

const IPV4_PATTERN = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g;
const IPV6_PATTERN = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g;

function isPrivateOrLocalhost(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '0.0.0.0') return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (ip === '::1') return true;
  return false;
}

export function ipAddressDetect(options: IpAddressDetectOptions): Guard {
  const allowPrivate = options.allowPrivate ?? true;

  return {
    name: 'ip-address-detect',
    version: '0.1.0',
    description: 'Detects IP addresses (v4 and v6)',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const v4 = text.match(IPV4_PATTERN) ?? [];
      const v6 = text.match(IPV6_PATTERN) ?? [];
      let allIps = [...v4, ...v6];

      if (allowPrivate) {
        allIps = allIps.filter((ip) => !isPrivateOrLocalhost(ip));
      }

      const triggered = allIps.length > 0;

      return {
        guardName: 'ip-address-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(allIps.length / 3, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { ipCount: allIps.length } : undefined,
      };
    },
  };
}
