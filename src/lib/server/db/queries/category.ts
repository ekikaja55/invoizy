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
  const [row] = await db
    .update(categories)
    .set(input)
    .where(eq(categories.id, id))
    .returning();
  return row;
}

export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id));
}

export async function reorderCategory(id: string, direction: 'up' | 'down') {
  const all = await db.query.categories.findMany({ orderBy: [asc(categories.sortOrder)] });
  const index = all.findIndex((c) => c.id === id);

  if (index === -1) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= all.length) return;

  const current = all[index];
  const swapWith = all[swapIndex];

  await db.transaction(async (tx) => {
    await tx.update(categories).set({ sortOrder: swapWith.sortOrder }).where(eq(categories.id, current.id));
    await tx.update(categories).set({ sortOrder: current.sortOrder }).where(eq(categories.id, swapWith.id));
  });
}
