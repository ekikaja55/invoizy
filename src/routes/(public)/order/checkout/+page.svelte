<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { cart, shippingLabel, type CartProduct } from '$lib/stores/cart.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { toast } from 'svelte-sonner';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import { formatRupiah } from '$lib/utils/currency';
	import {
		ShoppingBag,
		Trash2,
		Plus,
		Minus,
		Truck,
		ArrowRight,
		ChevronRight,
		ArrowLeft,
		Sparkles
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	interface PromoItem {
		name: string;
		minQty: number;
		discountAmount: number;
	}

	let { data }: { data: PageData } = $props();
	let isBusy = $state(false);

	$effect(() => {
		if (isBusy) {
			const prevBodyOverflow = document.body.style.overflow;
			const prevHtmlOverflow = document.documentElement.style.overflow;
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = prevBodyOverflow;
				document.documentElement.style.overflow = prevHtmlOverflow;
			};
		}
	});

	function preventScroll(e: Event) {
		e.preventDefault();
	}

	let itemToDelete = $state<CartProduct | null>(null);
	let confirmClearOpen = $state(false);

	function handleDecrement(item: CartProduct) {
		if (item.qty <= 1) {
			itemToDelete = item;
		} else {
			cart.addOrUpdateItem(item, item.qty - 1);
		}
	}

	function handleIncrement(item: CartProduct) {
		cart.addOrUpdateItem(item, item.qty + 1);
	}

	function confirmDeleteItem() {
		if (itemToDelete) {
			cart.addOrUpdateItem(itemToDelete, 0);
			itemToDelete = null;
			toast.success('Produk dihapus dari keranjang.');
		}
	}

	function confirmClearCart() {
		cart.clear();
		confirmClearOpen = false;
		toast.success('Keranjang belanja dikosongkan.');
	}

	const itemsJson = $derived(
		JSON.stringify(
			cart.items.map((i) => ({
				productId: i.productId,
				variantId: i.variantId ?? null,
				variantName: i.variantName ?? null,
				qty: i.qty
			}))
		)
	);
	const shippingJson = $derived(cart.shipping ? JSON.stringify(cart.shipping) : '');

	// Riwayat perangkat: satu-satunya momen token ada di client adalah sesaat
	// setelah order sukses — simpan di sini, dibaca halaman /order/riwayat.
	function saveInvoiceToHistory(orderId: string, token: string, total: number) {
		try {
			const raw = localStorage.getItem('invoizy:invoices');
			const parsed = JSON.parse(raw ?? '[]');
			const list = Array.isArray(parsed) ? parsed : [];
			const entry = { orderId, token, total, createdAt: new Date().toISOString() };
			const next = [entry, ...list.filter((i) => i?.orderId !== orderId)].slice(0, 20);
			localStorage.setItem('invoizy:invoices', JSON.stringify(next));
		} catch {
			// Storage penuh/mode privat — riwayat perangkat dilewati diam-diam.
		}
	}

	// 3 Opsi Pengiriman Khusus Event Chibiconxi
	type ShippingKind = 'mail_order' | 'pickup_day_1' | 'pickup_day_2';

	function selectShippingKind(kind: ShippingKind) {
		cart.setShipping({ kind, cost: 0 });
	}

	// Sinkronkan cart dengan katalog terbaru & aturan diskon promo saat halaman dimuat
	$effect(() => {
		const catalogMap = new SvelteMap<
			string,
			{
				name: string;
				price: number;
				trackStock: boolean;
				stock: number;
				variants?: { id: string; name: string; stock: number }[];
			}
		>();
		const promoRules: {
			productId: string;
			name: string;
			minQty: number;
			discountAmount: number;
		}[] = [];

		for (const category of [...data.productCategories]) {
			for (const product of category.products) {
				catalogMap.set(product.id, {
					name: product.name,
					price: product.priceInt,
					trackStock: product.trackStock,
					stock: product.stock,
					variants: product.variants
				});
				const prodWithPromos = product as typeof product & { promos?: PromoItem[] };
				if (Array.isArray(prodWithPromos.promos)) {
					for (const promo of prodWithPromos.promos) {
						promoRules.push({
							productId: product.id,
							name: promo.name,
							minQty: promo.minQty,
							discountAmount: promo.discountAmount
						});
					}
				}
			}
		}

		untrack(() => {
			cart.reconcile(catalogMap);
			cart.setPromoRules(promoRules);
			// Default ke mail_order jika belum ada opsi pengiriman aktif
			if (
				!cart.shipping ||
				(cart.shipping.kind !== 'mail_order' &&
					cart.shipping.kind !== 'pickup_day_1' &&
					cart.shipping.kind !== 'pickup_day_2')
			) {
				cart.setShipping({ kind: 'mail_order', cost: 0 });
			}
		});
	});
</script>

<div class="space-y-8 pb-24">
	<!-- Tombol Kembali ke Katalog -->
	<div>
		<a
			href={resolve('/(public)/order')}
			class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
		>
			<ArrowLeft size={14} strokeWidth={2.5} />
			<span>Kembali ke Katalog Merchandise</span>
		</a>
	</div>

	<!-- Page Header: Warm Monoline Editorial -->
	<header class="space-y-3">
		<div
			class="inline-flex items-center gap-2 rounded-full border-2 border-[#262626] bg-[#a2e1db] px-3.5 py-1 font-mono text-xs font-bold tracking-widest text-[#262626] uppercase shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#a2e1db] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9]"
		>
			<span class="inline-block h-2 w-2 rounded-full border border-[#262626] bg-[#fea770]"></span>
			<span>CHECKOUT PESANAN</span>
		</div>
		<h1
			class="font-serif text-3xl font-black tracking-tight text-[#262626] md:text-4xl dark:text-[#f2efe9]"
		>
			Lengkapi Pesanan Anda
		</h1>
		<p class="font-mono text-xs text-[#404040] md:text-sm dark:text-[#b8b5ad]">
			Pilih metode penerimaan barang dan lengkapi kontak Anda untuk faktur resmi.
		</p>
	</header>

	{#if cart.isEmpty}
		<div
			class="relative mx-auto max-w-md rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-10 text-center shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
				aria-hidden="true">+</span
			>
			<div
				class="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#fea770] text-[#262626] shadow-[2px_2px_0px_#262626]"
			>
				<ShoppingBag size={28} strokeWidth={2.25} />
			</div>
			<h2 class="mt-4 font-serif text-xl font-bold text-[#262626] dark:text-[#f2efe9]">
				Keranjang Masih Kosong
			</h2>
			<p class="mt-1 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
				Belum ada produk yang dipilih untuk dicheckout. Silakan jelajahi katalog merchandise
				terlebih dahulu.
			</p>
			<div class="mt-6">
				<a
					href={resolve('/(public)/order')}
					class="group relative inline-flex items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#fea770] px-5 py-2.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[2px_2px_0px_#b4a6d5]"
				>
					<span
						class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
					>
						<span>Buka Katalog Merchandise</span>
						<ArrowRight size={14} strokeWidth={2.5} />
					</span>
					<span
						class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-2 transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						<span>Buka Katalog Merchandise</span>
						<ArrowRight size={14} strokeWidth={2.5} />
					</span>
				</a>
			</div>
		</div>
	{:else}
		<!-- Step 1: Metode Pengambilan / Pengiriman Barang -->
		<div
			class="relative space-y-4 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
				aria-hidden="true">+</span
			>
			<div class="border-b-2 border-[#262626]/15 pb-3.5 dark:border-[#f2efe9]/15">
				<div class="flex items-center gap-2.5">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#fea770] text-[#262626] shadow-[2px_2px_0px_#262626]"
					>
						<Truck size={16} strokeWidth={2.5} />
					</div>
					<div>
						<span
							class="font-mono text-[10px] font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad]"
							>Langkah #01</span
						>
						<h2
							class="font-serif text-lg leading-tight font-bold text-[#262626] dark:text-[#f2efe9]"
						>
							Metode Pengiriman / Pengambilan
						</h2>
					</div>
				</div>
				<p class="mt-1.5 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
					Pilih apakah barang ingin dikirim via ekspedisi Shopee atau diambil langsung di booth
					pameran ChibiconXI.
				</p>
			</div>

			<!-- 3 Pilihan Pengiriman Event -->
			<div class="grid gap-3 sm:grid-cols-1">
				<!-- Opsi 1: Mail Order (Shopee Link) -->
				<label
					class="flex cursor-pointer items-start justify-between gap-3 rounded-lg border-2 p-4 transition-all duration-150 {cart
						.shipping?.kind === 'mail_order'
						? 'border-[#262626] bg-[#fea770]/15 shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#fea770]/20'
						: 'border-[#262626]/20 bg-[#f9f7f2] hover:border-[#262626] hover:bg-[#f2efe9] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]'}"
				>
					<div class="flex items-start gap-3">
						<input
							type="radio"
							name="shipping_kind"
							checked={cart.shipping?.kind === 'mail_order'}
							onchange={() => selectShippingKind('mail_order')}
							disabled={isBusy}
							class="mt-1 accent-[#262626] dark:accent-[#a2e1db]"
						/>
						<div class="space-y-1">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
									Mail Order (Kirim Paket via Shopee)
								</span>
								<span
									class="rounded border border-[#065f46] bg-[#a2e1db] px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-[#065f46] uppercase"
								>
									Gratis Ongkir di Web (Rp 0)
								</span>
							</div>
							<p class="font-mono text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
								Barang dibayar di website ini. Tautan checkout khusus Shopee (Rp 1 / bebas ongkir
								Shopee) akan dikirimkan ke WhatsApp/Email Anda untuk keperluan ekspedisi.
							</p>
						</div>
					</div>
					<span class="font-mono text-sm font-black text-[#065f46] dark:text-[#a2e1db]">Rp 0</span>
				</label>

				<!-- Opsi 2: Self Pickup Day 1 -->
				<label
					class="flex cursor-pointer items-start justify-between gap-3 rounded-lg border-2 p-4 transition-all duration-150 {cart
						.shipping?.kind === 'pickup_day_1'
						? 'border-[#262626] bg-[#fea770]/15 shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#fea770]/20'
						: 'border-[#262626]/20 bg-[#f9f7f2] hover:border-[#262626] hover:bg-[#f2efe9] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]'}"
				>
					<div class="flex items-start gap-3">
						<input
							type="radio"
							name="shipping_kind"
							checked={cart.shipping?.kind === 'pickup_day_1'}
							onchange={() => selectShippingKind('pickup_day_1')}
							disabled={isBusy}
							class="mt-1 accent-[#262626] dark:accent-[#a2e1db]"
						/>
						<div class="space-y-1.5">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
									Self-Pickup: Chibiconxi Day 1
								</span>
								<span
									class="rounded border border-[#262626] bg-[#b4a6d5]/40 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:border-[#f2efe9] dark:text-[#f2efe9]"
								>
									Ambil di Booth (Rp 0)
								</span>
							</div>
							<div class="space-y-0.5 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
								<p>
									Booth: <strong class="text-[#262626] dark:text-[#f2efe9]">@cho.lazey</strong> (No. TBA
									· Pasien Waras Dikit)
								</p>
								<p>
									Jadwal: <strong class="text-[#262626] dark:text-[#f2efe9]"
										>Sabtu, 12 Desember 2026</strong
									>
								</p>
							</div>
						</div>
					</div>
					<span class="font-mono text-sm font-black text-[#065f46] dark:text-[#a2e1db]">Rp 0</span>
				</label>

				<!-- Opsi 3: Self Pickup Day 2 -->
				<label
					class="flex cursor-pointer items-start justify-between gap-3 rounded-lg border-2 p-4 transition-all duration-150 {cart
						.shipping?.kind === 'pickup_day_2'
						? 'border-[#262626] bg-[#fea770]/15 shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#fea770]/20'
						: 'border-[#262626]/20 bg-[#f9f7f2] hover:border-[#262626] hover:bg-[#f2efe9] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]'}"
				>
					<div class="flex items-start gap-3">
						<input
							type="radio"
							name="shipping_kind"
							checked={cart.shipping?.kind === 'pickup_day_2'}
							onchange={() => selectShippingKind('pickup_day_2')}
							disabled={isBusy}
							class="mt-1 accent-[#262626] dark:accent-[#a2e1db]"
						/>
						<div class="space-y-1.5">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
									Self-Pickup: Chibiconxi Day 2
								</span>
								<span
									class="rounded border border-[#262626] bg-[#b4a6d5]/40 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:border-[#f2efe9] dark:text-[#f2efe9]"
								>
									Ambil di Booth (Rp 0)
								</span>
							</div>
							<div class="space-y-0.5 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
								<p>
									Booth: <strong class="text-[#262626] dark:text-[#f2efe9]">@cho.lazey</strong> (No. TBA
									· Pasien Waras Dikit)
								</p>
								<p>
									Jadwal: <strong class="text-[#262626] dark:text-[#f2efe9]"
										>Minggu, 13 Desember 2026</strong
									>
								</p>
							</div>
						</div>
					</div>
					<span class="font-mono text-sm font-black text-[#065f46] dark:text-[#a2e1db]">Rp 0</span>
				</label>
			</div>
		</div>

		<!-- Step 2: Ringkasan Belanja -->
		<div
			class="relative space-y-4 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
				aria-hidden="true">+</span
			>
			<div
				class="flex items-center justify-between border-b-2 border-[#262626]/15 pb-3.5 dark:border-[#f2efe9]/15"
			>
				<div class="flex items-center gap-2.5">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#a2e1db] text-[#262626] shadow-[2px_2px_0px_#262626]"
					>
						<ShoppingBag size={16} strokeWidth={2.5} />
					</div>
					<div>
						<span
							class="font-mono text-[10px] font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad]"
							>Langkah #02</span
						>
						<h2
							class="font-serif text-lg leading-tight font-bold text-[#262626] dark:text-[#f2efe9]"
						>
							Ringkasan Belanja
						</h2>
					</div>
				</div>
				<button
					type="button"
					onclick={() => (confirmClearOpen = true)}
					disabled={isBusy}
					class="flex items-center gap-1.5 rounded-lg border-2 border-[#991b1b] bg-[#fee2e2] px-2.5 py-1 font-mono text-xs font-bold text-[#991b1b] shadow-[1px_1px_0px_#991b1b] transition-all hover:bg-[#fecaca] active:translate-y-0.5 active:shadow-none disabled:opacity-50 dark:border-[#f87171] dark:bg-[#450a0a] dark:text-[#f87171]"
				>
					<Trash2 size={13} strokeWidth={2.5} />
					<span>Kosongkan</span>
				</button>
			</div>

			<ul class="space-y-2.5">
				{#each cart.items as item (item.variantId ? `${item.productId}:${item.variantId}` : item.productId)}
					<li
						class="flex items-start justify-between gap-3 rounded-lg border-2 border-[#262626]/20 bg-[#f9f7f2] p-3 shadow-[2px_2px_0px_#262626]/15 dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
					>
						<div class="min-w-0 flex-1">
							<span
								class="block truncate font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]"
							>
								{item.name}
							</span>
							<div class="mt-0.5 flex flex-wrap items-center gap-2">
								{#if item.variantName}
									<span
										class="rounded border border-[#262626] bg-[#b4a6d5]/30 px-1.5 py-0.5 font-mono text-xs font-bold text-[#262626] dark:border-[#f2efe9] dark:text-[#f2efe9]"
									>
										{item.variantName}
									</span>
								{/if}
								<span class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
									{formatRupiah(item.price)}
								</span>
							</div>
							<span
								class="mt-1 block font-mono text-xs font-bold text-[#065f46] dark:text-[#a2e1db]"
							>
								Subtotal: {formatRupiah(item.price * item.qty)}
							</span>
						</div>

						<div class="flex flex-col items-end gap-2">
							<button
								type="button"
								onclick={() => (itemToDelete = item)}
								disabled={isBusy}
								class="text-[#404040] transition-colors hover:text-[#991b1b] disabled:opacity-50 dark:text-[#b8b5ad] dark:hover:text-[#f87171]"
								aria-label={`Hapus ${item.name}`}
							>
								<Trash2 size={14} strokeWidth={2.5} />
							</button>

							<div
								class="flex items-center rounded-lg border-2 border-[#262626] bg-white shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331]"
							>
								<button
									type="button"
									onclick={() => handleDecrement(item)}
									disabled={isBusy}
									class="p-1 text-[#262626] hover:bg-neutral-200 active:bg-neutral-300 disabled:opacity-50 dark:text-[#f2efe9] dark:hover:bg-neutral-800"
									aria-label="Kurangi jumlah"
								>
									<Minus size={11} strokeWidth={2.75} />
								</button>
								<span
									class="w-6 text-center font-mono text-xs font-bold text-[#262626] dark:text-[#f2efe9]"
								>
									{item.qty}
								</span>
								<button
									type="button"
									onclick={() => handleIncrement(item)}
									disabled={isBusy}
									class="p-1 text-[#262626] hover:bg-neutral-200 active:bg-neutral-300 disabled:opacity-50 dark:text-[#f2efe9] dark:hover:bg-neutral-800"
									aria-label="Tambah jumlah"
								>
									<Plus size={11} strokeWidth={2.75} />
								</button>
							</div>
						</div>
					</li>
				{/each}

				<!-- Baris Subtotal -->
				<li
					class="flex items-center justify-between border-t-2 border-dashed border-[#262626]/20 pt-3 font-mono text-xs dark:border-[#f2efe9]/20"
				>
					<span class="text-[#404040] dark:text-[#b8b5ad]">Subtotal Barang</span>
					<span class="font-bold text-[#262626] dark:text-[#f2efe9]"
						>{formatRupiah(cart.subtotal)}</span
					>
				</li>

				<!-- Baris Diskon Promo (Jika Ada) -->
				{#if cart.discountTotal > 0}
					<li
						class="flex items-center justify-between font-mono text-xs text-[#991b1b] dark:text-[#f87171]"
					>
						<span class="flex items-center gap-1 font-bold">
							<Sparkles size={13} />
							<span>Potongan Diskon Promo</span>
						</span>
						<span class="font-bold">-{formatRupiah(cart.discountTotal)}</span>
					</li>
				{/if}

				<!-- Baris Opsi Pengiriman -->
				{#if cart.shipping}
					<li class="flex items-center justify-between font-mono text-xs dark:border-[#f2efe9]/20">
						<span class="text-[#404040] dark:text-[#b8b5ad]">
							{shippingLabel(cart.shipping)}
						</span>
						<span class="font-bold text-[#065f46] dark:text-[#a2e1db]">Rp 0</span>
					</li>
				{/if}

				<!-- Baris Total Akhir: Accounting Double Underline -->
				<li
					class="flex items-center justify-between border-t-2 border-b-2 border-double border-[#262626]/40 py-3 dark:border-[#f2efe9]/40"
				>
					<span class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
						Total Pembayaran
					</span>
					<span class="font-mono text-xl font-black text-[#065f46] dark:text-[#a2e1db]">
						{formatRupiah(cart.total)}
					</span>
				</li>
			</ul>
		</div>

		<!-- Step 3: Form Data Pembeli -->
		<form
			method="POST"
			use:enhance={() => {
				isBusy = true;
				return async ({ result }) => {
					if (result.type === 'success' && typeof result.data?.orderId === 'string') {
						const token =
							typeof result.data?.accessToken === 'string'
								? `?token=${result.data.accessToken}`
								: '';
						if (typeof result.data?.accessToken === 'string') {
							saveInvoiceToHistory(result.data.orderId, result.data.accessToken, cart.total);
						}
						// Catatan: cart.clear() dilakukan saat tiba di halaman pembayaran
						// agar tidak terjadi kedipan (flicker) "Keranjang Masih Kosong" sebelum redirect.
						const dest = `/order/bayar/${result.data.orderId}${token}`;
						window.location.href = dest;
						return;
					}
					handleFormResult(result, { failure: 'Gagal membuat pesanan.' });
					isBusy = false;
				};
			}}
			class="relative space-y-5 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
				aria-hidden="true">+</span
			>
			<input type="hidden" name="items" value={itemsJson} />
			<input type="hidden" name="shipping" value={shippingJson} />
			<input type="hidden" name="address" value="" />

			<!-- Honeypot anti-bot -->
			<div class="hidden" aria-hidden="true">
				<label for="website">Website</label>
				<input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
			</div>

			<div class="border-b-2 border-[#262626]/15 pb-3.5 dark:border-[#f2efe9]/15">
				<div class="flex items-center gap-2.5">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#b4a6d5] text-[#262626] shadow-[2px_2px_0px_#262626]"
					>
						<span class="font-mono text-sm font-bold">◈</span>
					</div>
					<div>
						<span
							class="font-mono text-[10px] font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad]"
							>Langkah #03</span
						>
						<h2
							class="font-serif text-lg leading-tight font-bold text-[#262626] dark:text-[#f2efe9]"
						>
							Data Pemesan
						</h2>
					</div>
				</div>
				<p class="mt-1.5 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
					Informasi ini akan tertera pada faktur resmi pesanan Anda.
				</p>
			</div>

			<!-- Handle Media Sosial -->
			<div>
				<label
					for="handle"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:text-[#f2efe9]"
				>
					Handle Media Sosial / Nama Panggilan
				</label>
				<div
					class="mt-1.5 flex overflow-hidden rounded-lg shadow-[2px_2px_0px_#262626] dark:shadow-[2px_2px_0px_#f2efe9]"
				>
					<span
						class="inline-flex items-center border-2 border-r-0 border-[#262626] bg-[#f2efe9] px-3 font-mono text-sm font-bold text-[#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
					>
						@
					</span>
					<input
						id="handle"
						name="handle"
						type="text"
						required
						placeholder="username_kamu"
						disabled={isBusy}
						class="w-full border-2 border-[#262626] bg-white px-3.5 py-2.5 font-sans text-sm text-[#262626] placeholder:text-[#404040]/40 focus:ring-2 focus:ring-[#fea770] focus:outline-none disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:placeholder:text-[#b8b5ad]/40"
					/>
				</div>
				<p class="mt-1 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
					Akun Instagram atau X aktif untuk verifikasi pesanan Anda.
				</p>
			</div>

			<!-- Email -->
			<div>
				<label
					for="email"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:text-[#f2efe9]"
				>
					Alamat Email Aktif
				</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					placeholder="kamu@email.com"
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2.5 font-sans text-sm text-[#262626] shadow-[2px_2px_0px_#262626] placeholder:text-[#404040]/40 focus:ring-2 focus:ring-[#fea770] focus:outline-none disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9] dark:placeholder:text-[#b8b5ad]/40"
				/>
				<p class="mt-1 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
					Faktur invoice PDF resmi otomatis dikirimkan ke alamat email ini.
				</p>
			</div>

			<!-- WhatsApp -->
			<div>
				<label
					for="phone"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:text-[#f2efe9]"
				>
					Nomor WhatsApp Aktif
				</label>
				<input
					id="phone"
					name="phone"
					type="tel"
					required
					placeholder="08123456789"
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2.5 font-sans text-sm text-[#262626] shadow-[2px_2px_0px_#262626] placeholder:text-[#404040]/40 focus:ring-2 focus:ring-[#fea770] focus:outline-none disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9] dark:placeholder:text-[#b8b5ad]/40"
				/>
				<p class="mt-1 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
					Nomor WhatsApp aktif untuk konfirmasi pesanan dan tautan checkout Shopee (bagi opsi Mail
					Order).
				</p>
			</div>

			<!-- Catatan Tambahan -->
			<div>
				<label
					for="note"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:text-[#f2efe9]"
				>
					Catatan Tambahan (Opsional)
				</label>
				<textarea
					id="note"
					name="note"
					rows="2"
					placeholder="Permintaan khusus atau pesan untuk penjual"
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2.5 font-sans text-sm leading-relaxed text-[#262626] shadow-[2px_2px_0px_#262626] placeholder:text-[#404040]/40 focus:ring-2 focus:ring-[#fea770] focus:outline-none disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9] dark:placeholder:text-[#b8b5ad]/40"
				></textarea>
				<p class="mt-1.5 font-mono text-[11px] font-bold text-[#991b1b] dark:text-[#f87171]">
					PERHATIAN: Emotikon atau simbol dekoratif tidak akan dicetak pada berkas PDF faktur.
				</p>
			</div>

			<!-- Primary Submit Button: Dual-Span Rolling Ticker -->
			<button
				type="submit"
				disabled={isBusy}
				class="group relative flex w-full items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#fea770] py-3.5 font-mono text-base font-bold text-[#262626] shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:border-[#262626]/30 disabled:bg-[#262626]/10 disabled:text-[#262626]/40 disabled:shadow-none dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[3px_3px_0px_#b4a6d5]"
			>
				<span
					class="inline-flex items-center gap-2 px-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
				>
					<span>{isBusy ? 'Memproses Pesanan...' : 'Lanjut ke Pembayaran'}</span>
					{#if !isBusy}<ChevronRight size={19} strokeWidth={2.5} class="shrink-0" />{/if}
				</span>
				<span
					class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-2 px-2 transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					<span>{isBusy ? 'Memproses Pesanan...' : 'Lanjut ke Pembayaran'}</span>
					{#if !isBusy}<ChevronRight size={19} strokeWidth={2.5} class="shrink-0" />{/if}
				</span>
			</button>
		</form>
	{/if}
</div>

{#if isBusy}
	<div
		class="fixed inset-0 z-[999] flex touch-none flex-col items-center justify-center overscroll-none bg-[#262626]/60 p-4 text-center backdrop-blur-xs select-none"
		role="dialog"
		aria-modal="true"
		aria-label="Memproses pesanan"
		tabindex="-1"
		onwheel={preventScroll}
		ontouchmove={preventScroll}
	>
		<div
			class="relative w-full max-w-sm space-y-4 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-[#f2efe9] p-6 shadow-[5px_5px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[5px_5px_0px_#f2efe9]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
				aria-hidden="true">+</span
			>
			<div
				class="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-[#262626]/20 border-t-[#fea770]"
			></div>
			<div class="space-y-1">
				<p class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
					Memverifikasi Pesanan Anda...
				</p>
				<p class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
					Menyiapkan detail pembayaran, tunggu sebentar
				</p>
			</div>
		</div>
	</div>
{/if}

<!-- Modal Konfirmasi Hapus 1 Item -->
<Modal
	open={itemToDelete !== null}
	title="Hapus Produk?"
	message={`Apakah Anda yakin ingin menghapus "${itemToDelete?.name}${itemToDelete?.variantName ? ` (${itemToDelete.variantName})` : ''}" dari keranjang belanja?`}
	danger={true}
	confirmLabel="Ya, Hapus"
	cancelLabel="Batal"
	onConfirm={confirmDeleteItem}
	onCancel={() => (itemToDelete = null)}
/>

<!-- Modal Konfirmasi Kosongkan Keranjang -->
<Modal
	open={confirmClearOpen}
	title="Kosongkan Keranjang?"
	message="Semua produk yang ada di dalam keranjang belanja akan dihapus. Anda yakin ingin melanjutkan?"
	danger={true}
	confirmLabel="Ya, Kosongkan"
	cancelLabel="Batal"
	onConfirm={confirmClearCart}
	onCancel={() => (confirmClearOpen = false)}
/>
