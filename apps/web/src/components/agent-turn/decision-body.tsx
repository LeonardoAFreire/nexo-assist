import type { AgentDecision, AgentStep, DecisionUnderstood } from '@nexo/contracts';
import { ConfidenceBadge } from './confidence-badge.js';
import { DecisionSection } from './decision-section.js';
import { DecisionStepList } from './decision-step-list.js';

type DecisionBodyProps = {
  id: string;
  decision: AgentDecision;
  steps: AgentStep[];
};

function UnderstoodSection({ understood }: { understood: DecisionUnderstood }) {
  return (
    <DecisionSection title="O que entendeu">
      <p>
        {understood.intentLabel}: {understood.summary}
      </p>
      <ul>
        {understood.entities.map((entity) => (
          <li key={entity.label}>
            {entity.label}: {entity.value}
          </li>
        ))}
      </ul>
    </DecisionSection>
  );
}

function RulesSection({ rules }: { rules: string[] }) {
  return (
    <DecisionSection title="Regras aplicadas">
      {rules.length === 0 ? <p>Nenhuma regra específica.</p> : null}
      <ul>
        {rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </DecisionSection>
  );
}

export function DecisionBody({ id, decision, steps }: DecisionBodyProps) {
  return (
    <div id={id} className="flex flex-col gap-3 rounded-xl border border-rule bg-desk p-3">
      <UnderstoodSection understood={decision.understood} />
      <DecisionSection title="Ação tomada">{decision.action.label}</DecisionSection>
      <DecisionSection title="Confiança">
        <ConfidenceBadge confidence={decision.confidence} />
      </DecisionSection>
      <DecisionSection title="Motivo">{decision.reason}</DecisionSection>
      <RulesSection rules={decision.rules} />
      <DecisionSection title="Passos executados">
        <DecisionStepList steps={steps} />
      </DecisionSection>
    </div>
  );
}
