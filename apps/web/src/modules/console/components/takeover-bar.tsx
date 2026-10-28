import type { Conversation } from '@nexo/contracts';
import { Hand, Headset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Attendance } from '../hooks/use-attendance.js';
import { formatClockTime } from './format-clock-time.js';

const LOCKED_PLACEHOLDER = 'Assuma o atendimento para responder ao funcionário.';

type TakeoverBarProps = {
  conversation: Conversation;
  attendance: Attendance;
};

function pausedNote(conversation: Conversation): string {
  const { handoff } = conversation;
  return handoff ? `Agent pausado · até ${formatClockTime(handoff.contactDueAt)}` : 'Agent pausado';
}

function TakeoverHeading({ conversation }: { conversation: Conversation }) {
  const firstName = conversation.employee.name.split(' ')[0];
  return (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning-text">
        <Hand aria-hidden="true" className="size-[17px]" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-[14.5px] font-semibold text-ink">
          {firstName} espera um atendente
        </p>
        <p className="truncate text-[12.5px] text-ink-3">{pausedNote(conversation)}</p>
      </div>
    </>
  );
}

export function TakeoverBar({ conversation, attendance }: TakeoverBarProps) {
  return (
    <div className="flex flex-col gap-2.5 border-t border-rule bg-paper px-5 pt-3 pb-3.5">
      <div className="flex items-center gap-3">
        <TakeoverHeading conversation={conversation} />
        <Button
          disabled={attendance.busy}
          onClick={() => attendance.claim.mutate()}
          className="h-9 gap-[7px] rounded-lg bg-cta pr-4 pl-3.5 text-[13.5px] font-semibold text-white"
        >
          <Headset aria-hidden="true" className="size-4" />
          Assumir atendimento
        </Button>
      </div>
      <p className="flex h-11 items-center rounded-xl bg-desk px-3.5 text-[14.5px] text-ink-3 opacity-55">
        {LOCKED_PLACEHOLDER}
      </p>
    </div>
  );
}
