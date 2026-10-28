import { fail, redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { categories, products } from '$lib/server/db/schema';
import { sql, asc, ne, and } from 'drizzle-orm';
import { productSchema } from '$lib/schemas/product';
import { getProductById, updateProduct } from '$lib/server/db/queries/product';
import { getSettings } from '$lib/server/db/queries/settings';
import {
	uploadProductImage,
	deleteProductImage,
	validateProductImageFile
} from '$lib/server/storage/supabase';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [allCategories, product, settings] = await Promise.all([
		db.query.categories.findMany({
			orderBy: [asc(categories.sortOrder), asc(categories.name)]
		}),
		getProductById(params.id),
		getSettings()
	]);

	if (!product) {
		throw error(404, 'Produk tidak ditemukan');
	}

	return {
		product: {
			id: product.id,
			categoryId: product.categoryId,
			name: product.name,
			priceInt: product.priceInt,
			weightGrams: product.weightGrams,
			trackStock: product.trackStock,
			stock: product.stock,
			description: product.description || '',
			active: product.active,
			sortOrder: product.sortOrder,
			imageUrls: product.imageUrls || [],
			variants: (product.variants || []).map((v) => ({
				id: v.id,
				name: v.name,
				stock: v.stock,
				trackStock: v.trackStock
			}))
		},
		categories: allCategories.map((c) => ({
			id: c.id,
			name: c.name
		})),
		storeName: settings?.storeName || 'cho.lazey'
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const formData = await request.formData();

		let retainedUrls: string[] = [];
		try {
			const raw = formData.get('existingImages');
			if (typeof raw === 'string' && raw.trim() !== '') {
				retainedUrls = JSON.parse(raw);
			}
		} catch (err) {
			logger.warn('product.parse-existing-images-failed', { error: err });
		}

		const files = formData.getAll('images') as File[];
		const newUploadedUrls: string[] = [];
		for (const file of files) {
			if (
				file instanceof File &&
				file.size > 0 &&
				retainedUrls.length + newUploadedUrls.length < 4
			) {
				const validationError = validateProductImageFile(file);
				if (validationError) {
					for (const url of newUploadedUrls) {
						await deleteProductImage(url).catch(() => {});
					}
					return fail(400, { error: validationError });
				}
				try {
					const res = await uploadProductImage(file);
					newUploadedUrls.push(res.url);
				} catch (err) {
					logger.error('product.image-upload-failed', { error: err });
				}
			}
		}

		const finalImageUrls = [...retainedUrls, ...newUploadedUrls].slice(0, 4);

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
			imageUrls: finalImageUrls,
			variants
		});

		if (!parsed.success) {
			for (const url of newUploadedUrls) {
				await deleteProductImage(url).catch(() => {});
			}
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data formulir tidak valid.' });
		}

		// Validasi nama duplikat mengecualikan produk yang sedang diedit
		const existingProduct = await db.query.products.findFirst({
			where: and(
				sql`lower(${products.name}) = lower(${parsed.data.name.trim()})`,
				ne(products.id, params.id)
			),
			with: { category: true }
		});

		if (existingProduct) {
			for (const url of newUploadedUrls) {
				await deleteProductImage(url).catch(() => {});
			}
			return fail(400, {
				error: `Nama produk "${parsed.data.name}" sudah digunakan di kategori "${existingProduct.category.name}". Gunakan nama lain.`
			});
		}

		try {
			await updateProduct(params.id, parsed.data);
			logger.info('admin.product.update.success', { id: params.id });
		} catch (err) {
			for (const url of newUploadedUrls) {
				await deleteProductImage(url).catch(() => {});
			}
			logger.error('admin.product.update.failed', { error: err });
			return fail(500, { error: 'Terjadi kegagalan saat memperbarui data produk.' });
		}

		throw redirect(303, '/admin/products');
	}
};
