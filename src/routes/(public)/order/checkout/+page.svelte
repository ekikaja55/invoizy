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
		const promoRules: { productId: string; name: string; minQty: number; discountAmount: number }[] = [];

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
			class="inline-flex items-center gap-2 rounded-[8px_3px_7px_2px] border-2 border-brandy/50 bg-papaya px-3.5 py-1.5 font-mono text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] transition-all hover:-translate-y-0.5 hover:border-brandy hover:bg-brandy/10 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
		>
			<ArrowLeft size={14} strokeWidth={2.5} />
			<span>Kembali ke Katalog Merchandise</span>
		</a>
	</div>

	<!-- Page Header / Scrapbook Title -->
	<header class="space-y-3">
		<div
			class="inline-block -rotate-2 rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya px-3.5 py-1.5 font-mono text-xs font-bold tracking-widest text-brandy uppercase shadow-[2px_2px_0px_#78290f] md:text-sm dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
		>
			CHECKOUT PESANAN
		</div>
		<h1
			class="font-headline text-3xl font-extrabold tracking-normal text-ink md:text-4xl dark:text-papaya"
		>
			Lengkapi Pesanan Anda
		</h1>
		<p class="font-handwriting text-2xl font-semibold leading-snug text-teal md:text-3xl dark:text-papaya/90">
			Pilih metode penerimaan barang dan isi kontak Anda untuk faktur resmi.
		</p>
	</header>

	{#if cart.isEmpty}
		<div
			class="mx-auto max-w-md rounded-[16px_8px_14px_6px] border-2 border-dashed border-brandy/40 bg-papaya/40 p-10 text-center shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/40 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
		>
			<div
				class="mx-auto flex h-16 w-16 items-center justify-center rounded-[12px_4px_10px_3px] border-2 border-brandy bg-papaya text-brandy shadow-[3px_3px_0px_#78290f] dark:border-papaya/40 dark:bg-ink dark:text-papaya"
			>
				<ShoppingBag size={28} strokeWidth={2.25} />
			</div>
			<h2 class="mt-4 font-headline text-xl font-bold text-ink dark:text-papaya">
				Keranjang Masih Kosong
			</h2>
			<p class="mt-1 font-sans text-xs text-brandy/80 dark:text-papaya/70">
				Belum ada produk yang dipilih untuk dicheckout. Silakan jelajahi katalog merchandise terlebih dahulu.
			</p>
			<div class="mt-6">
				<a
					href={resolve('/(public)/order')}
					class="inline-flex items-center gap-2 rounded-[10px_5px_9px_4px] border-2 border-brandy bg-tangerine px-5 py-2.5 font-sans text-sm font-bold text-white shadow-[3px_3px_0px_#78290f] transition-all hover:bg-[#e06d00] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
				>
					<span>Buka Katalog Merchandise</span>
					<ArrowRight size={16} strokeWidth={2.5} />
				</a>
			</div>
		</div>
	{:else}
		<!-- Step 1: Metode Pengambilan / Pengiriman Barang -->
		<div
			class="space-y-4 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/50 p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
		>
			<div class="border-b-2 border-brandy/20 pb-3 dark:border-papaya/20">
				<div class="flex items-center gap-2">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-[6px_2px_5px_1px] border-2 border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f]"
					>
						<Truck size={16} strokeWidth={2.5} />
					</div>
					<div>
						<h2 class="font-headline text-lg font-bold text-ink dark:text-papaya">
							Metode Pengiriman / Pengambilan
						</h2>
					</div>
				</div>
				<p class="mt-1 font-sans text-xs text-brandy/80 dark:text-papaya/70">
					Pilih apakah barang ingin dikirim lewat ekspedisi atau diambil langsung di booth pameran.
				</p>
			</div>

			<!-- 3 Pilihan Pengiriman Event -->
			<div class="grid gap-3 sm:grid-cols-1">
				<!-- Opsi 1: Mail Order (Shopee Link) -->
				<label
					class="flex cursor-pointer items-start justify-between gap-3 rounded-[12px_5px_10px_4px] border-2 p-4 transition-all duration-150 {cart.shipping?.kind === 'mail_order'
						? 'border-brandy bg-tangerine/15 shadow-[3px_3px_0px_#78290f] dark:border-papaya dark:bg-tangerine/25'
						: 'border-brandy/30 bg-white/70 hover:border-brandy hover:bg-papaya/40 dark:border-papaya/25 dark:bg-ink/70'}"
				>
					<div class="flex items-start gap-3">
						<input
							type="radio"
							name="shipping_kind"
							checked={cart.shipping?.kind === 'mail_order'}
							onchange={() => selectShippingKind('mail_order')}
							disabled={isBusy}
							class="mt-1 accent-tangerine"
						/>
						<div class="space-y-1">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-headline text-sm font-bold text-ink dark:text-papaya">
									Mail Order (Kirim Paket via Shopee)
								</span>
								<span
									class="rounded-[4px_2px_4px_2px] border border-forest/40 bg-forest/20 px-2 py-0.5 font-mono text-[10px] font-black text-forest tracking-wider uppercase"
								>
									Gratis Ongkir di Web (Rp 0)
								</span>
							</div>
							<p class="font-sans text-xs leading-relaxed text-brandy/80 dark:text-papaya/70">
								Barang dibayar di website ini. Tautan checkout khusus Shopee (Rp 1 / bebas ongkir Shopee) akan dikirimkan ke WhatsApp/Email Anda untuk keperluan ekspedisi.
							</p>
						</div>
					</div>
					<span class="font-mono text-sm font-black text-teal dark:text-teal/90">Rp 0</span>
				</label>

				<!-- Opsi 2: Self Pickup Day 1 -->
				<label
					class="flex cursor-pointer items-start justify-between gap-3 rounded-[12px_5px_10px_4px] border-2 p-4 transition-all duration-150 {cart.shipping?.kind === 'pickup_day_1'
						? 'border-brandy bg-tangerine/15 shadow-[3px_3px_0px_#78290f] dark:border-papaya dark:bg-tangerine/25'
						: 'border-brandy/30 bg-white/70 hover:border-brandy hover:bg-papaya/40 dark:border-papaya/25 dark:bg-ink/70'}"
				>
					<div class="flex items-start gap-3">
						<input
							type="radio"
							name="shipping_kind"
							checked={cart.shipping?.kind === 'pickup_day_1'}
							onchange={() => selectShippingKind('pickup_day_1')}
							disabled={isBusy}
							class="mt-1 accent-tangerine"
						/>
						<div class="space-y-1">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-headline text-sm font-bold text-ink dark:text-papaya">
									Self-Pickup: Chibiconxi Day 1
								</span>
								<span
									class="rounded-[4px_2px_4px_2px] border border-teal/40 bg-teal/20 px-2 py-0.5 font-mono text-[10px] font-black text-teal tracking-wider uppercase"
								>
									Ambil di Booth (Rp 0)
								</span>
							</div>
							<p class="font-sans text-xs leading-relaxed text-brandy/80 dark:text-papaya/70">
								Ambil pesanan langsung di meja booth cho.lazey pada event Chibiconxi hari pertama (Sabtu, 12 Desember 2026).
							</p>
						</div>
					</div>
					<span class="font-mono text-sm font-black text-teal dark:text-teal/90">Rp 0</span>
				</label>

				<!-- Opsi 3: Self Pickup Day 2 -->
				<label
					class="flex cursor-pointer items-start justify-between gap-3 rounded-[12px_5px_10px_4px] border-2 p-4 transition-all duration-150 {cart.shipping?.kind === 'pickup_day_2'
						? 'border-brandy bg-tangerine/15 shadow-[3px_3px_0px_#78290f] dark:border-papaya dark:bg-tangerine/25'
						: 'border-brandy/30 bg-white/70 hover:border-brandy hover:bg-papaya/40 dark:border-papaya/25 dark:bg-ink/70'}"
				>
					<div class="flex items-start gap-3">
						<input
							type="radio"
							name="shipping_kind"
							checked={cart.shipping?.kind === 'pickup_day_2'}
							onchange={() => selectShippingKind('pickup_day_2')}
							disabled={isBusy}
							class="mt-1 accent-tangerine"
						/>
						<div class="space-y-1">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-headline text-sm font-bold text-ink dark:text-papaya">
									Self-Pickup: Chibiconxi Day 2
								</span>
								<span
									class="rounded-[4px_2px_4px_2px] border border-teal/40 bg-teal/20 px-2 py-0.5 font-mono text-[10px] font-black text-teal tracking-wider uppercase"
								>
									Ambil di Booth (Rp 0)
								</span>
							</div>
							<p class="font-sans text-xs leading-relaxed text-brandy/80 dark:text-papaya/70">
								Ambil pesanan langsung di meja booth cho.lazey pada event Chibiconxi hari kedua (Minggu, 13 Desember 2026).
							</p>
						</div>
					</div>
					<span class="font-mono text-sm font-black text-teal dark:text-teal/90">Rp 0</span>
				</label>
			</div>
		</div>

		<!-- Step 2: Ringkasan Belanja -->
		<div
			class="space-y-4 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/50 p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-[6px_2px_5px_1px] border-2 border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f]"
					>
						<ShoppingBag size={16} strokeWidth={2.5} />
					</div>
					<h2 class="font-headline text-lg font-bold text-ink dark:text-papaya">Ringkasan Belanja</h2>
				</div>
				<button
					type="button"
					onclick={() => (confirmClearOpen = true)}
					disabled={isBusy}
					class="flex items-center gap-1.5 rounded-[6px_2px_5px_1px] border border-crimson/30 bg-crimson/10 px-2.5 py-1 font-mono text-xs font-bold text-crimson transition-colors hover:bg-crimson/20 disabled:opacity-50"
				>
					<Trash2 size={13} strokeWidth={2.5} />
					<span>Kosongkan</span>
				</button>
			</div>

			<ul class="space-y-2.5">
				{#each cart.items as item (item.variantId ? `${item.productId}:${item.variantId}` : item.productId)}
					<li
						class="flex items-start justify-between gap-3 rounded-[10px_4px_8px_3px] border-2 border-brandy/30 bg-white/70 p-3 shadow-[2px_2px_0px_#78290f] dark:border-papaya/25 dark:bg-ink/80 dark:shadow-[2px_2px_0px_rgba(255,236,209,0.15)]"
					>
						<div class="flex-1 min-w-0">
							<span class="font-headline text-sm font-bold text-ink truncate block dark:text-papaya">
								{item.name}
							</span>
							<div class="mt-0.5 flex flex-wrap items-center gap-2">
								{#if item.variantName}
									<span
										class="rounded-[4px_2px_4px_2px] border border-forest/30 bg-forest/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-forest"
									>
										{item.variantName}
									</span>
								{/if}
								<span class="font-mono text-xs text-brandy/80 dark:text-papaya/70">
									{formatRupiah(item.price)}
								</span>
							</div>
							<span class="mt-1 block font-mono text-xs font-bold text-teal dark:text-teal/90">
								Subtotal: {formatRupiah(item.price * item.qty)}
							</span>
						</div>

						<div class="flex flex-col items-end gap-2">
							<button
								type="button"
								onclick={() => (itemToDelete = item)}
								disabled={isBusy}
								class="text-brandy/50 transition-colors hover:text-crimson disabled:opacity-50 dark:text-papaya/50 dark:hover:text-crimson"
								aria-label={`Hapus ${item.name}`}
							>
								<Trash2 size={14} strokeWidth={2.5} />
							</button>

							<div class="flex items-center gap-1">
								<button
									type="button"
									onclick={() => handleDecrement(item)}
									disabled={isBusy}
									class="flex h-6 w-6 items-center justify-center rounded-[3px_1px_3px_1px] border-2 border-brandy bg-papaya text-ink shadow-[1px_1px_0px_#78290f] hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none disabled:opacity-50 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[1px_1px_0px_rgba(255,236,209,0.2)]"
									aria-label="Kurangi jumlah"
								>
									<Minus size={11} strokeWidth={2.75} />
								</button>
								<span
									class="w-6 text-center font-mono text-xs font-bold text-ink dark:text-papaya"
								>
									{item.qty}
								</span>
								<button
									type="button"
									onclick={() => handleIncrement(item)}
									disabled={isBusy}
									class="flex h-6 w-6 items-center justify-center rounded-[3px_1px_3px_1px] border-2 border-brandy bg-papaya text-ink shadow-[1px_1px_0px_#78290f] hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none disabled:opacity-50 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[1px_1px_0px_rgba(255,236,209,0.2)]"
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
					class="flex items-center justify-between border-t-2 border-dashed border-brandy/20 pt-3 text-xs font-mono dark:border-papaya/20"
				>
					<span class="text-brandy/80 dark:text-papaya/70">Subtotal Barang</span>
					<span class="font-bold text-ink dark:text-papaya">{formatRupiah(cart.subtotal)}</span>
				</li>

				<!-- Baris Diskon Promo (Jika Ada) -->
				{#if cart.discountTotal > 0}
					<li
						class="flex items-center justify-between text-xs font-mono text-crimson dark:text-red-400"
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
					<li
						class="flex items-center justify-between text-xs font-mono dark:border-papaya/20"
					>
						<span class="text-brandy/80 dark:text-papaya/70">
							{shippingLabel(cart.shipping)}
						</span>
						<span class="font-bold text-forest">Rp 0</span>
					</li>
				{/if}

				<!-- Baris Total Akhir -->
				<li
					class="flex items-center justify-between border-t-2 border-brandy pt-3 dark:border-papaya/30"
				>
					<span class="font-headline text-base font-extrabold text-ink dark:text-papaya">
						Total Pembayaran
					</span>
					<span class="font-mono text-xl font-black text-teal dark:text-teal/90">
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
			class="space-y-5 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/50 p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
		>
			<input type="hidden" name="items" value={itemsJson} />
			<input type="hidden" name="shipping" value={shippingJson} />
			<input type="hidden" name="address" value="" />

			<!-- Honeypot anti-bot -->
			<div class="hidden" aria-hidden="true">
				<label for="website">Website</label>
				<input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
			</div>

			<div class="border-b-2 border-brandy/20 pb-3 dark:border-papaya/20">
				<h2 class="font-headline text-lg font-bold text-ink dark:text-papaya">Data Pemesan</h2>
				<p class="font-handwriting text-xl font-semibold text-teal dark:text-papaya/90">
					Informasi ini akan tertera pada faktur resmi pesanan Anda.
				</p>
			</div>

			<!-- Handle Media Sosial -->
			<div>
				<label for="handle" class="block font-headline text-sm font-bold text-ink dark:text-papaya">
					Handle Media Sosial / Nama Panggilan
				</label>
				<div class="mt-1.5 flex">
					<span
						class="inline-flex items-center rounded-l-[8px_3px_0px_2px] border-2 border-r-0 border-brandy bg-papaya px-3 font-mono text-sm font-bold text-brandy dark:border-papaya/40 dark:bg-ink dark:text-papaya"
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
						class="w-full rounded-r-[0px_3px_8px_0px] border-2 border-brandy bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-brandy/40 focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none disabled:opacity-50 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:placeholder:text-papaya/40"
					/>
				</div>
				<p class="mt-1 font-mono text-[11px] text-brandy/70 dark:text-papaya/60">
					Akun Instagram atau X aktif untuk verifikasi pesanan Anda.
				</p>
			</div>

			<!-- Email -->
			<div>
				<label for="email" class="block font-headline text-sm font-bold text-ink dark:text-papaya">
					Alamat Email Aktif
				</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					placeholder="kamu@email.com"
					disabled={isBusy}
					class="mt-1.5 w-full rounded-[8px_3px_7px_2px] border-2 border-brandy bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-brandy/40 focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none disabled:opacity-50 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:placeholder:text-papaya/40"
				/>
				<p class="mt-1 font-mono text-[11px] text-brandy/70 dark:text-papaya/60">
					Faktur invoice PDF resmi otomatis dikirimkan ke alamat email ini.
				</p>
			</div>

			<!-- WhatsApp -->
			<div>
				<label for="phone" class="block font-headline text-sm font-bold text-ink dark:text-papaya">
					Nomor WhatsApp Aktif
				</label>
				<input
					id="phone"
					name="phone"
					type="tel"
					required
					placeholder="08123456789"
					disabled={isBusy}
					class="mt-1.5 w-full rounded-[8px_3px_7px_2px] border-2 border-brandy bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-brandy/40 focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none disabled:opacity-50 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:placeholder:text-papaya/40"
				/>
				<p class="mt-1 font-mono text-[11px] text-brandy/70 dark:text-papaya/60">
					Nomor WhatsApp aktif untuk konfirmasi pesanan dan tautan checkout Shopee (bagi opsi Mail Order).
				</p>
			</div>

			<!-- Catatan Tambahan -->
			<div>
				<label for="note" class="block font-headline text-sm font-bold text-ink dark:text-papaya">
					Catatan Tambahan (Opsional)
				</label>
				<textarea
					id="note"
					name="note"
					rows="2"
					placeholder="Permintaan khusus atau pesan untuk penjual"
					disabled={isBusy}
					class="mt-1.5 w-full rounded-[8px_3px_7px_2px] border-2 border-brandy bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-brandy/40 focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none disabled:opacity-50 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:placeholder:text-papaya/40"
				></textarea>
			</div>

			<button
				type="submit"
				disabled={isBusy}
				class="flex w-full items-center justify-center gap-2 rounded-[10px_5px_9px_4px] border-2 border-brandy bg-tangerine px-5 py-3.5 font-mono text-base font-bold text-white shadow-[4px_4px_0px_#78290f] transition-all hover:bg-[#e06d00] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:border-brandy/30 disabled:bg-brandy/20 disabled:text-brandy/40 disabled:shadow-none"
			>
				<span>{isBusy ? 'Memproses Pesanan...' : 'Lanjut ke Pembayaran & Bukti Transfer'}</span>
				<ArrowRight size={18} strokeWidth={2.5} />
			</button>
		</form>
	{/if}
</div>

{#if isBusy}
	<div
		class="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-center select-none touch-none overscroll-none"
		role="dialog"
		aria-modal="true"
		aria-label="Memproses pesanan"
		tabindex="-1"
		onwheel={preventScroll}
		ontouchmove={preventScroll}
	>
		<div
			class="-rotate-1 rounded-[16px_8px_14px_6px] border-2 border-brandy bg-papaya p-6 shadow-[6px_6px_0px_#78290f] max-w-sm w-full space-y-4 dark:border-papaya/40 dark:bg-ink dark:shadow-[6px_6px_0px_rgba(255,236,209,0.3)]"
		>
			<div
				class="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-brandy/30 border-t-tangerine"
			></div>
			<div class="space-y-1">
				<p class="font-headline text-lg font-bold text-ink dark:text-papaya">
					Memverifikasi Pesanan Anda...
				</p>
				<p class="font-sans text-xs text-brandy/80 dark:text-papaya/70">
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
