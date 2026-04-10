import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenCryptoMisuseOptions {
  action: 'block' | 'warn';
}

const WEAK_HASH: RegExp[] = [
  /\bMD5\s*\(/g,
  /\bmd5\s*\(/g,
  /\bSHA1\s*\(/g,
  /\bsha1\s*\(/g,
  /hashlib\.md5\s*\(/g,
  /hashlib\.sha1\s*\(/g,
  /crypto\.createHash\(\s*['"]md5['"]\s*\)/g,
  /crypto\.createHash\(\s*['"]sha1['"]\s*\)/g,
];

const WEAK_ENCRYPTION: RegExp[] = [
  /\bDES\b/g,
  /\bRC4\b/g,
  /\bECB\b/g,
  /\bBlowfish\b/gi,
  /DES\.new\s*\(/g,
  /DESede/g,
  /AES\.MODE_ECB/g,
  /mode:\s*['"]ECB['"]/g,
];

const HARDCODED_IV: RegExp[] = [
  /\biv\s*=\s*b"/gi,
  /\biv\s*=\s*"/gi,
  /\bIV\s*=\s*"/g,
  /\bnonce\s*=\s*b"/g,
  /\bnonce\s*=\s*"/g,
];

const INSECURE_RANDOM: RegExp[] = [
  /Math\.random\s*\(\)/g,
  /random\.random\s*\(\)/g,
  /\brand\s*\(\s*\)/g,
];

const NO_SALT: RegExp[] = [
  /\.hashpw\s*\([^,)]+\)/g,
  /pbkdf2.*iterations\s*=\s*[12]\b/gi,
  /hash\s*\(\s*password\s*\)/gi,
];

export function codegenCryptoMisuse(
  options: CodegenCryptoMisuseOptions,
): Guard {
  const allPatterns = [
    ...WEAK_HASH,
    ...WEAK_ENCRYPTION,
    ...HARDCODED_IV,
    ...INSECURE_RANDOM,
    ...NO_SALT,
  ];

  return {
    name: 'codegen-crypto-misuse',
    version: '0.1.0',
    description:
      'Detect cryptographic misuse in generated code (CWE-327)',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const matched: string[] = [];

      for (const pattern of allPatterns) {
        const re = new RegExp(pattern.source, pattern.flags);
        const m = re.exec(text);
        if (m) matched.push(m[0].trim());
      }

      const unique = [...new Set(matched)];
      const triggered = unique.length > 0;

      return {
        guardName: 'codegen-crypto-misuse',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `Crypto misuse detected: ${unique.slice(0, 3).join(', ')}${unique.length > 3 ? ` (+${unique.length - 3} more)` : ''}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              matched: unique,
              reason:
                'Code contains weak or insecure cryptographic patterns',
            }
          : undefined,
      };
    },
  };
}
