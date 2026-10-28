import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { getSettings } from '$lib/server/db/queries/settings';
import { eq, asc, isNotNull, sql, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [settings, showcaseProducts] = await Promise.all([
		getSettings(),
		db.query.products.findMany({
			where: and(
				eq(products.active, true),
				isNotNull(products.imageUrls),
				sql`array_length(${products.imageUrls}, 1) > 0`
			),
			orderBy: [asc(products.sortOrder), asc(products.createdAt)],
			limit: 12,
			columns: {
				id: true,
				name: true,
				imageUrls: true,
				priceInt: true
			}
		})
	]);

	return { settings, showcaseProducts };
};
