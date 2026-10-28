import type { Conversation } from '@nexo/contracts';
import type { Attendance } from '../hooks/use-attendance.js';
import { AttendanceBar } from './attendance-bar.js';
import { PersonAvatar } from './person-avatar.js';

type ConversationHeaderProps = {
  conversation: Conversation;
  analystId: string;
  attendance: Attendance;
};

function describe(conversation: Conversation): string {
  const { employee, handoff } = conversation;
  const tickets = handoff?.ticketNumbers ?? [];
  return [employee.department, ...tickets].filter(Boolean).join(' · ');
}

export function ConversationHeader(props: ConversationHeaderProps) {
  const { conversation, analystId, attendance } = props;
  const { employee } = conversation;
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-rule bg-paper pr-4 pl-5">
      <PersonAvatar initials={employee.initials} className="size-10 text-[14.5px] font-semibold" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="truncate text-[15.5px] font-semibold text-ink">{employee.name}</h2>
        <p className="truncate text-[12.5px] text-ink-3">{describe(conversation)}</p>
      </div>
      <AttendanceBar conversation={conversation} analystId={analystId} attendance={attendance} />
    </header>
  );
}
