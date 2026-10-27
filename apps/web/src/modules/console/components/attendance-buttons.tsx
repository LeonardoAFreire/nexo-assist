import { Button } from '@/components/ui/button';
import type { Attendance } from '../hooks/use-attendance.js';
import type { AttendanceMode } from './attendance-mode.js';

type AttendanceButtonsProps = {
  mode: AttendanceMode;
  attendance: Attendance;
};

export function AttendanceButtons({ mode, attendance }: AttendanceButtonsProps) {
  const { claim, release, close, busy } = attendance;
  if (mode === 'claimable') {
    return (
      <Button disabled={busy} onClick={() => claim.mutate()}>
        Assumir atendimento
      </Button>
    );
  }
  if (mode !== 'mine') {
    return null;
  }
  return (
    <>
      <Button variant="outline" disabled={busy} onClick={() => release.mutate()}>
        Devolver ao agent
      </Button>
      <Button variant="destructive" disabled={busy} onClick={() => close.mutate()}>
        Encerrar atendimento
      </Button>
    </>
  );
}
