// src/lib/stores/overlay.svelte.ts

class OverlayStore {
	active = $state(false);
	message = $state('Preparing');

	show(msg = 'Preparing') {
		this.message = msg;
		this.active = true;
	}

	hide() {
		this.active = false;
	}
}

export const manualOverlay = new OverlayStore();
