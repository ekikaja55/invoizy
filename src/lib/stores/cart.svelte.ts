// src/lib/stores/cart.svelte.ts

import { browser } from '$app/environment';

export interface CartProduct {
	productId: string;
	categoryId: string;
	categoryName: string;
	name: string;
	price: number;
	qty: number;
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

export type CartShipping = CartShippingQuote | CartShippingFallback;

export function shippingLabel(s: CartShipping): string {
	return s.kind === 'quote' ? `${s.courierLabel} ${s.service}` : 'Ongkir flat darurat';
}

const STORAGE_KEY = 'invoizy-cart-v1';

interface PersistedCart {
	items: CartProduct[];
	shipping: CartShipping | null;
}

function isValidShipping(v: unknown): v is CartShipping {
	if (!v || typeof v !== 'object') return false;
	const s = v as Record<string, unknown>;
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
		const existingIndex = items.findIndex((i) => i.productId === product.productId);

		if (qty <= 0) {
			if (existingIndex !== -1) items.splice(existingIndex, 1);
		} else if (existingIndex !== -1) {
			items[existingIndex].qty = qty;
		} else {
			items.push({ ...product, qty });
		}

		persist();
	}

	function getQty(productId: string): number {
		return items.find((i) => i.productId === productId)?.qty ?? 0;
	}

	function setShipping(option: CartShipping | null) {
		shipping = option;
		persist();
	}

	/**
	 * Sinkronkan cart tersimpan dengan katalog terbaru dari server:
	 * - buang item yang produknya sudah dihapus / nonaktif
	 * - perbarui nama & harga ke nilai terbaru
	 * - kurangi qty kalau melebihi stok yang tersedia
	 * Ongkir tidak direkonsiliasi ke katalog (bukan produk lagi) — cukup validasi bentuk.
	 */
	function reconcile(
		catalog: Map<string, { name: string; price: number; trackStock: boolean; stock: number }>
	) {
		items = items
			.map((item) => {
				const fresh = catalog.get(item.productId);
				if (!fresh) return null;

				const maxQty = fresh.trackStock ? fresh.stock : item.qty;
				const qty = Math.min(item.qty, maxQty);
				if (qty <= 0) return null;

				return { ...item, name: fresh.name, price: fresh.price, qty };
			})
			.filter((i): i is CartProduct => i !== null);

		if (shipping && !isValidShipping(shipping)) {
			shipping = null;
		}

		persist();
	}

	function clear() {
		items = [];
		shipping = null;
		persist();
	}

	const subtotal = $derived(items.reduce((sum, i) => sum + i.price * i.qty, 0));
	const shippingCost = $derived(shipping?.cost ?? 0);
	const total = $derived(subtotal + shippingCost);
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
		addOrUpdateItem,
		getQty,
		setShipping,
		reconcile,
		clear
	};
}

export const cart = createCart();
