import { z } from 'zod';

export const checkoutSchema = z.object({
	handle: z
		.string()
		.trim()
		.transform((v) => v.replace(/^@+/, ''))
		.pipe(z.string().min(3, 'Handle minimal 3 karakter').max(100, 'Handle terlalu panjang')),
	email: z.string().trim().email('Email tidak valid').max(254),
	note: z.string().trim().max(1000).optional().or(z.literal('')),
	address: z.string().trim().max(500).optional().default(''),
	phone: z
		.string()
		.trim()
		.max(20)
		.refine((v) => /^(\+?62|0)\d{9,13}$/.test(v.replace(/[\s\-.]/g, '')), 'Nomor HP tidak valid')
});

const mailOrderShippingSchema = z.object({
	kind: z.literal('mail_order')
});

const pickupDay1ShippingSchema = z.object({
	kind: z.literal('pickup_day_1')
});

const pickupDay2ShippingSchema = z.object({
	kind: z.literal('pickup_day_2')
});

// Ongkir dari kalkulasi client — cost & service divalidasi ulang server saat submit.
// etd/destLabel hanya display (seperti handle/note).
const quoteShippingSchema = z.object({
	kind: z.literal('quote'),
	courier: z.string().min(1).max(20),
	service: z.string().min(1).max(60),
	cost: z.number().int().min(0),
	destId: z.number().int().positive(),
	destLabel: z.string().trim().min(1).max(200)
});

const fallbackShippingSchema = z.object({
	kind: z.literal('fallback')
});

const pickupShippingSchema = z.object({
	kind: z.literal('pickup'),
	code: z.string().trim().max(50).optional()
});

export const checkoutShippingSchema = z.union([
	mailOrderShippingSchema,
	pickupDay1ShippingSchema,
	pickupDay2ShippingSchema,
	quoteShippingSchema,
	fallbackShippingSchema,
	pickupShippingSchema
]);

export const checkoutItemsSchema = z
	.array(
		z.object({
			productId: z.string().uuid('Produk tidak valid'),
			variantId: z.string().uuid('Varian tidak valid').optional().nullable(),
			variantName: z.string().trim().max(100).optional().nullable(),
			qty: z.number().int().min(1, 'Jumlah minimal 1').max(999, 'Jumlah maksimal 999')
		})
	)
	.min(1, 'Keranjang masih kosong')
	.max(100, 'Terlalu banyak item dalam satu pesanan');

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutItem = z.infer<typeof checkoutItemsSchema>[number];
export type CheckoutShipping = z.infer<typeof checkoutShippingSchema>;
