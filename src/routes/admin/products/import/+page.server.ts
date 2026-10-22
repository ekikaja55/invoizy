import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import { bulkImportProducts, type BulkProductItem } from '$lib/server/db/queries/product';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [allCategories, allProducts] = await Promise.all([
		db.query.categories.findMany({
			orderBy: [asc(categories.sortOrder), asc(categories.name)]
		}),
		db.query.products.findMany({
			with: {
				category: true
			}
		})
	]);

	return {
		categories: allCategories.map((c) => ({
			id: c.id,
			name: c.name
		})),
		existingProducts: allProducts.map((p) => ({
			id: p.id,
			name: p.name,
			categoryName: p.category.name
		}))
	};
};

export const actions: Actions = {
	import: async ({ request }) => {
		const formData = await request.formData();
		const itemsJson = formData.get('items');

		if (typeof itemsJson !== 'string' || !itemsJson) {
			return fail(400, { error: 'Tidak ada data produk yang dikirim untuk diimpor.' });
		}

		let parsedItems: BulkProductItem[];
		try {
			parsedItems = JSON.parse(itemsJson);
		} catch {
			return fail(400, { error: 'Format data produk tidak valid.' });
		}

		if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
			return fail(400, { error: 'Daftar produk impor kosong.' });
		}

		try {
			const result = await bulkImportProducts(parsedItems);
			logger.info('admin.products.bulk-import-page.success', { count: result.count });
			return { success: true, count: result.count };
		} catch (err) {
			logger.error('admin.products.bulk-import-page.failed', { error: err });
			return fail(500, {
				error: err instanceof Error ? err.message : 'Terjadi kegagalan saat menyimpan data produk.'
			});
		}
	}
};
