import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { CategoryInput } from '$lib/schemas/category';

export async function listCategories() {
	return db.query.categories.findMany({
		orderBy: [asc(categories.sortOrder)],
		with: { products: true }
	});
}

export async function createCategory(input: CategoryInput) {
	const [row] = await db.insert(categories).values(input).returning();
	return row;
}

export async function updateCategory(id: string, input: CategoryInput) {
	const [row] = await db.update(categories).set(input).where(eq(categories.id, id)).returning();
	return row;
}

export async function deleteCategory(id: string) {
	await db.delete(categories).where(eq(categories.id, id));
}

export async function reorderCategory(id: string, direction: 'up' | 'down') {
	const all = await db.query.categories.findMany({
		orderBy: [asc(categories.sortOrder), asc(categories.name), asc(categories.id)]
	});
	const index = all.findIndex((c) => c.id === id);

	if (index === -1) return;

	const swapIndex = direction === 'up' ? index - 1 : index + 1;
	if (swapIndex < 0 || swapIndex >= all.length) return;

	const updated = [...all];
	const [moved] = updated.splice(index, 1);
	updated.splice(swapIndex, 0, moved);

	await db.transaction(async (tx) => {
		for (let i = 0; i < updated.length; i++) {
			if (updated[i].sortOrder !== i) {
				await tx
					.update(categories)
					.set({ sortOrder: i })
					.where(eq(categories.id, updated[i].id));
			}
		}
	});
}
