import { type RefObject, useEffect, useRef } from 'react';

export function useFocusAfterEdit(editing: boolean): RefObject<HTMLButtonElement | null> {
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (wasEditing.current && !editing) {
      editButtonRef.current?.focus();
    }
    wasEditing.current = editing;
  }, [editing]);
  return editButtonRef;
}
