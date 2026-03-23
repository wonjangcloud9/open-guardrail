import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATES: Record<string, string> = {
  default: `version: "1"
pipelines:
  input:
    mode: fail-fast
    onError: block
    guards:
      - type: prompt-injection
        action: block
      - type: keyword
        action: block
        config:
          denied: []
  output:
    mode: run-all
    guards:
      - type: word-count
        action: warn
        config:
          max: 4000
`,
  strict: `version: "1"
pipelines:
  input:
    mode: fail-fast
    onError: block
    timeoutMs: 3000
    guards:
      - type: prompt-injection
        action: block
      - type: pii
        action: mask
        config:
          entities: [email, phone, credit-card, ssn]
      - type: keyword
        action: block
        config:
          denied: []
  output:
    mode: run-all
    onError: block
    guards:
      - type: pii
        action: mask
        config:
          entities: [email, phone, credit-card, ssn]
      - type: word-count
        action: block
        config:
          max: 4000
`,
};

export async function runInit(targetDir: string, preset: string = 'default'): Promise<void> {
  const dest = join(targetDir, 'guardrail.yaml');
  if (existsSync(dest)) {
    throw new Error(`guardrail.yaml already exists in ${targetDir}`);
  }

  const content = TEMPLATES[preset];
  if (!content) {
    throw new Error(`Unknown preset: ${preset}. Available: ${Object.keys(TEMPLATES).join(', ')}`);
  }

  writeFileSync(dest, content, 'utf-8');
}
