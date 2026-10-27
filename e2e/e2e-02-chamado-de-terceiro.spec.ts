import { expect, test, type Page } from '@playwright/test';
import { agentMessages, history, sendMessage } from './support/chat.js';
import { ELISA } from './support/people.js';
import { signIn } from './support/sign-in.js';

const OTHER_EMPLOYEE_TICKET = 'INC-20517';
const NONEXISTENT_TICKET = 'INC-99999';
const OTHER_EMPLOYEE_DATA = [
  'VPN sem acesso à rede da filial',
  'Carla Mendes',
  'Operações',
  'Ninguém da equipe',
];

async function askAbout(page: Page, number: string, expectedReplies: number): Promise<string> {
  await sendMessage(page, `Qual o status do ${number}?`);
  await expect(agentMessages(page)).toHaveCount(expectedReplies);
  const reply = agentMessages(page).last();
  await expect(reply).toContainText(number);
  return (await reply.innerText()).replaceAll(number, 'NÚMERO');
}

test('E2E-02: chamado de outra pessoa recebe a mesma resposta de um chamado inexistente', async ({
  page,
}) => {
  await signIn(page, ELISA.email);
  const third = await askAbout(page, OTHER_EMPLOYEE_TICKET, 1);
  const missing = await askAbout(page, NONEXISTENT_TICKET, 2);
  expect(third).toContain('Não encontrei o chamado');
  expect(third).toBe(missing);
  await expect(history(page).getByRole('article', { name: /INC-/ })).toHaveCount(0);
  for (const thirdPartyData of OTHER_EMPLOYEE_DATA) {
    await expect(page.getByText(thirdPartyData)).toHaveCount(0);
  }
});
