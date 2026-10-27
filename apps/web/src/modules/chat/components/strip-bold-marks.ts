const BOLD_MARKS = /\*\*(.+?)\*\*/g;

export function stripBoldMarks(text: string): string {
  return text.replace(BOLD_MARKS, '$1');
}
