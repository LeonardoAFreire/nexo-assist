import type { Provider } from '@nestjs/common';
import { fromCore } from './chat-core.providers.js';
import { AnalystAttendance } from './core/analyst/analyst-attendance.js';
import { AnalystTicketAccess } from './core/console/analyst-ticket-access.js';
import { ConsoleEventStream } from './core/console/console-event-stream.js';
import { ConsoleQueries } from './core/console/console-queries.js';
import { MarkConversationRead } from './core/console/mark-conversation-read.js';
import { EmployeeHandoff } from './core/handoff/employee-handoff.js';

export const CHAT_CONSOLE_PROVIDERS: Provider[] = [
  fromCore(EmployeeHandoff, (core) => core.employeeHandoff),
  fromCore(ConsoleQueries, (core) => core.consoleQueries),
  fromCore(ConsoleEventStream, (core) => core.consoleEvents),
  fromCore(MarkConversationRead, (core) => core.markRead),
  fromCore(AnalystTicketAccess, (core) => core.analystTickets),
  fromCore(AnalystAttendance, (core) => core.attendance),
];
