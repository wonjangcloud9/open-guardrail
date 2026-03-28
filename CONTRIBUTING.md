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

## Project Structure

```
packages/
  core/         — Pipeline, Guard interface, EventBus, Config Loader
  guards/       — 350 built-in guards
  open-guardrail/ — Umbrella package (re-exports core + guards)
  cli/          — CLI tools (init, validate, list)
  adapters/     — 8 SDK adapters (OpenAI, Anthropic, Next.js, Express, ...)
python/         — Python SDK (309 guards)
benchmarks/     — Performance benchmark suite
playground/     — Interactive browser playground
docs-site/      — VitePress documentation site
examples/       — 15 usage examples
presets/         — 23 YAML preset configurations
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm bench` | Run benchmarks |
| `pnpm playground` | Start interactive playground |
| `pnpm docs:dev` | Start docs site dev server |

## Release

```bash
./scripts/release.sh 1.2.0
```

## Code Style

- TypeScript strict mode
- Small functions, early returns, meaningful names
- Comments explain "why", not "what"

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
