/**
 * Example: Express with open-guardrail middleware adapter
 *
 * Usage:
 *   pnpm start
 *   curl -X POST http://localhost:3000/api/chat \
 *     -H 'Content-Type: application/json' \
 *     -d '{"message":"Hello, how are you?"}'
 */
import express from 'express';
import { pipe, promptInjection, pii, keyword } from 'open-guardrail';
import { createGuardrailMiddleware, createOutputGuard } from 'open-guardrail-express';

const app = express();
app.use(express.json());

// ─── Input guardrail middleware ───
const guardrail = createGuardrailMiddleware({
  input: pipe(
    promptInjection({ action: 'block' }),
    pii({ entities: ['email', 'phone'], action: 'mask' }),
    keyword({ denied: ['hack', 'exploit'], action: 'block' }),
  ),
  onBlocked: (result, _req, res) => {
    const blocker = result.results.find((r) => r.action === 'block');
    res.status(403).json({
      error: 'Input blocked by guardrail',
      guard: blocker?.guardName,
      message: blocker?.message,
    });
  },
});

// ─── Output guard ───
const guardOutput = createOutputGuard({
  output: pipe(pii({ entities: ['email', 'phone'], action: 'mask' })),
});

// ─── Routes ───
app.post('/api/chat', guardrail, async (req, res) => {
  // req.body.message is now safe (PII masked if needed)
  const safeMessage = req.body.message;

  // Simulate LLM response
  const llmResponse = `You said: ${safeMessage}. Contact us at support@example.com`;

  // Guard output before sending
  const outputResult = await guardOutput(llmResponse);
  res.json({ reply: outputResult.output ?? llmResponse });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(3000, () => console.log('Server on http://localhost:3000'));
