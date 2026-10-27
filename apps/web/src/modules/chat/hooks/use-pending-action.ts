import type {
  ChatTurnOutcome,
  ConfirmPendingActionRequest,
  EditPendingActionRequest,
  PendingAction,
} from '@nexo/contracts';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { isApiRequestError } from '@/lib/api-request-error';
import {
  cancelPendingAction,
  confirmPendingAction,
  editPendingAction,
} from '../api/pending-actions.js';
import { chatKeys } from './chat-keys.js';
import { applyActionUpdate, applyConfirmation } from './pending-action-cache.js';

const NOT_FOUND_STATUS = 404;
const CONFLICT_STATUS = 409;

export type PendingActionApi = {
  confirm: (via: ConfirmPendingActionRequest['via']) => void;
  edit: (changes: EditPendingActionRequest, onSaved: () => void) => void;
  cancel: () => void;
  isPending: boolean;
  errorMessage: string | null;
};

function isStale(error: Error): boolean {
  return (
    isApiRequestError(error) &&
    (error.status === NOT_FOUND_STATUS || error.status === CONFLICT_STATUS)
  );
}

function useResyncOnStale(): (error: Error) => void {
  const queryClient = useQueryClient();
  return (error: Error) => {
    if (isStale(error)) {
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversation });
    }
  };
}

function useConfirm(
  action: PendingAction,
): UseMutationResult<ChatTurnOutcome, Error, ConfirmPendingActionRequest['via']> {
  const queryClient = useQueryClient();
  const onError = useResyncOnStale();
  return useMutation({
    mutationFn: (via: ConfirmPendingActionRequest['via']) =>
      confirmPendingAction(action.id, { via }),
    onSuccess: (outcome, via) => applyConfirmation(queryClient, { action, via, outcome }),
    onError,
  });
}

function useEdit(
  actionId: string,
): UseMutationResult<PendingAction, Error, EditPendingActionRequest> {
  const queryClient = useQueryClient();
  const onError = useResyncOnStale();
  return useMutation({
    mutationFn: (changes: EditPendingActionRequest) => editPendingAction(actionId, changes),
    onSuccess: (updated) => applyActionUpdate(queryClient, updated),
    onError,
  });
}

function useCancel(actionId: string): UseMutationResult<PendingAction, Error, void> {
  const queryClient = useQueryClient();
  const onError = useResyncOnStale();
  return useMutation({
    mutationFn: () => cancelPendingAction(actionId),
    onSuccess: (updated) => applyActionUpdate(queryClient, updated),
    onError,
  });
}

export function usePendingAction(action: PendingAction): PendingActionApi {
  const confirm = useConfirm(action);
  const edit = useEdit(action.id);
  const cancel = useCancel(action.id);
  const clearErrors = () => [confirm, edit, cancel].forEach((mutation) => mutation.reset());
  return {
    confirm: (via) => {
      clearErrors();
      confirm.mutate(via);
    },
    edit: (changes, onSaved) => {
      clearErrors();
      edit.mutate(changes, { onSuccess: onSaved });
    },
    cancel: () => {
      clearErrors();
      cancel.mutate();
    },
    isPending: confirm.isPending || edit.isPending || cancel.isPending,
    errorMessage: (confirm.error ?? edit.error ?? cancel.error)?.message ?? null,
  };
}
