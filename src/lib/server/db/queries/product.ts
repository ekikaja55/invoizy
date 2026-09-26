import { db } from '$lib/server/db';
import { products, categories } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { ProductInput } from '$lib/schemas/product';

export async function listProductsGroupedByCategory() {
  return db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder)],
    with: {
      products: {
        orderBy: [asc(products.sortOrder)]
      }
    }
  });
}

export async function createProduct(input: ProductInput) {
  const [row] = await db.insert(products).values(input).returning();
  return row;
}

export async function updateProduct(id: string, input: ProductInput) {
  const [row] = await db.update(products).set(input).where(eq(products.id, id)).returning();
  return row;
}

export async function deleteProduct(id: string) {
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
    await tx.update(products).set({ sortOrder: swapWith.sortOrder }).where(eq(products.id, current.id));
    await tx.update(products).set({ sortOrder: current.sortOrder }).where(eq(products.id, swapWith.id));
  });
}