import { describe, it, expect } from 'vitest';
import { parseConfig, validateConfig } from '../src/config-loader.js';

const validYaml = `
version: "1"
pipelines:
  input:
    mode: fail-fast
    onError: block
    timeoutMs: 3000
    guards:
      - type: keyword
        action: block
        config:
          denied: ["bad"]
  output:
    mode: run-all
    guards:
      - type: word-count
        action: warn
        config:
          max: 500
`;

describe('Config Loader', () => {
  it('parses valid YAML string', () => {
    const config = parseConfig(validYaml);
    expect(config.version).toBe('1');
    expect(config.pipelines).toBeDefined();
  });

  it('validates config structure', () => {
    const config = parseConfig(validYaml);
    const result = validateConfig(config);
    expect(result.success).toBe(true);
  });

  it('rejects invalid version', () => {
    const bad = `
version: "99"
pipelines:
  input:
    guards:
      - type: keyword
        action: block
`;
    const config = parseConfig(bad);
    const result = validateConfig(config);
    expect(result.success).toBe(false);
  });

  it('rejects invalid action', () => {
    const bad = `
version: "1"
pipelines:
  input:
    guards:
      - type: keyword
        action: destroy
`;
    const config = parseConfig(bad);
    const result = validateConfig(config);
    expect(result.success).toBe(false);
  });

  it('rejects empty guards array', () => {
    const bad = `
version: "1"
pipelines:
  input:
    guards: []
`;
    const config = parseConfig(bad);
    const result = validateConfig(config);
    expect(result.success).toBe(false);
  });

  it('accepts mask action', () => {
    const yaml = `
version: "1"
pipelines:
  input:
    guards:
      - type: pii
        action: mask
`;
    const config = parseConfig(yaml);
    const result = validateConfig(config);
    expect(result.success).toBe(true);
  });
});
