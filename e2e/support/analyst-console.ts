import type { Browser, Page } from '@playwright/test';
import { signIn } from './sign-in.js';

export async function openAnalystPage(
  browser: Browser,
  baseURL: string,
  email: string,
): Promise<Page> {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await signIn(page, email);
  return page;
}

export async function openConversationOf(page: Page, employeeName: string): Promise<void> {
  await page
    .getByRole('link', { name: new RegExp(employeeName) })
    .first()
    .click();
}

export async function sendAnalystReply(page: Page, text: string): Promise<void> {
  await page.getByLabel('Resposta ao funcionário').fill(text);
  await page.getByRole('button', { name: 'Enviar' }).click();
}
