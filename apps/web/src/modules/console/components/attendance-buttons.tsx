import { Bot, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Attendance } from '../hooks/use-attendance.js';
import type { AttendanceMode } from './attendance-mode.js';

type AttendanceButtonsProps = {
  mode: AttendanceMode;
  attendance: Attendance;
};

export function AttendanceButtons({ mode, attendance }: AttendanceButtonsProps) {
  const { release, close, busy } = attendance;
  if (mode !== 'mine') {
    return null;
  }
  return (
    <>
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => release.mutate()}
        className="h-9 gap-1.5 rounded-lg border-ink/12 pr-3 pl-2.5 text-[13.5px] font-medium text-ink-2 shadow-[0_1px_2px_#1b24310d]"
      >
        <Bot aria-hidden="true" className="size-[15px]" />
        Devolver ao agent
      </Button>
      <Button
        disabled={busy}
        onClick={() => close.mutate()}
        className="h-9 gap-1.5 rounded-lg bg-danger-soft pr-3 pl-2.5 text-[13.5px] font-semibold text-danger-text hover:bg-danger-soft/70"
      >
        <XCircle aria-hidden="true" className="size-[15px]" />
        Encerrar atendimento
      </Button>
    </>
  );
}
