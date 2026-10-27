import type { Conversation } from '@nexo/contracts';
import { isApiRequestError } from '@/lib/api-request-error';
import { useAttendance } from '../hooks/use-attendance.js';
import { attendanceModeOf, attendanceNote } from './attendance-mode.js';
import { AttendanceButtons } from './attendance-buttons.js';

const FALLBACK_ERROR_MESSAGE = 'Não foi possível concluir a ação. Tente de novo.';

type AttendanceBarProps = {
  conversation: Conversation;
  analystId: string;
};

function errorMessageOf(error: Error): string {
  return isApiRequestError(error) ? error.message : FALLBACK_ERROR_MESSAGE;
}

export function AttendanceBar({ conversation, analystId }: AttendanceBarProps) {
  const attendance = useAttendance(conversation.id);
  const mode = attendanceModeOf(conversation, analystId);
  const note = attendanceNote(conversation, mode);
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
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
