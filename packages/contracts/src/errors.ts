const TICKETS_UNAVAILABLE_MESSAGE =
  'O sistema de chamados está fora do ar agora. Tente de novo em instantes ou fale com um analista.';
const TICKET_NOT_FOUND_MESSAGE = 'Chamado não encontrado.';

export class TicketsUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super(TICKETS_UNAVAILABLE_MESSAGE, options);
    this.name = 'TicketsUnavailableError';
  }
}

export class TicketNotFoundError extends Error {
  constructor(options?: ErrorOptions) {
    super(TICKET_NOT_FOUND_MESSAGE, options);
    this.name = 'TicketNotFoundError';
  }
}

export class TicketRuleViolationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'TicketRuleViolationError';
  }
}
