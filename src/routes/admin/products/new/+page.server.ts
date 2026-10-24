import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { categories, products } from '$lib/server/db/schema';
import { sql, asc } from 'drizzle-orm';
import { productSchema } from '$lib/schemas/product';
import { createProduct } from '$lib/server/db/queries/product';
import { getSettings } from '$lib/server/db/queries/settings';
import { uploadProductImage, deleteProductImage } from '$lib/server/storage/supabase';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [allCategories, settings] = await Promise.all([
		db.query.categories.findMany({
			orderBy: [asc(categories.sortOrder), asc(categories.name)]
		}),
		getSettings()
	]);

	if (allCategories.length === 0) {
		throw redirect(303, '/admin/categories');
	}

	return {
		categories: allCategories.map((c) => ({
			id: c.id,
			name: c.name
		})),
		storeName: settings?.storeName || 'cho.lazey'
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const files = formData.getAll('images') as File[];

		const uploadedUrls: string[] = [];
		for (const file of files) {
			if (file instanceof File && file.size > 0 && uploadedUrls.length < 4) {
				try {
					const res = await uploadProductImage(file);
					uploadedUrls.push(res.url);
				} catch (err) {
					logger.error('product.image-upload-failed', { error: err });
				}
			}
		}

		let variants = [];
		try {
			const rawVariants = formData.get('variants');
			if (typeof rawVariants === 'string' && rawVariants.trim() !== '') {
				variants = JSON.parse(rawVariants);
			}
		} catch (err) {
			logger.warn('product.parse-variants-failed', { error: err });
		}

		const parsed = productSchema.safeParse({
			categoryId: formData.get('categoryId'),
			name: formData.get('name'),
			priceInt: formData.get('priceInt'),
			weightGrams: formData.get('weightGrams') || 0,
			trackStock: formData.get('trackStock') === 'on',
			stock: formData.get('stock') || 0,
			description: formData.get('description'),
			active: formData.get('active') === 'on',
			sortOrder: formData.get('sortOrder') || 0,
			imageUrls: uploadedUrls,
			variants
		});

		if (!parsed.success) {
			for (const url of uploadedUrls) {
				await deleteProductImage(url).catch(() => {});
			}
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data formulir tidak valid.' });
		}

		// Validasi nama duplikat
		const existingProduct = await db.query.products.findFirst({
			where: sql`lower(${products.name}) = lower(${parsed.data.name.trim()})`,
			with: { category: true }
		});

		if (existingProduct) {
			for (const url of uploadedUrls) {
				await deleteProductImage(url).catch(() => {});
			}
			return fail(400, {
				error: `Nama produk "${parsed.data.name}" sudah terdaftar di kategori "${existingProduct.category.name}". Gunakan nama lain.`
			});
		}

		try {
			await createProduct(parsed.data);
			logger.info('admin.product.create.success', { name: parsed.data.name });
		} catch (err) {
			for (const url of uploadedUrls) {
				await deleteProductImage(url).catch(() => {});
			}
			logger.error('admin.product.create.failed', { error: err });
			return fail(500, { error: 'Terjadi kegagalan saat menyimpan produk baru.' });
		}

		throw redirect(303, '/admin/products');
	}
};
