import { describe, expect, it } from 'vitest';
import { makeTurnContext } from '../persistence/scripted/make-turn-context.js';
import { StepRecorder } from './step-recorder.js';

describe('StepRecorder.note', () => {
  it('registra e emite um passo decidido pelo código, sem tool', () => {
    const recorder = new StepRecorder();
    const { context, events } = makeTurnContext();
    recorder.note(context, {
      kind: 'handed_off',
      label: 'transferiu para um analista',
      result: 'motivo: pedido do funcionário',
      status: 'ok',
    });
    expect(recorder.steps).toEqual([
      {
        id: 's1',
        kind: 'handed_off',
        label: 'transferiu para um analista',
        result: 'motivo: pedido do funcionário',
        status: 'ok',
        attempts: 1,
        durationMs: 0,
      },
    ]);
    expect(events).toEqual([{ type: 'step', step: recorder.steps[0] }]);
  });
});
