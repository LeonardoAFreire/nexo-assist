import type {
  ChatTurnOutcome,
  ConfirmPendingActionRequest,
  EditPendingActionRequest,
  PendingAction,
} from '@nexo/contracts';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import {
  cancelPendingAction,
  confirmPendingAction,
  editPendingAction,
} from '../api/pending-actions.js';
import { applyActionUpdate, applyConfirmation } from './pending-action-cache.js';
import { useCacheTargets, useResyncOnStale } from './use-action-cache.js';

export type PendingActionApi = {
  confirm: (via: ConfirmPendingActionRequest['via']) => void;
  edit: (changes: EditPendingActionRequest, onSaved: () => void) => void;
  cancel: () => void;
  isPending: boolean;
  errorMessage: string | null;
};

function useConfirm(
  action: PendingAction,
): UseMutationResult<ChatTurnOutcome, Error, ConfirmPendingActionRequest['via']> {
  const targets = useCacheTargets();
  const onError = useResyncOnStale();
  return useMutation({
    mutationFn: (via: ConfirmPendingActionRequest['via']) =>
      confirmPendingAction(action.id, { via }),
    onSuccess: (outcome, via) => applyConfirmation(targets, { action, via, outcome }),
    onError,
  });
}

function useEdit(
  actionId: string,
): UseMutationResult<PendingAction, Error, EditPendingActionRequest> {
  const targets = useCacheTargets();
  const onError = useResyncOnStale();
  return useMutation({
    mutationFn: (changes: EditPendingActionRequest) => editPendingAction(actionId, changes),
    onSuccess: (updated) => applyActionUpdate(targets, updated),
    onError,
  });
}

function useCancel(actionId: string): UseMutationResult<PendingAction, Error, void> {
  const targets = useCacheTargets();
  const onError = useResyncOnStale();
  return useMutation({
    mutationFn: () => cancelPendingAction(actionId),
    onSuccess: (updated) => applyActionUpdate(targets, updated),
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
