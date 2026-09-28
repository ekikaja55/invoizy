import { goto, invalidateAll } from '$app/navigation';
import { resolve } from '$app/paths';
import type { AdminRoute, PublicRoute } from '$lib/constants';

export async function navigateTo(path: AdminRoute | PublicRoute) {
  await goto(resolve(path));
  await invalidateAll(); // Memastikan semua fungsi load direfresh bersih di client
}
