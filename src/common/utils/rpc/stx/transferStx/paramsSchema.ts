import { z } from 'zod';

const paramsSchema = z.object({
  amount: z.union([z.string(), z.number()]),
  recipient: z.string(),
  memo: z.string().optional(),
});

export type ParamsSchema = z.infer<typeof paramsSchema>;

export default paramsSchema;
