import { type RefObject, useEffect, useRef } from 'react';

const FIELD_SELECTOR = 'input, textarea, select';

export function useFocusFirstField(): RefObject<HTMLFormElement | null> {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>(FIELD_SELECTOR)?.focus();
  }, []);
  return formRef;
}
