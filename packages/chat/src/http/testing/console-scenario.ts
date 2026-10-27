import { DEMO_ANALYSTS, DEMO_EMPLOYEES, type EmployeeConversationView } from '@nexo/contracts';
import { completedEvent } from '../../core/testing/agent-events.js';
import { chatClient, type ChatHttpClient } from './chat-http-client.js';
import type { ChatTestApp } from './chat-test-app.js';

export const [ANA, BRUNO, CARLA, DIEGO, ELISA] = DEMO_EMPLOYEES;
export const [RAFAEL, GABRIELA] = DEMO_ANALYSTS;

const HANDOFF = '/conversations/current/handoff';

export type ConsoleScenario = {
  rafael: ChatHttpClient;
  gabriela: ChatHttpClient;
  employees: Record<'ana' | 'bruno' | 'carla' | 'diego' | 'elisa', ChatHttpClient>;
  ids: Record<'agent' | 'waiting' | 'waitingToo' | 'claimed', string>;
};

export async function clientFor(
  app: ChatTestApp,
  person: { id: string } | undefined,
): Promise<ChatHttpClient> {
  return chatClient(app, await app.sessionCookie(person!.id));
}

async function conversationIdOf(client: ChatHttpClient): Promise<string> {
  const view = await client.json<EmployeeConversationView>('GET', '/conversations/current');
  return view.body.conversation!.id;
}

async function talk(app: ChatTestApp, client: ChatHttpClient, reply: string): Promise<string> {
  app.agent.enqueue([completedEvent(reply)]);
  await client.send('Preciso de ajuda com o meu chamado');
  return conversationIdOf(client);
}

async function talkAndHandOff(app: ChatTestApp, client: ChatHttpClient, reply: string) {
  const id = await talk(app, client, reply);
  await client.json('POST', HANDOFF, { reason: 'requested' });
  return id;
}

export async function seedConsoleScenario(app: ChatTestApp): Promise<ConsoleScenario> {
  const rafael = await clientFor(app, RAFAEL);
  const gabriela = await clientFor(app, GABRIELA);
  const employees = {
    ana: await clientFor(app, ANA),
    bruno: await clientFor(app, BRUNO),
    carla: await clientFor(app, CARLA),
    diego: await clientFor(app, DIEGO),
    elisa: await clientFor(app, ELISA),
  };
  const ids = {
    agent: await talk(app, employees.ana, 'Seu chamado INC-20150 foi resolvido.'),
    waiting: await talkAndHandOff(app, employees.bruno, 'O INC-20311 segue em andamento.'),
    waitingToo: await talkAndHandOff(app, employees.diego, 'Vi o INC-20311 também.'),
    claimed: await talkAndHandOff(app, employees.carla, 'Vou transferir você.'),
  };
  await rafael.json('POST', `/console/conversations/${ids.claimed}/claim`);
  return { rafael, gabriela, employees, ids };
}
