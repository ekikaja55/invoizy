import { goto, invalidateAll } from '$app/navigation';
import { resolve } from '$app/paths';
import type { AdminRoute, PublicRoute } from '$lib/constants';
import { manualOverlay } from '$lib/stores/overlay.svelte';

export async function navigateTo(path: AdminRoute | PublicRoute) {
	await goto(resolve(path));
	await invalidateAll(); // Memastikan semua fungsi load direfresh bersih di client
}

export async function navigateWithDelay(
	path: AdminRoute | PublicRoute,
	delayMs = 1500,
	message = 'Preparing'
) {
	manualOverlay.show(message);
	try {
		await new Promise((r) => setTimeout(r, delayMs));
		await goto(resolve(path));
		await invalidateAll();
	} finally {
		manualOverlay.hide();
	}
}
