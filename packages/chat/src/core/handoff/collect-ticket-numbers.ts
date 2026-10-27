import type { ChatMessage, MessagePart } from '@nexo/contracts';

const TICKET_NUMBER_IN_TEXT = /\b(?:INC|REQ)-\d{5}\b/g;

function numbersFromPart(part: MessagePart): string[] {
  if (part.type === 'ticket_card') {
    return [part.ticket.number];
  }
  if (part.type === 'ticket_selection') {
    return part.selectedNumber === null ? [] : [part.selectedNumber];
  }
  if (part.type === 'pending_action') {
    return part.action.targetNumber === null ? [] : [part.action.targetNumber];
  }
  return [];
}

function numbersFromMessage(message: ChatMessage): string[] {
  const cited = message.text.match(TICKET_NUMBER_IN_TEXT) ?? [];
  return [...message.parts.flatMap(numbersFromPart), ...cited];
}

export function collectTicketNumbers(messages: readonly ChatMessage[]): string[] {
  return [...new Set(messages.flatMap(numbersFromMessage))];
}

export function extractTicketNumbers(text: string): string[] {
  return [...new Set(text.match(TICKET_NUMBER_IN_TEXT) ?? [])];
}
