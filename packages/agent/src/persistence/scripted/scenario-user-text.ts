import type { LlmMessage } from '../../core/llm-client.js';

const EMPLOYEE_MESSAGE = /<mensagem_do_funcionario>([\s\S]*)<\/mensagem_do_funcionario>/;

export function lastEmployeeText(messages: readonly LlmMessage[]): string {
  const last = messages.at(-1);
  const wrapped = EMPLOYEE_MESSAGE.exec(last?.content ?? '');
  return (wrapped?.[1] ?? '').trim();
}
