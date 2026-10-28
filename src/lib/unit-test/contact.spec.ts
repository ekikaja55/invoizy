import { describe, it, expect } from 'vitest';
import { waLink, igLink } from '$lib/utils/contact';

describe('Contact Helpers Unit Tests', () => {
	describe('waLink', () => {
		it('mengonversi nomor awalan 0 ke standar internasional 62', () => {
			const link = waLink('08123456789', 'Halo Admin');
			expect(link).toBe('https://wa.me/628123456789?text=Halo%20Admin');
		});

		it('menangani nomor yang sudah berawalan 62 atau +62 dengan pemisah strip dan spasi', () => {
			const link1 = waLink('+62 812-3456-7890', 'Test');
			expect(link1).toBe('https://wa.me/6281234567890?text=Test');

			const link2 = waLink('6281234567890', 'Test');
			expect(link2).toBe('https://wa.me/6281234567890?text=Test');
		});

		it('menambahkan 62 jika nomor diinput tanpa awalan 0 (misal 8123456789)', () => {
			const link = waLink('8123456789', 'Order #123');
			expect(link).toBe('https://wa.me/628123456789?text=Order%20%23123');
		});

		it('meng-encode karakter baris baru dan tanda baca dengan rapi', () => {
			const multilineText = 'Halo Kak!\nPesanan #AB123\nTotal: Rp 50.000';
			const link = waLink('08123456789', multilineText);
			expect(link).toContain(encodeURIComponent(multilineText));
		});

		it('mengembalikan null jika input adalah handle media sosial atau nomor terlalu pendek', () => {
			expect(waLink('@cholazey_store')).toBeNull();
			expect(waLink('12345')).toBeNull();
			expect(waLink('')).toBeNull();
		});
	});

	describe('igLink', () => {
		it('mengonversi handle dengan simbol @ menjadi URL instagram valid', () => {
			expect(igLink('@cholazey')).toBe('https://instagram.com/cholazey');
			expect(igLink('cholazey')).toBe('https://instagram.com/cholazey');
		});

		it('mempertahankan URL jika input sudah berupa URL penuh', () => {
			expect(igLink('https://instagram.com/cholazey')).toBe('https://instagram.com/cholazey');
		});

		it('mengembalikan null untuk string kosong', () => {
			expect(igLink('')).toBeNull();
			expect(igLink('   ')).toBeNull();
		});
	});
});
