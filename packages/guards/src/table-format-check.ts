import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface TableFormatCheckOptions {
  action: 'block' | 'warn';
}

export function tableFormatCheck(options: TableFormatCheckOptions): Guard {
  return {
    name: 'table-format-check',
    version: '0.1.0',
    description: 'Validates markdown table formatting',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const tablePattern = /(?:^|\n)(\|.+\|(?:\n\|.+\|)+)/g;
      let tableMatch: RegExpExecArray | null;

      while ((tableMatch = tablePattern.exec(text)) !== null) {
        const rows = tableMatch[1].trim().split('\n');
        if (rows.length < 2) continue;

        const colCounts = rows.map((r) =>
          r.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).length,
        );
        const headerCols = colCounts[0];

        for (let i = 1; i < colCounts.length; i++) {
          if (colCounts[i] !== headerCols) {
            issues.push(`Row ${i + 1} has ${colCounts[i]} cols, expected ${headerCols}`);
          }
        }

        if (rows.length >= 2) {
          const sepRow = rows[1];
          if (!/^\|[\s:]*-+[\s:]*\|/.test(sepRow)) {
            issues.push('Missing or invalid alignment row');
          }
        }

        for (let i = 0; i < rows.length; i++) {
          const cells = rows[i].split('|').slice(1, -1);
          for (let j = 0; j < cells.length; j++) {
            if (cells[j].trim() === '' && i !== 1) {
              issues.push(`Empty cell at row ${i + 1}, col ${j + 1}`);
            }
          }
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 4, 1.0) : 0;

      return {
        guardName: 'table-format-check',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
