import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Navigation Semantics & Accessibility Audit', () => {
	it('SidebarNav.svelte menggunakan tag <a> semantik untuk navigasi Home & Admin', () => {
		const filePath = path.resolve(process.cwd(), 'src/lib/components/nav/SidebarNav.svelte');
		const content = fs.readFileSync(filePath, 'utf-8');

		// Tidak boleh ada <button yang memanggil navigateTo('/') atau navigateTo('/admin')
		expect(content).not.toMatch(/<button[^>]*navigateTo\('\/'\)/);
		expect(content).not.toMatch(/<button[^>]*navigateTo\('\/admin'\)/);

		// Harus menggunakan tag <a> dengan resolve('/') dan resolve('/admin')
		expect(content).toMatch(/<a[^>]*href=\{resolve\('\/'\)\}/);
		expect(content).toMatch(/<a[^>]*href=\{resolve\('\/admin'\)\}/);
	});

	it('MobileFab.svelte menggunakan tag <a> semantik untuk navigasi Home & Admin', () => {
		const filePath = path.resolve(process.cwd(), 'src/lib/components/nav/MobileFab.svelte');
		const content = fs.readFileSync(filePath, 'utf-8');

		// Tidak boleh ada <button yang memanggil navigateTo('/') atau navigateTo('/admin')
		expect(content).not.toMatch(/<button[^>]*navigateTo\('\/'\)/);
		expect(content).not.toMatch(/<button[^>]*navigateTo\('\/admin'\)/);

		// Harus menggunakan tag <a> dengan resolve('/') dan resolve('/admin')
		expect(content).toMatch(/<a[^>]*href=\{resolve\('\/'\)\}/);
		expect(content).toMatch(/<a[^>]*href=\{resolve\('\/admin'\)\}/);
	});

	it('navigating.ts tidak memanggil fungsi invalidateAll() (Zero Double-Fetch)', () => {
		const filePath = path.resolve(process.cwd(), 'src/lib/utils/navigating.ts');
		const content = fs.readFileSync(filePath, 'utf-8');

		expect(content).not.toMatch(/\bawait\s+invalidateAll\b/);
		expect(content).not.toMatch(/\bimport\s+{[^}]*invalidateAll[^}]*}\s+from/);
	});
});
