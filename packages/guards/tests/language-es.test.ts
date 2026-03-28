import { describe, it, expect } from 'vitest';
import { languageEs } from '../src/language-es.js';

describe('language-es guard', () => {
  it('passes Spanish text', async () => {
    const guard = languageEs({ action: 'block' });
    const result = await guard.check('El gato es un animal que tiene cuatro patas', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('fails non-Spanish text', async () => {
    const guard = languageEs({ action: 'block' });
    const result = await guard.check('The quick brown fox jumps over the lazy dog', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects Spanish character patterns', async () => {
    const guard = languageEs({ action: 'warn' });
    const result = await guard.check('¿Cómo estás? La niña está en la escuela', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('respects minRatio option', async () => {
    const guard = languageEs({ action: 'block', minRatio: 0.8 });
    const result = await guard.check('Hola world mixed text', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('returns score details', async () => {
    const guard = languageEs({ action: 'block' });
    const result = await guard.check('El la de que en un es por los', { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect(result.details!.combinedScore).toBeGreaterThan(0);
  });

  it('handles empty text', async () => {
    const guard = languageEs({ action: 'block' });
    const result = await guard.check('', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('has correct metadata', () => {
    const guard = languageEs({ action: 'block' });
    expect(guard.name).toBe('language-es');
    expect(guard.category).toBe('locale');
  });
});
