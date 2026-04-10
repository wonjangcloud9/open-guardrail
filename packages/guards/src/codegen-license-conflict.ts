import type {
  Guard,
  GuardResult,
  GuardContext,
} from 'open-guardrail-core';

interface CodegenLicenseConflictOptions {
  action: 'block' | 'warn';
  projectLicense?: string;
}

const PERMISSIVE = new Set([
  'mit',
  'apache-2.0',
  'apache',
  'bsd-2-clause',
  'bsd-3-clause',
  'bsd',
  'isc',
  'unlicense',
  'cc0',
]);

const COPYLEFT_PATTERNS: RegExp[] = [
  /\bGPL\b/g,
  /\bAGPL\b/g,
  /\bLGPL\b/g,
  /\bSSPL\b/g,
  /\bEUPL\b/g,
  /GPLv[23]/g,
  /AGPL-3\.0/g,
  /GNU\s+General\s+Public/gi,
  /GNU\s+Affero/gi,
  /Licensed\s+under\s+(the\s+)?GPL/gi,
  /Licensed\s+under\s+(the\s+)?AGPL/gi,
  /Licensed\s+under\s+(the\s+)?LGPL/gi,
];

const PROPRIETARY_PATTERNS: RegExp[] = [
  /All\s+rights\s+reserved/gi,
  /\bproprietary\b/gi,
  /\bconfidential\s+and\s+proprietary\b/gi,
  /do\s+not\s+distribute/gi,
  /not\s+for\s+redistribution/gi,
];

const COPYRIGHT_PATTERN =
  /Copyright\s+\(c\)\s+\d{4}/gi;

const LICENSE_FILE_REF: RegExp[] = [
  /see\s+(the\s+)?LICENSE\s+file/gi,
  /see\s+(the\s+)?NOTICE\s+file/gi,
  /refer\s+to\s+(the\s+)?LICENSE/gi,
];

export function codegenLicenseConflict(
  options: CodegenLicenseConflictOptions,
): Guard {
  const projLicense = (
    options.projectLicense ?? 'MIT'
  ).toLowerCase();
  const isPermissive = PERMISSIVE.has(projLicense);

  return {
    name: 'codegen-license-conflict',
    version: '0.1.0',
    description:
      'Detect potential license compliance issues in generated code',
    category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(
      text: string,
      _ctx: GuardContext,
    ): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      if (isPermissive) {
        for (const pat of COPYLEFT_PATTERNS) {
          const re = new RegExp(pat.source, pat.flags);
          const m = re.exec(text);
          if (m) {
            issues.push(
              `copyleft license "${m[0]}" incompatible with ${projLicense}`,
            );
          }
        }
      }

      for (const pat of PROPRIETARY_PATTERNS) {
        const re = new RegExp(pat.source, pat.flags);
        const m = re.exec(text);
        if (m) issues.push(`proprietary marker: "${m[0]}"`);
      }

      const crRe = new RegExp(
        COPYRIGHT_PATTERN.source,
        COPYRIGHT_PATTERN.flags,
      );
      const crm = crRe.exec(text);
      if (crm) issues.push(`third-party copyright: "${crm[0]}"`);

      for (const pat of LICENSE_FILE_REF) {
        const re = new RegExp(pat.source, pat.flags);
        const m = re.exec(text);
        if (m) issues.push(`license file reference: "${m[0]}"`);
      }

      const unique = [...new Set(issues)];
      const triggered = unique.length > 0;

      return {
        guardName: 'codegen-license-conflict',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        message: triggered
          ? `License conflict: ${unique.slice(0, 3).join('; ')}${unique.length > 3 ? ` (+${unique.length - 3} more)` : ''}`
          : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered
          ? {
              issues: unique,
              projectLicense: projLicense,
              reason:
                'Code contains license references that may conflict with project license',
            }
          : undefined,
      };
    },
  };
}
