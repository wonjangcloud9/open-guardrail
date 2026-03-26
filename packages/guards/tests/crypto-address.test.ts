import { describe, it, expect } from 'vitest';
import { cryptoAddress } from '../src/crypto-address.js';
const ctx = { pipelineType: 'input' as const };
describe('crypto-address', () => {
  it('detects Ethereum address', async () => { expect((await cryptoAddress({ action: 'block', coins: ['ethereum'] }).check('Send to 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD08', ctx)).passed).toBe(false); });
  it('masks Bitcoin address', async () => { const r = await cryptoAddress({ action: 'mask', coins: ['bitcoin'] }).check('BTC: bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', ctx); expect(r.overrideText).toContain('[BITCOIN_ADDR]'); });
  it('allows clean text', async () => { expect((await cryptoAddress({ action: 'block' }).check('Hello world', ctx)).passed).toBe(true); });
});
