# Plugins

Extend open-guardrail with community-built guards.

## Using a Plugin

```typescript
import { GuardRegistry, pipe } from 'open-guardrail-core';
import { myPlugin } from 'open-guardrail-plugin-example';

const registry = new GuardRegistry();
registry.use(myPlugin);

// Resolve guards from plugin
const guard = registry.resolve('my-guard', { action: 'block' });
const pipeline = pipe(guard);
```

### With OpenGuardrail (YAML config)

```typescript
import { OpenGuardrail } from 'open-guardrail';
import { myPlugin } from 'open-guardrail-plugin-example';

const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
engine.use(myPlugin); // now YAML can reference plugin guard types
```

## Creating a Plugin

A plugin exports a `GuardPlugin` object with metadata and guard factories:

```typescript
import type { Guard, GuardPlugin } from 'open-guardrail-core';

function noEmoji(config: Record<string, unknown>): Guard {
  const action = (config.action as 'block' | 'warn') ?? 'warn';
  return {
    name: 'no-emoji',
    version: '1.0.0',
    description: 'Block emoji in text',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text, ctx) {
      const start = performance.now();
      const hasEmoji = /[\p{Emoji_Presentation}]/u.test(text);
      return {
        guardName: 'no-emoji',
        passed: !hasEmoji,
        action: hasEmoji ? action : 'allow',
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}

export const myPlugin: GuardPlugin = {
  meta: {
    name: 'my-plugin',
    version: '1.0.0',
    description: 'Custom guards for my use case',
    author: 'Your Name',
    homepage: 'https://github.com/you/open-guardrail-plugin-example',
    tags: ['content'],
  },
  guards: {
    'no-emoji': noEmoji,
  },
};
```

## Plugin API

### `GuardPlugin` interface

```typescript
interface GuardPlugin {
  meta: {
    name: string;
    version: string;
    description: string;
    author?: string;
    homepage?: string;
    tags?: string[];
  };
  guards: Record<string, (config: Record<string, unknown>) => Guard>;
}
```

### Registry methods

| Method | Description |
|--------|-------------|
| `registry.use(plugin)` | Register all guards from a plugin |
| `registry.plugins()` | List all registered plugins |
| `registry.getMeta(type)` | Get plugin metadata for a guard type |
| `registry.describe()` | List all guards with their plugin info |
| `registry.unregister(type)` | Remove a guard type |

## Publishing Convention

Name your npm package: `open-guardrail-plugin-<name>`

```json
{
  "name": "open-guardrail-plugin-my-guards",
  "peerDependencies": {
    "open-guardrail-core": ">=1.0.0"
  }
}
```
