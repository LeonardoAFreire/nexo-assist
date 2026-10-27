import { describe, expect, it } from 'vitest';
import { DEMO_PEOPLE } from './demo-people.js';
import { userProfileSchema } from './identity/user-profile.js';

describe('DEMO_PEOPLE', () => {
  it('traz 5 funcionários e 3 analistas com perfis válidos', () => {
    const employees = DEMO_PEOPLE.filter((person) => person.role === 'employee');
    const analysts = DEMO_PEOPLE.filter((person) => person.role === 'analyst');
    expect(employees).toHaveLength(5);
    expect(analysts).toHaveLength(3);
    DEMO_PEOPLE.forEach((person) => {
      expect(userProfileSchema.safeParse(person).success).toBe(true);
    });
  });

  it('usa ids e e-mails únicos', () => {
    const ids = new Set(DEMO_PEOPLE.map((person) => person.id));
    const emails = new Set(DEMO_PEOPLE.map((person) => person.email));
    expect(ids.size).toBe(DEMO_PEOPLE.length);
    expect(emails.size).toBe(DEMO_PEOPLE.length);
  });

  it('define nível só para analistas e Rafael Lima como N2', () => {
    DEMO_PEOPLE.forEach((person) => {
      expect(person.supportLevel === null).toBe(person.role === 'employee');
    });
    expect(DEMO_PEOPLE.find((person) => person.name === 'Rafael Lima')?.supportLevel).toBe('N2');
  });
});
