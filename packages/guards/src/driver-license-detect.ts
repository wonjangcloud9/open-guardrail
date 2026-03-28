import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface DriverLicenseDetectOptions {
  action: 'block' | 'warn';
}

const DL_PATTERNS: RegExp[] = [
  /\b[A-Z]\d{7}\b/,              // CA, NY format (1 letter + 7 digits)
  /\b[A-Z]\d{12}\b/,             // FL format (1 letter + 12 digits)
  /\b[A-Z]{2}\d{6}\b/,           // some states (2 letters + 6 digits)
  /\b\d{7,9}\b/,                  // numeric only states
  /\b[A-Z]\d{3}-\d{4}-\d{4}\b/,  // WA format
  /\b[A-Z]{1}\d{4}-\d{5}-\d{5}\b/, // IL format
];

export function driverLicenseDetect(options: DriverLicenseDetectOptions): Guard {
  return {
    name: 'driver-license-detect',
    version: '0.1.0',
    description: 'Detects US driver license number patterns',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of DL_PATTERNS) {
        if (pattern.test(text)) {
          matched.push(pattern.source);
        }
      }

      const triggered = matched.length > 0;

      return {
        guardName: 'driver-license-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(matched.length / 2, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matchedPatterns: matched.length } : undefined,
      };
    },
  };
}
