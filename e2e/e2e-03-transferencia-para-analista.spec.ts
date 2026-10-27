import { expect, test } from '@playwright/test';
import {
  openAnalystPage,
  openConversationOf,
  sendAnalystReply,
} from './support/analyst-console.js';
import { agentMessages, history, sendMessage } from './support/chat.js';
import { DIEGO, RAFAEL } from './support/people.js';
import { signIn } from './support/sign-in.js';

const OWN_TICKET = 'INC-20402';
const ANALYST_REPLY = 'Oi, Diego. Já estou com o seu atendimento.';

test('E2E-03: o analista assume, responde, devolve e o agent volta a responder', async ({
  page: employeePage,
  browser,
  baseURL,
}) => {
  await signIn(employeePage, DIEGO.email);
  await sendMessage(employeePage, 'Quero falar com um analista');
  await expect(employeePage.getByText('Aguardando atendente')).toBeVisible();
  const analystPage = await openAnalystPage(browser, baseURL ?? '', RAFAEL.email);
  await openConversationOf(analystPage, DIEGO.name);
  await analystPage.getByRole('button', { name: 'Assumir atendimento' }).click();
  await expect(employeePage.getByText('Você está com um analista')).toBeVisible();
  await expect(employeePage.getByText(RAFAEL.name).first()).toBeVisible();
  await sendAnalystReply(analystPage, ANALYST_REPLY);
  await expect(employeePage.getByRole('article', { name: /Rafael Lima/ })).toContainText(
    ANALYST_REPLY,
  );
  await analystPage.getByRole('button', { name: 'Devolver ao agent' }).click();
  await expect(employeePage.getByText('Você está com um analista')).toBeHidden();
  await sendMessage(employeePage, `Pode me mostrar o ${OWN_TICKET}?`);
  await expect(agentMessages(employeePage).last()).toContainText(
    `Aqui está o chamado ${OWN_TICKET}`,
  );
  await expect(history(employeePage).getByRole('article', { name: /Outlook/ })).toContainText(
    OWN_TICKET,
  );
  await analystPage.context().close();
});
