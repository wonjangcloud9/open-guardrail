/**
 * Example: Using a guard plugin with open-guardrail.
 */
import { GuardRegistry, pipe } from 'open-guardrail-core';
import { promptInjection } from 'open-guardrail-guards';
import { myPlugin } from './my-plugin.js';

// ─── Method 1: Use plugin with GuardRegistry ───

const registry = new GuardRegistry();
registry.use(myPlugin);

console.log('Registered plugins:', registry.plugins());
console.log('All guard types:', registry.list());
console.log();

// Resolve guards from registry
const emojiGuard = registry.resolve('no-emoji', { action: 'block' });
const sentenceGuard = registry.resolve('max-sentences', { action: 'warn', max: 3 });

// ─── Method 2: Use plugin guards directly in pipe() ───

const pipeline = pipe(
  promptInjection({ action: 'block' }),
  emojiGuard,
  sentenceGuard,
);

// Test with various inputs
const tests = [
  'Hello, how are you?',
  'Hello! 🎉 Great to see you!',
  'One. Two. Three. Four. Five sentences here.',
];

for (const text of tests) {
  const result = await pipeline.run(text);
  console.log(`Input:  "${text}"`);
  console.log(`Passed: ${result.passed} (${result.action})`);
  for (const r of result.results) {
    if (r.action !== 'allow') {
      console.log(`  → ${r.guardName}: ${r.action} — ${r.message}`);
    }
  }
  console.log();
}
