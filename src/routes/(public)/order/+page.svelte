<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { untrack } from 'svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { resolve } from '$app/paths';
	import { formatRupiah } from '$lib/utils/currency';
	import {
		ArrowRight,
		ArrowUp,
		PackageX,
		Layers,
		Search,
		X,
		ChevronDown,
		ChevronUp,
		Eye
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	interface PromoItem {
		name: string;
		minQty: number;
		discountAmount: number;
	}

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedCategoryId = $state<string | null>(null);
	let showBackToTop = $state(false);

	const INITIAL_CATEGORY_LIMIT = 6;
	const expandedCategories = new SvelteSet<string>();

	function toggleCategoryExpand(categoryId: string) {
		if (expandedCategories.has(categoryId)) {
			expandedCategories.delete(categoryId);
		} else {
			expandedCategories.add(categoryId);
		}
	}

	function handleScroll() {
		if (typeof window !== 'undefined') {
			showBackToTop = window.scrollY > 400;
		}
	}

	function scrollToTop() {
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	// Sinkronkan cart tersimpan dengan katalog terbaru sekali saat halaman dimuat
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
		});
	});

	// Filter reaktif sisi klien untuk Kategori dan Pencarian Teks
	const filteredCategories = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();

		return data.productCategories
			.filter((category) => {
				if (selectedCategoryId !== null && category.id !== selectedCategoryId) {
					return false;
				}
				return true;
			})
			.map((category) => {
				if (!q) return category;
				const matchingProducts = category.products.filter((p) => {
					return (
						p.name.toLowerCase().includes(q) ||
						(p.description && p.description.toLowerCase().includes(q))
					);
				});
				return {
					...category,
					products: matchingProducts
				};
			})
			.filter((category) => category.products.length > 0);
	});
</script>

<div class="space-y-10 pb-32">
	<!-- Page Header: Warm Monoline Stamp & Fraunces Editorial -->
	<header class="space-y-3">
		<div
			class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#a2e1db] px-5 py-2 font-mono text-sm font-black tracking-widest text-[#262626] uppercase shadow-[3px_3px_0px_#262626] sm:text-base dark:border-[#a2e1db] dark:bg-[#1a1825] dark:text-[#a2e1db] dark:shadow-[3px_3px_0px_#b4a6d5]"
		>
			<span class="h-2.5 w-2.5 rounded-full border border-[#262626] bg-white"></span>
			<span>KATALOG PRODUK</span>
		</div>
		<h1
			class="font-serif text-3xl font-bold tracking-normal text-[#262626] md:text-4xl dark:text-[#f2efe9]"
		>
			Pilih Pesanan Anda
		</h1>
		<p class="font-sans text-sm text-[#404040] md:text-base dark:text-[#b8b5ad]">
			Pilih barang favoritmu, tambahkan ke keranjang, dan dapatkan invoice instan.
		</p>
	</header>

	<!-- Filter & Search Controls: Warm Monoline Controls -->
	{#if data.productCategories.length > 0}
		<div class="space-y-4">
			<!-- Instant Search Bar -->
			<div class="relative mx-auto max-w-md">
				<Search
					size={16}
					strokeWidth={2.5}
					class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#404040] dark:text-[#b8b5ad]"
				/>
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Cari nama produk..."
					class="w-full rounded-lg border-2 border-[#262626] bg-white py-2.5 pr-9 pl-10 font-sans text-sm text-[#262626] shadow-[2px_2px_0px_#262626] placeholder:text-[#404040]/50 focus:border-[#262626] focus:ring-0 focus:outline-none dark:border-[#a2e1db] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#b4a6d5] dark:placeholder:text-[#b8b5ad]/50"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => (searchQuery = '')}
						class="absolute top-1/2 right-3 -translate-y-1/2 text-[#404040] hover:text-[#991b1b] dark:text-[#b8b5ad]"
						aria-label="Bersihkan pencarian"
					>
						<X size={15} strokeWidth={2.5} />
					</button>
				{/if}
			</div>

			<!-- Category Filter: Mobile Dropdown Selector & Desktop Horizontal Pills -->
			<div class="block sm:hidden">
				<div class="relative">
					<select
						bind:value={selectedCategoryId}
						class="w-full appearance-none rounded-lg border-2 border-[#262626] bg-white px-4 py-2.5 pr-10 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] focus:border-[#262626] focus:outline-none dark:border-[#a2e1db] dark:bg-[#252331] dark:text-[#f2efe9]"
					>
						<option value={null}>
							Semua Kategori ({data.productCategories.reduce((s, c) => s + c.products.length, 0)})
						</option>
						{#each data.productCategories as cat (cat.id)}
							<option value={cat.id}>{cat.name} ({cat.products.length})</option>
						{/each}
					</select>
					<ChevronDown
						size={16}
						strokeWidth={2.5}
						class="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[#262626] dark:text-[#f2efe9]"
					/>
				</div>
			</div>

			<div
				class="hidden pt-1 pb-1 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-2.5"
			>
				<button
					type="button"
					onclick={() => (selectedCategoryId = null)}
					class="shrink-0 rounded-lg border-2 px-3.5 py-1.5 font-mono text-xs font-bold transition-all duration-150 {selectedCategoryId ===
					null
						? '-translate-y-0.5 border-[#262626] bg-[#fea770] text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626]'
						: 'border-[#262626]/20 bg-white text-[#404040] hover:border-[#262626] hover:bg-[#f2efe9] dark:border-[#f2efe9]/20 dark:bg-[#252331] dark:text-[#b8b5ad] dark:hover:bg-[#1a1825]'}"
				>
					Semua ({data.productCategories.reduce((s, c) => s + c.products.length, 0)})
				</button>
				{#each data.productCategories as cat (cat.id)}
					{@const active = selectedCategoryId === cat.id}
					<button
						type="button"
						onclick={() => (selectedCategoryId = active ? null : cat.id)}
						class="shrink-0 rounded-lg border-2 px-3.5 py-1.5 font-mono text-xs font-bold transition-all duration-150 {active
							? '-translate-y-0.5 border-[#262626] bg-[#fea770] text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626]'
							: 'border-[#262626]/20 bg-white text-[#404040] hover:border-[#262626] hover:bg-[#f2efe9] dark:border-[#f2efe9]/20 dark:bg-[#252331] dark:text-[#b8b5ad] dark:hover:bg-[#1a1825]'}"
					>
						{cat.name} ({cat.products.length})
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Empty State: Katalog Kosong atau Filter Tidak Cocok -->
	{#if data.productCategories.length === 0}
		<div
			class="mx-auto max-w-md rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-8 text-center shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<div
				class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#262626] bg-[#fea770]/20 text-[#262626] dark:border-[#a2e1db] dark:text-[#f2efe9]"
			>
				<PackageX size={24} strokeWidth={2.5} />
			</div>
			<p class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
				Katalog Belum Tersedia
			</p>
			<p class="mt-1 text-sm text-[#404040] dark:text-[#b8b5ad]">
				Katalog produk sedang dipersiapkan. Silakan kunjungi kembali beberapa saat lagi.
			</p>
		</div>
	{:else if filteredCategories.length === 0}
		<div
			class="mx-auto max-w-md rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-8 text-center shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<div
				class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#262626] bg-[#fea770]/20 text-[#262626] dark:border-[#a2e1db] dark:text-[#f2efe9]"
			>
				<PackageX size={24} strokeWidth={2.5} />
			</div>
			<p class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
				Produk Tidak Ditemukan
			</p>
			<p class="mt-1 text-sm text-[#404040] dark:text-[#b8b5ad]">
				Tidak ada produk yang cocok dengan kata kunci pencarian atau filter kategori saat ini.
			</p>
			<div class="mt-4">
				<button
					type="button"
					onclick={() => {
						searchQuery = '';
						selectedCategoryId = null;
					}}
					class="rounded-md border-2 border-[#262626] bg-[#fea770] px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626]"
				>
					Reset Filter & Pencarian
				</button>
			</div>
		</div>
	{/if}

	{#each filteredCategories as category, categoryIdx (category.id)}
		{@const isSearching = searchQuery.trim().length > 0}
		{@const isExpanded = expandedCategories.has(category.id)}
		{@const visibleProducts =
			isSearching || isExpanded
				? category.products
				: category.products.slice(0, INITIAL_CATEGORY_LIMIT)}
		{@const hasMore = !isSearching && category.products.length > INITIAL_CATEGORY_LIMIT}

		<section class="space-y-4">
			<!-- Category Divider Monoline Index -->
			<div class="flex items-center gap-3">
				<div
					class="flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[2px_2px_0px_#b4a6d5]"
				>
					<span class="font-mono text-xs font-bold text-[#d9532f] dark:text-[#fea770]">
						#{String(categoryIdx + 1).padStart(2, '0')}
					</span>
					<h2 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
						{category.name}
					</h2>
					<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
						({category.products.length})
					</span>
				</div>
				<div class="h-px flex-1 bg-[#262626]/20 dark:bg-[#f2efe9]/20"></div>
			</div>

			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each visibleProducts as product (product.id)}
					{@const hasVariants = Boolean(product.variants && product.variants.length > 0)}
					{@const totalVariantStock = hasVariants
						? (product.variants ?? []).reduce((s, v) => s + v.stock, 0)
						: 0}
					{@const outOfStock = hasVariants
						? totalVariantStock <= 0
						: product.trackStock && product.stock <= 0}
					{@const pPromos = (product as typeof product & { promos?: PromoItem[] }).promos}
					{@const activePromo = Array.isArray(pPromos) && pPromos.length > 0 ? pPromos[0] : null}

					<a
						href={resolve('/(public)/order/products/[id]', { id: product.id })}
						class="group relative flex flex-col justify-between rounded-xl border-2 border-[#262626] bg-white p-4.5 shadow-[3px_3px_0px_#262626] transition-all duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0px_#262626] dark:border-[#a2e1db]/40 dark:bg-[#252331] dark:shadow-[3px_3px_0px_#b4a6d5] dark:hover:shadow-[5px_5px_0px_#b4a6d5]"
					>
						<!-- Hanging Price Tag Promo (Pojok Kiri Atas Luar Card) -->
						{#if activePromo}
							<div
								class="absolute -top-3.5 -left-2.5 z-20 -rotate-3 transition-transform duration-200 group-hover:rotate-0"
							>
								<div
									class="relative flex items-center gap-1.5 rounded-l-[4px] rounded-r-md border-[1.5px] border-[#262626] bg-[#fea770] py-1.5 pr-3 pl-2 shadow-[2px_2px_0px_#262626] dark:border-[#1a1825]"
								>
									<span
										class="h-2 w-2 shrink-0 rounded-full border border-[#262626] bg-white shadow-inner"
										aria-hidden="true"
									></span>
									<span
										class="font-mono text-xs font-black tracking-wider text-[#262626] uppercase"
									>
										Diskon {formatRupiah(activePromo.discountAmount)}
									</span>
								</div>
							</div>
						{/if}

						<div>
							<!-- Photo Container -->
							{#if product.imageUrls && product.imageUrls.length > 0}
								<div
									class="relative mb-3.5 block overflow-hidden rounded-lg border border-[#262626]/20 bg-[#f2efe9] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
								>
									<img
										src={product.imageUrls[0]}
										alt={product.name}
										loading="lazy"
										decoding="async"
										class="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									{#if product.imageUrls.length > 1}
										<span
											class="absolute right-2 bottom-2 rounded-md border border-[#262626] bg-white/90 px-2 py-0.5 font-mono text-xs font-bold text-[#262626] backdrop-blur-xs dark:border-[#f2efe9]/40 dark:bg-[#252331]/90 dark:text-[#f2efe9]"
										>
											+{product.imageUrls.length - 1} foto
										</span>
									{/if}
								</div>
							{/if}

							<h3
								class="font-serif text-lg font-bold text-[#262626] transition-colors group-hover:text-[#fea770] dark:text-[#f2efe9] dark:group-hover:text-[#fea770]"
							>
								{product.name}
							</h3>

							<p class="mt-1 font-mono text-base font-bold text-[#262626] dark:text-[#a2e1db]">
								{formatRupiah(product.priceInt)}
							</p>

							{#if activePromo}
								<p class="mt-1 text-xs font-bold text-[#d9532f] dark:text-[#fea770]">
									Beli min. {activePromo.minQty} pcs diskon {formatRupiah(
										activePromo.discountAmount
									)}
								</p>
							{/if}

							{#if product.description}
								<p
									class="mt-2 line-clamp-2 text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]"
								>
									{product.description}
								</p>
							{/if}

							<div class="mt-3 flex flex-wrap items-center gap-2">
								{#if hasVariants}
									{#if totalVariantStock > 0}
										<span
											class="inline-flex items-center gap-1 rounded-full border border-[#262626] bg-[#b4a6d5]/30 px-2.5 py-0.5 font-mono text-xs font-bold text-[#262626] dark:border-[#a2e1db]/40 dark:bg-[#b4a6d5]/20 dark:text-[#f2efe9]"
										>
											<Layers size={12} strokeWidth={2.5} />
											<span>{product.variants.length} Varian</span>
										</span>
									{:else}
										<span
											class="rounded-full border border-[#991b1b] bg-[#fee2e2] px-2.5 py-0.5 font-mono text-xs font-bold text-[#991b1b]"
										>
											Stok Habis
										</span>
									{/if}
								{:else if product.trackStock}
									{#if product.stock > 0}
										<span
											class="rounded-full border border-[#262626] bg-[#a2e1db] px-2.5 py-0.5 font-mono text-xs font-bold text-[#262626] dark:border-[#1a1825] dark:bg-[#a2e1db] dark:text-[#1a1825]"
										>
											Stok: {product.stock}
										</span>
									{:else}
										<span
											class="rounded-full border border-[#991b1b] bg-[#fee2e2] px-2.5 py-0.5 font-mono text-xs font-bold text-[#991b1b]"
										>
											Stok Habis
										</span>
									{/if}
								{/if}
							</div>
						</div>

						<!-- Card Footer: Rolling Action Container Persis CardsLab -->
						<div class="mt-4 border-t border-[#262626]/15 pt-3 dark:border-[#f2efe9]/15">
							<div
								class="relative h-10 w-full overflow-hidden rounded-md border-[1.5px] border-[#262626] bg-white transition-all duration-300 dark:border-[#f2efe9]/30 dark:bg-[#252331]"
							>
								<!-- Desktop State Awal: "Detail Produk" dengan icon Eye -->
								<div
									class="hidden h-full w-full items-center justify-center gap-2 px-3 text-xs font-bold text-[#262626] transition-transform duration-300 ease-out group-hover:-translate-y-full sm:flex dark:text-[#f2efe9]"
								>
									<Eye size={15} class="text-[#262626] dark:text-[#f2efe9]" />
									<span>{outOfStock ? 'Lihat Produk (Habis)' : 'Detail Produk'}</span>
								</div>

								<!-- Desktop Hover & Mobile Permanen: Bar hitam arang pekat -->
								<div
									class="flex h-full w-full items-center justify-center gap-2 bg-[#262626] px-3 text-xs font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-transform duration-300 ease-out sm:absolute sm:inset-0 sm:translate-y-full sm:group-hover:translate-y-0 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9]"
								>
									<span>{outOfStock ? 'Lihat Produk (Habis)' : 'Detail Produk'}</span>
									<ArrowRight
										size={14}
										class="transition-transform duration-200 group-hover:translate-x-0.5"
									/>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>

			{#if hasMore}
				<div class="pt-2 text-center">
					<button
						type="button"
						onclick={() => toggleCategoryExpand(category.id)}
						class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-white px-5 py-2.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#fea770] hover:text-[#262626] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#b4a6d5] dark:hover:bg-[#fea770] dark:hover:text-[#262626]"
					>
						{#if isExpanded}
							<ChevronUp size={15} strokeWidth={2.5} />
							<span>Ciutkan Katalog {category.name}</span>
						{:else}
							<ChevronDown size={15} strokeWidth={2.5} />
							<span>Lihat Semua ({category.products.length} Produk)</span>
						{/if}
					</button>
				</div>
			{/if}
		</section>
	{/each}

	<!-- Floating Back to Top Button: Warm Monoline Stamp -->
	{#if showBackToTop}
		<button
			type="button"
			onclick={scrollToTop}
			class="fixed right-5 bottom-24 z-30 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#262626] bg-[#fea770] text-[#262626] shadow-[3px_3px_0px_#262626] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#262626] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[3px_3px_0px_#b4a6d5]"
			aria-label="Kembali ke atas halaman"
		>
			<ArrowUp size={18} strokeWidth={2.5} />
		</button>
	{/if}
</div>

<svelte:window onscroll={handleScroll} />
