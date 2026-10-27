import type { Conversation } from '@nexo/contracts';
import { AttendanceBar } from './attendance-bar.js';

type ConversationHeaderProps = {
  conversation: Conversation;
  analystId: string;
};

export function ConversationHeader({ conversation, analystId }: ConversationHeaderProps) {
  const { employee } = conversation;
  return (
    <header className="flex items-start justify-between gap-4 border-b border-rule px-6 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-text">
          {employee.initials}
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{employee.name}</h2>
          <p className="text-[13px] text-ink-3">{employee.department}</p>
        </div>
      </div>
      <AttendanceBar conversation={conversation} analystId={analystId} />
    </header>
  );
}
