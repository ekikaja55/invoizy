import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mock module SvelteKit bawaan sebelum import navigating.ts
const mockGoto = vi.fn();

vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => mockGoto(...args)
}));

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

// 2. Import modul yang akan diuji
import { navigateTo, navigateWithDelay } from '$lib/utils/navigating';
import { manualOverlay } from '$lib/stores/overlay.svelte';

describe('Navigating Utils Unit Tests (Battle-Testing)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		manualOverlay.hide();
		mockGoto.mockReset();
	});

	describe('1. navigateTo()', () => {
		it('berhasil memanggil goto dengan path yang tepat', async () => {
			mockGoto.mockResolvedValueOnce(undefined);

			const result = await navigateTo('/admin');

			expect(mockGoto).toHaveBeenCalledTimes(1);
			expect(mockGoto).toHaveBeenCalledWith('/admin');
			expect(result).toBe(true);
		});

		it('mengunci re-entrancy / double-click spam (hanya eksekusi 1 goto)', async () => {
			// Simulasi navigasi lambat (50ms)
			mockGoto.mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 50)));

			// Panggilan pertama (aktif)
			const p1 = navigateTo('/admin');

			// Panggilan kedua & ketiga saat p1 masih berjalan (spam click)
			const p2 = navigateTo('/admin');
			const p3 = navigateTo('/');

			const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

			expect(mockGoto).toHaveBeenCalledTimes(1);
			expect(res1).toBe(true);
			expect(res2).toBe(false); // Diabaikan oleh lock
			expect(res3).toBe(false); // Diabaikan oleh lock
		});

		it('menyaring error abort tanpa melempar unhandled rejection ke console', async () => {
			const abortError = { type: 'abort', message: 'Navigation aborted by router' };
			mockGoto.mockRejectedValueOnce(abortError);

			// Memastikan tidak throw error keluar
			const result = await navigateTo('/order');

			expect(result).toBe(false);
			expect(mockGoto).toHaveBeenCalledTimes(1);

			// Lock harus dilepas sehingga panggilan berikutnya tetap bisa berjalan
			mockGoto.mockResolvedValueOnce(undefined);
			const retryResult = await navigateTo('/order');
			expect(retryResult).toBe(true);
		});
	});

	describe('2. navigateWithDelay()', () => {
		it('mengaktifkan visual overlay selama delay dan menutupnya saat selesai', async () => {
			mockGoto.mockResolvedValueOnce(undefined);

			expect(manualOverlay.active).toBe(false);

			const navPromise = navigateWithDelay('/about-dev', 30, 'Memuat Profil...');

			// Saat sedang delay, overlay harus aktif dengan pesan yang benar
			expect(manualOverlay.active).toBe(true);
			expect(manualOverlay.message).toBe('Memuat Profil...');

			await navPromise;

			// Setelah navigasi selesai, overlay harus otomatis tertutup
			expect(manualOverlay.active).toBe(false);
			expect(mockGoto).toHaveBeenCalledWith('/about-dev');
		});

		it('tetap menutup overlay dan melepas lock jika navigasi mengalami error/abort', async () => {
			mockGoto.mockRejectedValueOnce({ type: 'abort' });

			const result = await navigateWithDelay('/about-dev', 20);

			expect(result).toBe(false);
			expect(manualOverlay.active).toBe(false);

			// Pastikan lock terlepas sehingga panggilan selanjutnya bisa jalan
			mockGoto.mockResolvedValueOnce(undefined);
			const retry = await navigateWithDelay('/about-dev', 20);
			expect(retry).toBe(true);
			expect(manualOverlay.active).toBe(false);
		});
	});
});
