import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { browser } from '$app/environment';
import type { AdminRoute, PublicRoute } from '$lib/constants';
import { manualOverlay } from '$lib/stores/overlay.svelte';

let isNavigating = false;
let delayTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Imperative navigation helper dengan pengaman:
 * 1. SSR check (hanya dieksekusi di browser).
 * 2. Re-entrancy guard (mencegah race condition dari double-click spam).
 * 3. Abort-safe error boundary (menyaring internal cancellation router).
 * 4. Tanpa redundansi invalidateAll() (mencegah beban query ganda pada server).
 */
export async function navigateTo(path: AdminRoute | PublicRoute): Promise<boolean> {
	if (!browser) return false;
	if (isNavigating) return false;

	isNavigating = true;
	try {
		await goto(resolve(path));
		return true;
	} catch (err) {
		if ((err as { type?: string })?.type !== 'abort') {
			console.error('[Navigation Error]', err);
		}
		return false;
	} finally {
		isNavigating = false;
	}
}

/**
 * Delayed navigation dengan visual transition overlay.
 * Mengamankan timer dari ghosting dan selalu mereset overlay serta lock di finally.
 */
export async function navigateWithDelay(
	path: AdminRoute | PublicRoute,
	delayMs = 1500,
	message = 'Preparing'
): Promise<boolean> {
	if (!browser) return false;
	if (isNavigating) return false;

	isNavigating = true;
	manualOverlay.show(message);

	if (delayTimer !== null) {
		clearTimeout(delayTimer);
		delayTimer = null;
	}

	try {
		await new Promise<void>((res) => {
			delayTimer = setTimeout(() => {
				delayTimer = null;
				res();
			}, delayMs);
		});

		await goto(resolve(path));
		return true;
	} catch (err) {
		if ((err as { type?: string })?.type !== 'abort') {
			console.error('[Delayed Navigation Error]', err);
		}
		return false;
	} finally {
		if (delayTimer !== null) {
			clearTimeout(delayTimer);
			delayTimer = null;
		}
		manualOverlay.hide();
		isNavigating = false;
	}
}
