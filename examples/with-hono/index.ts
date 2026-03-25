/**
 * Example: Hono with open-guardrail
 *
 * Lightweight guard middleware — works on Node.js,
 * Cloudflare Workers, Deno, and Bun.
 *
 * Usage:
 *   pnpm start
 *   curl -X POST http://localhost:3000/api/chat \
 *     -H 'Content-Type: application/json' \
 *     -d '{"message":"Hello, how are you?"}'
 */
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { pipe, promptInjection, pii, keyword } from 'open-guardrail';
import { createGuardrailMiddleware } from 'open-guardrail-hono';

const app = new Hono();

// Create guardrail middleware
const guardrail = createGuardrailMiddleware({
  input: pipe(
    promptInjection({ action: 'block' }),
    keyword({ denied: ['hack', 'exploit', 'jailbreak'], action: 'block' }),
    pii({ entities: ['email', 'phone', 'ssn'], action: 'mask' }),
  ),
});

// Apply guardrail to chat endpoint
app.post('/api/chat', guardrail, async (c) => {
  const body = c.get('guardrailBody' as never) ?? await c.req.json();
  const result = c.get('guardrailResult' as never);

  return c.json({
    reply: `You said: ${(body as any).message}`,
    guarded: result ? true : false,
  });
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

console.log('Server running on http://localhost:3000');
serve({ fetch: app.fetch, port: 3000 });
