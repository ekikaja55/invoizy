import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(100),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export type CategoryInput = z.infer<typeof categorySchema>;
