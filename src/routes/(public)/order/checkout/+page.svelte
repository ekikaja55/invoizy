<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { cart, shippingLabel, type CartProduct } from '$lib/stores/cart.svelte';
	import { waLink } from '$lib/utils/contact';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { toast } from 'svelte-sonner';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import { formatRupiah } from '$lib/utils/currency';
	import type { ResolvedPathname } from '$app/types';
	import {
		ShoppingBag,
		Trash2,
		Plus,
		Minus,
		Truck,
		Store,
		MapPin,
		Search,
		AlertCircle,
		ArrowRight,
		Check
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let isBusy = $state(false);

	let itemToDelete = $state<CartProduct | null>(null);
	let confirmClearOpen = $state(false);

	function handleDecrement(item: CartProduct) {
		if (item.qty <= 1) {
			itemToDelete = item;
		} else {
			cart.addOrUpdateItem(item, item.qty - 1);
			cart.setShipping(null);
			quotedKey = null;
		}
	}

	function handleIncrement(item: CartProduct) {
		cart.addOrUpdateItem(item, item.qty + 1);
		cart.setShipping(null);
		quotedKey = null;
	}

	function confirmDeleteItem() {
		if (itemToDelete) {
			cart.addOrUpdateItem(itemToDelete, 0);
			cart.setShipping(null);
			quotedKey = null;
			itemToDelete = null;
			toast.success('Produk dihapus dari keranjang.');
		}
	}

	function confirmClearCart() {
		cart.clear();
		quotedKey = null;
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

	interface Destination {
		id: number;
		label: string;
	}

	interface QuoteOption {
		service: string;
		description: string;
		cost: number;
		etd: string;
	}

	interface QuoteGroup {
		courier: string;
		courierLabel: string;
		options: QuoteOption[];
		cached: boolean;
	}

	let destQuery = $state('');
	let destResults = $state<Destination[]>([]);
	let searching = $state(false);
	let searchError = $state('');
	let hasSearched = $state(false);

	let dest = $state<{ id: number; label: string } | null>(
		cart.shipping?.kind === 'quote'
			? { id: cart.shipping.destId, label: cart.shipping.destLabel }
			: null
	);
	let quoting = $state(false);
	let quoteError = $state('');
	let quoteGroups = $state<QuoteGroup[]>([]);
	let fallbackRate = $state<number | null>(null);
	// Eskalasi: 3x gagal beruntun (cari maupun kalkulasi) → tawarkan bantuan + flat darurat.
	let failCount = $state(0);
	let modalOpen = $state(false);
	let emergencyRate = $state<number | null>(null);
	const showEscalation = $derived(failCount >= 3);
	// Kunci item+dest saat quote sukses — beda = basi, wajib cek ulang (berat pengaruhi harga).
	let quotedKey = $state<string | null>(null);

	const itemsKey = $derived(
		JSON.stringify(cart.items.map((i) => ({ productId: i.productId, qty: i.qty })))
	);
	const currentKey = $derived(`${itemsKey}|${dest?.id ?? ''}`);
	const needsQuote = $derived(
		dest !== null && !cart.isEmpty && (quotedKey === null || quotedKey !== currentKey)
	);

	let pickupCodeInput = $state(
		cart.shipping?.kind === 'pickup' ? cart.shipping.code : ''
	);
	let shippingMethod = $state<'courier' | 'pickup'>(
		cart.shipping?.kind === 'pickup' ? 'pickup' : 'courier'
	);

	function switchShippingMethod(method: 'courier' | 'pickup') {
		shippingMethod = method;
		if (method === 'pickup') {
			cart.setShipping({ kind: 'pickup', code: pickupCodeInput.trim(), cost: 0 });
		} else {
			cart.setShipping(null);
		}
	}

	function handlePickupCodeInput(val: string) {
		pickupCodeInput = val;
		if (shippingMethod === 'pickup') {
			cart.setShipping({ kind: 'pickup', code: val.trim(), cost: 0 });
		}
	}

	// Pencarian eksplisit via tombol (bukan per huruf): tiap hit = 1 req kuota.
	async function doSearch() {
		const q = destQuery.trim();
		if (q.length < 3) {
			destResults = [];
			searchError = 'Ketik minimal 3 huruf dulu.';
			hasSearched = false;
			return;
		}
		if (searching) return;
		searching = true;
		searchError = '';
		hasSearched = true;
		try {
			const res = await fetch(`/api/shipping/search?q=${encodeURIComponent(q)}`);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? 'Pencarian gagal.');
			destResults = json.results;
			failCount = 0;
		} catch (e) {
			destResults = [];
			searchError = e instanceof Error ? e.message : 'Pencarian gagal.';
			failCount += 1;
		} finally {
			searching = false;
		}
	}

	function selectDest(d: Destination) {
		dest = d;
		destQuery = d.label;
		destResults = [];
		cart.setShipping(null);
		quotedKey = null;
		quoteGroups = [];
		fallbackRate = null;
		quoteError = '';
		fetchQuote();
	}

	function clearDest() {
		dest = null;
		destQuery = '';
		destResults = [];
		hasSearched = false;
		cart.setShipping(null);
		quotedKey = null;
		quoteGroups = [];
		fallbackRate = null;
	}

	async function fetchQuote() {
		if (!dest || cart.isEmpty || quoting) return;
		quoting = true;
		quoteError = '';
		try {
			const res = await fetch('/api/shipping/quote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					destinationId: dest.id,
					items: cart.items.map((i) => ({ productId: i.productId, qty: i.qty }))
				})
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? 'Kalkulasi gagal.');
			quoteGroups = json.options;
			fallbackRate = json.fallback?.rate ?? null;
			quotedKey = currentKey;
			failCount = 0;
			// Pertahankan pilihan lama bila masih tersedia dgn harga sama.
			const cur = cart.shipping;
			if (cur?.kind === 'quote') {
				const still = quoteGroups
					.find((g) => g.courier === cur.courier)
					?.options.find((o) => o.service === cur.service && o.cost === cur.cost);
				if (!still) cart.setShipping(null);
			}
		} catch (e) {
			quoteError = e instanceof Error ? e.message : 'Kalkulasi gagal.';
			failCount += 1;
		} finally {
			quoting = false;
		}
	}

	function selectService(group: QuoteGroup, opt: QuoteOption) {
		if (!dest) return;
		cart.setShipping({
			kind: 'quote',
			courier: group.courier,
			courierLabel: group.courierLabel,
			service: opt.service,
			cost: opt.cost,
			etd: opt.etd,
			destId: dest.id,
			destLabel: dest.label
		});
	}

	function isSelected(group: QuoteGroup, opt: QuoteOption): boolean {
		const s = cart.shipping;
		return s?.kind === 'quote' && s.courier === group.courier && s.service === opt.service;
	}

	function etdLabel(etd: string): string {
		return etd && etd !== '-' ? ` · ${etd}` : '';
	}

	async function openEmergency() {
		try {
			const res = await fetch('/api/shipping/fallback');
			const json = await res.json();
			if (!res.ok || typeof json.rate !== 'number' || json.rate <= 0) {
				throw new Error('Flat darurat tidak tersedia saat ini.');
			}
			emergencyRate = json.rate;
			modalOpen = true;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Flat darurat tidak tersedia.');
		}
	}

	function confirmEmergency() {
		modalOpen = false;
		if (emergencyRate === null) return;
		cart.setShipping({ kind: 'fallback', cost: emergencyRate });
		quotedKey = currentKey;
		failCount = 0;
		toast.success('Ongkir flat darurat dipakai.');
	}

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

	// Sinkronkan cart dengan katalog terbaru saat halaman dimuat (harga/stok bisa berubah).
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

		for (const category of [...data.productCategories]) {
			for (const product of category.products) {
				catalogMap.set(product.id, {
					name: product.name,
					price: product.priceInt,
					trackStock: product.trackStock,
					stock: product.stock,
					variants: product.variants
				});
			}
		}

		untrack(() => cart.reconcile(catalogMap));
	});
</script>

<div class="space-y-8 pb-24">
	<!-- Page Header / Scrapbook Title -->
	<header class="space-y-3">
		<div
			class="inline-block -rotate-2 rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya px-3.5 py-1.5 font-mono text-xs font-bold tracking-widest text-brandy uppercase shadow-[2px_2px_0px_#78290f] md:text-sm dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
		>
			CHECKOUT PESANAN
		</div>
		<h1
			class="font-serif text-3xl font-bold tracking-normal text-ink md:text-4xl dark:text-papaya"
		>
			Lengkapi Pesanan Anda
		</h1>
		<p class="font-handwriting text-2xl font-semibold leading-snug text-teal md:text-3xl dark:text-papaya/90">
			Periksa kembali rincian belanjaan dan isi data pengiriman dengan benar.
		</p>
	</header>

	{#if cart.isEmpty}
		<div
			class="mx-auto max-w-md rounded-[16px_8px_14px_6px] border-2 border-dashed border-brandy/40 bg-papaya/40 p-10 text-center shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/40 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
		>
			<div
				class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-brandy bg-tangerine/20 text-brandy dark:border-papaya/40 dark:text-papaya"
			>
				<ShoppingBag size={28} strokeWidth={2.5} />
			</div>
			<p class="font-serif text-lg font-bold text-ink dark:text-papaya">
				Keranjang Kamu Masih Kosong
			</p>
			<p class="mt-1 text-sm text-brandy/80 dark:text-papaya/70">
				Belum ada produk yang kamu pilih untuk dipesan.
			</p>
			<div class="mt-5">
				<a
					href={resolve('/(public)/order')}
					class="inline-flex items-center gap-2 rounded-[8px_3px_7px_2px] border-2 border-brandy bg-tangerine px-5 py-2.5 font-mono text-sm font-bold text-white shadow-[3px_3px_0px_#78290f] transition-all hover:bg-[#e06d00] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
				>
					<span>Mulai Belanja</span>
					<ArrowRight size={15} strokeWidth={2.5} />
				</a>
			</div>
		</div>
	{:else}
		<!-- Step 1: Pengiriman -->
		<div
			class="space-y-4 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/50 p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
		>
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-[6px_2px_5px_1px] border-2 border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f]"
				>
					<Truck size={16} strokeWidth={2.5} />
				</div>
				<h2 class="font-serif text-lg font-bold text-ink dark:text-papaya">Metode Pengiriman</h2>
			</div>

			{#if data.pickupEnabled}
				<div class="grid grid-cols-2 gap-2.5">
					<button
						type="button"
						onclick={() => switchShippingMethod('courier')}
						class="rounded-[8px_3px_7px_2px] border-2 p-3 font-mono text-xs font-bold transition-all duration-150 {shippingMethod ===
						'courier'
							? 'border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f] -translate-y-0.5'
							: 'border-brandy/40 bg-papaya text-ink hover:bg-brandy/10 dark:border-papaya/30 dark:bg-ink dark:text-papaya'}"
					>
						Kirim via Kurir
					</button>
					<button
						type="button"
						onclick={() => switchShippingMethod('pickup')}
						class="rounded-[8px_3px_7px_2px] border-2 p-3 font-mono text-xs font-bold transition-all duration-150 {shippingMethod ===
						'pickup'
							? 'border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f] -translate-y-0.5'
							: 'border-brandy/40 bg-papaya text-ink hover:bg-brandy/10 dark:border-papaya/30 dark:bg-ink dark:text-papaya'}"
					>
						Ambil Sendiri (Rp 0)
					</button>
				</div>
			{/if}

			{#if shippingMethod === 'pickup' && data.pickupEnabled}
				<div
					class="space-y-3 rounded-[10px_4px_8px_3px] border-2 border-dashed border-forest/50 bg-forest/10 p-4"
				>
					<div class="flex items-center justify-between">
						<span class="font-serif text-sm font-bold text-forest"
							>Self-Pickup di Lokasi Toko</span
						>
						<span
							class="rounded-[4px_2px_4px_2px] border border-forest/40 bg-forest/20 px-2 py-0.5 font-mono text-xs font-bold text-forest"
						>
							Gratis (Rp 0)
						</span>
					</div>
					<p class="text-xs leading-relaxed text-ink/80 dark:text-papaya/80">
						Khusus rekanan/teman yang mengambil pesanan langsung ke lokasi toko. Masukkan kode
						khusus dari admin.
					</p>
					<div>
						<label
							for="pickupCodeInput"
							class="block font-mono text-xs font-bold text-brandy dark:text-papaya"
						>
							Kode Rahasia Rekanan
						</label>
						<input
							id="pickupCodeInput"
							type="text"
							value={pickupCodeInput}
							oninput={(e) => handlePickupCodeInput(e.currentTarget.value)}
							placeholder="MASUKKAN KODE"
							disabled={isBusy}
							class="mt-1 w-full rounded-[6px_3px_5px_2px] border-2 border-brandy bg-white px-3.5 py-2 font-mono text-sm font-bold uppercase text-ink placeholder:text-brandy/40 focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none disabled:opacity-50 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:placeholder:text-papaya/40"
						/>
					</div>
				</div>
			{:else}
				<div class="flex gap-2">
					<input
						type="search"
						bind:value={destQuery}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								doSearch();
							}
						}}
						placeholder="Ketik nama kecamatan tujuan (mis. Gambir, Sukajadi)"
						disabled={isBusy}
						class="w-full rounded-[8px_3px_7px_2px] border-2 border-brandy bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-brandy/40 focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none disabled:opacity-50 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:placeholder:text-papaya/40"
					/>
					<button
						type="button"
						onclick={doSearch}
						disabled={searching || isBusy}
						class="shrink-0 rounded-[8px_3px_7px_2px] border-2 border-brandy bg-tangerine px-5 py-2.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#78290f] transition-all hover:bg-[#e06d00] active:translate-y-0.5 active:shadow-none disabled:opacity-50"
					>
						{searching ? 'Mencari...' : 'Cari'}
					</button>
				</div>

				<p class="text-xs text-brandy/80 dark:text-papaya/70">
					Ketik nama kecamatan atau kota tujuan Anda.
					{#if data.contact}
						{@const waManual = waLink(
							data.contact,
							'Halo admin, kecamatan saya belum terdaftar di pilihan ongkir cho.lazey - CHIBICONXI CATALOGUE. Boleh dibantu hitung ongkir manual?'
						)}
						{#if waManual}
							<a
								href={waManual}
								target="_blank"
								rel="external noopener noreferrer"
								class="font-bold underline hover:text-tangerine"
							>
								Hubungi admin via WhatsApp
							</a>
						{:else}
							Hubungi admin
						{/if}
					{:else}
						Hubungi admin
					{/if}
					jika tidak menemukan kecamatannya.
				</p>

				{#if searchError}
					<p class="font-mono text-xs font-bold text-crimson">{searchError}</p>
				{/if}

				{#if hasSearched && !searching && destResults.length === 0 && !searchError && !dest}
					<div
						class="rounded-[10px_4px_8px_3px] border-2 border-brandy/40 bg-tangerine/10 p-3.5 text-xs text-brandy dark:border-papaya/30 dark:bg-tangerine/15 dark:text-papaya"
					>
						<p class="font-serif text-sm font-bold text-ink dark:text-papaya">
							Kecamatan tidak ditemukan atau tidak ada yang cocok?
						</p>
						<p class="mt-1 leading-relaxed">
							Pastikan ejaan kecamatan sudah benar atau coba cari berdasarkan nama kota/kabupaten.
							Jika masih tidak ditemukan, silakan hubungi admin untuk dibantu cek ongkir manual.
						</p>
						{#if data.contact}
							{@const waNotFound = waLink(
								data.contact,
								`Halo admin, saya mau checkout tapi kecamatan tujuan "${destQuery}" tidak ditemukan di sistem. Boleh dibantu cek ongkir manual?`
							)}
							{#if waNotFound}
								<div class="mt-2.5">
									<a
										href={waNotFound}
										target="_blank"
										rel="external noopener noreferrer"
										class="inline-flex items-center gap-1.5 rounded-[6px_2px_5px_1px] border-2 border-brandy bg-tangerine px-3 py-1.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#78290f] hover:bg-[#e06d00]"
									>
										Chat Admin via WhatsApp
									</a>
								</div>
							{/if}
						{/if}
					</div>
				{/if}

				{#if destResults.length > 0}
					<ul class="space-y-1.5">
						{#each destResults as d (d.id)}
							<li>
								<button
									type="button"
									onclick={() => selectDest(d)}
									disabled={isBusy}
									class="group flex w-full items-center justify-between rounded-[8px_3px_7px_2px] border-2 border-brandy/40 bg-white/80 p-3 text-left font-sans text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] transition-all hover:border-brandy hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none disabled:opacity-50 dark:border-papaya/30 dark:bg-ink dark:text-papaya dark:hover:border-papaya dark:hover:bg-papaya/15 dark:hover:text-papaya"
								>
									<span>{d.label}</span>
									<span class="font-mono text-[11px] text-teal transition-colors group-hover:text-tangerine dark:text-teal/90">Pilih & Cek Ongkir →</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}

				{#if dest}
					<div
						class="flex items-center justify-between gap-2 rounded-[8px_3px_7px_2px] border-2 border-brandy bg-papaya p-3 shadow-[2px_2px_0px_#78290f] dark:border-papaya/40 dark:bg-ink dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
					>
						<div class="flex items-center gap-2">
							<MapPin size={16} strokeWidth={2.5} class="text-tangerine shrink-0" />
							<span class="text-xs text-ink dark:text-papaya"
								>Tujuan: <strong class="font-bold">{dest.label}</strong></span
							>
						</div>
						<button
							type="button"
							onclick={clearDest}
							disabled={isBusy}
							class="rounded-[4px_2px_3px_1px] border border-brandy/30 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-brandy hover:bg-brandy/10 disabled:opacity-50 dark:border-papaya/30 dark:bg-ink dark:text-papaya"
						>
							Ganti
						</button>
					</div>
				{/if}

				{#if dest}
					{#if quoting}
						<div
							class="flex items-center gap-2 rounded-[8px_3px_7px_2px] border border-dashed border-brandy/40 bg-papaya/40 p-3 text-xs text-brandy dark:border-papaya/30 dark:bg-ink/40 dark:text-papaya"
						>
							<div class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-tangerine border-t-transparent"></div>
							<span>Menghitung ongkir ke {dest.label}...</span>
						</div>
					{:else if quoteError}
						<div
							class="rounded-[8px_3px_7px_2px] border-2 border-crimson/40 bg-crimson/10 p-3 text-xs text-crimson"
						>
							<p class="font-mono font-bold">{quoteError}</p>
							<button
								type="button"
								onclick={fetchQuote}
								disabled={isBusy}
								class="mt-1 font-mono font-bold underline disabled:opacity-50"
							>
								Coba lagi
							</button>
						</div>
					{:else}
						{#each quoteGroups as group (group.courier)}
							<div class="space-y-1.5 pt-1">
								<p class="font-mono text-xs font-bold text-brandy/80 dark:text-papaya/70">
									{group.courierLabel}
								</p>
								<div class="grid gap-2 sm:grid-cols-2">
									{#each group.options as opt (opt.service)}
										{@const active = isSelected(group, opt)}
										<label
											class="flex cursor-pointer items-center justify-between rounded-[8px_3px_7px_2px] border-2 p-3 transition-all duration-150 {active
												? 'border-brandy bg-tangerine/15 shadow-[2px_2px_0px_#78290f] dark:border-papaya dark:bg-tangerine/20'
												: 'border-brandy/30 bg-white/70 hover:border-brandy hover:bg-papaya/40 dark:border-papaya/25 dark:bg-ink/70'}"
										>
											<div class="flex items-center gap-2.5">
												<input
													type="radio"
													name="shipping"
													checked={active}
													onchange={() => selectService(group, opt)}
													disabled={isBusy}
													class="accent-tangerine"
												/>
												<div>
													<span class="font-serif text-xs font-bold text-ink dark:text-papaya"
														>{opt.service}</span
													>
													{#if opt.etd && opt.etd !== '-'}
														<span class="block font-mono text-[10px] text-brandy/70 dark:text-papaya/60"
															>{opt.etd}</span
														>
													{/if}
												</div>
											</div>
											<span class="font-mono text-xs font-bold text-teal dark:text-teal/90"
												>{formatRupiah(opt.cost)}</span
											>
										</label>
									{/each}
								</div>
							</div>
						{/each}

						{#if fallbackRate !== null}
							<label
								class="flex cursor-pointer items-center justify-between rounded-[8px_3px_7px_2px] border-2 border-brandy bg-brandy/10 p-3 shadow-[2px_2px_0px_#78290f] dark:border-papaya/40 dark:bg-papaya/10"
							>
								<div class="flex items-center gap-2.5">
									<input
										type="radio"
										name="shipping"
										checked={cart.shipping?.kind === 'fallback'}
										onchange={() =>
											cart.setShipping({ kind: 'fallback', cost: fallbackRate ?? 0 })}
										disabled={isBusy}
										class="accent-tangerine"
									/>
									<div>
										<span class="font-serif text-xs font-bold text-ink dark:text-papaya"
											>Flat Darurat</span
										>
										<span class="block font-mono text-[10px] text-brandy/70 dark:text-papaya/60"
											>Cek ongkir otomatis gangguan</span
										>
									</div>
								</div>
								<span class="font-mono text-xs font-bold text-teal dark:text-teal/90"
									>{formatRupiah(fallbackRate)}</span
								>
							</label>
						{/if}

						{#if needsQuote}
							<button
								type="button"
								onclick={fetchQuote}
								disabled={isBusy}
								class="w-full rounded-[8px_3px_7px_2px] border-2 border-brandy bg-papaya py-2 font-mono text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] transition-all hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none disabled:opacity-50 dark:border-papaya/40 dark:bg-ink dark:text-papaya"
							>
								{quotedKey === null
									? 'Cek Ongkir'
									: 'Cek Ulang Ongkir (keranjang telah berubah)'}
							</button>
						{/if}
					{/if}
				{/if}

				{#if showEscalation}
					<div
						class="rounded-[10px_4px_8px_3px] border-2 border-brandy bg-tangerine/15 p-4 shadow-[3px_3px_0px_#78290f] dark:border-papaya/30 dark:bg-ink"
					>
						<p class="font-serif text-sm font-bold text-ink dark:text-papaya">Masih Kendala?</p>
						<p class="mt-1 text-xs leading-relaxed text-ink/80 dark:text-papaya/80">
							Cek ongkir otomatis sedang mengalami gangguan jaringan. Anda dapat menghubungi admin
							atau melanjutkan dengan tarif flat darurat.
						</p>
						<div class="mt-3 flex flex-wrap gap-2">
							{#if data.contact}
								{@const wa = waLink(data.contact)}
								{#if wa}
									<a
										href={wa}
										target="_blank"
										rel="external noopener noreferrer"
										class="rounded-[6px_2px_5px_1px] border-2 border-brandy bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] hover:bg-papaya dark:border-papaya/40 dark:bg-ink dark:text-papaya"
									>
										Chat Admin via WA
									</a>
								{:else}
									<span
										class="rounded-[6px_2px_5px_1px] border-2 border-brandy bg-white px-3 py-1.5 font-mono text-xs text-ink dark:border-papaya/40 dark:bg-ink dark:text-papaya"
									>
										Hubungi admin: {data.contact}
									</span>
								{/if}
							{/if}
							<button
								type="button"
								onclick={openEmergency}
								disabled={isBusy}
								class="rounded-[6px_2px_5px_1px] border-2 border-brandy bg-tangerine px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#78290f] hover:bg-[#e06d00] disabled:opacity-50"
							>
								Pakai Ongkir Flat Darurat
							</button>
						</div>
					</div>
				{/if}

				<Modal
					open={modalOpen}
					title="Pakai ongkir flat darurat?"
					message={`Cek ongkir otomatis sedang gangguan, jadi tarifnya flat ${formatRupiah(emergencyRate ?? 0)} ke semua tujuan. Bisa lebih mahal atau murah dari tarif kurir asli, tapi order tetap diproses dan invoice dikirim seperti biasa. Lanjut?`}
					confirmLabel="Ya, pakai flat"
					onConfirm={confirmEmergency}
					onCancel={() => (modalOpen = false)}
				/>
			{/if}
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
					<h2 class="font-serif text-lg font-bold text-ink dark:text-papaya">Ringkasan Belanja</h2>
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
							<span class="font-serif text-sm font-bold text-ink truncate block dark:text-papaya"
								>{item.name}</span
							>
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

				{#if cart.shipping}
					<li
						class="flex items-center justify-between border-t-2 border-dashed border-brandy/20 pt-3 text-sm dark:border-papaya/20"
					>
						<div>
							<span class="font-serif text-xs font-bold text-ink dark:text-papaya"
								>Ongkir · {shippingLabel(cart.shipping)}</span
							>
							{#if cart.shipping.kind === 'quote'}
								<span class="block font-mono text-[11px] text-brandy/70 dark:text-papaya/60">
									{cart.shipping.destLabel}{cart.shipping.etd && cart.shipping.etd !== '-'
										? ` · ${cart.shipping.etd}`
										: ''}
								</span>
							{/if}
						</div>
						<span class="font-mono text-xs font-bold text-teal dark:text-teal/90"
							>{formatRupiah(cart.shipping.cost)}</span
						>
					</li>
				{/if}

				<li
					class="flex items-center justify-between border-t-2 border-brandy pt-3 dark:border-papaya/30"
				>
					<span class="font-serif text-base font-bold text-ink dark:text-papaya">Total Akhir</span>
					<span class="font-mono text-xl font-bold text-teal dark:text-teal/90"
						>{formatRupiah(cart.total)}</span
					>
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
						// Query ditempel manual (token UUID aman-URL); path tetap via resolve().
						const dest = `${resolve('/(public)/order/sukses/[orderId]', {
							orderId: result.data.orderId
						})}${token}` as ResolvedPathname;
						goto(dest, { replaceState: true });
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

			<!-- Honeypot anti-bot: field tersembunyi, manusia tidak mengisinya -->
			<div class="hidden" aria-hidden="true">
				<label for="website">Website</label>
				<input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
			</div>

			<div class="border-b-2 border-brandy/20 pb-3 dark:border-papaya/20">
				<h2 class="font-serif text-lg font-bold text-ink dark:text-papaya">Data Pemesan</h2>
				<p class="font-handwriting text-xl font-semibold text-teal dark:text-papaya/90">
					Informasi ini akan tertera pada faktur resmi pesanan Anda.
				</p>
			</div>

			<div>
				<label for="handle" class="block font-serif text-sm font-bold text-ink dark:text-papaya"
					>Handle Media Sosial</label
				>
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
					Akun Instagram/X aktif untuk verifikasi pesanan.
				</p>
			</div>

			<div>
				<label for="email" class="block font-serif text-sm font-bold text-ink dark:text-papaya"
					>Alamat Email</label
				>
				<input
					id="email"
					name="email"
					type="email"
					required
					placeholder="kamu@email.com"
					disabled={isBusy}
					class="mt-1.5 w-full rounded-[8px_3px_7px_2px] border-2 border-brandy bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-brandy/40 focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none disabled:opacity-50 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:placeholder:text-papaya/40"
				/>
				{#if data.emailEnabled}
					<p class="mt-1 font-mono text-[11px] text-brandy/70 dark:text-papaya/60">
						Invoice PDF dan konfirmasi pesanan otomatis dikirim ke email ini.
					</p>
				{:else}
					<p class="mt-1 font-mono text-[11px] text-brandy/70 dark:text-papaya/60">
						Tautan & unduhan invoice langsung tersedia di halaman sukses setelah order dibuat.
					</p>
				{/if}
			</div>

			<div>
				<label for="phone" class="block font-serif text-sm font-bold text-ink dark:text-papaya"
					>Nomor WhatsApp</label
				>
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
					Nomor aktif untuk konfirmasi ketersediaan barang dan info resi.
				</p>
			</div>

			<div>
				<label for="address" class="block font-serif text-sm font-bold text-ink dark:text-papaya"
					>Alamat Lengkap</label
				>
				{#if shippingMethod === 'pickup' && data.pickupEnabled}
					<input type="hidden" name="address" value="Ambil Sendiri di Toko / Self-Pickup" />
					<div
						class="mt-1.5 rounded-[8px_3px_7px_2px] border-2 border-dashed border-forest/40 bg-forest/10 p-3 text-xs text-forest"
					>
						Barang akan diambil langsung di toko. Alamat pengiriman kurir tidak diperlukan.
					</div>
				{:else}
					<textarea
						id="address"
						name="address"
						rows="3"
						required
						placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, kode pos, patokan"
						disabled={isBusy}
						class="mt-1.5 w-full rounded-[8px_3px_7px_2px] border-2 border-brandy bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-brandy/40 focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none disabled:opacity-50 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:placeholder:text-papaya/40"
					></textarea>
					<p class="mt-1 font-mono text-[11px] text-brandy/70 dark:text-papaya/60">
						Alamat lengkap beserta patokan rumah untuk kurir ekspedisi.
					</p>
				{/if}
			</div>

			<div>
				<label for="note" class="block font-serif text-sm font-bold text-ink dark:text-papaya"
					>Catatan Tambahan (opsional)</label
				>
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
				<span>{isBusy ? 'Membuat Pesanan...' : 'Buat Pesanan & Dapatkan Invoice'}</span>
				<ArrowRight size={18} strokeWidth={2.5} />
			</button>
		</form>
	{/if}
</div>

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

