import { describe, expect, it } from 'vitest';
import { DEFAULT_TOKEN_PRICING } from '../core/agent-settings.js';
import { conservativePricing, pricingFor } from './model-prices.js';

describe('model-prices', () => {
  it('usa o preço assumido para modelos fora da tabela', () => {
    expect(pricingFor('vendor/desconhecido')).toEqual(DEFAULT_TOKEN_PRICING);
  });

  it('usa o maior preço de cada direção quando os modelos diferem', () => {
    const pricing = conservativePricing(['openai/gpt-4o-mini', 'openai/gpt-4o']);
    expect(pricing).toEqual({ inputPerMillionUsd: 2.5, outputPerMillionUsd: 10 });
  });
});
