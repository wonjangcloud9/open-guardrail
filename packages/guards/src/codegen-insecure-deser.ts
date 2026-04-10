import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenInsecureDeserOptions {
  action: 'block' | 'warn';
}

const DESER_PATTERNS: { re: RegExp; label: string }[] = [
  // Python
  { re: /pickle\.loads?\s*\(/, label: 'Python pickle.load(s)' },
  { re: /yaml\.load\s*\([^)]*(?!\bLoader\s*=\s*SafeLoader)[^)]*\)/, label: 'Python yaml.load without SafeLoader' },
  { re: /yaml\.load\s*\(\s*[^,)]+\s*\)/, label: 'Python yaml.load (no Loader arg)' },
  { re: /marshal\.loads?\s*\(/, label: 'Python marshal.load(s)' },
  { re: /shelve\.open\s*\(/, label: 'Python shelve.open' },
  // Java
  { re: /ObjectInputStream/, label: 'Java ObjectInputStream' },
  { re: /\.readObject\s*\(/, label: 'Java readObject()' },
  { re: /XMLDecoder/, label: 'Java XMLDecoder' },
  { re: /XStream\s*\(\s*\)/, label: 'Java XStream' },
  // PHP
  { re: /\bunserialize\s*\(/, label: 'PHP unserialize()' },
  { re: /maybe_unserialize\s*\(/, label: 'PHP maybe_unserialize()' },
  // Ruby
  { re: /Marshal\.load\s*\(/, label: 'Ruby Marshal.load' },
  { re: /YAML\.load\s*\([^)]*(?!safe)[^)]*\)/i, label: 'Ruby YAML.load (unsafe)' },
  // Node.js
  { re: /eval\s*\(\s*JSON\.parse\s*\(/, label: 'eval(JSON.parse())' },
  { re: /node-serialize/, label: 'node-serialize (known vulnerable)' },
  { re: /serialize-javascript/, label: 'serialize-javascript' },
  // .NET
  { re: /BinaryFormatter/, label: '.NET BinaryFormatter' },
  { re: /SoapFormatter/, label: '.NET SoapFormatter' },
];

/**
 * Detects insecure deserialization patterns in generated code (CWE-502).
 * Flags pickle, yaml.load without SafeLoader, ObjectInputStream,
 * unserialize, Marshal.load, and other known-dangerous deserializers.
 */
export function codegenInsecureDeser(
  options: CodegenInsecureDeserOptions,
): Guard {
  return {
    name: 'codegen-insecure-deser',
    version: '0.1.0',
    description:
      'Detect insecure deserialization patterns (CWE-502)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const findings: string[] = [];

      for (const { re, label } of DESER_PATTERNS) {
        if (re.test(text)) {
          findings.push(label);
        }
      }

      const triggered = findings.length > 0;

      return {
        guardName: 'codegen-insecure-deser',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Insecure deserialization risk: ${findings.join(', ')}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? { findings, reason: 'CWE-502: Insecure deserialization patterns detected' }
          : undefined,
      };
    },
  };
}
