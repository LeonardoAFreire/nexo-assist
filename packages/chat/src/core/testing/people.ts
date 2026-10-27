import type { UserProfile } from '@nexo/contracts';
import { EMPLOYEE_ID } from './factories.js';

export const ANA: UserProfile = {
  id: EMPLOYEE_ID,
  name: 'Ana Souza',
  role: 'employee',
  department: 'Financeiro',
  supportLevel: null,
  initials: 'AS',
};

export const BRUNO: UserProfile = {
  id: '2b8e4d17-5c3a-4f92-8e61-7a9d0c1b3e42',
  name: 'Bruno Tavares',
  role: 'employee',
  department: 'Comercial',
  supportLevel: null,
  initials: 'BT',
};

export const RAFAEL: UserProfile = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  name: 'Rafael Lima',
  role: 'analyst',
  department: 'Suporte',
  supportLevel: 'N2',
  initials: 'RL',
};

export const GABRIELA: UserProfile = {
  id: 'a1b2c3d4-0000-4000-8000-000000000002',
  name: 'Gabriela Rocha',
  role: 'analyst',
  department: 'Suporte',
  supportLevel: 'N1',
  initials: 'GR',
};

export const ALL_PEOPLE: readonly UserProfile[] = [ANA, BRUNO, RAFAEL, GABRIELA];
