import { z } from 'zod';

export const productSchema = z.object({
	categoryId: z.string().uuid('Kategori tidak valid'),
	name: z.string().trim().min(1, 'Nama produk wajib diisi').max(150),
	priceInt: z.coerce.number().int().min(0, 'Harga tidak boleh negatif'),
	weightGrams: z.coerce.number().int().min(0, 'Berat tidak boleh negatif').default(0),
	trackStock: z.coerce.boolean().default(false),
	stock: z.coerce.number().int().min(0).default(0),
	active: z.coerce.boolean().default(true),
	description: z.string().trim().max(1000, 'Deskripsi maksimal 1000 karakter').optional().nullable(),
	imageUrls: z.array(z.string().url()).max(4).default([]),
	variants: z
		.array(
			z.object({
				id: z.string().uuid().optional(),
				name: z.string().trim().min(1, 'Nama varian wajib diisi').max(100),
				stock: z.coerce.number().int().min(0, 'Stok varian tidak boleh negatif')
			})
		)
		.default([])
});

export type ProductInput = z.infer<typeof productSchema>;
