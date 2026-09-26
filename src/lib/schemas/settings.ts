import { z } from 'zod';

export const settingsSchema = z.object({
  storeName: z.string().trim().min(1, 'Nama toko wajib diisi').max(100),
  instagram: z.string().trim().max(100).optional().or(z.literal('')),
  twitter: z.string().trim().max(100).optional().or(z.literal('')),
  emailFromName: z.string().trim().max(100).optional().or(z.literal('')),
  bankName: z.string().trim().max(100).optional().or(z.literal('')),
  bankAccountNumber: z.string().trim().max(50).optional().or(z.literal('')),
  bankAccountHolder: z.string().trim().max(100).optional().or(z.literal('')),
  vaInfo: z.string().trim().max(255).optional().or(z.literal('')),
  paymentNote: z.string().trim().max(1000).optional().or(z.literal(''))
});

export type SettingsInput = z.infer<typeof settingsSchema>;
