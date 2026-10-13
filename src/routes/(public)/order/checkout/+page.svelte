<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { cart, shippingLabel } from '$lib/stores/cart.svelte';
	import { waLink } from '$lib/utils/contact';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { toast } from 'svelte-sonner';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import { formatRupiah } from '$lib/utils/currency';
	import type { ResolvedPathname } from '$app/types';
	import { ShoppingBag } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let isBusy = $state(false);

	const itemsJson = $derived(
		JSON.stringify(cart.items.map((i) => ({ productId: i.productId, qty: i.qty })))
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

	// Pencarian eksplisit via tombol (bukan per huruf): tiap hit = 1 req kuota.
	async function doSearch() {
		const q = destQuery.trim();
		if (q.length < 3) {
			destResults = [];
			searchError = 'Ketik minimal 3 huruf dulu.';
			return;
		}
		if (searching) return;
		searching = true;
		searchError = '';
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
			{ name: string; price: number; trackStock: boolean; stock: number }
		>();

		for (const category of [...data.productCategories]) {
			for (const product of category.products) {
				catalogMap.set(product.id, {
					name: product.name,
					price: product.priceInt,
					trackStock: product.trackStock,
					stock: product.stock
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

			{#if searchError}
				<p class="mt-2 text-xs text-red-600 dark:text-red-400">{searchError}</p>
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
		</div>

		<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
			<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Ringkasan</h2>

			<ul class="mt-3 space-y-2">
				{#each cart.items as item (item.productId)}
					<li class="flex items-center justify-between text-sm">
						<span>
							{item.name}
							<span class="text-neutral-500"> × {item.qty}</span>
						</span>
						<span>{formatRupiah(item.price * item.qty)}</span>
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
				<input
					id="handle"
					name="handle"
					type="text"
					required
					placeholder="@namakamu"
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
				/>
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
