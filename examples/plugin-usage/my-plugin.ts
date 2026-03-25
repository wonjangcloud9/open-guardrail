/**
 * Example: Creating a guard plugin.
 *
 * A plugin bundles one or more guards with metadata.
 * Community members can publish plugins as npm packages
 * following this pattern.
 */
import type { Guard, GuardPlugin } from 'open-guardrail-core';

function noEmoji(config: Record<string, unknown>): Guard {
  const action = (config.action as 'block' | 'warn') ?? 'warn';
  const emojiPattern = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;

  return {
    name: 'no-emoji',
    version: '1.0.0',
    description: 'Block or warn when text contains emoji',
    category: 'content',
    supportedStages: ['input', 'output'],
    async check(text, _ctx) {
      const start = performance.now();
      const hasEmoji = emojiPattern.test(text);
      return {
        guardName: 'no-emoji',
        passed: !hasEmoji,
        action: hasEmoji ? action : 'allow',
        message: hasEmoji ? 'Text contains emoji' : undefined,
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}

function maxSentences(config: Record<string, unknown>): Guard {
  const action = (config.action as 'block' | 'warn') ?? 'warn';
  const max = (config.max as number) ?? 10;

  return {
    name: 'max-sentences',
    version: '1.0.0',
    description: 'Limit the number of sentences',
    category: 'format',
    supportedStages: ['input', 'output'],
    async check(text, _ctx) {
      const start = performance.now();
      const count = text.split(/[.!?]+/).filter(Boolean).length;
      const exceeded = count > max;
      return {
        guardName: 'max-sentences',
        passed: !exceeded,
        action: exceeded ? action : 'allow',
        message: exceeded ? `${count} sentences (max ${max})` : undefined,
        latencyMs: Math.round(performance.now() - start),
      };
    },
  };
}

/** The plugin export — register with registry.use(myPlugin) */
export const myPlugin: GuardPlugin = {
  meta: {
    name: 'my-custom-guards',
    version: '1.0.0',
    description: 'Example plugin with no-emoji and max-sentences guards',
    author: 'Lucas',
    tags: ['content', 'format'],
  },
  guards: {
    'no-emoji': noEmoji,
    'max-sentences': maxSentences,
  },
};
