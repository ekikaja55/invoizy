import { z } from 'zod';

export const paymentMethodSchema = z.object({
  type: z.enum(['bank', 'va', 'other']),
  label: z.string().trim().min(1, 'Label wajib diisi').max(100),
  accountNumber: z.string().trim().min(1, 'Nomor rekening/VA wajib diisi').max(100),
  accountHolder: z.string().trim().min(1, 'Nama pemilik wajib diisi').max(100),
  note: z.string().trim().max(255).optional().or(z.literal('')),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;