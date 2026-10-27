import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeTicketSummary } from '@/test/console-fixtures';
import { TicketChoice } from './ticket-choice.js';

describe('TicketChoice', () => {
  it('RF9: mostra número, título, status e a data da última atualização', () => {
    const ticket = makeTicketSummary({
      number: 'INC-20298',
      title: 'Excel fecha sozinho ao abrir planilhas grandes',
      lastUpdatedAt: '2026-10-21T17:52:00.000Z',
    });
    render(<TicketChoice ticket={ticket} disabled={false} onChoose={() => undefined} />);
    const choice = screen.getByRole('button', { name: /INC-20298/ });
    expect(choice).toHaveTextContent('Excel fecha sozinho ao abrir planilhas grandes');
    expect(choice).toHaveTextContent('Atualizado em 21/10/2026');
  });
});
