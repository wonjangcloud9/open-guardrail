## Task 4: Examples — custom-guard + with-express

**Files:**
- Create: `examples/custom-guard/package.json`
- Create: `examples/custom-guard/my-guard.ts`
- Create: `examples/custom-guard/index.ts`
- Create: `examples/custom-guard/README.md`
- Create: `examples/with-express/package.json`
- Create: `examples/with-express/server.ts`
- Create: `examples/with-express/README.md`

- [ ] **Step 1: Create examples/custom-guard/package.json**

```json
{
  "name": "example-custom-guard",
  "private": true,
  "type": "module",
  "scripts": { "start": "npx tsx index.ts" },
  "dependencies": { "open-guardrail": "workspace:*" },
  "devDependencies": { "tsx": "^4.0.0" }
}
```

- [ ] **Step 2: Create examples/custom-guard/my-guard.ts**

```typescript
import type { Guard, GuardResult, GuardContext } from 'open-guardrail';

interface UrlBlockerOptions {
  action: 'block' | 'warn';
}

export function urlBlocker(options: UrlBlockerOptions): Guard {
  const URL_REGEX = /https?:\/\/[^\s]+/gi;

  return {
    name: 'url-blocker',
    version: '1.0.0',
    description: 'Blocks messages containing URLs',
    category: 'custom',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches = text.match(URL_REGEX);
      const triggered = matches !== null && matches.length > 0;

      return {
        guardName: 'url-blocker',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { urls: matches } : undefined,
      };
    },
  };
}
```

- [ ] **Step 3: Create examples/custom-guard/index.ts**

```typescript
import { pipe, promptInjection } from 'open-guardrail';
import { urlBlocker } from './my-guard.js';

async function main() {
  const pipeline = pipe(
    promptInjection({ action: 'block' }),
    urlBlocker({ action: 'block' }),
  );

  const safe = await pipeline.run('Hello, how are you?');
  console.log('Safe:', safe.passed);

  const blocked = await pipeline.run('Check out https://evil.com/phish');
  console.log('URL blocked:', blocked.passed, blocked.details);
}

main();
```

- [ ] **Step 4: Create examples/custom-guard/README.md**

```markdown
# Custom Guard

Shows how to create a custom guard implementing the Guard interface.

## Run

```bash
pnpm install
pnpm start
```
```

- [ ] **Step 5: Create examples/with-express/package.json**

```json
{
  "name": "example-with-express",
  "private": true,
  "type": "module",
  "scripts": { "start": "npx tsx server.ts" },
  "dependencies": {
    "open-guardrail": "workspace:*",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "@types/express": "^5.0.0"
  }
}
```

- [ ] **Step 6: Create examples/with-express/server.ts**

```typescript
import express from 'express';
import { pipe, promptInjection, pii, keyword } from 'open-guardrail';

const app = express();
app.use(express.json());

const inputGuard = pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email', 'phone'], action: 'mask' }),
  keyword({ denied: ['hack', 'exploit'], action: 'block' }),
);

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  const result = await inputGuard.run(message);
  if (!result.passed) {
    res.status(400).json({ error: 'Input blocked', action: result.action });
    return;
  }

  // Use result.output (masked) or original message
  const safeMessage = result.output ?? message;
  res.json({ reply: `Echo: ${safeMessage}` });
});

app.listen(3000, () => console.log('Server on http://localhost:3000'));
```

- [ ] **Step 7: Create examples/with-express/README.md**

```markdown
# Express Middleware

Express server with open-guardrail as input middleware.

## Run

```bash
pnpm install
pnpm start
# Test: curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"hello"}'
```
```

- [ ] **Step 8: Commit**

```bash
git add examples/custom-guard/ examples/with-express/
git commit -m "feat(examples): add custom-guard and Express middleware examples"
```
