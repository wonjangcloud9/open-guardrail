import { readFileSync, existsSync } from 'node:fs';
import { parseConfig, validateConfig } from 'open-guardrail-core';

interface ValidateResult {
  valid: boolean;
  errors?: string[];
}

export async function runValidate(filePath: string): Promise<ValidateResult> {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const raw = parseConfig(content);
  const result = validateConfig(raw);

  if (result.success) {
    return { valid: true };
  }
  return { valid: false, errors: result.errors };
}
