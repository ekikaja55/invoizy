// src/lib/stores/cart.svelte.ts

import { browser } from '$app/environment';

export interface CartProduct {
	productId: string;
	variantId?: string | null;
	variantName?: string | null;
	categoryId: string;
	categoryName: string;
	name: string;
	price: number;
	qty: number;
}

export interface CartShippingMailOrder {
	kind: 'mail_order';
	cost: 0;
}

export interface CartShippingPickupDay1 {
	kind: 'pickup_day_1';
	cost: 0;
}

export interface CartShippingPickupDay2 {
	kind: 'pickup_day_2';
	cost: 0;
}

// Ongkir hasil kalkulasi RajaOngkir (server-validated ulang saat submit).
export interface CartShippingQuote {
	kind: 'quote';
	courier: string;
	courierLabel: string;
	service: string;
	cost: number;
	etd: string;
	destId: number;
	destLabel: string;
}

// Flat darurat saat layanan ongkir gangguan (rate dari Settings).
export interface CartShippingFallback {
	kind: 'fallback';
	cost: number;
}

// Ambil sendiri di toko (khusus rekanan/teman dengan kode rahasia).
export interface CartShippingPickup {
	kind: 'pickup';
	code?: string;
	cost: 0;
}

export type CartShipping =
	| CartShippingMailOrder
	| CartShippingPickupDay1
	| CartShippingPickupDay2
	| CartShippingQuote
	| CartShippingFallback
	| CartShippingPickup;

export function shippingLabel(s: CartShipping): string {
	if (s.kind === 'mail_order') return 'Mail Order (Pengiriman via Shopee)';
	if (s.kind === 'pickup_day_1') return 'Self-Pickup: Chibiconxi Day 1 (12 Des)';
	if (s.kind === 'pickup_day_2') return 'Self-Pickup: Chibiconxi Day 2 (13 Des)';
	if (s.kind === 'pickup') return 'Ambil Sendiri (Self-Pickup)';
	return s.kind === 'quote' ? `${s.courierLabel} ${s.service}` : 'Ongkir flat darurat';
}

export interface CartPromoRule {
	productId: string;
	name: string;
	minQty: number;
	discountAmount: number;
}

export function getCartItemKey(productId: string, variantId?: string | null): string {
	return variantId ? `${productId}:${variantId}` : productId;
}

const STORAGE_KEY = 'invoizy-cart-v1';

interface PersistedCart {
	items: CartProduct[];
	shipping: CartShipping | null;
}

function isValidShipping(v: unknown): v is CartShipping {
	if (!v || typeof v !== 'object') return false;
	const s = v as Record<string, unknown>;
	if (s.kind === 'mail_order' || s.kind === 'pickup_day_1' || s.kind === 'pickup_day_2') {
		return s.cost === 0;
	}
	if (s.kind === 'quote') {
		return (
			typeof s.courier === 'string' &&
			typeof s.service === 'string' &&
			typeof s.cost === 'number' &&
			typeof s.destId === 'number' &&
			typeof s.destLabel === 'string'
		);
	}
	if (s.kind === 'fallback') {
		return typeof s.cost === 'number';
	}
	if (s.kind === 'pickup') {
		return s.cost === 0;
	}
	// Bentuk lama (produk ongkir) otomatis digugurkan — migrasi diam-diam.
	return false;
}

function loadPersisted(): PersistedCart {
	if (!browser) return { items: [], shipping: null };

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { items: [], shipping: null };

		const parsed = JSON.parse(raw) as PersistedCart;
		return {
			items: Array.isArray(parsed.items) ? parsed.items : [],
			shipping: isValidShipping(parsed.shipping) ? parsed.shipping : null
		};
	} catch {
		// data korup / format lama, abaikan dan mulai bersih
		return { items: [], shipping: null };
	}
}

function createCart() {
	const initial = loadPersisted();
	let items = $state<CartProduct[]>(initial.items);
	let shipping = $state<CartShipping | null>(initial.shipping);

	function persist() {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, shipping }));
	}

	function addOrUpdateItem(product: Omit<CartProduct, 'qty'>, qty: number) {
		const targetKey = getCartItemKey(product.productId, product.variantId);
		const existingIndex = items.findIndex(
			(i) => getCartItemKey(i.productId, i.variantId) === targetKey
		);

		if (qty <= 0) {
			if (existingIndex !== -1) items.splice(existingIndex, 1);
		} else if (existingIndex !== -1) {
			items[existingIndex].qty = qty;
		} else {
			items.push({ ...product, qty });
		}

		persist();
	}

	function addItem(product: Omit<CartProduct, 'qty'>, deltaQty: number) {
		const targetKey = getCartItemKey(product.productId, product.variantId);
		const existingIndex = items.findIndex(
			(i) => getCartItemKey(i.productId, i.variantId) === targetKey
		);

		if (existingIndex !== -1) {
			items[existingIndex].qty += deltaQty;
			if (items[existingIndex].qty <= 0) {
				items.splice(existingIndex, 1);
			}
		} else if (deltaQty > 0) {
			items.push({ ...product, qty: deltaQty });
		}

		persist();
	}

	function getQty(productId: string, variantId?: string | null): number {
		const targetKey = getCartItemKey(productId, variantId);
		return (
			items.find((i) => getCartItemKey(i.productId, i.variantId) === targetKey)?.qty ?? 0
		);
	}

	function setShipping(option: CartShipping | null) {
		shipping = option;
		persist();
	}

	/**
	 * Sinkronkan cart tersimpan dengan katalog terbaru dari server:
	 * - buang item yang produknya sudah dihapus / nonaktif
	 * - perbarui nama & harga ke nilai terbaru
	 * - kurangi qty kalau melebihi stok yang tersedia (baik stok produk maupun varian)
	 */
	function reconcile(
		catalog: Map<
			string,
			{
				name: string;
				price: number;
				trackStock: boolean;
				stock: number;
				variants?: { id: string; name: string; stock: number }[];
			}
		>
	) {
		const nextItems: CartProduct[] = [];
		for (const item of items) {
			const fresh = catalog.get(item.productId);
			if (!fresh) continue;

			let maxQty = fresh.trackStock ? fresh.stock : item.qty;
			let currentVariantName = item.variantName ?? null;

			if (item.variantId) {
				const variant = fresh.variants?.find((v) => v.id === item.variantId);
				if (!variant) continue;
				maxQty = variant.stock;
				currentVariantName = variant.name;
			}

			const qty = Math.min(item.qty, maxQty);
			if (qty <= 0) continue;

			nextItems.push({
				...item,
				name: fresh.name,
				price: fresh.price,
				variantName: currentVariantName,
				qty
			});
		}
		items = nextItems;

		if (shipping && !isValidShipping(shipping)) {
			shipping = null;
		}

		persist();
	}

	let promoRules = $state<CartPromoRule[]>([]);

	function setPromoRules(rules: CartPromoRule[]) {
		promoRules = rules;
	}

	function clear() {
		items = [];
		shipping = null;
		persist();
	}

	const subtotal = $derived(items.reduce((sum, i) => sum + i.price * i.qty, 0));
	const discountTotal = $derived.by(() => {
		if (!promoRules || promoRules.length === 0) return 0;
		const qtyPerProduct: Record<string, number> = {};
		for (const item of items) {
			qtyPerProduct[item.productId] = (qtyPerProduct[item.productId] || 0) + item.qty;
		}
		let totalDiscount = 0;
		for (const [prodId, qty] of Object.entries(qtyPerProduct)) {
			const rules = promoRules.filter((r) => r.productId === prodId);
			for (const rule of rules) {
				if (rule.minQty > 0 && qty >= rule.minQty && rule.discountAmount > 0) {
					const multiplier = Math.floor(qty / rule.minQty);
					totalDiscount += multiplier * rule.discountAmount;
				}
			}
		}
		return totalDiscount;
	});
	const shippingCost = $derived(shipping?.cost ?? 0);
	const total = $derived(Math.max(0, subtotal - discountTotal) + shippingCost);
	const itemCount = $derived(items.reduce((sum, i) => sum + i.qty, 0));
	const isEmpty = $derived(items.length === 0);

	return {
		get items() {
			return items;
		},
		get shipping() {
			return shipping;
		},
		get subtotal() {
			return subtotal;
		},
		get discountTotal() {
			return discountTotal;
		},
		get shippingCost() {
			return shippingCost;
		},
		get total() {
			return total;
		},
		get itemCount() {
			return itemCount;
		},
		get isEmpty() {
			return isEmpty;
		},
		get promoRules() {
			return promoRules;
		},
		setPromoRules,
		addOrUpdateItem,
		addItem,
		getQty,
		setShipping,
		reconcile,
		clear
	};
}

export const cart = createCart();
