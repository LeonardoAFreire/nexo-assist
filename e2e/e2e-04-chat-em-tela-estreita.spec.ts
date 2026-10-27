import { expect, test } from '@playwright/test';
import { ELISA } from './support/people.js';
import { signIn } from './support/sign-in.js';

const NARROW_VIEWPORT = { width: 375, height: 800 };
const MIN_COMPOSER_WIDTH = 220;

test('E2E-04: o chat continua utilizável em 375 px, sem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize(NARROW_VIEWPORT);
  await signIn(page, ELISA.email);
  const composer = page.getByRole('textbox', { name: 'Mensagem para o Nexo' });
  await expect(composer).toBeVisible();
  const box = await composer.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(MIN_COMPOSER_WIDTH);
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
});
