import { z } from 'zod';

export const productSchema = z.object({
  categoryId: z.string().uuid('Kategori tidak valid'),
  name: z.string().trim().min(1, 'Nama produk wajib diisi').max(150),
  priceInt: z.coerce.number().int().min(0, 'Harga tidak boleh negatif'),
  trackStock: z.coerce.boolean().default(false),
  stock: z.coerce.number().int().min(0).default(0),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export type ProductInput = z.infer<typeof productSchema>;
