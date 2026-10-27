import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AgentBubble } from './agent-bubble.js';
import { FormattedText } from './formatted-text.js';

describe('FormattedText', () => {
  it('mostra o trecho entre ** em negrito, sem os asteriscos', () => {
    render(<p>{<FormattedText text="O chamado está **aguardando analista** há seis dias." />}</p>);
    expect(screen.getByText('aguardando analista').tagName).toBe('STRONG');
    expect(document.body.textContent).toBe('O chamado está aguardando analista há seis dias.');
  });

  it('mantém o texto sem marcação como está', () => {
    render(<p>{<FormattedText text="Use 2 * 3 e ** solto" />}</p>);
    expect(document.body.textContent).toBe('Use 2 * 3 e ** solto');
  });

  it('não interpreta HTML do texto', () => {
    render(<p>{<FormattedText text="**<b>x</b>**" />}</p>);
    expect(document.body.querySelector('b')).toBeNull();
    expect(document.body.textContent).toBe('<b>x</b>');
  });
});

describe('AgentBubble', () => {
  it('mostra a resposta do agent sem os asteriscos do negrito', () => {
    render(<AgentBubble text="Está **aguardando analista**." typing={false} />);
    expect(document.body.textContent).toBe('Está aguardando analista.');
  });
});
