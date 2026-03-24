## Task 6: Open Source Infrastructure

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`
- Create: `.github/ISSUE_TEMPLATE/feature_request.md`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Create CONTRIBUTING.md**

```markdown
# Contributing to open-guardrail

Thank you for contributing!

## Development Setup

```bash
git clone https://github.com/wonjangcloud9/open-guardrail.git
cd open-guardrail
pnpm install
pnpm build
pnpm test
```

Requirements: Node.js >= 18, pnpm >= 9

## Making Changes

1. Fork the repo and create a branch (`git checkout -b feat/my-feature`)
2. Write tests first (TDD)
3. Implement your changes
4. Run `pnpm test` and `pnpm build`
5. Commit using conventional commits (`feat:`, `fix:`, `docs:`)
6. Open a Pull Request

## Creating a Custom Guard

Implement the `Guard` interface from `open-guardrail-core`:

```typescript
import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

export function myGuard(options: MyOptions): Guard {
  return {
    name: 'my-guard',
    version: '1.0.0',
    description: 'What it does',
    category: 'custom',
    supportedStages: ['input', 'output'],
    async check(text: string, ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      // your logic here
      return {
        guardName: 'my-guard',
        passed: true,
        action: 'allow',
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}
```

## Code Style

- TypeScript strict mode
- ESLint + Prettier (run `pnpm lint`)
- Small functions, early returns, meaningful names

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
```

- [ ] **Step 2: Create SECURITY.md**

```markdown
# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities through [GitHub Security Advisories](https://github.com/wonjangcloud9/open-guardrail/security/advisories/new).

**Do NOT open a public issue for security vulnerabilities.**

## Response Timeline

- **Acknowledgment:** within 48 hours
- **Initial assessment:** within 5 business days
- **Patch release:** within 7 days of confirmation

## Scope

- Core engine (`open-guardrail-core`)
- Built-in guards (`open-guardrail-guards`)
- CLI (`open-guardrail-cli`)

## Supported Versions

| Version | Supported |
|---------|-----------|
| >= 0.5.x | Yes |
| < 0.5.0 | No |
```

- [ ] **Step 3: Create .github/ISSUE_TEMPLATE/bug_report.md**

```markdown
---
name: Bug Report
about: Report a bug
labels: bug
---

## Description

A clear description of the bug.

## Steps to Reproduce

1.
2.
3.

## Expected Behavior



## Actual Behavior



## Environment

- Node.js version:
- Package version:
- OS:
```

- [ ] **Step 4: Create .github/ISSUE_TEMPLATE/feature_request.md**

```markdown
---
name: Feature Request
about: Suggest a new feature
labels: enhancement
---

## Problem

What problem does this solve?

## Proposed Solution

How should it work?

## Alternatives Considered

Other approaches you've thought about.
```

- [ ] **Step 5: Create .github/PULL_REQUEST_TEMPLATE.md**

```markdown
## Summary

Brief description of changes.

## Changes

-
-

## Test Plan

- [ ] Tests added/updated
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes

## Checklist

- [ ] Follows existing code style
- [ ] No breaking changes (or documented)
```

- [ ] **Step 6: Commit**

```bash
git add CONTRIBUTING.md SECURITY.md .github/ISSUE_TEMPLATE/ .github/PULL_REQUEST_TEMPLATE.md
git commit -m "docs: add CONTRIBUTING, SECURITY, issue/PR templates"
```
