import type {
  AgentIntent,
  DecisionUnderstood,
  TicketAffected,
  Understanding,
  UnderstandingEntities,
} from '@nexo/contracts';

type Entity = DecisionUnderstood['entities'][number];

const INTENT_LABELS: Record<AgentIntent, string> = {
  question: 'dúvida',
  ticket_status: 'consultar chamado',
  ticket_complement: 'complementar chamado',
  ticket_open: 'abrir chamado',
  analyst_request: 'falar com um analista',
  out_of_scope: 'assunto fora de TI',
  closing: 'encerrar a conversa',
  other: 'outro assunto',
};

const IMPACT_LABELS: Record<TicketAffected, string> = {
  only_me: 'só o funcionário',
  my_team: 'a equipe',
  whole_company: 'a empresa toda',
  unknown: 'não informado',
};

function yesNo(value: boolean): string {
  return value ? 'sim' : 'não';
}

function toEntities(entities: UnderstandingEntities): Entity[] {
  const candidates: Array<[string, string | null]> = [
    ['Chamado', entities.ticketNumber],
    ['Sistema', entities.operatingSystem],
    ['Sintoma', entities.symptom],
    ['Quem é afetado', entities.impact && IMPACT_LABELS[entities.impact]],
    ['Impede o trabalho', entities.blocksWork === null ? null : yesNo(entities.blocksWork)],
    [
      'Compromisso no mesmo dia',
      entities.sameDayCommitment === null ? null : yesNo(entities.sameDayCommitment),
    ],
    ['Tem alternativa', entities.hasWorkaround === null ? null : yesNo(entities.hasWorkaround)],
  ];
  return candidates.flatMap(([label, value]) => (value === null ? [] : [{ label, value }]));
}

export function describeUnderstanding(understanding: Understanding): DecisionUnderstood {
  return {
    intent: understanding.intent,
    intentLabel: INTENT_LABELS[understanding.intent],
    summary: understanding.summary,
    entities: toEntities(understanding.entities),
  };
}
