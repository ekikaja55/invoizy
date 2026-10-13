import { z } from 'zod';

// Kontrak terkunci dari JSON aktual RajaOngkir V2 (hasil trial Fase A).
// Semua respons API divalidasi skema ini sebelum dipakai — jangan percaya mentah.

export const destinationSchema = z.object({
	id: z.number().int(),
	label: z.string(),
	province_name: z.string(),
	city_name: z.string(),
	district_name: z.string(),
	subdistrict_name: z.string(),
	zip_code: z.string()
});

export const costOptionSchema = z.object({
	name: z.string(),
	code: z.string(),
	service: z.string(),
	description: z.string(),
	// Integer rupiah — selaras aturan harga aplikasi.
	cost: z.number().int().min(0),
	// String bebas: '3 day', '1 day', '0 day', '-', bahkan '' (JNT kosong).
	// Tampilkan apa adanya; sembunyikan bila '-' atau kosong.
	etd: z.string()
});

export const destinationListSchema = z.object({
	meta: z.object({ message: z.string(), code: z.number(), status: z.string() }),
	data: z.array(destinationSchema).nullable()
});

export const calcResponseSchema = z.object({
	meta: z.object({ message: z.string(), code: z.number(), status: z.string() }),
	data: z.array(costOptionSchema).nullable()
});

export type Destination = z.infer<typeof destinationSchema>;
export type CostOption = z.infer<typeof costOptionSchema>;
