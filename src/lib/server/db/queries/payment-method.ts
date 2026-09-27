import { db } from '$lib/server/db';
import { paymentMethods } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { PaymentMethodInput } from '$lib/schemas/payment-method';

export async function listPaymentMethods() {
  return db.query.paymentMethods.findMany({
    orderBy: [asc(paymentMethods.sortOrder)]
  });
}

export async function createPaymentMethod(input: PaymentMethodInput) {
  const [row] = await db.insert(paymentMethods).values(input).returning();
  return row;
}

export async function updatePaymentMethod(id: string, input: PaymentMethodInput) {
  const [row] = await db
    .update(paymentMethods)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(paymentMethods.id, id))
    .returning();
  return row;
}

export async function deletePaymentMethod(id: string) {
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
}

export async function reorderPaymentMethod(id: string, direction: 'up' | 'down') {
  const all = await db.query.paymentMethods.findMany({ orderBy: [asc(paymentMethods.sortOrder)] });
  const index = all.findIndex((p) => p.id === id);
  if (index === -1) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= all.length) return;

  const current = all[index];
  const swapWith = all[swapIndex];

  await db.transaction(async (tx) => {
    await tx.update(paymentMethods).set({ sortOrder: swapWith.sortOrder }).where(eq(paymentMethods.id, current.id));
    await tx.update(paymentMethods).set({ sortOrder: current.sortOrder }).where(eq(paymentMethods.id, swapWith.id));
  });
}
