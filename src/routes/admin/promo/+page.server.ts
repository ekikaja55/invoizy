import { fail } from '@sveltejs/kit';
import {
	listPromosWithProducts,
	listActiveProductsForPromo,
	createPromo,
	updatePromo,
	togglePromo,
	deletePromo
} from '$lib/server/db/queries/promo';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [promos, products] = await Promise.all([
		listPromosWithProducts(),
		listActiveProductsForPromo()
	]);

	return {
		promos,
		products
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const productId = formData.get('productId');
		const name = formData.get('name');
		const minQty = Number(formData.get('minQty'));
		const discountAmount = Number(formData.get('discountAmount'));

		if (typeof productId !== 'string' || !productId) {
			return fail(400, { error: 'Pilih produk yang berlaku untuk promo ini.' });
		}
		if (typeof name !== 'string' || !name.trim()) {
			return fail(400, { error: 'Nama promo wajib diisi.' });
		}
		if (!Number.isInteger(minQty) || minQty < 1) {
			return fail(400, { error: 'Syarat minimal kuantitas minimal 1.' });
		}
		if (!Number.isInteger(discountAmount) || discountAmount <= 0) {
			return fail(400, { error: 'Nominal diskon harus lebih besar dari Rp 0.' });
		}

		try {
			await createPromo({
				productId,
				name,
				minQty,
				discountAmount,
				active: true
			});
			return { success: true };
		} catch (err) {
			logger.error('promo.create-failed', { error: err });
			return fail(500, { error: 'Gagal membuat promo baru.' });
		}
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		const productId = formData.get('productId');
		const name = formData.get('name');
		const minQty = Number(formData.get('minQty'));
		const discountAmount = Number(formData.get('discountAmount'));

		if (typeof id !== 'string' || !id) {
			return fail(400, { error: 'ID promo tidak valid.' });
		}
		if (typeof productId !== 'string' || !productId) {
			return fail(400, { error: 'Pilih produk yang berlaku untuk promo ini.' });
		}
		if (typeof name !== 'string' || !name.trim()) {
			return fail(400, { error: 'Nama promo wajib diisi.' });
		}
		if (!Number.isInteger(minQty) || minQty < 1) {
			return fail(400, { error: 'Syarat minimal kuantitas minimal 1.' });
		}
		if (!Number.isInteger(discountAmount) || discountAmount <= 0) {
			return fail(400, { error: 'Nominal diskon harus lebih besar dari Rp 0.' });
		}

		try {
			await updatePromo(id, {
				productId,
				name,
				minQty,
				discountAmount
			});
			return { success: true };
		} catch (err) {
			logger.error('promo.update-failed', { error: err, promoId: id });
			return fail(500, { error: 'Gagal memperbarui promo.' });
		}
	},

	toggle: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		const active = formData.get('active') === 'true';

		if (typeof id !== 'string') {
			return fail(400, { error: 'ID promo tidak valid.' });
		}

		try {
			await togglePromo(id, active);
			return { success: true };
		} catch (err) {
			logger.error('promo.toggle-failed', { error: err, promoId: id });
			return fail(500, { error: 'Gagal mengubah status promo.' });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string') {
			return fail(400, { error: 'ID promo tidak valid.' });
		}

		try {
			await deletePromo(id);
			return { success: true };
		} catch (err) {
			logger.error('promo.delete-failed', { error: err, promoId: id });
			return fail(500, { error: 'Gagal menghapus promo.' });
		}
	}
};
