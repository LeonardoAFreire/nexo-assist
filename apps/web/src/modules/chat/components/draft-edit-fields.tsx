import { categoryLabels } from '@/components/tickets/labels';
import type { DraftForm } from '../hooks/use-draft-form.js';
import { affectedLabels } from './affected-labels.js';
import { SelectField } from './select-field.js';
import { TextAreaField } from './text-area-field.js';
import { TextInputField } from './text-input-field.js';

type DraftEditFieldsProps = {
  form: DraftForm;
};

function DraftTextFields({ form }: DraftEditFieldsProps) {
  const { values, errors, setField } = form;
  return (
    <>
      <TextInputField
        label="Título"
        value={values.title}
        error={errors.title}
        onChange={(value) => setField('title', value)}
      />
      <TextAreaField
        label="Descrição"
        value={values.description}
        error={errors.description}
        onChange={(value) => setField('description', value)}
      />
    </>
  );
}

function DraftChoiceFields({ form }: DraftEditFieldsProps) {
  const { values, errors, setField } = form;
  return (
    <>
      <SelectField
        label="Categoria"
        value={values.category}
        options={categoryLabels}
        error={errors.category}
        onChange={(value) => setField('category', value)}
      />
      <SelectField
        label="Afetados"
        value={values.affected}
        options={affectedLabels}
        error={errors.affected}
        onChange={(value) => setField('affected', value)}
      />
    </>
  );
}

export function DraftEditFields({ form }: DraftEditFieldsProps) {
  return (
    <>
      <DraftTextFields form={form} />
      <DraftChoiceFields form={form} />
    </>
  );
}
