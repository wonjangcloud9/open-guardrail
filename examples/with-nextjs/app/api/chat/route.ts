/**
 * Next.js App Router API route with open-guardrail
 *
 * Usage:
 *   pnpm dev
 *   curl -X POST http://localhost:3000/api/chat \
 *     -H 'Content-Type: application/json' \
 *     -d '{"message":"Hello!"}'
 */
import { pipe, promptInjection, pii, keyword } from 'open-guardrail';
import { guardApiRoute, guardResponse } from 'open-guardrail-nextjs';

const guard = guardApiRoute({
  input: pipe(
    promptInjection({ action: 'block' }),
    pii({ entities: ['email', 'phone'], action: 'mask' }),
    keyword({ denied: ['hack', 'exploit'], action: 'block' }),
  ),
});

const outputPipeline = pipe(
  pii({ entities: ['email', 'phone'], action: 'mask' }),
);

export async function POST(request: Request) {
  // Guard input — returns 403 Response if blocked
  const guarded = await guard(request);
  if (guarded instanceof Response) return guarded;

  const { body } = guarded;
  const safeMessage = body.message;

  // Simulate LLM response
  const llmResponse = `You said: ${safeMessage}. Contact support@example.com for help.`;

  // Guard output
  const safe = await guardResponse(outputPipeline, llmResponse);

  return Response.json({ reply: safe.output ?? llmResponse });
}
