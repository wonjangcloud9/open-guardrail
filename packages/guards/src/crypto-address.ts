import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CryptoAddressOptions { action: 'block' | 'warn' | 'mask'; coins?: ('bitcoin' | 'ethereum' | 'litecoin' | 'ripple' | 'solana')[]; }

const COIN_PATTERNS: Record<string, RegExp> = {
  bitcoin: /\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}\b/g,
  ethereum: /\b0x[a-fA-F0-9]{40}\b/g,
  litecoin: /\b[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}\b/g,
  ripple: /\br[0-9a-zA-Z]{24,34}\b/g,
  solana: /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g,
};
const ALL_COINS = Object.keys(COIN_PATTERNS);

export function cryptoAddress(options: CryptoAddressOptions): Guard {
  const coins = options.coins ?? ALL_COINS;
  return { name: 'crypto-address', version: '0.1.0', description: 'Detect cryptocurrency wallet addresses', category: 'privacy', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); const detected: { coin: string; address: string }[] = [];
      for (const coin of coins) { const re = new RegExp(COIN_PATTERNS[coin]?.source ?? '', 'g'); let m; while ((m = re.exec(text))) detected.push({ coin, address: m[0] }); }
      const triggered = detected.length > 0;
      if (!triggered) return { guardName: 'crypto-address', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      if (options.action === 'mask') { let r = text; for (const d of detected.sort((a, b) => text.lastIndexOf(b.address) - text.lastIndexOf(a.address))) r = r.replace(d.address, `[${d.coin.toUpperCase()}_ADDR]`); return { guardName: 'crypto-address', passed: true, action: 'override', overrideText: r, latencyMs: Math.round(performance.now() - start), details: { detected: detected.map(d => d.coin) } }; }
      return { guardName: 'crypto-address', passed: false, action: options.action, message: `Crypto address: ${detected.map(d => d.coin).join(', ')}`, latencyMs: Math.round(performance.now() - start), details: { detected, reason: 'Cryptocurrency wallet addresses detected' } };
    },
  };
}
