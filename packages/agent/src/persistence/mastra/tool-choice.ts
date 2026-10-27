const MAX_FORCED_STEPS = 3;
const CITATION_TOOL = 'citar_artigo';
const JSON_OUTPUT_TYPE = 'json';
const REFUSED_STATUSES = ['rule_violated', 'duplicate_found', 'not_found', 'refused'];

type ToolResult = { toolName: string; output?: unknown };
type StepWithTools = { toolCalls?: { toolName: string }[]; toolResults?: ToolResult[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function unwrap(output: unknown): unknown {
  return isRecord(output) && output.type === JSON_OUTPUT_TYPE ? output.value : output;
}

function isRefused(output: unknown): boolean {
  const value = unwrap(output);
  return isRecord(value) && REFUSED_STATUSES.includes(String(value.status));
}

function isApplicableCitation(result: ToolResult): boolean {
  const value = unwrap(result.output);
  return result.toolName === CITATION_TOOL && isRecord(value) && value.applies === true;
}

function hasFinished(finishingTools: string[], steps: StepWithTools[]): boolean {
  const calls = steps.flatMap((step) => step.toolCalls ?? []);
  const results = steps.flatMap((step) => step.toolResults ?? []);
  const accepted = results.filter(
    (result) => finishingTools.includes(result.toolName) && !isRefused(result.output),
  );
  const unanswered =
    results.length === 0 && calls.some((call) => finishingTools.includes(call.toolName));
  return accepted.length > 0 || unanswered || results.some(isApplicableCitation);
}

export function chooseToolChoice(
  finishingTools: string[],
  steps: StepWithTools[],
): 'required' | 'auto' {
  const exhausted = steps.length >= MAX_FORCED_STEPS;
  const free = exhausted || finishingTools.length === 0 || hasFinished(finishingTools, steps);
  return free ? 'auto' : 'required';
}
