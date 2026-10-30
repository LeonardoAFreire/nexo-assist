import { z } from 'zod';
import { envFields, PUBLIC_SEED_PASSWORDS } from './env.fields.js';

const PLACEHOLDER_SECRET_PATTERN = /change-me|changeme|example|segredo-de-teste/i;

type EnvInput = z.infer<z.ZodObject<typeof envFields>>;

function addIssue(context: z.RefinementCtx, path: string, message: string): void {
  context.addIssue({ code: 'custom', path: [path], message });
}

function validateConditionals(env: EnvInput, context: z.RefinementCtx): void {
  const isProduction = env.NODE_ENV === 'production';
  if (env.LLM_PROVIDER === 'openrouter' && !env.OPENROUTER_API_KEY) {
    addIssue(context, 'OPENROUTER_API_KEY', 'obrigatória quando LLM_PROVIDER=openrouter');
  }
  if (env.LLM_PROVIDER === 'scripted' && isProduction) {
    addIssue(context, 'LLM_PROVIDER', 'scripted não é permitido em produção');
  }
  if (env.LOG_LEVEL === 'debug' && isProduction) {
    addIssue(context, 'LOG_LEVEL', 'debug não é permitido em produção');
  }
  if (isProduction && PLACEHOLDER_SECRET_PATTERN.test(env.JWT_SECRET)) {
    addIssue(context, 'JWT_SECRET', 'o segredo de exemplo não é permitido em produção');
  }
  if (isProduction && PUBLIC_SEED_PASSWORDS.includes(env.SEED_USER_PASSWORD)) {
    addIssue(context, 'SEED_USER_PASSWORD', 'a senha pública não é permitida em produção');
  }
}

export const envSchema = z.object(envFields).superRefine(validateConditionals);

export type Env = z.infer<typeof envSchema>;
