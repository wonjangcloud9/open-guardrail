import { parse as parseYaml } from 'yaml';
import { configSchema, type RawConfig } from './config-schema.js';

export function parseConfig(yamlOrJson: string): Record<string, unknown> {
  return parseYaml(yamlOrJson, { prettyErrors: true }) as Record<string, unknown>;
}

export function validateConfig(raw: unknown): { success: true; data: RawConfig } | { success: false; errors: string[] } {
  const result = configSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  };
}

export function loadConfigFromString(yamlOrJson: string): RawConfig {
  const raw = parseConfig(yamlOrJson);
  const result = validateConfig(raw);
  if (!result.success) {
    throw new Error(`Invalid config:\n${result.errors.join('\n')}`);
  }
  return result.data;
}
