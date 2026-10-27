const PARAGRAPH_BREAK = '\n\n';

export class StepTextSeparator {
  private hasText = false;
  private afterToolCall = false;
  private heldWhitespace = '';

  noteToolCall(): void {
    this.afterToolCall = this.hasText;
    this.heldWhitespace = '';
  }

  apply(delta: string): string {
    const startsContent = !this.hasText || this.afterToolCall;
    const incoming = startsContent ? delta.trimStart() : `${this.heldWhitespace}${delta}`;
    const content = incoming.trimEnd();
    this.heldWhitespace = incoming.slice(content.length);
    if (content === '') {
      return '';
    }
    const separator = this.afterToolCall ? PARAGRAPH_BREAK : '';
    this.hasText = true;
    this.afterToolCall = false;
    return `${separator}${content}`;
  }
}
