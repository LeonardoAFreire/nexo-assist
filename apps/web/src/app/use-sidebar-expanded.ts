import { useState } from 'react';

const STORAGE_KEY = 'nexo.console.sidebar-expanded';
const EXPANDED_VALUE = 'true';

type SidebarExpansion = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

function readStoredValue(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === EXPANDED_VALUE;
  } catch {
    return false;
  }
}

function storeValue(expanded: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(expanded));
  } catch {
    return;
  }
}

export function useSidebarExpanded(): SidebarExpansion {
  const [expanded, setExpandedState] = useState(readStoredValue);
  const setExpanded = (next: boolean): void => {
    setExpandedState(next);
    storeValue(next);
  };
  return { expanded, setExpanded };
}
