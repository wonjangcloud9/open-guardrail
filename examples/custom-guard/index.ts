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
  console.log('URL blocked:', blocked.passed, blocked.action);
}

main();
