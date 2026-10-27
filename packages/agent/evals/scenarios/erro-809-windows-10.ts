import {
  citedArticle,
  completedWithoutFailure,
  mentions,
  noProposal,
  notHandedOff,
  usedStep,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

export const erro809Windows10: EvalScenario = {
  id: 'erro-809-windows-10',
  name: 'Erro 809 da VPN no Windows 10',
  goal: 'resolution',
  acceptance: ['CA-05'],
  requester: 'Bruno Tavares',
  history: [],
  userMessage: 'Minha VPN está com erro 809. Meu computador usa Windows 10.',
  criteria: [
    usedStep('searched_knowledge'),
    citedArticle('vpn-erro-809', true),
    mentions(/reinstal/i, 'orienta reinstalar o cliente de VPN'),
    noProposal(),
    notHandedOff(),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('question', 'Erro 809 na VPN no Windows 10', {
      entities: { operatingSystem: 'Windows 10', symptom: 'erro 809' },
    }),
    replies('Reinstale o cliente de VPN pelo portal de softwares e reinicie o computador.', [
      { name: 'buscar_central', input: { query: 'VPN erro 809' } },
      {
        name: 'citar_artigo',
        input: { articleId: 'vpn-erro-809', applies: true, reason: 'vale para Windows 10' },
      },
    ]),
  ],
};
