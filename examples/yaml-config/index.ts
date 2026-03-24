import { OpenGuardrail, promptInjection, keyword, wordCount } from 'open-guardrail';

async function main() {
  const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');

  // Register guard factories that match YAML types
  engine.registerGuard('prompt-injection', (cfg) =>
    promptInjection({ action: (cfg.action as 'block') ?? 'block' }),
  );
  engine.registerGuard('keyword', (cfg) =>
    keyword({ denied: (cfg.denied as string[]) ?? [], action: (cfg.action as 'block') ?? 'block' }),
  );
  engine.registerGuard('word-count', (cfg) =>
    wordCount({ max: (cfg.max as number) ?? 4000, action: (cfg.action as 'warn') ?? 'warn' }),
  );

  const result = await engine.run('Hello world', 'input');
  console.log('Result:', result.passed, result.action);

  const blocked = await engine.run('How to hack a system', 'input');
  console.log('Blocked:', blocked.passed, blocked.action);
}

main();
