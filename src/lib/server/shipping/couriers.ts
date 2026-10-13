export interface CourierConfig {
	code: string;
	label: string;
	// Allowlist exact-match nama service dari hasil trial.
	services: string[];
}

export const SHIPPING_COURIERS: CourierConfig[] = [
	{ code: 'jne', label: 'JNE', services: ['REG', 'YES'] },
	{ code: 'jnt', label: 'J&T', services: ['EZ'] },
	{ code: 'spx', label: 'SPX', services: ['SPX Standard'] },
	// Ekonomis ikut disertakan sebagai redundansi: ketersediaan service per rute
	// fluktuatif (API-nya sendiri bilang begitu), dan deskripsi "khusus Sumatera"-nya
	// terbukti salah. Urutan tampil: termurah dulu (diurutkan di Fase C).
	{ code: 'wahana', label: 'Wahana', services: ['Express', 'Ekonomis'] }
];
