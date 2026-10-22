<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { untrack } from 'svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { resolve } from '$app/paths';
	import { formatRupiah } from '$lib/utils/currency';
	import { ArrowRight, PackageX, Layers, Search, X, Sparkles, Tag } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedCategoryId = $state<string | null>(null);

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
				if ('promos' in product && Array.isArray((product as any).promos)) {
					for (const promo of (product as any).promos) {
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
	<!-- Page Header / Scrapbook Title -->
	<header class="space-y-3">
		<div
			class="inline-block -rotate-2 rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya px-3.5 py-1.5 font-mono text-xs font-bold tracking-widest text-brandy uppercase shadow-[2px_2px_0px_#78290f] md:text-sm dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
		>
			KATALOG PRODUK
		</div>
		<h1
			class="font-serif text-3xl font-bold tracking-normal text-ink md:text-4xl dark:text-papaya"
		>
			Pilih Pesanan Anda
		</h1>
		<p class="font-handwriting text-2xl font-semibold leading-snug text-teal md:text-3xl dark:text-papaya/90">
			Pilih barang favoritmu, tambahkan ke keranjang, dan dapatkan invoice instan.
		</p>
	</header>

	<!-- Filter & Search Controls -->
	{#if data.productCategories.length > 0}
		<div class="space-y-4">
			<!-- Instant Search Bar -->
			<div class="relative mx-auto max-w-md">
				<Search
					size={16}
					strokeWidth={2.5}
					class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brandy/60 dark:text-papaya/60"
				/>
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Cari nama produk..."
					class="w-full rounded-[8px_3px_7px_2px] border-2 border-brandy bg-white py-2.5 pr-9 pl-10 text-sm text-ink shadow-[2px_2px_0px_#78290f] placeholder:text-brandy/40 focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)] dark:placeholder:text-papaya/40"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => (searchQuery = '')}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-brandy/60 hover:text-crimson dark:text-papaya/60"
						aria-label="Bersihkan pencarian"
					>
						<X size={15} strokeWidth={2.5} />
					</button>
				{/if}
			</div>

			<!-- Category Pills (Washi Index Tabs) -->
			<div class="flex items-center justify-start gap-2.5 overflow-x-auto pt-1 pb-1 sm:justify-center">
				<button
					type="button"
					onclick={() => (selectedCategoryId = null)}
					class="shrink-0 -rotate-1 rounded-[6px_2px_5px_1px] border-2 px-3.5 py-1.5 font-mono text-xs font-bold transition-all duration-150 hover:rotate-0 {selectedCategoryId ===
					null
						? 'border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f] -translate-y-0.5'
						: 'border-brandy/40 bg-papaya text-ink hover:border-brandy hover:bg-brandy/10 dark:border-papaya/30 dark:bg-ink dark:text-papaya'}"
				>
					Semua ({data.productCategories.reduce((s, c) => s + c.products.length, 0)})
				</button>
				{#each data.productCategories as cat, catIdx (cat.id)}
					{@const active = selectedCategoryId === cat.id}
					{@const pillTilt = catIdx % 2 === 0 ? 'rotate-1' : '-rotate-1'}
					<button
						type="button"
						onclick={() => (selectedCategoryId = active ? null : cat.id)}
						class="shrink-0 rounded-[6px_2px_5px_1px] border-2 px-3.5 py-1.5 font-mono text-xs font-bold transition-all duration-150 hover:rotate-0 {pillTilt} {active
							? 'border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f] -translate-y-0.5'
							: 'border-brandy/40 bg-papaya text-ink hover:border-brandy hover:bg-brandy/10 dark:border-papaya/30 dark:bg-ink dark:text-papaya'}"
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
			class="mx-auto max-w-md -rotate-1 rounded-[16px_8px_14px_6px] border-2 border-dashed border-brandy/40 bg-papaya/40 p-8 text-center shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/40 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
		>
			<div
				class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-brandy bg-tangerine/20 text-brandy dark:border-papaya/40 dark:text-papaya"
			>
				<PackageX size={24} strokeWidth={2.5} />
			</div>
			<p class="font-serif text-lg font-bold text-ink dark:text-papaya">
				Katalog Belum Tersedia
			</p>
			<p class="mt-1 text-sm text-brandy/80 dark:text-papaya/70">
				Katalog produk sedang dipersiapkan. Silakan kunjungi kembali beberapa saat lagi.
			</p>
		</div>
	{:else if filteredCategories.length === 0}
		<div
			class="mx-auto max-w-md -rotate-1 rounded-[16px_8px_14px_6px] border-2 border-dashed border-brandy/40 bg-papaya/40 p-8 text-center shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/40 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
		>
			<div
				class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-brandy bg-tangerine/20 text-brandy dark:border-papaya/40 dark:text-papaya"
			>
				<PackageX size={24} strokeWidth={2.5} />
			</div>
			<p class="font-serif text-lg font-bold text-ink dark:text-papaya">
				Produk Tidak Ditemukan
			</p>
			<p class="mt-1 text-sm text-brandy/80 dark:text-papaya/70">
				Tidak ada produk yang cocok dengan kata kunci pencarian atau filter kategori saat ini.
			</p>
			<div class="mt-4">
				<button
					type="button"
					onclick={() => {
						searchQuery = '';
						selectedCategoryId = null;
					}}
					class="rounded-[6px_2px_5px_1px] border-2 border-brandy bg-tangerine px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#78290f] transition-all hover:bg-[#e06d00] active:translate-y-0.5 active:shadow-none"
				>
					Reset Filter & Pencarian
				</button>
			</div>
		</div>
	{/if}

	{#each filteredCategories as category, categoryIdx (category.id)}
		<section class="space-y-4">
			<!-- Category Divider / Washi Index -->
			<div class="flex items-center gap-3">
				<div
					class="flex items-center gap-2 rounded-[8px_3px_6px_2px] border-2 border-brandy bg-papaya px-3 py-1 shadow-[2px_2px_0px_#78290f] dark:border-papaya/40 dark:bg-ink dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
				>
					<span class="font-mono text-xs font-bold text-tangerine"
						>#{String(categoryIdx + 1).padStart(2, '0')}</span
					>
					<h2 class="font-serif text-lg font-bold text-ink dark:text-papaya">
						{category.name}
					</h2>
				</div>
				<div
					class="h-0.5 flex-1 border-t-[3px] border-dashed border-brandy/50 dark:border-papaya/45"
				></div>
			</div>

			<div class="grid gap-7 sm:gap-8 sm:grid-cols-2">
				{#each category.products as product, productIdx (product.id)}
					{@const hasVariants = Boolean(product.variants && product.variants.length > 0)}
					{@const totalVariantStock = hasVariants
						? (product.variants ?? []).reduce((s, v) => s + v.stock, 0)
						: 0}
					{@const outOfStock = hasVariants
						? totalVariantStock <= 0
						: product.trackStock && product.stock <= 0}
					<!-- Micro-tilt berseling 1.2deg yang melurus saat hover -->
					{@const tiltClass = productIdx % 2 === 0 ? '-rotate-[1.2deg]' : 'rotate-[1.2deg]'}

					<div
						class="group relative flex flex-col justify-between rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/50 p-4.5 shadow-[4px_4px_0px_#78290f] transition-all duration-200 transform-gpu backface-hidden hover:-translate-y-1 hover:rotate-0 hover:shadow-[6px_6px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)] dark:hover:shadow-[6px_6px_0px_rgba(255,236,209,0.3)] {tiltClass}"
					>
						<div>
							{#if product.imageUrls && product.imageUrls.length > 0}
								<a
									href={resolve('/(public)/order/products/[id]', { id: product.id })}
									class="relative mb-3.5 block overflow-hidden rounded-[10px_5px_8px_4px] border-2 border-brandy/40 bg-papaya/80 shadow-[2px_2px_0px_#78290f] transition-transform duration-200 group-hover:scale-[1.01] dark:border-papaya/30 dark:bg-ink/80"
								>
									<!-- Washi tape corner sticker accent -->
									<div
										class="absolute -top-1 left-4 z-10 h-3 w-7 -rotate-6 border border-brandy/30 bg-yellow-200/85 backdrop-blur-xs"
									></div>

									<div class="relative block w-full overflow-hidden text-left">
										<img
											src={product.imageUrls[0]}
											alt={product.name}
											loading="lazy"
											decoding="async"
											class="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
										/>
										{#if product.imageUrls.length > 1}
											<span
												class="absolute right-2 bottom-2 rounded-[5px_2px_4px_2px] border border-brandy/40 bg-ink/85 px-2 py-0.5 font-mono text-[10px] font-bold text-papaya shadow-[1px_1px_0px_#78290f] backdrop-blur-xs"
											>
												+{product.imageUrls.length - 1} foto
											</span>
										{/if}
									</div>
								</a>
							{/if}

							<div class="flex items-start justify-between gap-2">
								<a
									href={resolve('/(public)/order/products/[id]', { id: product.id })}
									class="font-serif text-lg font-bold text-ink transition-colors hover:text-tangerine dark:text-papaya dark:hover:text-tangerine"
								>
									{product.name}
								</a>
							</div>

							<p class="mt-1 font-mono text-base font-bold text-teal dark:text-teal/90">
								{formatRupiah(product.priceInt)}
							</p>

							{#if 'promos' in product && Array.isArray((product as any).promos) && (product as any).promos.length > 0}
								{@const activePromo = (product as any).promos[0]}
								<div class="mt-2 inline-flex items-center gap-1.5 rounded-[6px_2px_5px_1px] border border-tangerine/60 bg-tangerine/15 px-2.5 py-1 text-xs font-bold text-brandy shadow-[1px_1px_0px_#78290f] dark:border-tangerine/40 dark:bg-tangerine/20 dark:text-papaya">
									<Sparkles size={13} strokeWidth={2.5} class="shrink-0 text-tangerine" />
									<span>Beli ≥{activePromo.minQty} Diskon {formatRupiah(activePromo.discountAmount)}</span>
								</div>
							{/if}

							{#if product.description}
								<p
									class="mt-2 line-clamp-2 text-xs leading-relaxed text-brandy/80 dark:text-papaya/70"
								>
									{product.description}
								</p>
							{/if}

							<div class="mt-3 flex flex-wrap items-center gap-2">
								{#if hasVariants}
									{#if totalVariantStock > 0}
										<span
											class="inline-flex items-center gap-1 rounded-[6px_2px_5px_1px] border border-forest/30 bg-forest/15 px-2 py-0.5 font-mono text-[11px] font-bold text-forest"
										>
											<Layers size={12} strokeWidth={2.5} />
											<span>{product.variants.length} Varian</span>
										</span>
									{:else}
										<span
											class="rounded-[6px_2px_5px_1px] border border-crimson/30 bg-crimson/15 px-2 py-0.5 font-mono text-[11px] font-bold text-crimson"
										>
											Stok Habis
										</span>
									{/if}
								{:else if product.trackStock}
									{#if product.stock > 0}
										<span
											class="rounded-[6px_2px_5px_1px] border border-brandy/20 bg-papaya px-2 py-0.5 font-mono text-[11px] font-medium text-brandy/80 dark:border-papaya/20 dark:bg-ink dark:text-papaya/80"
										>
											Stok: {product.stock}
										</span>
									{:else}
										<span
											class="rounded-[6px_2px_5px_1px] border border-crimson/30 bg-crimson/15 px-2 py-0.5 font-mono text-[11px] font-bold text-crimson"
										>
											Stok Habis
										</span>
									{/if}
								{/if}
							</div>
						</div>

						<div
							class="mt-4 border-t border-dashed border-brandy/20 pt-3 dark:border-papaya/20"
						>
							<a
								href={resolve('/(public)/order/products/[id]', { id: product.id })}
								class="inline-flex w-full items-center justify-center gap-2 rounded-[8px_4px_7px_3px] border-2 border-brandy px-4 py-2.5 text-xs font-bold transition-all duration-150 {outOfStock
									? 'border-brandy/30 bg-brandy/5 text-brandy/50 opacity-60 dark:border-papaya/20 dark:text-papaya/40'
									: 'bg-tangerine text-white shadow-[3px_3px_0px_#78290f] hover:bg-[#e06d00] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none'}"
							>
								<span
									>{outOfStock ? 'Lihat Produk (Habis)' : 'Lihat Detail Produk'}</span
								>
								<ArrowRight size={14} strokeWidth={2.5} />
							</a>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>

