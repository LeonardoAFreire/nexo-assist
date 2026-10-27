import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AgentDecision, AgentStep } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { DecisionDetails } from './decision-details.js';
import { StepsLine } from './steps-line.js';

function makeStep(overrides: Partial<AgentStep> = {}): AgentStep {
  return {
    id: 's1',
    kind: 'searched_tickets',
    label: 'consultou seus chamados',
    result: 'nenhum chamado aberto sobre VPN',
    status: 'ok',
    attempts: 1,
    durationMs: 120,
    ...overrides,
  };
}

function makeDecision(overrides: Partial<AgentDecision> = {}): AgentDecision {
  return {
    understood: {
      intent: 'ticket_open',
      intentLabel: 'abrir chamado',
      summary: 'VPN com erro 809 no Windows 11',
      entities: [{ label: 'Sistema', value: 'Windows 11' }],
    },
    action: { kind: 'asked_question', label: 'perguntou quem é afetado' },
    confidence: { value: 0.86, label: 'alta' },
    reason: 'falta saber quem é afetado',
    rules: ['sem chamado aberto sobre o mesmo problema: segue para abertura'],
    handoff: null,
    ...overrides,
  };
}

describe('DecisionDetails', () => {
  it('expande o detalhe com entendimento, ação, confiança e motivo', async () => {
    const user = userEvent.setup();
    render(<DecisionDetails decision={makeDecision()} steps={[makeStep()]} />);
    const toggle = screen.getByRole('button', { name: /ver detalhes da decisão/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('falta saber quem é afetado')).not.toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/VPN com erro 809 no Windows 11/)).toBeInTheDocument();
    expect(screen.getByText('perguntou quem é afetado')).toBeInTheDocument();
    expect(screen.getByText(/confiança 86% · alta/)).toBeInTheDocument();
    expect(screen.getByText('falta saber quem é afetado')).toBeInTheDocument();
    expect(screen.getByText(/segue para abertura/)).toBeInTheDocument();
  });

  it('mostra falha e novas tentativas de cada passo', async () => {
    const user = userEvent.setup();
    const failed = makeStep({ status: 'failed', attempts: 3, result: 'sistema indisponível' });
    render(<DecisionDetails decision={makeDecision()} steps={[failed]} />);
    await user.click(screen.getByRole('button', { name: /ver detalhes da decisão/i }));
    expect(screen.getByText('sistema indisponível')).toBeInTheDocument();
    expect(screen.getByText('falhou · 3 tentativas')).toBeInTheDocument();
  });

  it('recolhe o detalhe ao clicar de novo', async () => {
    const user = userEvent.setup();
    render(<DecisionDetails decision={makeDecision()} steps={[makeStep()]} />);
    const toggle = screen.getByRole('button', { name: /ver detalhes da decisão/i });
    await user.click(toggle);
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('falta saber quem é afetado')).not.toBeInTheDocument();
  });
});

describe('StepsLine', () => {
  it('lista os passos e marca em texto o que falhou', () => {
    const steps = [
      makeStep(),
      makeStep({ id: 's2', label: 'buscou artigos', status: 'failed', attempts: 3 }),
    ];
    render(<StepsLine steps={steps} />);
    const items = within(screen.getByRole('list', { name: 'Passos do agent' })).getAllByRole(
      'listitem',
    );
    expect(items[0]).toHaveTextContent('consultou seus chamados');
    expect(items[1]).toHaveTextContent('buscou artigos (falhou) (3 tentativas)');
  });

  it('não renderiza nada sem passos', () => {
    const { container } = render(<StepsLine steps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
