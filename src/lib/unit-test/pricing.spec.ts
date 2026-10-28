import { describe, it, expect } from 'vitest';
import {
	calculatePromoDiscount,
	calculateOrderTotals,
	type PromoRuleItem
} from '$lib/utils/pricing';

describe('Pricing & Promo Logic Unit Tests', () => {
	const mockPromoRules: PromoRuleItem[] = [
		{
			productId: 'prod-standee-1',
			minQty: 3,
			discountAmount: 3000
		},
		{
			productId: 'prod-keychain-2',
			minQty: 2,
			discountAmount: 5000
		}
	];

	describe('calculatePromoDiscount', () => {
		it('mengembalikan 0 jika tidak ada promo rules atau item kosong', () => {
			expect(calculatePromoDiscount([], mockPromoRules)).toBe(0);
			expect(calculatePromoDiscount([{ productId: 'prod-standee-1', qty: 5 }], [])).toBe(0);
		});

		it('mengembalikan diskon Rp 0 jika kuantitas kurang dari minQty (beli 2 item)', () => {
			const items = [{ productId: 'prod-standee-1', qty: 2 }];
			const discount = calculatePromoDiscount(items, mockPromoRules);
			expect(discount).toBe(0);
		});

		it('mengembalikan diskon Rp 3.000 jika kuantitas tepat minQty (beli 3 item)', () => {
			const items = [{ productId: 'prod-standee-1', qty: 3 }];
			const discount = calculatePromoDiscount(items, mockPromoRules);
			expect(discount).toBe(3000);
		});

		it('diskon tetap Rp 3.000 jika kuantitas belum mencapai kelipatan berikutnya (beli 5 item)', () => {
			const items = [{ productId: 'prod-standee-1', qty: 5 }];
			const discount = calculatePromoDiscount(items, mockPromoRules);
			expect(discount).toBe(3000);
		});

		it('diskon otomatis berlipat ganda menjadi Rp 6.000 jika kuantitas mencapai kelipatan kedua (beli 6 item)', () => {
			const items = [{ productId: 'prod-standee-1', qty: 6 }];
			const discount = calculatePromoDiscount(items, mockPromoRules);
			expect(discount).toBe(6000);
		});

		it('diskon berlipat ganda menjadi Rp 9.000 untuk kelipatan ketiga (beli 9 item)', () => {
			const items = [{ productId: 'prod-standee-1', qty: 9 }];
			const discount = calculatePromoDiscount(items, mockPromoRules);
			expect(discount).toBe(9000);
		});

		it('mengakumulasi diskon dari beberapa produk yang berbeda dengan benar', () => {
			const items = [
				{ productId: 'prod-standee-1', qty: 3 }, // diskon: 3.000
				{ productId: 'prod-keychain-2', qty: 4 } // diskon: (4/2) * 5.000 = 10.000
			];
			const discount = calculatePromoDiscount(items, mockPromoRules);
			expect(discount).toBe(13000);
		});

		it('mengakumulasi kuantitas varian produk yang sama ke dalam satu penghitungan promo', () => {
			// Pembeli beli 2 Standee Varian A dan 1 Standee Varian B (total 3 Standee)
			const items = [
				{ productId: 'prod-standee-1', qty: 2 },
				{ productId: 'prod-standee-1', qty: 1 }
			];
			const discount = calculatePromoDiscount(items, mockPromoRules);
			expect(discount).toBe(3000);
		});
	});

	describe('calculateOrderTotals', () => {
		it('menghitung subtotal, diskon, dan total akhir dengan tepat', () => {
			const items = [
				{ productId: 'prod-standee-1', price: 50000, qty: 3 }, // subtotal: 150.000, diskon: 3.000
				{ productId: 'prod-other', price: 25000, qty: 2 } // subtotal: 50.000, tanpa diskon
			];
			const shippingCost = 15000;

			const result = calculateOrderTotals(items, mockPromoRules, shippingCost);

			expect(result.subtotal).toBe(200000);
			expect(result.discountTotal).toBe(3000);
			expect(result.total).toBe(212000); // 200.000 - 3.000 + 15.000
		});

		it('mencegah total bernilai negatif jika diskon melebihi subtotal', () => {
			const items = [{ productId: 'prod-free', price: 1000, qty: 1 }];
			const extremePromo: PromoRuleItem[] = [
				{
					productId: 'prod-free',
					minQty: 1,
					discountAmount: 10000
				}
			];

			const result = calculateOrderTotals(items, extremePromo, 0);

			expect(result.subtotal).toBe(1000);
			expect(result.discountTotal).toBe(10000);
			expect(result.total).toBe(0); // Math.max(0, 1000 - 10000)
		});
	});
});
