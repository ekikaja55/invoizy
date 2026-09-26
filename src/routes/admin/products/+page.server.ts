import { fail } from '@sveltejs/kit';
import { productSchema } from '$lib/schemas/product';
import {
  listProductsGroupedByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProduct
} from '$lib/server/db/queries/product';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const categoriesWithProducts = await listProductsGroupedByCategory();
  return { categoriesWithProducts };
};

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    categoryId: formData.get('categoryId'),
    name: formData.get('name'),
    priceInt: formData.get('priceInt'),
    trackStock: formData.get('trackStock') === 'on',
    stock: formData.get('stock'),
    active: formData.get('active') === 'on',
    sortOrder: formData.get('sortOrder')
  });
}

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const parsed = parseProductForm(formData);

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    try {
      await createProduct(parsed.data);
      return { success: true };
    } catch (err) {
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

    const parsed = parseProductForm(formData);

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
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