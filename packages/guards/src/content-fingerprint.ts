import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface ContentFingerprintOptions {
  action: 'block' | 'warn';
  knownHashes: string[];
}

function djb2(text: string): string {
  let hash = 5381;
  const slice = text.slice(0, 200);
  for (let i = 0; i < slice.length; i++) {
    hash = ((hash << 5) + hash + slice.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16);
}

export function contentFingerprint(
  options: ContentFingerprintOptions,
): Guard {
  const hashSet = new Set(options.knownHashes);

  return {
    name: 'content-fingerprint',
    version: '0.1.0',
    description:
      'Compares content hash against known bad content hashes',
    category: 'security',
    supportedStages: ['output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const hash = djb2(text);
      const triggered = hashSet.has(hash);

      return {
        guardName: 'content-fingerprint',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: { hash, matched: triggered },
      };
    },
  };
}
