import { error } from '@sveltejs/kit';
import { getProductById } from '$lib/server/db/queries/product';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const product = await getProductById(params.id);
	if (!product || !product.active) {
		throw error(404, 'Produk tidak ditemukan atau sudah tidak tersedia.');
	}

	return {
		product
	};
};
