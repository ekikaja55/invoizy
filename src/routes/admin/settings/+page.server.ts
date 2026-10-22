import { fail } from '@sveltejs/kit';
import { settingsSchema } from '$lib/schemas/settings';
import { getSettings, updateSettings } from '$lib/server/db/queries/settings';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const settings = await getSettings();
	return { settings };
};

export const actions: Actions = {
	update: async ({ request }) => {
		const formData = await request.formData();

		const parsed = settingsSchema.safeParse({
			storeName: formData.get('storeName'),
			instagram: formData.get('instagram'),
			twitter: formData.get('twitter'),
			emailFromName: formData.get('emailFromName'),
			paymentNote: formData.get('paymentNote'),
			proofContact: formData.get('proofContact'),
			emergencyFlatRate: formData.get('emergencyFlatRate'),
			pickupCode: formData.get('pickupCode'),
			pickupCodeEnabled: formData.get('pickupCodeEnabled') === 'on' || formData.get('pickupCodeEnabled') === 'true',
			shopeeCheckoutUrl: formData.get('shopeeCheckoutUrl')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
		}

		try {
			await updateSettings(parsed.data);
			return { success: true };
		} catch (err) {
			logger.error('settings.update-failed', { error: err });
			return fail(500, { error: 'Gagal menyimpan pengaturan.' });
		}
	},

	savePickupCode: async ({ request }) => {
		const formData = await request.formData();
		const pickupCode = String(formData.get('pickupCode') ?? '').trim();

		if (pickupCode.length > 50) {
			return fail(400, { error: 'Kode pickup maksimal 50 karakter.' });
		}

		try {
			await updateSettings({
				pickupCode,
				pickupCodeEnabled: true
			});
			return { success: true, pickupCode, pickupCodeEnabled: true };
		} catch (err) {
			logger.error('settings.save-pickup-code-failed', { error: err });
			return fail(500, { error: 'Gagal menyimpan kode pickup.' });
		}
	}
};
