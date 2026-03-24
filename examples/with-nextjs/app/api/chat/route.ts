import { NextResponse } from 'next/server';
import { pipe, promptInjection, pii, keyword } from 'open-guardrail';

const inputGuard = pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email', 'phone'], action: 'mask' }),
  keyword({ denied: ['hack', 'exploit'], action: 'block' }),
);

export async function POST(request: Request) {
  const { message } = await request.json();

  const result = await inputGuard.run(message);
  if (!result.passed) {
    return NextResponse.json(
      { error: 'Input blocked', action: result.action },
      { status: 400 },
    );
  }

  const safeMessage = result.output ?? message;
  return NextResponse.json({ reply: `Echo: ${safeMessage}` });
}
