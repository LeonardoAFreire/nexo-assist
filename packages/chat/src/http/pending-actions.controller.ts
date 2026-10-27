import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  type ChatTurnOutcome,
  type ConfirmPendingActionRequest,
  confirmPendingActionRequestSchema,
  type EditPendingActionRequest,
  editPendingActionRequestSchema,
  type PendingAction,
} from '@nexo/contracts';
import {
  CurrentSession,
  OriginGuard,
  Roles,
  type SessionClaims,
  SessionGuard,
} from '@nexo/shared/auth';
import { ZodValidationPipe } from '@nexo/shared/http';
import { EmployeePendingActions } from '../core/pending-actions/employee-pending-actions.js';
import { type StatusOverrides, withChatErrors } from './chat-error.mapper.js';

const actionIdPipe = new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND });
const EDIT_STATUS_OVERRIDES: StatusOverrides = {
  validation_error: HttpStatus.UNPROCESSABLE_ENTITY,
};

@Controller('conversations/current/pending-actions')
@UseGuards(SessionGuard, OriginGuard)
@Roles('employee')
export class PendingActionsController {
  constructor(private readonly actions: EmployeePendingActions) {}

  @Patch(':actionId')
  edit(
    @Param('actionId', actionIdPipe) actionId: string,
    @Body(new ZodValidationPipe(editPendingActionRequestSchema)) changes: EditPendingActionRequest,
    @CurrentSession() claims: SessionClaims,
  ): Promise<PendingAction> {
    const employeeId = claims.userId;
    return withChatErrors(
      () => this.actions.edit({ employeeId, actionId, changes }),
      EDIT_STATUS_OVERRIDES,
    );
  }

  @Post(':actionId/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(
    @Param('actionId', actionIdPipe) actionId: string,
    @Body(new ZodValidationPipe(confirmPendingActionRequestSchema))
    body: ConfirmPendingActionRequest,
    @CurrentSession() claims: SessionClaims,
  ): Promise<ChatTurnOutcome> {
    const employeeId = claims.userId;
    return withChatErrors(() => this.actions.confirm({ employeeId, actionId, via: body.via }));
  }

  @Post(':actionId/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('actionId', actionIdPipe) actionId: string,
    @CurrentSession() claims: SessionClaims,
  ): Promise<PendingAction> {
    const employeeId = claims.userId;
    return withChatErrors(() => this.actions.cancel({ employeeId, actionId }));
  }
}
