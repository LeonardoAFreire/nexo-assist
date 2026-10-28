const APPLE_PLATFORM = /Mac|iPhone|iPad/;

export function confirmShortcutLabel(userAgent: string = navigator.userAgent): string {
  return APPLE_PLATFORM.test(userAgent) ? '⌘↵' : 'Ctrl ↵';
}
