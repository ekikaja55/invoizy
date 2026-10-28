export interface PromoRuleItem {
	productId: string;
	minQty: number;
	discountAmount: number;
}

/**
 * Menghitung total diskon promo berdasarkan kuantitas per produk dengan aturan kelipatan (multiplied tiered discount).
 * Contoh: minQty 3, diskon Rp 3.000:
 * - qty 2 -> Rp 0
 * - qty 3 -> Rp 3.000
 * - qty 5 -> Rp 3.000
 * - qty 6 -> Rp 6.000
 */
export function calculatePromoDiscount(
	items: { productId: string; qty: number }[],
	rules: PromoRuleItem[]
): number {
	if (!rules || rules.length === 0 || !items || items.length === 0) return 0;

	const qtyPerProduct: Record<string, number> = {};
	for (const item of items) {
		qtyPerProduct[item.productId] = (qtyPerProduct[item.productId] || 0) + item.qty;
	}

	let totalDiscount = 0;
	for (const [prodId, qty] of Object.entries(qtyPerProduct)) {
		const matchingRules = rules.filter((r) => r.productId === prodId);
		for (const rule of matchingRules) {
			if (rule.minQty > 0 && qty >= rule.minQty && rule.discountAmount > 0) {
				const multiplier = Math.floor(qty / rule.minQty);
				totalDiscount += multiplier * rule.discountAmount;
			}
		}
	}

	return totalDiscount;
}

/**
 * Menghitung rincian total transaksi (subtotal, diskon, dan total akhir).
 * Selalu mengembalikan integer rupiah, tidak boleh negatif.
 */
export function calculateOrderTotals(
	items: { productId: string; price: number; qty: number }[],
	rules: PromoRuleItem[] = [],
	shippingCost: number = 0
): { subtotal: number; discountTotal: number; total: number } {
	const subtotal = items.reduce((sum, item) => sum + Math.round(item.price) * item.qty, 0);
	const discountTotal = calculatePromoDiscount(items, rules);
	const total = Math.max(0, subtotal - discountTotal) + Math.max(0, Math.round(shippingCost));

	return {
		subtotal,
		discountTotal,
		total
	};
}
