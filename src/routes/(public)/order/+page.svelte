<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { untrack } from 'svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { resolve } from '$app/paths';
	import { formatRupiah } from '$lib/utils/currency';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// sinkronkan cart tersimpan dengan katalog terbaru sekali saat halaman dimuat
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

<div class="space-y-8 pb-32">
	<h1 class="text-xl font-semibold">Order</h1>

	{#if data.productCategories.length === 0}
		<p class="py-8 text-center text-sm text-neutral-500">
			Katalog belum tersedia. Coba lagi nanti.
		</p>
	{/if}

	{#each data.productCategories as category (category.id)}
		<section class="space-y-3">
			<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
				{category.name}
			</h2>

			<div class="grid gap-3 sm:grid-cols-2">
				{#each category.products as product (product.id)}
					{@const hasVariants = Boolean(product.variants && product.variants.length > 0)}
					{@const totalVariantStock = hasVariants
						? (product.variants ?? []).reduce((s, v) => s + v.stock, 0)
						: 0}
					{@const outOfStock = hasVariants
						? totalVariantStock <= 0
						: product.trackStock && product.stock <= 0}

					<div class="flex flex-col justify-between rounded-xl border border-neutral-200 p-4 transition-all hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700">
						<div>
							{#if product.imageUrls && product.imageUrls.length > 0}
								<a
									href={resolve('/(public)/order/products/[id]', { id: product.id })}
									class="mb-3 block overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
								>
									<div class="group relative block w-full overflow-hidden text-left">
										<img
											src={product.imageUrls[0]}
											alt={product.name}
											loading="lazy"
											decoding="async"
											class="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
										/>
										{#if product.imageUrls.length > 1}
											<span
												class="absolute right-2 bottom-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur"
											>
												+{product.imageUrls.length - 1} foto
											</span>
										{/if}
									</div>
								</a>
							{/if}

							<a
								href={resolve('/(public)/order/products/[id]', { id: product.id })}
								class="block font-medium hover:underline"
							>
								{product.name}
							</a>
							<p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
								{formatRupiah(product.priceInt)}
							</p>

							{#if product.description}
								<p class="mt-1 line-clamp-2 text-xs text-neutral-500">
									{product.description}
								</p>
							{/if}

							<div class="mt-2 flex items-center gap-2">
								{#if hasVariants}
									{#if totalVariantStock > 0}
										<span
											class="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
										>
											Tersedia {product.variants.length} Varian
										</span>
									{:else}
										<span
											class="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
										>
											Stok Habis
										</span>
									{/if}
								{:else if product.trackStock}
									{#if product.stock > 0}
										<span class="text-xs text-neutral-400">Stok: {product.stock}</span>
									{:else}
										<span
											class="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
										>
											Stok Habis
										</span>
									{/if}
								{/if}
							</div>
						</div>

						<div class="mt-4 pt-2">
							<a
								href={resolve('/(public)/order/products/[id]', { id: product.id })}
								class="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 py-2 text-xs font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800 {outOfStock
									? 'opacity-60'
									: ''}"
							>
								{outOfStock ? 'Lihat Produk (Habis)' : 'Lihat Detail Produk'}
							</a>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>

