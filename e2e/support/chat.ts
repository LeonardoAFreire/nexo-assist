import type { Locator, Page } from '@playwright/test';

export function messageBox(page: Page): Locator {
  return page.getByLabel('Mensagem para o Nexo');
}

export function history(page: Page): Locator {
  return page.getByRole('list', { name: 'Mensagens' });
}

export function agentMessages(page: Page): Locator {
  return history(page).getByRole('article', { name: 'Nexo Assist' });
}

export async function sendMessage(page: Page, text: string): Promise<void> {
  await messageBox(page).fill(text);
  await page.getByRole('button', { name: 'Enviar' }).click();
}

export async function pickOption(page: Page, label: string): Promise<void> {
  await history(page).getByRole('button', { name: label, exact: true }).last().click();
}
