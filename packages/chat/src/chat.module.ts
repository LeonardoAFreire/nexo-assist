import { Module } from '@nestjs/common';
import { CHAT_CONSOLE_PROVIDERS } from './chat-console.providers.js';
import { CHAT_CORE_PROVIDERS } from './chat-core.providers.js';
import { MessageAllowance } from './core/allowance/message-allowance.js';
import {
  SESSION_USAGE_REPOSITORY,
  type SessionUsageRepository,
} from './core/allowance/session-usage-repository.js';
import { CLOCK, type Clock } from './core/clock/clock.js';
import { SystemClock } from './core/clock/system-clock.js';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from './core/conversation/conversation-repository.js';
import { ConversationEventsHub } from './core/events/conversation-events-hub.js';
import { MESSAGE_REPOSITORY, type MessageRepository } from './core/messages/message-repository.js';
import { PENDING_ACTION_REPOSITORY } from './core/pending-actions/pending-action-repository.js';
import { RecoverInterruptedTurns } from './core/send/recover-interrupted-turns.js';
import { AnalystProfilePipe } from './http/analyst-profile.pipe.js';
import { ConsoleActionsController } from './http/console-actions.controller.js';
import { ConsoleController } from './http/console.controller.js';
import { ConsoleStreamController } from './http/console-stream.controller.js';
import { ConversationStreamController } from './http/conversation-stream.controller.js';
import { EmployeeConversationController } from './http/employee-conversation.controller.js';
import { EmployeeSessionPipe } from './http/employee-session.pipe.js';
import { PendingActionsController } from './http/pending-actions.controller.js';
import { UserThrottlerGuard } from './http/user-throttler.guard.js';
import { ChatMigrator } from './persistence/chat.migrator.js';
import { ConsoleSeedStore } from './persistence/console-seed-store.js';
import { ConsoleSeeder } from './persistence/console-seeder.js';
import { DrizzleConversationRepository } from './persistence/drizzle-conversation.repository.js';
import { DrizzleMessageRepository } from './persistence/drizzle-message.repository.js';
import { DrizzlePendingActionRepository } from './persistence/drizzle-pending-action.repository.js';
import { DrizzleSessionUsageRepository } from './persistence/drizzle-session-usage.repository.js';
import { InterruptedTurnsRecovery } from './persistence/interrupted-turns-recovery.js';

@Module({
  controllers: [
    EmployeeConversationController,
    PendingActionsController,
    ConversationStreamController,
    ConsoleController,
    ConsoleActionsController,
    ConsoleStreamController,
  ],
  providers: [
    ChatMigrator,
    ConsoleSeedStore,
    ConsoleSeeder,
    InterruptedTurnsRecovery,
    {
      provide: RecoverInterruptedTurns,
      inject: [CONVERSATION_REPOSITORY, MESSAGE_REPOSITORY, CLOCK],
      useFactory: (
        conversations: ConversationRepository,
        messages: MessageRepository,
        clock: Clock,
      ) => new RecoverInterruptedTurns({ conversations, messages, clock }),
    },
    EmployeeSessionPipe,
    AnalystProfilePipe,
    UserThrottlerGuard,
    { provide: CLOCK, useClass: SystemClock },
    { provide: CONVERSATION_REPOSITORY, useClass: DrizzleConversationRepository },
    { provide: MESSAGE_REPOSITORY, useClass: DrizzleMessageRepository },
    { provide: PENDING_ACTION_REPOSITORY, useClass: DrizzlePendingActionRepository },
    { provide: SESSION_USAGE_REPOSITORY, useClass: DrizzleSessionUsageRepository },
    {
      provide: MessageAllowance,
      inject: [SESSION_USAGE_REPOSITORY],
      useFactory: (usage: SessionUsageRepository) => new MessageAllowance(usage),
    },
    { provide: ConversationEventsHub, useFactory: () => new ConversationEventsHub() },
    ...CHAT_CORE_PROVIDERS,
    ...CHAT_CONSOLE_PROVIDERS,
  ],
})
export class ChatModule {}
