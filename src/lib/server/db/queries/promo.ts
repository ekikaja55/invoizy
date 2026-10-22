import { db } from '$lib/server/db';
import { productPromos, products } from '$lib/server/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export async function listPromosWithProducts() {
	return db.query.productPromos.findMany({
		orderBy: [desc(productPromos.createdAt)],
		with: {
			product: {
				with: {
					category: true
				}
			}
		}
	});
}

export async function listActiveProductsForPromo() {
	return db.query.products.findMany({
		where: eq(products.active, true),
		orderBy: [asc(products.name)],
		with: {
			category: true
		}
	});
}

export async function createPromo(input: {
	productId: string;
	name: string;
	minQty: number;
	discountAmount: number;
	active?: boolean;
}) {
	const [promo] = await db
		.insert(productPromos)
		.values({
			productId: input.productId,
			name: input.name.trim(),
			minQty: input.minQty,
			discountAmount: input.discountAmount,
			active: input.active !== undefined ? input.active : true
		})
		.returning();
	return promo;
}

export async function togglePromo(id: string, active: boolean) {
	const [promo] = await db
		.update(productPromos)
		.set({ active, updatedAt: new Date() })
		.where(eq(productPromos.id, id))
		.returning();
	return promo;
}

export async function updatePromo(
	id: string,
	input: {
		productId: string;
		name: string;
		minQty: number;
		discountAmount: number;
		active?: boolean;
	}
) {
	const [promo] = await db
		.update(productPromos)
		.set({
			productId: input.productId,
			name: input.name.trim(),
			minQty: input.minQty,
			discountAmount: input.discountAmount,
			...(input.active !== undefined ? { active: input.active } : {}),
			updatedAt: new Date()
		})
		.where(eq(productPromos.id, id))
		.returning();
	return promo;
}

export async function deletePromo(id: string) {
	await db.delete(productPromos).where(eq(productPromos.id, id));
}
