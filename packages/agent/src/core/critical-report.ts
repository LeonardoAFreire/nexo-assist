import type { Understanding } from '@nexo/contracts';

const GROUP_IMPACTS: Understanding['entities']['impact'][] = ['my_team', 'whole_company'];

export function isCriticalReport(understanding: Understanding): boolean {
  const { intent, entities } = understanding;
  return (
    intent === 'ticket_open' &&
    entities.blocksWork === true &&
    GROUP_IMPACTS.includes(entities.impact)
  );
}
