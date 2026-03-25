/**
 * Example: Fastify with open-guardrail plugin
 *
 * Usage:
 *   pnpm start
 *   curl -X POST http://localhost:3000/api/chat \
 *     -H 'Content-Type: application/json' \
 *     -d '{"message":"Hello, how are you?"}'
 */
import Fastify from 'fastify';
import { pipe, promptInjection, pii, keyword } from 'open-guardrail';
import { createGuardrailPlugin } from 'open-guardrail-fastify';

const app = Fastify({ logger: true });

// Register guardrail plugin
app.register(createGuardrailPlugin({
  input: pipe(
    promptInjection({ action: 'block' }),
    keyword({ denied: ['hack', 'exploit', 'jailbreak'], action: 'block' }),
    pii({ entities: ['email', 'phone', 'ssn'], action: 'mask' }),
  ),
}));

app.post('/api/chat', async (request, reply) => {
  const body = request.body as { message: string };
  reply.send({ reply: `You said: ${body.message}` });
});

app.get('/health', async () => ({ status: 'ok' }));

app.listen({ port: 3000 }, () => {
  console.log('Server on http://localhost:3000');
});
