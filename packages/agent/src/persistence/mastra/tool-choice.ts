const MAX_FORCED_STEPS = 3;
const CITATION_TOOL = 'citar_artigo';

type ToolResult = { toolName: string; output?: unknown };
type StepWithTools = { toolCalls?: { toolName: string }[]; toolResults?: ToolResult[] };

function isApplicableCitation(result: ToolResult): boolean {
  const { output } = result;
  const applies = typeof output === 'object' && output !== null && 'applies' in output;
  return result.toolName === CITATION_TOOL && applies && output.applies === true;
}

function hasFinished(finishingTools: string[], steps: StepWithTools[]): boolean {
  const calls = steps.flatMap((step) => step.toolCalls ?? []);
  const results = steps.flatMap((step) => step.toolResults ?? []);
  return (
    calls.some((call) => finishingTools.includes(call.toolName)) ||
    results.some(isApplicableCitation)
  );
}

export function chooseToolChoice(
  finishingTools: string[],
  steps: StepWithTools[],
): 'required' | 'auto' {
  const exhausted = steps.length >= MAX_FORCED_STEPS;
  const free = exhausted || finishingTools.length === 0 || hasFinished(finishingTools, steps);
  return free ? 'auto' : 'required';
}
