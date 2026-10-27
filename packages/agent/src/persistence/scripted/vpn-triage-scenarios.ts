import type { Scenario } from './scenario.js';
import { understandingOf } from './scenario-understanding.js';

const ARTICLE_ID = 'vpn-erro-809';
const CENTRAL_QUERY = 'VPN erro 809';
const SYMPTOM = 'erro 809 na VPN';
const ARTICLE_REASON = 'O artigo vale apenas para Windows 10 e o funcionário usa Windows 11.';
const WINDOWS_QUESTION = 'Qual é a versão do seu Windows?';
const AFFECTED_QUESTION = 'Quem é afetado pelo problema?';
const BLOCKED_QUESTION = 'O problema impede você de trabalhar?';
export const WINDOWS_11_ANSWER = 'Windows 11';
export const ONLY_ME_ANSWER = 'Só eu';
export const BLOCKED_ANSWER = 'Sim, não consigo trabalhar';

export const vpnReportScenario: Scenario = {
  name: 'vpn-relato',
  trigger: /vpn.*809|809.*vpn/i,
  understanding: understandingOf({
    intent: 'ticket_open',
    summary: 'Funcionário relata erro 809 ao conectar na VPN',
    entities: { symptom: SYMPTOM },
  }),
  async reply(run) {
    await run.callTool('buscar_central', { query: CENTRAL_QUERY });
    const options = ['Windows 10', WINDOWS_11_ANSWER];
    await run.callTool('perguntar_opcoes', { question: WINDOWS_QUESTION, options });
    return 'Encontrei um artigo sobre o erro 809. Preciso saber a versão do Windows para ver se ele vale para você.';
  },
};

export const vpnWindowsScenario: Scenario = {
  name: 'vpn-versao-do-windows',
  trigger: new RegExp(`^${WINDOWS_11_ANSWER}$`),
  understanding: understandingOf({
    intent: 'ticket_open',
    summary: 'Funcionário informa que usa Windows 11',
    entities: { symptom: SYMPTOM, operatingSystem: WINDOWS_11_ANSWER },
  }),
  async reply(run) {
    await run.callTool('buscar_central', { query: CENTRAL_QUERY });
    const citation = { articleId: ARTICLE_ID, applies: false, reason: ARTICLE_REASON };
    await run.callTool('citar_artigo', citation);
    const options = [ONLY_ME_ANSWER, 'Minha equipe', 'Toda a empresa'];
    await run.callTool('perguntar_opcoes', { question: AFFECTED_QUESTION, options });
    return 'O artigo não vale para o Windows 11, então vou abrir um chamado.';
  },
};

export const vpnAffectedScenario: Scenario = {
  name: 'vpn-quem-e-afetado',
  trigger: new RegExp(`^${ONLY_ME_ANSWER}$`),
  understanding: understandingOf({
    intent: 'ticket_open',
    summary: 'Funcionário informa que só ele é afetado',
    entities: { symptom: SYMPTOM, operatingSystem: WINDOWS_11_ANSWER, impact: 'only_me' },
  }),
  async reply(run) {
    const options = [BLOCKED_ANSWER, 'Não, consigo contornar'];
    await run.callTool('perguntar_opcoes', { question: BLOCKED_QUESTION, options });
    return 'Entendi, o problema afeta só você.';
  },
};
