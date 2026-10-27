import { AnalystAttendance } from '../analyst/analyst-attendance.js';
import { ClaimConversation } from '../analyst/claim-conversation.js';
import { CloseConversation } from '../analyst/close-conversation.js';
import { ReleaseConversation } from '../analyst/release-conversation.js';
import { SendAnalystMessage } from '../analyst/send-analyst-message.js';
import type { Clock } from '../clock/clock.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import type { ConversationEventsHub } from '../events/conversation-events-hub.js';
import { EmployeeHandoff } from '../handoff/employee-handoff.js';
import type { HandOffConversation } from '../handoff/hand-off-conversation.js';
import { RequestHandoff } from '../handoff/request-handoff.js';
import type { MessageRepository } from '../messages/message-repository.js';
import type { ConversationNotifier } from '../notifier/conversation-notifier.js';
import type { PendingActionRepository } from '../pending-actions/pending-action-repository.js';
import { TimelineBuilder } from '../timeline/timeline-builder.js';
import type { ConversationViewBuilder } from '../view/conversation-view-builder.js';
import type { ProfileLookup } from '../view/load-profiles.js';
import { AnalystTicketAccess, type TicketsReader } from './analyst-ticket-access.js';
import { ConsoleDirectory } from './console-directory.js';
import { ConsoleEventStream } from './console-event-stream.js';
import { ConsoleQueries } from './console-queries.js';
import { MarkConversationRead } from './mark-conversation-read.js';

export type ConsoleCoreDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  actions: PendingActionRepository;
  identity: ProfileLookup;
  tickets: TicketsReader;
  hub: ConversationEventsHub;
  clock: Clock;
};

export type ConsoleCollaborators = {
  views: ConversationViewBuilder;
  notifier: ConversationNotifier;
  handOff: HandOffConversation;
};

export type ConsoleCore = {
  employeeHandoff: EmployeeHandoff;
  consoleQueries: ConsoleQueries;
  consoleEvents: ConsoleEventStream;
  markRead: MarkConversationRead;
  analystTickets: AnalystTicketAccess;
  attendance: AnalystAttendance;
};

export function buildConsoleCore(deps: ConsoleCoreDeps, shared: ConsoleCollaborators): ConsoleCore {
  const { conversations, messages, clock, identity } = deps;
  const { views, notifier, handOff } = shared;
  const analystDeps = { conversations, messages, notifier, clock };
  const directory = new ConsoleDirectory({ conversations, messages, identity, clock });
  const timeline = new TimelineBuilder(deps.actions);
  const queries = new ConsoleQueries({ directory, conversations, messages, views, timeline });
  const request = new RequestHandoff(conversations, messages, handOff);
  return {
    employeeHandoff: new EmployeeHandoff(request, views),
    consoleQueries: queries,
    consoleEvents: new ConsoleEventStream(deps.hub, queries),
    markRead: new MarkConversationRead(conversations, notifier, clock),
    analystTickets: new AnalystTicketAccess(conversations, messages, deps.tickets),
    attendance: new AnalystAttendance({
      claim: new ClaimConversation(analystDeps, identity),
      release: new ReleaseConversation(analystDeps),
      close: new CloseConversation(analystDeps),
      send: new SendAnalystMessage(analystDeps),
      views,
    }),
  };
}
