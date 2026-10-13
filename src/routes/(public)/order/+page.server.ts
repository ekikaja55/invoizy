import { getActiveCatalog } from '$lib/server/db/queries/order';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const catalog = await getActiveCatalog();

	// Syarat: baris kategori ongkir peninggalan sudah dihapus + kolom is_shipping di-drop.
	return { productCategories: catalog };
};
