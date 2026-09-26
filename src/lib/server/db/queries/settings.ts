import { db } from '$lib/server/db';
import { storeSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { SettingsInput } from '$lib/schemas/settings';

export async function getSettings() {
  const row = await db.query.storeSettings.findFirst({
    where: eq(storeSettings.id, 1)
  });
  return row ?? null;
}

export async function updateSettings(input: SettingsInput & { qrisUrl?: string }) {
  const [row] = await db
    .update(storeSettings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(storeSettings.id, 1))
    .returning();
  return row;
}