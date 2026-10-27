import { expect, test } from '@playwright/test';
import { history, pickOption, sendMessage } from './support/chat.js';
import { ANA } from './support/people.js';
import { signIn } from './support/sign-in.js';

const PROVISIONAL_NUMBER = /D-\d+/;
const DEFINITIVE_NUMBER = /INC-\d{5}/;
const DRAFT_TITLE = 'VPN com erro 809 ao conectar';

test('E2E-01: abre um chamado de VPN com erro 809 após confirmar o rascunho', async ({ page }) => {
  await signIn(page, ANA.email);
  await sendMessage(page, 'Minha VPN está com erro 809 e não conecto');
  await expect(history(page).getByRole('list', { name: 'Passos do agent' }).last()).toContainText(
    'buscou na central de ajuda',
  );
  await pickOption(page, 'Windows 11');
  await expect(history(page).getByText('VPN com erro 809 não se aplica')).toBeVisible();
  await pickOption(page, 'Só eu');
  await pickOption(page, 'Sim, não consigo trabalhar');
  const draft = history(page).getByRole('article', { name: /^Rascunho/ });
  await expect(draft).toContainText(DRAFT_TITLE);
  await expect(draft).toContainText('Só eu');
  await expect(draft).toContainText('Prioridade alta');
  await expect(draft).toContainText('Resposta até');
  await expect(draft).toContainText(PROVISIONAL_NUMBER);
  await draft.getByRole('button', { name: /Confirmar/ }).click();
  await expect(history(page).getByText(/Rascunho D-\d+ · confirmada/)).toBeVisible();
  const card = history(page).getByRole('article', { name: DRAFT_TITLE });
  await expect(card).toContainText(DEFINITIVE_NUMBER);
  await expect(card).toContainText('Prioridade alta');
});
