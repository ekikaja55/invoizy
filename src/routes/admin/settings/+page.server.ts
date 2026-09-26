import { fail } from '@sveltejs/kit';
import { settingsSchema } from '$lib/schemas/settings';
import { getSettings, updateSettings } from '$lib/server/db/queries/settings';
import { validateQrisFile, uploadQrisImage } from '$lib/server/storage/supabase';
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
      bankName: formData.get('bankName'),
      bankAccountNumber: formData.get('bankAccountNumber'),
      bankAccountHolder: formData.get('bankAccountHolder'),
      vaInfo: formData.get('vaInfo'),
      paymentNote: formData.get('paymentNote')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    const qrisFile = formData.get('qrisFile');
    let qrisUrl: string | undefined;

    if (qrisFile instanceof File && qrisFile.size > 0) {
      const validationError = validateQrisFile(qrisFile);
      if (validationError) {
        return fail(400, { error: validationError });
      }

      try {
        qrisUrl = await uploadQrisImage(qrisFile);
      } catch (err) {
        logger.error('settings.qris-upload-failed', { error: err });
        return fail(500, { error: 'Gagal mengunggah QRIS.' });
      }
    }

    try {
      await updateSettings({ ...parsed.data, ...(qrisUrl && { qrisUrl }) });
      return { success: true };
    } catch (err) {
      logger.error('settings.update-failed', { error: err });
      return fail(500, { error: 'Gagal menyimpan pengaturan.' });
    }
  }
};