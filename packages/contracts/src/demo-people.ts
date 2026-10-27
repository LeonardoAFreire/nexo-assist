import type { UserProfile } from './identity/user-profile.js';

export type DemoPerson = UserProfile & { email: string };

export const DEMO_EMPLOYEES: readonly DemoPerson[] = [
  {
    id: '6f1c2a8e-3b7d-4e55-9a10-1d2f3c4b5a61',
    name: 'Ana Souza',
    email: 'ana.souza@nexo.com.br',
    role: 'employee',
    department: 'Financeiro',
    supportLevel: null,
    initials: 'AS',
  },
  {
    id: '2b8e4d17-5c3a-4f92-8e61-7a9d0c1b3e42',
    name: 'Bruno Tavares',
    email: 'bruno.tavares@nexo.com.br',
    role: 'employee',
    department: 'Comercial',
    supportLevel: null,
    initials: 'BT',
  },
  {
    id: '9d3a6f20-1e8b-4c47-b5d3-0f2a8e6c4b17',
    name: 'Carla Mendes',
    email: 'carla.mendes@nexo.com.br',
    role: 'employee',
    department: 'Operações',
    supportLevel: null,
    initials: 'CM',
  },
  {
    id: '4c7b1e93-8a2d-4d05-a6f8-3e5b9d1c7a28',
    name: 'Diego Ramos',
    email: 'diego.ramos@nexo.com.br',
    role: 'employee',
    department: 'Marketing',
    supportLevel: null,
    initials: 'DR',
  },
  {
    id: '7e5d2c84-6b9f-4a13-9c70-5d8a2f4e6b39',
    name: 'Elisa Prado',
    email: 'elisa.prado@nexo.com.br',
    role: 'employee',
    department: 'Recursos Humanos',
    supportLevel: null,
    initials: 'EP',
  },
];

export const DEMO_ANALYSTS: readonly DemoPerson[] = [
  {
    id: 'b2d4f6a8-0c1e-4b3d-8f5a-9e7c1a3b5d70',
    name: 'Rafael Lima',
    email: 'rafael.lima@nexo.com.br',
    role: 'analyst',
    department: null,
    supportLevel: 'N2',
    initials: 'RL',
  },
  {
    id: 'a8c6e4d2-3f1b-4a59-b7d1-2c4e6a8f0b53',
    name: 'Gabriela Rocha',
    email: 'gabriela.rocha@nexo.com.br',
    role: 'analyst',
    department: null,
    supportLevel: 'N1',
    initials: 'GR',
  },
  {
    id: 'c5a3b1d9-7e2f-4c68-a4b0-8d6f2e1a9c84',
    name: 'Fábio Nunes',
    email: 'fabio.nunes@nexo.com.br',
    role: 'analyst',
    department: null,
    supportLevel: 'N1',
    initials: 'FN',
  },
];

export const DEMO_PEOPLE: readonly DemoPerson[] = [...DEMO_EMPLOYEES, ...DEMO_ANALYSTS];
