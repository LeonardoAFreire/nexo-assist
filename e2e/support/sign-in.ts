import { expect, type Page } from '@playwright/test';

const SIGN_IN_PASSWORD = 'senha-de-demonstracao';

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail corporativo').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(SIGN_IN_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}
