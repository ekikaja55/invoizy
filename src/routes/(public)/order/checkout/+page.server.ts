import { fail } from '@sveltejs/kit';
import { getActiveCatalog, createOrder, OrderError } from '$lib/server/db/queries/order';
import { checkoutSchema, checkoutItemsSchema, type CheckoutItem } from '$lib/schemas/order';
import { checkOrderSubmitRateLimit } from '$lib/server/ratelimit';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const catalog = await getActiveCatalog();

  const productCategories = catalog.filter((c) => !c.isShipping);
  const shippingCategory = catalog.find((c) => c.isShipping) ?? null;

  return { productCategories, shippingCategory };
};

export const actions: Actions = {
  default: async ({ request, getClientAddress }) => {
    const formData = await request.formData();

    // Honeypot anti-bot: field tersembunyi yang cuma diisi bot. Manusia tidak mengisinya.
    const honeypot = formData.get('website');
    if (typeof honeypot === 'string' && honeypot.trim() !== '') {
      return { success: true }; // diam-diam tolak bot
    }

    // Rate limit per IP — cegah spam submit (honeypot lolos → ini lapis kedua).
    try {
      const rl = await checkOrderSubmitRateLimit(getClientAddress());
      if (!rl.success) {
        return fail(429, { error: 'Terlalu banyak percobaan. Silakan coba lagi beberapa menit.' });
      }
    } catch (err) {
      // Upstash bermasalah → jangan blokir order, tapi catat.
      logger.error('order.ratelimit-failed', { error: err });
    }

    const parsed = checkoutSchema.safeParse({
      handle: formData.get('handle'),
      email: formData.get('email'),
      note: formData.get('note'),
      shippingId: formData.get('shippingId')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    let items: CheckoutItem[];
    try {
      items = checkoutItemsSchema.parse(JSON.parse(String(formData.get('items') ?? '[]')));
    } catch {
      return fail(400, { error: 'Keranjang tidak valid. Silakan muat ulang halaman order.' });
    }

    try {
      const { orderId } = await createOrder({
        handle: parsed.data.handle,
        email: parsed.data.email,
        note: parsed.data.note ?? '',
        items,
        shippingId: parsed.data.shippingId || null
      });
      return { success: true, orderId };
    } catch (err) {
      if (err instanceof OrderError) {
        return fail(400, { error: err.message });
      }
      logger.error('order.create-failed', { error: err });
      return fail(500, { error: 'Gagal membuat pesanan. Silakan coba lagi.' });
    }
  }
};
