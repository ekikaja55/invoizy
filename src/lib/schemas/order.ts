import { z } from 'zod';

export const checkoutSchema = z.object({
  handle: z.string().trim().min(1, 'Handle wajib diisi').max(100),
  email: z.string().trim().email('Email tidak valid').max(254),
  note: z.string().trim().max(1000).optional().or(z.literal('')),
  shippingId: z.string().uuid('Ongkir tidak valid').optional().or(z.literal(''))
});

export const checkoutItemsSchema = z
  .array(
    z.object({
      productId: z.string().uuid('Produk tidak valid'),
      qty: z.number().int().min(1, 'Jumlah minimal 1').max(999, 'Jumlah maksimal 999')
    })
  )
  .min(1, 'Keranjang masih kosong')
  .max(100, 'Terlalu banyak item dalam satu pesanan');

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutItem = z.infer<typeof checkoutItemsSchema>[number];
