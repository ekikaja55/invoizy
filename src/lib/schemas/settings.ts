import { z } from 'zod';

export const settingsSchema = z.object({
	storeName: z.string().trim().min(1, 'Nama toko wajib diisi').max(100),
	instagram: z.string().trim().max(100).optional().or(z.literal('')),
	twitter: z.string().trim().max(100).optional().or(z.literal('')),
	emailFromName: z.string().trim().max(100).optional().or(z.literal('')),
	paymentNote: z.string().trim().max(1000).optional().or(z.literal('')),
	proofContact: z.string().trim().max(200).optional().or(z.literal('')),
	emergencyFlatRate: z.coerce.number().int().min(0).max(1_000_000),
	pickupCode: z.string().trim().max(50).optional().or(z.literal('')),
	pickupCodeEnabled: z.boolean().default(false)
});

export type SettingsInput = z.infer<typeof settingsSchema>;
