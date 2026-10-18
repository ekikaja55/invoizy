import { db } from '$lib/server/db';
import { products, categories, productVariants } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { deleteProductImage } from '$lib/server/storage/supabase';
import type { ProductInput } from '$lib/schemas/product';

export async function listProductsGroupedByCategory() {
	return db.query.categories.findMany({
		orderBy: [asc(categories.sortOrder)],
		with: {
			products: {
				orderBy: [asc(products.sortOrder)],
				with: {
					variants: {
						orderBy: [asc(productVariants.sortOrder), asc(productVariants.createdAt)]
					}
				}
			}
		}
	});
}

export async function getProductById(id: string) {
	return db.query.products.findFirst({
		where: eq(products.id, id),
		with: {
			category: true,
			variants: {
				orderBy: [asc(productVariants.sortOrder), asc(productVariants.createdAt)]
			}
		}
	});
}

export async function createProduct(input: ProductInput) {
	return db.transaction(async (tx) => {
		const { variants: variantList, ...productData } = input;
		const [row] = await tx.insert(products).values(productData).returning();

		if (variantList && variantList.length > 0) {
			await tx.insert(productVariants).values(
				variantList.map((v, idx) => ({
					productId: row.id,
					name: v.name,
					stock: v.stock,
					sortOrder: idx
				}))
			);
		}

		return row;
	});
}

export async function updateProduct(id: string, input: ProductInput) {
	return db.transaction(async (tx) => {
		const { variants: variantList, ...productData } = input;
		const [row] = await tx.update(products).set(productData).where(eq(products.id, id)).returning();

		// Sinkronkan varian: hapus yang lama, masukkan yang baru
		await tx.delete(productVariants).where(eq(productVariants.productId, id));
		if (variantList && variantList.length > 0) {
			await tx.insert(productVariants).values(
				variantList.map((v, idx) => ({
					productId: id,
					name: v.name,
					stock: v.stock,
					sortOrder: idx
				}))
			);
		}

		return row;
	});
}

export async function deleteProduct(id: string) {
	const prod = await db.query.products.findFirst({ where: eq(products.id, id) });
	if (prod?.imageUrls && prod.imageUrls.length > 0) {
		for (const url of prod.imageUrls) {
			try {
				await deleteProductImage(url);
			} catch {
				// Abaikan jika file sudah tidak ada di storage
			}
		}
	}
	await db.delete(products).where(eq(products.id, id));
}

export async function reorderProduct(id: string, direction: 'up' | 'down') {
	const product = await db.query.products.findFirst({ where: eq(products.id, id) });
	if (!product) return;

	const siblings = await db.query.products.findMany({
		where: eq(products.categoryId, product.categoryId),
		orderBy: [asc(products.sortOrder)]
	});

	const index = siblings.findIndex((p) => p.id === id);
	const swapIndex = direction === 'up' ? index - 1 : index + 1;
	if (swapIndex < 0 || swapIndex >= siblings.length) return;

	const current = siblings[index];
	const swapWith = siblings[swapIndex];

	await db.transaction(async (tx) => {
		await tx
			.update(products)
			.set({ sortOrder: swapWith.sortOrder })
			.where(eq(products.id, current.id));
		await tx
			.update(products)
			.set({ sortOrder: current.sortOrder })
			.where(eq(products.id, swapWith.id));
	});
}
