<script lang="ts">
	import { resolve } from '$app/paths';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatRupiah } from '$lib/utils/currency';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft, Copy, Check, Plus, Minus, ShoppingBag, Image as ImageIcon } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const product = $derived(data.product);

	let activeImageIndex = $state(0);
	let selectedVariantId = $state<string | null>(null);
	let qty = $state(1);
	let copied = $state(false);

	const hasVariants = $derived(Boolean(product.variants && product.variants.length > 0));
	const selectedVariant = $derived(
		hasVariants && selectedVariantId
			? product.variants.find((v) => v.id === selectedVariantId) ?? null
			: null
	);

	// Tentukan stok efektif berdasarkan varian yang dipilih atau stok produk global
	const effectiveStock = $derived.by(() => {
		if (hasVariants) {
			if (!selectedVariant) return 0;
			return selectedVariant.stock;
		}
		if (product.trackStock) {
			return product.stock;
		}
		return 999;
	});

	const isOutOfStock = $derived.by(() => {
		if (hasVariants) {
			const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
			return totalStock <= 0;
		}
		return product.trackStock && product.stock <= 0;
	});

	// Auto-select varian pertama yang masih ada stok
	$effect(() => {
		if (hasVariants && selectedVariantId === null && product.variants.length > 0) {
			const availableVariant = product.variants.find((v) => v.stock > 0);
			if (availableVariant) {
				selectedVariantId = availableVariant.id;
			} else {
				selectedVariantId = product.variants[0].id;
			}
		}
	});

	// Reset Qty jika melebihi stok yang tersedia saat ganti varian
	$effect(() => {
		if (effectiveStock > 0 && qty > effectiveStock) {
			qty = effectiveStock;
		} else if (effectiveStock > 0 && qty < 1) {
			qty = 1;
		}
	});

	async function copyProductLink() {
		try {
			const shareText = `Yuk cek "${product.name}" (${formatRupiah(product.priceInt)}) di sini:\n${window.location.href}`;
			await navigator.clipboard.writeText(shareText);
			copied = true;
			toast.success('Link & info produk berhasil disalin!');
			setTimeout(() => {
				copied = false;
			}, 2500);
		} catch {
			toast.error('Gagal menyalin link.');
		}
	}

	function selectVariant(id: string) {
		if (selectedVariantId !== id) {
			selectedVariantId = id;
			qty = 1;
		}
	}

	function handleAddToCart() {
		if (hasVariants && !selectedVariant) {
			toast.error('Silakan pilih salah satu varian terlebih dahulu.');
			return;
		}

		if (effectiveStock <= 0) {
			toast.error('Maaf, stok untuk pilihan ini sedang habis.');
			return;
		}

		const parsedQty = Math.floor(Number(qty)) || 1;
		const finalQty = Math.max(1, Math.min(effectiveStock, parsedQty));

		cart.addItem(
			{
				productId: product.id,
				variantId: selectedVariant?.id ?? null,
				variantName: selectedVariant?.name ?? null,
				categoryId: product.categoryId,
				categoryName: product.category.name,
				name: product.name,
				price: product.priceInt
			},
			finalQty
		);

		const variantLabel = selectedVariant ? ` (${selectedVariant.name})` : '';
		toast.success(`${finalQty}x "${product.name}${variantLabel}" ditambahkan ke keranjang.`);
		qty = 1;
	}
</script>

<div class="mx-auto max-w-2xl space-y-6 pb-36">
	<!-- Top Navigation -->
	<div class="flex items-center justify-between">
		<a
			href={resolve('/(public)/order')}
			class="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
		>
			<ArrowLeft size={16} />
			Kembali ke Katalog
		</a>

		<button
			type="button"
			onclick={copyProductLink}
			class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
		>
			{#if copied}
				<Check size={14} class="text-emerald-600 dark:text-emerald-400" />
				<span class="text-emerald-600 dark:text-emerald-400">Tersalin</span>
			{:else}
				<Copy size={14} />
				<span>Salin Link</span>
			{/if}
		</button>
	</div>

	<!-- Galeri Multi-Foto -->
	{#if product.imageUrls && product.imageUrls.length > 0}
		<div class="space-y-3">
			<div
				class="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
			>
				<img
					src={product.imageUrls[activeImageIndex] ?? product.imageUrls[0]}
					alt={product.name}
					class="max-h-[460px] w-full object-contain"
				/>
			</div>

			{#if product.imageUrls.length > 1}
				<div class="flex justify-center gap-2 overflow-x-auto py-1">
					{#each product.imageUrls as imgUrl, idx (imgUrl)}
						<button
							type="button"
							onclick={() => (activeImageIndex = idx)}
							class="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all {activeImageIndex ===
							idx
								? 'border-neutral-900 dark:border-white'
								: 'border-transparent opacity-60 hover:opacity-100'}"
						>
							<img src={imgUrl} alt="Thumbnail {idx + 1}" class="h-full w-full object-cover" />
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="flex h-52 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"
		>
			<ImageIcon size={36} />
		</div>
	{/if}

	<!-- Header Informasi Produk -->
	<div class="space-y-2 border-b border-neutral-200 pb-5 dark:border-neutral-800">
		<span class="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
			{product.category.name}
		</span>
		<h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
			{product.name}
		</h1>
		<div class="flex items-baseline gap-3">
			<p class="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
				{formatRupiah(product.priceInt)}
			</p>
			{#if product.weightGrams > 0}
				<span class="text-xs text-neutral-500">
					· {product.weightGrams} gram
				</span>
			{/if}
		</div>

		<!-- Status Stok Global / Varian -->
		<div class="pt-1">
			{#if isOutOfStock}
				<span
					class="inline-block rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-400"
				>
					Stok Habis
				</span>
			{:else if hasVariants}
				<span
					class="inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
				>
					Tersedia {product.variants.length} Varian
				</span>
			{:else if product.trackStock}
				<span class="text-xs text-neutral-500">
					Sisa stok: <strong class="font-semibold text-neutral-800 dark:text-neutral-200">{product.stock}</strong>
				</span>
			{/if}
		</div>
	</div>

	<!-- Pilihan Varian (jika produk memiliki varian) -->
	{#if hasVariants}
		<div class="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
			<div class="flex items-center justify-between">
				<span class="text-sm font-semibold">Pilih Varian:</span>
				{#if selectedVariant}
					<span class="text-xs text-neutral-500">
						Stok varian ini: <strong class="font-medium text-neutral-800 dark:text-neutral-200">{selectedVariant.stock}</strong>
					</span>
				{/if}
			</div>

			<div class="flex flex-wrap gap-2">
				{#each product.variants as variant (variant.id)}
					{@const variantOutOfStock = variant.stock <= 0}
					<button
						type="button"
						disabled={variantOutOfStock}
						onclick={() => selectVariant(variant.id)}
						class="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all {selectedVariantId ===
						variant.id
							? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
							: variantOutOfStock
								? 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-600'
								: 'border-neutral-300 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800'}"
					>
						<span>{variant.name}</span>
						{#if variantOutOfStock}
							<span class="text-[10px] text-neutral-400">(Habis)</span>
						{:else}
							<span class="text-[10px] opacity-75">({variant.stock})</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Deskripsi Produk -->
	{#if product.description}
		<div class="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
			<h2 class="text-sm font-semibold tracking-wide text-neutral-700 uppercase dark:text-neutral-300">
				Deskripsi Produk
			</h2>
			<p class="text-sm leading-relaxed whitespace-pre-line text-neutral-600 dark:text-neutral-400">
				{product.description}
			</p>
		</div>
	{/if}

	<!-- Kontrol Jumlah & Tambah ke Keranjang -->
	<div class="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
		<div class="flex items-center justify-between">
			<span class="text-sm font-semibold">Jumlah Pesanan:</span>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => (qty = Math.max(1, qty - 1))}
					disabled={qty <= 1 || effectiveStock <= 0}
					class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 dark:border-neutral-700 dark:hover:bg-neutral-800"
				>
					<Minus size={14} />
				</button>
				<input
					type="number"
					min="1"
					max={effectiveStock > 0 ? effectiveStock : 1}
					bind:value={qty}
					onblur={() => {
						if (!qty || qty < 1) qty = 1;
						if (effectiveStock > 0 && qty > effectiveStock) qty = effectiveStock;
					}}
					disabled={effectiveStock <= 0}
					class="h-8 w-14 rounded-lg border border-neutral-300 bg-white text-center text-sm font-semibold text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white"
				/>
				<button
					type="button"
					onclick={() => (qty = Math.min(effectiveStock, qty + 1))}
					disabled={qty >= effectiveStock || effectiveStock <= 0}
					class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 dark:border-neutral-700 dark:hover:bg-neutral-800"
				>
					<Plus size={14} />
				</button>
			</div>
		</div>

		<button
			type="button"
			onclick={handleAddToCart}
			disabled={effectiveStock <= 0 || (hasVariants && !selectedVariant)}
			class="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
		>
			<ShoppingBag size={16} />
			<span>
				{effectiveStock <= 0
					? 'Stok Pilihan Ini Habis'
					: hasVariants && !selectedVariant
						? 'Pilih Varian Terlebih Dahulu'
						: '+ Tambah ke Keranjang'}
			</span>
		</button>
	</div>
</div>

