import { z } from 'zod';

export const isoDateTimeSchema = z.iso.datetime();

export type IsoDateTime = z.infer<typeof isoDateTimeSchema>;
