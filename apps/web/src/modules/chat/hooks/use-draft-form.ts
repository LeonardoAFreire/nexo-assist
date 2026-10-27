import type { EditPendingActionRequest, TicketDraft } from '@nexo/contracts';
import { type FormEvent, useState } from 'react';
import {
  changedFields,
  type DraftField,
  type DraftValues,
  type FieldErrors,
  toValues,
  validateChanges,
} from './draft-form-values.js';

export type DraftFormInput = {
  draft: TicketDraft;
  onSave: (changes: EditPendingActionRequest) => void;
  onClose: () => void;
};

export type DraftForm = {
  values: DraftValues;
  errors: FieldErrors;
  setField: <Field extends DraftField>(field: Field, value: DraftValues[Field]) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
};

export function useDraftForm({ draft, onSave, onClose }: DraftFormInput): DraftForm {
  const [values, setValues] = useState<DraftValues>(() => toValues(draft));
  const [errors, setErrors] = useState<FieldErrors>({});

  function setField<Field extends DraftField>(field: Field, value: DraftValues[Field]): void {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const changes = changedFields(draft, values);
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }
    const found = validateChanges(changes);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      onSave(changes);
    }
  }

  return { values, errors, setField, submit };
}
