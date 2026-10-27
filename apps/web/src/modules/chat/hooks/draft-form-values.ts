import {
  type EditPendingActionRequest,
  editPendingActionRequestSchema,
  type TicketAffected,
  type TicketCategory,
  type TicketDraft,
} from '@nexo/contracts';

export type DraftValues = {
  title: string;
  description: string;
  category: TicketCategory;
  affected: TicketAffected;
};

export type DraftField = keyof DraftValues;

export type FieldErrors = Partial<Record<DraftField, string>>;

const FIELD_MESSAGES: Record<DraftField, string> = {
  title: 'O título deve ter de 5 a 120 caracteres.',
  description: 'A descrição deve ter de 10 a 2.000 caracteres.',
  category: 'Escolha uma categoria.',
  affected: 'Escolha quem é afetado.',
};

const DRAFT_FIELDS: DraftField[] = ['title', 'description', 'category', 'affected'];

export function toValues(draft: TicketDraft): DraftValues {
  const { title, description, category, affected } = draft;
  return { title, description, category, affected };
}

export function changedFields(draft: TicketDraft, values: DraftValues): EditPendingActionRequest {
  const initial = toValues(draft);
  const changes = DRAFT_FIELDS.filter((field: DraftField) => initial[field] !== values[field]);
  return Object.fromEntries(changes.map((field: DraftField) => [field, values[field]]));
}

export function validateChanges(changes: EditPendingActionRequest): FieldErrors {
  const result = editPendingActionRequestSchema.safeParse(changes);
  if (result.success) {
    return {};
  }
  const invalid = result.error.issues.map((issue) => String(issue.path[0]));
  const errors = DRAFT_FIELDS.filter((field: DraftField) => invalid.includes(field));
  return Object.fromEntries(errors.map((field: DraftField) => [field, FIELD_MESSAGES[field]]));
}
