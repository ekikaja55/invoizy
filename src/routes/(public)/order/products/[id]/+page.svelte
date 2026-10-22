<script lang="ts">
	import { resolve } from '$app/paths';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatRupiah } from '$lib/utils/currency';
	import { toast } from 'svelte-sonner';
	import {
		ArrowLeft,
		Copy,
		Check,
		Plus,
		Minus,
		ShoppingBag,
		Image as ImageIcon,
		Layers,
		Sparkles
	} from '@lucide/svelte';
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
			class="inline-flex items-center gap-1.5 rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya px-3 py-1.5 font-mono text-xs font-bold text-brandy shadow-[2px_2px_0px_#78290f] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
		>
			<ArrowLeft size={14} strokeWidth={2.5} />
			<span>Kembali ke Katalog</span>
		</a>

		<button
			type="button"
			onclick={copyProductLink}
			class="inline-flex items-center gap-1.5 rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya px-3 py-1.5 font-mono text-xs font-bold text-brandy shadow-[2px_2px_0px_#78290f] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
		>
			{#if copied}
				<Check size={14} strokeWidth={2.75} class="text-forest" />
				<span class="text-forest">Tersalin</span>
			{:else}
				<Copy size={14} strokeWidth={2.5} />
				<span>Salin Link</span>
			{/if}
		</button>
	</div>

	<!-- Galeri Multi-Foto -->
	{#if product.imageUrls && product.imageUrls.length > 0}
		<div class="space-y-3">
			<div
				class="relative overflow-hidden rounded-[16px_8px_14px_6px] border-2 border-brandy bg-papaya/70 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/70 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
			>
				<img
					src={product.imageUrls[activeImageIndex] ?? product.imageUrls[0]}
					alt={product.name}
					class="max-h-[460px] w-full object-contain"
				/>
			</div>

			{#if product.imageUrls.length > 1}
				<div class="flex justify-center gap-2.5 overflow-x-auto py-1">
					{#each product.imageUrls as imgUrl, idx (imgUrl)}
						<button
							type="button"
							onclick={() => (activeImageIndex = idx)}
							class="h-16 w-16 shrink-0 overflow-hidden rounded-[8px_4px_7px_3px] border-2 transition-all duration-150 {activeImageIndex ===
							idx
								? 'border-brandy ring-2 ring-tangerine shadow-[2px_2px_0px_#78290f] -translate-y-0.5 dark:border-papaya dark:ring-tangerine'
								: 'border-brandy/30 opacity-60 hover:opacity-100 hover:border-brandy dark:border-papaya/30'}"
						>
							<img src={imgUrl} alt="Thumbnail {idx + 1}" class="h-full w-full object-cover" />
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="flex h-52 flex-col items-center justify-center gap-2 rounded-[16px_8px_14px_6px] border-2 border-dashed border-brandy/40 bg-papaya/40 text-brandy/60 shadow-[3px_3px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/40 dark:text-papaya/60 dark:shadow-[3px_3px_0px_rgba(255,236,209,0.15)]"
		>
			<ImageIcon size={36} strokeWidth={2} />
			<span class="font-handwriting text-xl font-semibold text-brandy/70 dark:text-papaya/70">Belum ada foto produk</span>
		</div>
	{/if}

	<!-- Header Informasi Produk -->
	<div
		class="space-y-3 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/50 p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
	>
		<div class="flex items-center gap-2">
			<span
				class="rounded-[5px_2px_4px_2px] border border-brandy/30 bg-brandy/10 px-2 py-0.5 font-mono text-[11px] font-bold text-brandy uppercase dark:border-papaya/30 dark:bg-papaya/10 dark:text-papaya"
			>
				{product.category.name}
			</span>
		</div>

		<h1
			class="font-serif text-2xl font-bold tracking-normal text-ink md:text-3xl dark:text-papaya"
		>
			{product.name}
		</h1>

		<div class="flex items-baseline gap-3">
			<p class="font-mono text-2xl font-bold text-teal md:text-3xl dark:text-teal/90">
				{formatRupiah(product.priceInt)}
			</p>
			{#if product.weightGrams > 0}
				<span class="font-mono text-xs font-medium text-brandy/70 dark:text-papaya/70">
					· {product.weightGrams} gram
				</span>
			{/if}
		</div>

		<!-- Status Stok Global / Varian -->
		<div class="pt-1">
			{#if isOutOfStock}
				<span
					class="inline-block rounded-[6px_2px_5px_1px] border border-crimson/30 bg-crimson/15 px-2.5 py-1 font-mono text-xs font-bold text-crimson"
				>
					Stok Habis
				</span>
			{:else if hasVariants}
				<span
					class="inline-flex items-center gap-1.5 rounded-[6px_2px_5px_1px] border border-forest/30 bg-forest/15 px-2.5 py-1 font-mono text-xs font-bold text-forest"
				>
					<Layers size={13} strokeWidth={2.5} />
					<span>Tersedia {product.variants.length} Varian</span>
				</span>
			{:else if product.trackStock}
				<span class="font-mono text-xs text-brandy/80 dark:text-papaya/80">
					Sisa stok: <strong class="font-bold text-ink dark:text-papaya">{product.stock}</strong>
				</span>
			{/if}
		</div>

		<!-- Banner Promo Kuantitas Produk -->
		{#if product.promos && product.promos.length > 0}
			{@const p = product.promos[0]}
			<div
				class="mt-3 flex items-start gap-2.5 rounded-[10px_4px_8px_3px] border-2 border-dashed border-tangerine bg-tangerine/15 p-3.5 text-xs shadow-[2px_2px_0px_#78290f] dark:bg-tangerine/20"
			>
				<Sparkles size={20} strokeWidth={2.5} class="mt-0.5 shrink-0 text-tangerine animate-pulse" />
				<div class="space-y-1">
					<p class="font-serif text-sm font-bold text-ink dark:text-papaya">
						Spesial Promo: {p.name}
					</p>
					<p class="font-mono text-xs text-brandy dark:text-papaya/90">
						Beli minimal <strong>{p.minQty} pcs</strong> (bebas campur desain varian), otomatis hemat <strong>{formatRupiah(p.discountAmount)}</strong>! Diskon berlaku kelipatan saat checkout.
					</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Pilihan Varian (jika produk memiliki varian) -->
	{#if hasVariants}
		<div
			class="space-y-3 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/50 p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
		>
			<div class="flex items-center justify-between">
				<span class="font-serif text-sm font-bold text-ink dark:text-papaya">Pilih Varian:</span>
				{#if selectedVariant}
					<span class="font-mono text-xs text-brandy/70 dark:text-papaya/70">
						Stok varian ini: <strong class="font-bold text-teal">{selectedVariant.stock}</strong>
					</span>
				{/if}
			</div>

			<div class="flex flex-wrap gap-2.5">
				{#each product.variants as variant (variant.id)}
					{@const variantOutOfStock = variant.stock <= 0}
					<button
						type="button"
						disabled={variantOutOfStock}
						onclick={() => selectVariant(variant.id)}
						class="flex items-center gap-1.5 rounded-[8px_3px_7px_2px] border-2 px-3.5 py-2 font-mono text-xs font-bold transition-all duration-150 {selectedVariantId ===
						variant.id
							? 'border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f] -translate-y-0.5'
							: variantOutOfStock
								? 'cursor-not-allowed border-brandy/20 bg-brandy/5 text-brandy/40 opacity-50 line-through dark:border-papaya/20 dark:text-papaya/40'
								: 'border-brandy/50 bg-papaya text-ink shadow-[1px_1px_0px_#78290f] hover:border-brandy hover:bg-brandy/10 dark:border-papaya/30 dark:bg-ink dark:text-papaya'}"
					>
						<span>{variant.name}</span>
						{#if variantOutOfStock}
							<span class="text-[10px] opacity-75">(Habis)</span>
						{:else}
							<span class="text-[10px] opacity-80">({variant.stock})</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Deskripsi Produk -->
	{#if product.description}
		<div
			class="space-y-2 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/50 p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
		>
			<h2
				class="font-serif text-sm font-bold tracking-wide text-ink uppercase dark:text-papaya"
			>
				Deskripsi Produk
			</h2>
			<p
				class="text-sm leading-relaxed whitespace-pre-line text-ink/85 dark:text-papaya/85"
			>
				{product.description}
			</p>
		</div>
	{/if}

	<!-- Kontrol Jumlah & Tambah ke Keranjang -->
	<div
		class="space-y-4 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/60 p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
	>
		<div class="flex items-center justify-between">
			<span class="font-serif text-sm font-bold text-ink dark:text-papaya">Jumlah Pesanan:</span>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => (qty = Math.max(1, qty - 1))}
					disabled={qty <= 1 || effectiveStock <= 0}
					class="flex h-9 w-9 items-center justify-center rounded-[6px_3px_5px_2px] border-2 border-brandy bg-papaya font-bold text-ink shadow-[2px_2px_0px_#78290f] transition-all hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-30 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
				>
					<Minus size={15} strokeWidth={2.75} />
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
					class="h-9 w-16 rounded-[6px_3px_5px_2px] border-2 border-brandy bg-white text-center font-mono text-base font-bold text-ink shadow-[inset_1px_1px_0px_rgba(0,0,0,0.1)] focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:border-papaya/40 dark:bg-ink dark:text-papaya"
				/>
				<button
					type="button"
					onclick={() => (qty = Math.min(effectiveStock, qty + 1))}
					disabled={qty >= effectiveStock || effectiveStock <= 0}
					class="flex h-9 w-9 items-center justify-center rounded-[6px_3px_5px_2px] border-2 border-brandy bg-papaya font-bold text-ink shadow-[2px_2px_0px_#78290f] transition-all hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-30 dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
				>
					<Plus size={15} strokeWidth={2.75} />
				</button>
			</div>
		</div>

		<button
			type="button"
			onclick={handleAddToCart}
			disabled={effectiveStock <= 0 || (hasVariants && !selectedVariant)}
			class="flex w-full items-center justify-center gap-2 rounded-[10px_5px_9px_4px] border-2 border-brandy bg-tangerine px-4 py-3.5 font-bold text-sm text-white shadow-[4px_4px_0px_#78290f] transition-all duration-150 hover:bg-[#e06d00] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:border-brandy/30 disabled:bg-brandy/15 disabled:text-brandy/40 disabled:shadow-none dark:disabled:border-papaya/20 dark:disabled:text-papaya/30"
		>
			<ShoppingBag size={18} strokeWidth={2.5} />
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

