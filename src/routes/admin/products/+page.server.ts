import { fail } from '@sveltejs/kit';
import { productSchema } from '$lib/schemas/product';
import {
	listProductsGroupedByCategory,
	createProduct,
	updateProduct,
	deleteProduct,
	reorderProduct
} from '$lib/server/db/queries/product';
import { getSettings } from '$lib/server/db/queries/settings';
import { uploadProductImage, deleteProductImage } from '$lib/server/storage/supabase';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [categoriesWithProducts, settings] = await Promise.all([
		listProductsGroupedByCategory(),
		getSettings()
	]);
	return {
		categoriesWithProducts,
		storeName: settings?.storeName || 'Toko'
	};
};

function parseProductForm(formData: FormData, imageUrls: string[] = []) {
	let variants = [];
	try {
		const rawVariants = formData.get('variants');
		if (typeof rawVariants === 'string' && rawVariants.trim() !== '') {
			variants = JSON.parse(rawVariants);
		}
	} catch (err) {
		logger.warn('product.parse-variants-failed', { error: err });
	}

	return productSchema.safeParse({
		categoryId: formData.get('categoryId'),
		name: formData.get('name'),
		priceInt: formData.get('priceInt'),
		weightGrams: formData.get('weightGrams'),
		trackStock: formData.get('trackStock') === 'on',
		stock: formData.get('stock'),
		description: formData.get('description'),
		active: formData.get('active') === 'on',
		sortOrder: formData.get('sortOrder'),
		imageUrls,
		variants
	});
}

export const actions: Actions = {
	create: async ({ request }) => {
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

		const parsed = parseProductForm(formData, uploadedUrls);

		if (!parsed.success) {
			for (const url of uploadedUrls) {
				await deleteProductImage(url).catch(() => {});
			}
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
		}

		try {
			await createProduct(parsed.data);
			return { success: true };
		} catch (err) {
			for (const url of uploadedUrls) {
				await deleteProductImage(url).catch(() => {});
			}
			logger.error('product.create-failed', { error: err });
			return fail(500, { error: 'Gagal menyimpan produk.' });
		}
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string') {
			return fail(400, { error: 'ID produk tidak valid.' });
		}

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
			if (file instanceof File && file.size > 0 && retainedUrls.length + newUploadedUrls.length < 4) {
				try {
					const res = await uploadProductImage(file);
					newUploadedUrls.push(res.url);
				} catch (err) {
					logger.error('product.image-upload-failed', { error: err });
				}
			}
		}

		const finalImageUrls = [...retainedUrls, ...newUploadedUrls].slice(0, 4);
		const parsed = parseProductForm(formData, finalImageUrls);

		if (!parsed.success) {
			for (const url of newUploadedUrls) {
				await deleteProductImage(url).catch(() => {});
			}
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
		}

		// Bersihkan gambar lama yang dihapus dari Supabase Storage
		try {
			const oldUrlsRaw = formData.get('oldImages');
			if (typeof oldUrlsRaw === 'string' && oldUrlsRaw.trim() !== '') {
				const oldUrls = JSON.parse(oldUrlsRaw) as string[];
				for (const oldUrl of oldUrls) {
					if (!finalImageUrls.includes(oldUrl)) {
						await deleteProductImage(oldUrl).catch(() => {});
					}
				}
			}
		} catch (err) {
			logger.warn('product.cleanup-old-images-failed', { error: err });
		}

		try {
			await updateProduct(id, parsed.data);
			return { success: true };
		} catch (err) {
			logger.error('product.update-failed', { error: err, productId: id });
			return fail(500, { error: 'Gagal memperbarui produk.' });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string') {
			return fail(400, { error: 'ID produk tidak valid.' });
		}

		try {
			await deleteProduct(id);
			return { success: true };
		} catch (err) {
			logger.error('product.delete-failed', { error: err, productId: id });
			return fail(500, { error: 'Gagal menghapus produk.' });
		}
	},

	reorder: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		const direction = formData.get('direction');

		if (typeof id !== 'string' || (direction !== 'up' && direction !== 'down')) {
			return fail(400, { error: 'Data reorder tidak valid.' });
		}

		try {
			await reorderProduct(id, direction);
			return { success: true };
		} catch (err) {
			logger.error('product.reorder-failed', { error: err, productId: id });
			return fail(500, { error: 'Gagal mengubah urutan.' });
		}
	}
};
