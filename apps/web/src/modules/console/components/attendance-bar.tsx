import type { Conversation } from '@nexo/contracts';
import { Bot } from 'lucide-react';
import { isApiRequestError } from '@/lib/api-request-error';
import type { Attendance } from '../hooks/use-attendance.js';
import { attendanceModeOf, attendanceNote } from './attendance-mode.js';
import { AttendanceButtons } from './attendance-buttons.js';

const FALLBACK_ERROR_MESSAGE = 'Não foi possível concluir a ação. Tente de novo.';
const WAITING_LABEL = 'Aguardando atendente';

type AttendanceBarProps = {
  conversation: Conversation;
  analystId: string;
  attendance: Attendance;
};

function errorMessageOf(error: Error): string {
  return isApiRequestError(error) ? error.message : FALLBACK_ERROR_MESSAGE;
}

function WaitingPill() {
  return (
    <p className="flex items-center gap-[7px] rounded-full bg-warning-soft px-[11px] py-1.5 text-[12.5px] font-semibold text-warning-text">
      <Bot aria-hidden="true" className="size-3.5" />
      {WAITING_LABEL}
    </p>
  );
}

export function AttendanceBar({ conversation, analystId, attendance }: AttendanceBarProps) {
  const mode = attendanceModeOf(conversation, analystId);
  const note = attendanceNote(conversation, mode);
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {mode === 'claimable' ? <WaitingPill /> : null}
        {note ? <span className="text-[13px] text-ink-3">{note}</span> : null}
        <AttendanceButtons mode={mode} attendance={attendance} />
      </div>
      {attendance.error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {errorMessageOf(attendance.error)}
        </p>
      ) : null}
    </div>
  );
}
