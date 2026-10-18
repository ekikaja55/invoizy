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
	import { ShoppingBag, Trash2, Plus, Minus } from '@lucide/svelte';
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

<div class="space-y-6 pb-16">
	<h1 class="text-xl font-semibold">Checkout</h1>

	{#if cart.isEmpty}
		<div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
			<ShoppingBag size={40} class="text-neutral-400" />
			<p class="text-sm text-neutral-500">Keranjang kamu masih kosong.</p>
			<a
				href={resolve('/order')}
				class="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white
               hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
			>
				Mulai Order
			</a>
		</div>
	{:else}
		<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
			<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Pengiriman</h2>

			{#if data.pickupEnabled}
				<div class="mt-3 grid grid-cols-2 gap-2">
					<button
						type="button"
						onclick={() => switchShippingMethod('courier')}
						class="rounded-lg border p-2.5 text-center text-sm font-medium transition-colors {shippingMethod === 'courier' ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800'}"
					>
						Kirim via Kurir
					</button>
					<button
						type="button"
						onclick={() => switchShippingMethod('pickup')}
						class="rounded-lg border p-2.5 text-center text-sm font-medium transition-colors {shippingMethod === 'pickup' ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800'}"
					>
						Ambil Sendiri (Rp 0)
					</button>
				</div>
			{/if}

			{#if shippingMethod === 'pickup' && data.pickupEnabled}
				<div class="mt-4 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/40">
					<div class="flex items-center justify-between">
						<span class="text-sm font-semibold">Self-Pickup di Lokasi Toko</span>
						<span class="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
							Gratis (Rp 0)
						</span>
					</div>
					<p class="text-xs text-neutral-600 dark:text-neutral-400">
						Khusus rekanan/teman yang mengambil pesanan langsung ke lokasi toko. Masukkan kode khusus dari admin.
					</p>
					<div>
						<label for="pickupCodeInput" class="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
							Kode Rahasia Rekanan
						</label>
						<input
							id="pickupCodeInput"
							type="text"
							value={pickupCodeInput}
							oninput={(e) => handlePickupCodeInput(e.currentTarget.value)}
							placeholder="Masukkan kode khusus"
							disabled={isBusy}
							class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono uppercase text-neutral-900 placeholder:text-neutral-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
						/>
					</div>
				</div>
			{:else}
				<div class="mt-3 flex gap-2">
					<input
						type="search"
						bind:value={destQuery}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								doSearch();
							}
						}}
						placeholder="Ketik kecamatan tujuan"
						disabled={isBusy}
						class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
					/>
					<button
						onclick={doSearch}
						disabled={searching || isBusy}
						class="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white
                 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
					>
						{searching ? '...' : 'Cari'}
					</button>
				</div>

				<p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
					Ketik nama kecamatan atau kota. Jika kecamatan tujuan tidak ditemukan atau tidak ada yang cocok,
					{#if data.contact}
						{@const waManual = waLink(
							data.contact,
							'Halo admin, kecamatan saya belum terdaftar di pilihan ongkir invoizy. Boleh dibantu hitung ongkir manual?'
						)}
						{#if waManual}
							<a
								href={waManual}
								target="_blank"
								rel="external noopener noreferrer"
								class="font-medium underline hover:text-neutral-900 dark:hover:text-neutral-100"
							>
								hubungi admin via WhatsApp
							</a>
						{:else}
							hubungi admin
						{/if}
					{:else}
						hubungi admin
					{/if}
					untuk bantuan ongkir manual.
				</p>

				{#if searchError}
					<p class="mt-2 text-xs text-red-600 dark:text-red-400">{searchError}</p>
				{/if}

				{#if hasSearched && !searching && destResults.length === 0 && !searchError && !dest}
					<div
						class="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
					>
						<p class="font-medium">Kecamatan tidak ditemukan atau tidak ada yang cocok?</p>
						<p class="mt-1">
							Pastikan ejaan kecamatan sudah benar atau coba cari berdasarkan nama kota/kabupaten. Jika masih tidak ditemukan, silakan hubungi admin untuk dibantu cek ongkir manual.
						</p>
						{#if data.contact}
							{@const waNotFound = waLink(
								data.contact,
								`Halo admin, saya mau checkout tapi kecamatan tujuan "${destQuery}" tidak ditemukan di sistem. Boleh dibantu cek ongkir manual?`
							)}
							{#if waNotFound}
								<div class="mt-2">
									<a
										href={waNotFound}
										target="_blank"
										rel="external noopener noreferrer"
										class="inline-flex items-center rounded-md bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600"
									>
										Chat Admin via WhatsApp
									</a>
								</div>
							{/if}
						{/if}
					</div>
				{/if}

			{#if destResults.length > 0}
				<ul class="mt-2 space-y-1">
					{#each destResults as d (d.id)}
						<li>
							<button
								onclick={() => selectDest(d)}
								disabled={isBusy}
								class="w-full rounded-lg border border-neutral-200 p-2.5 text-left text-sm
                       hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-white/10"
							>
								{d.label}
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			{#if dest}
				<div
					class="mt-2 flex items-center justify-between gap-2 rounded-lg bg-neutral-100 p-2.5 text-sm dark:bg-white/10"
				>
					<span>Tujuan: <span class="font-medium">{dest.label}</span></span>
					<button
						onclick={clearDest}
						disabled={isBusy}
						class="shrink-0 text-xs underline disabled:opacity-50"
					>
						Ganti
					</button>
				</div>
			{/if}

			{#if dest}
				{#if quoting}
					<p class="mt-2 text-xs text-neutral-500">Menghitung ongkir...</p>
				{:else if quoteError}
					<div class="mt-2 rounded-lg border border-red-200 p-2.5 text-sm dark:border-red-900">
						<p class="text-red-600 dark:text-red-400">{quoteError}</p>
						<button
							onclick={fetchQuote}
							disabled={isBusy}
							class="mt-1 text-xs underline disabled:opacity-50"
						>
							Coba lagi
						</button>
					</div>
				{:else}
					{#each quoteGroups as group (group.courier)}
						<div class="mt-2 space-y-1">
							<p class="text-xs font-semibold text-neutral-500">{group.courierLabel}</p>
							{#each group.options as opt (opt.service)}
								<label
									class="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200 p-2.5
                         dark:border-neutral-800"
								>
									<div class="flex items-center gap-2">
										<input
											type="radio"
											name="shipping"
											checked={isSelected(group, opt)}
											onchange={() => selectService(group, opt)}
											disabled={isBusy}
										/>
										<span class="text-sm">{opt.service}{etdLabel(opt.etd)}</span>
									</div>
									<span class="text-sm text-neutral-500">{formatRupiah(opt.cost)}</span>
								</label>
							{/each}
						</div>
					{/each}

					{#if fallbackRate !== null}
						<label
							class="mt-2 flex cursor-pointer items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-2.5
                     dark:border-amber-800 dark:bg-amber-950"
						>
							<div class="flex items-center gap-2">
								<input
									type="radio"
									name="shipping"
									checked={cart.shipping?.kind === 'fallback'}
									onchange={() => cart.setShipping({ kind: 'fallback', cost: fallbackRate ?? 0 })}
									disabled={isBusy}
								/>
								<span class="text-sm"
									>Flat darurat <span class="text-xs text-neutral-500">(cek ongkir gangguan)</span
									></span
								>
							</div>
							<span class="text-sm text-neutral-500">{formatRupiah(fallbackRate)}</span>
						</label>
					{/if}

					{#if needsQuote}
						<button
							onclick={fetchQuote}
							disabled={isBusy}
							class="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
                     hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-white/10"
						>
							{quotedKey === null ? 'Cek Ongkir' : 'Cek Ulang Ongkir (keranjang berubah)'}
						</button>
					{/if}
				{/if}
			{/if}

			{#if showEscalation}
				<div
					class="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950"
				>
					<p class="font-medium">Masih kendala?</p>
					<p class="mt-1 text-neutral-600 dark:text-neutral-400">
						Cek ongkir otomatisnya lagi gangguan. Hubungi admin atau lanjut pakai ongkir flat
						darurat.
					</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#if data.contact}
							{@const wa = waLink(data.contact)}
							{#if wa}
								<a
									href={wa}
									target="_blank"
									rel="external"
									class="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium
                         hover:bg-neutral-100 dark:border-neutral-700 dark:bg-transparent dark:hover:bg-white/10"
								>
									Chat Admin via WA
								</a>
							{:else}
								<span
									class="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-600
                         dark:border-neutral-700 dark:text-neutral-400"
								>
									Hubungi admin: {data.contact}
								</span>
							{/if}
						{/if}
						<button
							onclick={openEmergency}
							disabled={isBusy}
							class="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white
                     disabled:opacity-50 dark:bg-white dark:text-neutral-900"
						>
							Pakai ongkir flat darurat
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

		<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Ringkasan</h2>
				<button
					type="button"
					onclick={() => (confirmClearOpen = true)}
					disabled={isBusy}
					class="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
				>
					<Trash2 size={13} />
					<span>Kosongkan</span>
				</button>
			</div>

			<ul class="mt-3 space-y-2.5">
				{#each cart.items as item (item.variantId ? `${item.productId}:${item.variantId}` : item.productId)}
					<li
						class="flex items-start justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50/60 p-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900/40"
					>
						<div class="flex-1 min-w-0">
							<span class="font-medium truncate block">{item.name}</span>
							<div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
								{#if item.variantName}
									<span
										class="rounded bg-neutral-200/70 px-1.5 py-0.5 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
									>
										{item.variantName}
									</span>
								{/if}
								<span class="text-neutral-500">
									{formatRupiah(item.price)}
								</span>
							</div>
							<span class="mt-1 block text-xs font-semibold text-neutral-900 dark:text-white">
								{formatRupiah(item.price * item.qty)}
							</span>
						</div>

						<div class="flex flex-col items-end gap-1.5">
							<button
								type="button"
								onclick={() => (itemToDelete = item)}
								disabled={isBusy}
								class="text-neutral-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
								aria-label={`Hapus ${item.name}`}
							>
								<Trash2 size={15} />
							</button>

							<div
								class="flex items-center rounded-lg border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800"
							>
								<button
									type="button"
									onclick={() => handleDecrement(item)}
									disabled={isBusy}
									class="flex h-6 w-6 items-center justify-center rounded-l-lg hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-700"
									aria-label="Kurangi jumlah"
								>
									<Minus size={12} />
								</button>
								<span class="w-7 text-center text-xs font-bold text-neutral-900 dark:text-white">
									{item.qty}
								</span>
								<button
									type="button"
									onclick={() => handleIncrement(item)}
									disabled={isBusy}
									class="flex h-6 w-6 items-center justify-center rounded-r-lg hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-700"
									aria-label="Tambah jumlah"
								>
									<Plus size={12} />
								</button>
							</div>
						</div>
					</li>
				{/each}

				{#if cart.shipping}
					<li
						class="flex items-center justify-between border-t border-neutral-200 pt-2 text-sm dark:border-neutral-800"
					>
						<span>
							Ongkir · {shippingLabel(cart.shipping)}
							{#if cart.shipping.kind === 'quote'}
								<span class="block text-xs text-neutral-500">
									{cart.shipping.destLabel}{cart.shipping.etd && cart.shipping.etd !== '-'
										? ` · ${cart.shipping.etd}`
										: ''}
								</span>
							{/if}
						</span>
						<span>{formatRupiah(cart.shipping.cost)}</span>
					</li>
				{/if}

				<li
					class="flex items-center justify-between border-t border-neutral-200 pt-2 text-sm font-semibold dark:border-neutral-800"
				>
					<span>Total</span>
					<span>{formatRupiah(cart.total)}</span>
				</li>
			</ul>
		</div>

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
			class="space-y-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
		>
			<input type="hidden" name="items" value={itemsJson} />
			<input type="hidden" name="shipping" value={shippingJson} />

			<!-- Honeypot anti-bot: field tersembunyi, manusia tidak mengisinya -->
			<div class="hidden" aria-hidden="true">
				<label for="website">Website</label>
				<input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
			</div>

			<div>
				<label for="handle" class="block text-sm font-medium">Handle Sosmed</label>
				<div class="mt-1 flex rounded-lg">
					<span
						class="inline-flex items-center rounded-l-lg border border-r-0 border-neutral-300 bg-neutral-100 px-3 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
					>
						@
					</span>
					<input
						id="handle"
						name="handle"
						type="text"
						required
						placeholder="namakamu"
						disabled={isBusy}
						class="w-full rounded-r-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
					/>
				</div>
				<p class="mt-1 text-xs text-neutral-500">
					Akun Instagram/X aktif (minimal 3 karakter) untuk verifikasi pesanan.
				</p>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					placeholder="kamu@email.com"
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
				/>
				{#if data.emailEnabled}
					<p class="mt-1 text-xs text-neutral-500">
						Invoice PDF dan bukti pesanan otomatis dikirim ke email ini.
					</p>
				{:else}
					<p class="mt-1 text-xs text-neutral-500">
						Untuk identitas pemesan. Tautan & unduhan invoice langsung tersedia di halaman sukses setelah order dibuat.
					</p>
				{/if}
			</div>

			<div>
				<label for="note" class="block text-sm font-medium">Catatan (opsional)</label>
				<textarea
					id="note"
					name="note"
					rows="3"
					placeholder="Ukuran, warna, atau catatan lain"
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
				></textarea>
			</div>

			<div>
				<label for="address" class="block text-sm font-medium">Alamat</label>
				{#if shippingMethod === 'pickup' && data.pickupEnabled}
					<input type="hidden" name="address" value="Ambil Sendiri di Toko / Self-Pickup" />
					<div
						class="mt-1 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
					>
						Barang akan diambil langsung di toko. Alamat pengiriman kurir tidak diperlukan.
					</div>
				{:else}
					<textarea
						id="address"
						name="address"
						rows="3"
						required
						placeholder="Jalan, nomor rumah, patokan, kecamatan, kota, kode pos"
						disabled={isBusy}
						class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                  placeholder:text-neutral-400 disabled:opacity-50
                  dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
					></textarea>
					<p class="mt-1 text-xs text-neutral-500">
						Alamat lengkap beserta patokan rumah untuk kurir ekspedisi.
					</p>
				{/if}
			</div>

			<div>
				<label for="phone" class="block text-sm font-medium">Nomor WhatsApp</label>
				<input
					id="phone"
					name="phone"
					type="tel"
					required
					placeholder="08xx xxxx xxxx"
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                  placeholder:text-neutral-400 disabled:opacity-50
                  dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
				/>
				<p class="mt-1 text-xs text-neutral-500">
					Nomor WhatsApp aktif untuk konfirmasi ketersediaan barang dan info pengiriman.
				</p>
			</div>

			<button
				type="submit"
				disabled={isBusy}
				class="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white
               disabled:opacity-50 dark:bg-white dark:text-neutral-900"
			>
				{isBusy ? 'Membuat pesanan...' : 'Buat Pesanan'}
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

