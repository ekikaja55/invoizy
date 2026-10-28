import { fail } from '@sveltejs/kit';
import { paymentMethodSchema } from '$lib/schemas/payment-method';
import {
	listPaymentMethods,
	createPaymentMethod,
	updatePaymentMethod,
	deletePaymentMethod,
	reorderPaymentMethod,
	reorderPaymentMethodsBatch
} from '$lib/server/db/queries/payment-method';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const methods = await listPaymentMethods();
	return { methods };
};

function parseForm(formData: FormData) {
	return paymentMethodSchema.safeParse({
		type: formData.get('type'),
		label: formData.get('label'),
		accountNumber: formData.get('accountNumber'),
		accountHolder: formData.get('accountHolder'),
		note: formData.get('note'),
		active: formData.get('active') === 'on',
		sortOrder: formData.get('sortOrder')
	});
}

export const actions: Actions = {
	create: async ({ request }) => {
		const parsed = parseForm(await request.formData());
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
		}

		try {
			await createPaymentMethod(parsed.data);
			return { success: true };
		} catch (err) {
			logger.error('payment-method.create-failed', { error: err });
			return fail(500, { error: 'Gagal menyimpan metode pembayaran.' });
		}
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		if (typeof id !== 'string') return fail(400, { error: 'ID tidak valid.' });

		const parsed = parseForm(formData);
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
		}

		try {
			await updatePaymentMethod(id, parsed.data);
			return { success: true };
		} catch (err) {
			logger.error('payment-method.update-failed', { error: err, id });
			return fail(500, { error: 'Gagal memperbarui metode pembayaran.' });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		if (typeof id !== 'string') return fail(400, { error: 'ID tidak valid.' });

		try {
			await deletePaymentMethod(id);
			return { success: true };
		} catch (err) {
			logger.error('payment-method.delete-failed', { error: err, id });
			return fail(500, { error: 'Gagal menghapus metode pembayaran.' });
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
			await reorderPaymentMethod(id, direction);
			return { success: true };
		} catch (err) {
			logger.error('payment-method.reorder-failed', { error: err, id });
			return fail(500, { error: 'Gagal mengubah urutan.' });
		}
	},

	reorderBatch: async ({ request }) => {
		const formData = await request.formData();
		const rawOrderedIds = formData.get('orderedIds');

		if (typeof rawOrderedIds !== 'string') {
			return fail(400, { error: 'Data urutan tidak valid.' });
		}

		try {
			const orderedIds: string[] = JSON.parse(rawOrderedIds);
			if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
				return fail(400, { error: 'Daftar ID metode pembayaran kosong.' });
			}

			await reorderPaymentMethodsBatch(orderedIds);
			return { success: true };
		} catch (err) {
			logger.error('payment-method.reorder-batch-failed', { error: err });
			return fail(500, { error: 'Gagal menyimpan susunan urutan metode pembayaran.' });
		}
	}
};
