import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface VehicleIdDetectOptions {
  action: 'block' | 'warn';
}

const VIN_PATTERN = /\b[A-HJ-NPR-Z0-9]{17}\b/g;
const US_PLATE = /\b[A-Z]{1,3}\s?\d{1,4}\s?[A-Z]{0,3}\b/;
const EU_PLATE = /\b[A-Z]{1,3}\s?-?\s?\d{1,4}\s?-?\s?[A-Z]{1,3}\b/;

export function vehicleIdDetect(options: VehicleIdDetectOptions): Guard {
  return {
    name: 'vehicle-id-detect',
    version: '0.1.0',
    description: 'Detects VINs and license plate patterns',
    category: 'privacy',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const vins = text.match(VIN_PATTERN) ?? [];
      const hasUsPlate = US_PLATE.test(text);
      const hasEuPlate = EU_PLATE.test(text);
      const vinCount = vins.length;
      const plateCount = (hasUsPlate ? 1 : 0) + (hasEuPlate ? 1 : 0);
      const triggered = vinCount > 0;

      return {
        guardName: 'vehicle-id-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min((vinCount + plateCount) / 2, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { vinCount, plateCount }
          : undefined,
      };
    },
  };
}
