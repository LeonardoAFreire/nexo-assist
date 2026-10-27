import {
  askedQuickOptions,
  citedArticle,
  completedWithoutFailure,
  didNotAsk,
  neverAppliedArticle,
  usedStep,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

const AFFECTED_TOPIC = /quem|afet|pessoas|impact/i;
const SYSTEM_TOPIC = /windows|sistema operacional/i;

export const erro809Windows11: EvalScenario = {
  id: 'erro-809-windows-11',
  name: 'Erro 809 da VPN no Windows 11 segue para o chamado',
  goal: 'ticket_quality',
  acceptance: ['CA-05', 'CA-10'],
  requester: 'Bruno Tavares',
  history: [],
  userMessage: 'Minha VPN não conecta, erro 809, Windows 11',
  criteria: [
    usedStep('searched_knowledge'),
    citedArticle('vpn-erro-809', false),
    neverAppliedArticle('vpn-erro-809'),
    askedQuickOptions(AFFECTED_TOPIC),
    didNotAsk(SYSTEM_TOPIC),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('ticket_open', 'VPN com erro 809 no Windows 11', {
      entities: { operatingSystem: 'Windows 11', symptom: 'erro 809' },
    }),
    replies('O artigo não se aplica ao Windows 11. Vou abrir um chamado.', [
      { name: 'buscar_central', input: { query: 'VPN erro 809' } },
      {
        name: 'citar_artigo',
        input: { articleId: 'vpn-erro-809', applies: false, reason: 'vale só para Windows 10' },
      },
      {
        name: 'perguntar_opcoes',
        input: {
          question: 'Quem está sem conseguir usar a VPN?',
          options: ['Só eu', 'Minha equipe', 'A empresa toda'],
        },
      },
    ]),
  ],
};
