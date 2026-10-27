const PARAGRAPH_BREAK = '\n\n';

export class StepTextSeparator {
  private hasText = false;
  private afterToolCall = false;

  noteToolCall(): void {
    this.afterToolCall = this.hasText;
  }

  apply(delta: string): string {
    const separator = this.afterToolCall ? PARAGRAPH_BREAK : '';
    this.hasText = true;
    this.afterToolCall = false;
    return `${separator}${delta}`;
  }
}
