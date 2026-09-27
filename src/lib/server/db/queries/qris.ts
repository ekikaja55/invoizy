
import { db } from '$lib/server/db';
import { qrisCodes } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function listQrisCodes() {
  return db.query.qrisCodes.findMany({
    orderBy: [asc(qrisCodes.sortOrder)]
  });
}

export async function getQrisCode(id: string) {
  return db.query.qrisCodes.findFirst({
    where: eq(qrisCodes.id, id)
  });
}

export async function createQrisCode(input: {
  label: string;
  imageUrl: string;
  imagePath: string;
  sortOrder: number;
}) {
  const [row] = await db.insert(qrisCodes).values(input).returning();
  return row;
}

export async function updateQrisLabel(id: string, label: string, active: boolean) {
  const [row] = await db
    .update(qrisCodes)
    .set({ label, active, updatedAt: new Date() })
    .where(eq(qrisCodes.id, id))
    .returning();
  return row;
}

export async function deleteQrisCode(id: string) {
  await db.delete(qrisCodes).where(eq(qrisCodes.id, id));
}

export async function reorderQrisCode(id: string, direction: 'up' | 'down') {
  const all = await db.query.qrisCodes.findMany({
    orderBy: [asc(qrisCodes.sortOrder)]
  });

  const index = all.findIndex((q) => q.id === id);
  if (index === -1) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= all.length) return;

  const current = all[index];
  const swapWith = all[swapIndex];

  await db.transaction(async (tx) => {
    await tx
      .update(qrisCodes)
      .set({ sortOrder: swapWith.sortOrder })
      .where(eq(qrisCodes.id, current.id));
    await tx
      .update(qrisCodes)
      .set({ sortOrder: current.sortOrder })
      .where(eq(qrisCodes.id, swapWith.id));
  });
}