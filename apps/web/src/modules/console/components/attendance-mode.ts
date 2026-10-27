import type { Conversation } from '@nexo/contracts';

export type AttendanceMode = 'claimable' | 'mine' | 'other' | 'agent' | 'closed';

export function attendanceModeOf(conversation: Conversation, analystId: string): AttendanceMode {
  if (conversation.state === 'waiting_analyst') {
    return 'claimable';
  }
  if (conversation.state === 'with_analyst') {
    return conversation.assignedAnalyst?.id === analystId ? 'mine' : 'other';
  }
  return conversation.state === 'closed' ? 'closed' : 'agent';
}

export function attendanceNote(conversation: Conversation, mode: AttendanceMode): string | null {
  if (mode === 'other') {
    return `Atendida por ${conversation.assignedAnalyst?.name ?? 'outro analista'}`;
  }
  if (mode === 'agent') {
    return 'O agent está atendendo esta conversa';
  }
  return mode === 'closed' ? 'Conversa encerrada' : null;
}
