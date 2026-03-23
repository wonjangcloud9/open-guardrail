## Task 9: Umbrella Package (open-guardrail)

**Files:**
- Create: `packages/open-guardrail/package.json`
- Create: `packages/open-guardrail/tsconfig.json`
- Create: `packages/open-guardrail/tsup.config.ts`
- Create: `packages/open-guardrail/src/index.ts`

- [ ] **Step 1: Create packages/open-guardrail/package.json**

```json
{
  "name": "open-guardrail",
  "version": "0.1.0",
  "description": "Open-source guardrail engine for LLM applications",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@open-guardrail/core": "workspace:*",
    "@open-guardrail/guards": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.4.0"
  },
  "keywords": ["guardrail", "llm", "ai", "safety", "moderation", "pii", "prompt-injection"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/notwonjang/open-guardrail"
  }
}
```

- [ ] **Step 2: Create tsconfig + tsup config**

`packages/open-guardrail/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*"],
  "exclude": ["dist"]
}
```

`packages/open-guardrail/tsup.config.ts`:
```typescript
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true, sourcemap: true, clean: true,
  target: ['node18', 'es2022'],
});
```

- [ ] **Step 3: Create umbrella index.ts**

Create `packages/open-guardrail/src/index.ts`:

```typescript
// Core
export {
  type Guard, type GuardAction, type GuardCategory,
  type GuardContext, type GuardResult, type GuardErrorInfo,
  type GuardFactory, type PipelineOptions, type PipelineResult,
  type PipelineMode, type PipelineStage, type OnErrorAction,
  GuardError, EventBus, Pipeline, createPipeline, pipe,
  GuardRegistry, OpenGuardrail,
  configSchema, type RawConfig,
  parseConfig, validateConfig, loadConfigFromString,
} from '@open-guardrail/core';

// Guards
export {
  regex, keyword, pii, promptInjection,
  wordCount, schemaGuard,
} from '@open-guardrail/guards';
```

- [ ] **Step 4: Build all packages**

Run: `pnpm build`
Expected: all 3 packages build successfully

- [ ] **Step 5: Commit**

```bash
git add packages/open-guardrail/ && git commit -m "feat: add umbrella open-guardrail package re-exporting core + guards"
```
