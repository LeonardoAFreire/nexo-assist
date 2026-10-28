import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeTicketDetail } from '@/test/chat-cards-factories';
import { makeStep } from '@/test/chat-factories';
import { AgentMessage } from './agent-message.js';

describe('AgentMessage', () => {
  it('mostra só o cartão quando a resposta não tem texto, sem bolha vazia', () => {
    const ticket = makeTicketDetail();
    render(
      <AgentMessage
        messageId="reply"
        text=""
        steps={[makeStep()]}
        parts={[{ type: 'ticket_card', ticket }]}
        decision={null}
        busy={false}
      />,
    );
    const article = screen.getByRole('article', { name: 'Nexo Assist' });
    expect(within(article).getByText(ticket.title)).toBeVisible();
    expect(article.children).toHaveLength(2);
  });
});
