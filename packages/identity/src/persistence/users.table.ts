import type { SupportLevel, UserRole } from '@nexo/contracts';
import { pgSchema, text, uuid } from 'drizzle-orm/pg-core';

export const IDENTITY_SCHEMA = 'identity';

export const identitySchema = pgSchema(IDENTITY_SCHEMA);

export const usersTable = identitySchema.table('users', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').$type<UserRole>().notNull(),
  department: text('department'),
  supportLevel: text('support_level').$type<SupportLevel>(),
  initials: text('initials').notNull(),
  passwordHash: text('password_hash'),
});
