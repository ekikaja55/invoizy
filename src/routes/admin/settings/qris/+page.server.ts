
import { fail } from '@sveltejs/kit';
import {
  listQrisCodes,
  createQrisCode,
  updateQrisLabel,
  getQrisCode,
  deleteQrisCode,
  reorderQrisCode
} from '$lib/server/db/queries/qris';
import { validateQrisFile, uploadQrisImage, deleteQrisImage } from '$lib/server/storage/supabase';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const codes = await listQrisCodes();
  return { codes };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const label = formData.get('label');
    const file = formData.get('imageFile');

    if (typeof label !== 'string' || label.trim().length === 0) {
      return fail(400, { error: 'Label wajib diisi.' });
    }

    if (!(file instanceof File)) {
      return fail(400, { error: 'File QRIS wajib diunggah.' });
    }

    const validationError = validateQrisFile(file);
    if (validationError) {
      return fail(400, { error: validationError });
    }

    try {
      const { url, path } = await uploadQrisImage(file);
      await createQrisCode({ label: label.trim(), imageUrl: url, imagePath: path, sortOrder: 0 });
      return { success: true };
    } catch (err) {
      logger.error('qris.create-failed', { error: err });
      return fail(500, { error: 'Gagal mengunggah QRIS.' });
    }
  },

  update: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');
    const label = formData.get('label');
    const active = formData.get('active') === 'on';

    if (typeof id !== 'string' || typeof label !== 'string' || label.trim().length === 0) {
      return fail(400, { error: 'Data tidak valid.' });
    }

    try {
      await updateQrisLabel(id, label.trim(), active);
      return { success: true };
    } catch (err) {
      logger.error('qris.update-failed', { error: err, id });
      return fail(500, { error: 'Gagal memperbarui QRIS.' });
    }
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');

    if (typeof id !== 'string') {
      return fail(400, { error: 'ID tidak valid.' });
    }

    try {
      const existing = await getQrisCode(id);
      if (existing) {
        await deleteQrisImage(existing.imagePath);
      }
      await deleteQrisCode(id);
      return { success: true };
    } catch (err) {
      logger.error('qris.delete-failed', { error: err, id });
      return fail(500, { error: 'Gagal menghapus QRIS.' });
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
      await reorderQrisCode(id, direction);
      return { success: true };
    } catch (err) {
      logger.error('qris.reorder-failed', { error: err, id });
      return fail(500, { error: 'Gagal mengubah urutan.' });
    }
  }
};