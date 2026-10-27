import { DEMO_EMPLOYEES } from '@nexo/contracts';
import type { TicketRecord } from '../../core/ticket-record.js';

export type SeedTicketSpec = Pick<
  TicketRecord,
  | 'number'
  | 'type'
  | 'title'
  | 'description'
  | 'category'
  | 'priority'
  | 'affected'
  | 'status'
  | 'requesterId'
> & {
  openedDaysAgo: number;
  updatedDaysAgo: number;
  updateLabel: string;
};

export function employeeIdByName(name: string): string {
  const employee = DEMO_EMPLOYEES.find((candidate) => candidate.name === name);
  if (employee === undefined) {
    throw new Error(`Funcionário de exemplo não encontrado: ${name}`);
  }
  return employee.id;
}
