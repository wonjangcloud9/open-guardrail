import { describe, it, expect } from 'vitest';
import { piiBr } from '../src/pii-br.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-br', () => {
  it('detects valid CPF', async () => {
    expect((await piiBr({ entities: ['cpf'], action: 'block' }).check('CPF: 529.982.247-25', ctx)).passed).toBe(false);
  });
  it('rejects invalid CPF checksum', async () => {
    expect((await piiBr({ entities: ['cpf'], action: 'block' }).check('CPF: 111.111.111-11', ctx)).passed).toBe(true);
  });
  it('detects CNPJ', async () => {
    expect((await piiBr({ entities: ['cnpj'], action: 'block' }).check('CNPJ: 11.222.333/0001-81', ctx)).passed).toBe(false);
  });
  it('allows clean text', async () => {
    expect((await piiBr({ entities: ['cpf', 'cnpj'], action: 'block' }).check('Olá mundo', ctx)).passed).toBe(true);
  });
});
