import { fail } from '@sveltejs/kit';
import { categorySchema } from '$lib/schemas/category';
import { listCategories, createCategory, updateCategory, deleteCategory, reorderCategory } from '$lib/server/db/queries/category';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const categories = await listCategories();
  return { categories };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const parsed = categorySchema.safeParse({
      name: formData.get('name'),
      sortOrder: formData.get('sortOrder')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    try {
      await createCategory(parsed.data);
      return { success: true };
    } catch (err) {
      logger.error('category.create-failed', { error: err });
      return fail(500, { error: 'Gagal menyimpan kategori.' });
    }
  },

  update: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');

    if (typeof id !== 'string') {
      return fail(400, { error: 'ID kategori tidak valid.' });
    }

    const parsed = categorySchema.safeParse({
      name: formData.get('name'),
      sortOrder: formData.get('sortOrder')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    try {
      await updateCategory(id, parsed.data);
      return { success: true };
    } catch (err) {
      logger.error('category.update-failed', { error: err, categoryId: id });
      return fail(500, { error: 'Gagal memperbarui kategori.' });
    }
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');

    if (typeof id !== 'string') {
      return fail(400, { error: 'ID kategori tidak valid.' });
    }

    try {
      await deleteCategory(id);
      return { success: true };
    } catch (err) {
      logger.error('category.delete-failed', { error: err, categoryId: id });
      return fail(500, { error: 'Gagal menghapus kategori.' });
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
      await reorderCategory(id, direction);
      return { success: true };
    } catch (err) {
      logger.error('category.reorder-failed', { error: err, categoryId: id });
      return fail(500, { error: 'Gagal mengubah urutan.' });
    }
  }
};
