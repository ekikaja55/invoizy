<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
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
		Sparkles,
		Zap,
		Loader2
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const product = $derived(data.product);

	let activeImageIndex = $state(0);
	let selectedVariantId = $state<string | null>(null);
	let qty = $state(1);
	let copied = $state(false);
	let isDirectBuying = $state(false);
	let isAddingToCart = $state(false);

	const hasVariants = $derived(Boolean(product.variants && product.variants.length > 0));
	const selectedVariant = $derived(
		hasVariants && selectedVariantId
			? (product.variants.find((v) => v.id === selectedVariantId) ?? null)
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
		if (isAddingToCart) return;

		if (hasVariants && !selectedVariant) {
			toast.error('Silakan pilih salah satu varian terlebih dahulu.');
			return;
		}

		if (effectiveStock <= 0) {
			toast.error('Maaf, stok untuk pilihan ini sedang habis.');
			return;
		}

		isAddingToCart = true;

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

		setTimeout(() => {
			isAddingToCart = false;
		}, 350);
	}

	async function handleDirectBuy() {
		if (isDirectBuying) return;

		if (hasVariants && !selectedVariant) {
			toast.error('Silakan pilih salah satu varian terlebih dahulu.');
			return;
		}

		if (effectiveStock <= 0) {
			toast.error('Maaf, stok untuk pilihan ini sedang habis.');
			return;
		}

		isDirectBuying = true;

		try {
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

			await goto(resolve('/(public)/order/checkout'));
		} finally {
			isDirectBuying = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl space-y-6 pb-36">
	<!-- Top Navigation: Monoline Buttons -->
	<div class="flex items-center justify-between">
		<a
			href={resolve('/(public)/order')}
			class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#fea770] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#b4a6d5] dark:hover:bg-[#fea770] dark:hover:text-[#262626]"
		>
			<ArrowLeft size={14} strokeWidth={2.5} />
			<span>Kembali ke Katalog</span>
		</a>

		<button
			type="button"
			onclick={copyProductLink}
			class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#a2e1db] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#b4a6d5] dark:hover:bg-[#a2e1db] dark:hover:text-[#1a1825]"
		>
			{#if copied}
				<Check size={14} strokeWidth={2.5} class="text-[#065f46] dark:text-[#34d399]" />
				<span class="text-[#065f46] dark:text-[#34d399]">Tersalin</span>
			{:else}
				<Copy size={14} strokeWidth={2.5} />
				<span>Salin Link</span>
			{/if}
		</button>
	</div>

	<!-- Galeri Multi-Foto: Clean Monoline Frame -->
	{#if product.imageUrls && product.imageUrls.length > 0}
		<div class="space-y-3">
			<div
				class="relative overflow-hidden rounded-xl border-2 border-[#262626] bg-[#f2efe9] shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#1a1825] dark:shadow-[4px_4px_0px_#b4a6d5]"
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
							class="h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150 {activeImageIndex ===
							idx
								? '-translate-y-0.5 border-[#262626] shadow-[2px_2px_0px_#262626] ring-2 ring-[#fea770] dark:border-[#a2e1db] dark:ring-[#fea770]'
								: 'border-[#262626]/20 opacity-60 hover:border-[#262626] hover:opacity-100 dark:border-[#f2efe9]/20'}"
						>
							<img src={imgUrl} alt="Thumbnail {idx + 1}" class="h-full w-full object-cover" />
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="flex h-52 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#262626]/30 bg-white/50 text-[#404040] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]/50 dark:text-[#b8b5ad]"
		>
			<ImageIcon size={36} strokeWidth={2} />
			<span class="font-sans text-sm font-semibold">Belum ada foto produk</span>
		</div>
	{/if}

	<!-- Header Informasi Produk: Warm Monoline Card -->
	<div
		class="relative overflow-hidden rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
	>
		<!-- Drafting Crosshair Mark -->
		<span
			class="pointer-events-none absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20"
			aria-hidden="true"
		>
			+
		</span>

		<div class="space-y-3">
			<div class="flex items-center gap-2">
				<span
					class="rounded-full border border-[#262626] bg-[#b4a6d5]/30 px-2.5 py-0.5 font-mono text-xs font-bold text-[#262626] uppercase dark:border-[#a2e1db]/40 dark:bg-[#b4a6d5]/20 dark:text-[#f2efe9]"
				>
					{product.category.name}
				</span>
			</div>

			<h1
				class="font-serif text-2xl font-bold tracking-normal text-[#262626] md:text-3xl dark:text-[#f2efe9]"
			>
				{product.name}
			</h1>

			<div class="flex items-baseline gap-3">
				<p class="font-mono text-2xl font-bold text-[#262626] md:text-3xl dark:text-[#a2e1db]">
					{formatRupiah(product.priceInt)}
				</p>
				{#if product.weightGrams > 0}
					<span class="font-mono text-xs font-medium text-[#404040] dark:text-[#b8b5ad]">
						· {product.weightGrams} gram
					</span>
				{/if}
			</div>

			<!-- Status Stok Global / Varian -->
			<div class="pt-1">
				{#if isOutOfStock}
					<span
						class="inline-block rounded-full border border-[#991b1b] bg-[#fee2e2] px-3 py-1 font-mono text-xs font-bold text-[#991b1b]"
					>
						Stok Habis
					</span>
				{:else if hasVariants}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-[#065f46] bg-[#d1fae5] px-3 py-1 font-mono text-xs font-bold text-[#065f46] dark:border-[#34d399] dark:bg-[#064e3b] dark:text-[#34d399]"
					>
						<Layers size={13} strokeWidth={2.5} />
						<span>Tersedia {product.variants.length} Varian</span>
					</span>
				{:else if product.trackStock}
					<span class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
						Sisa stok: <strong class="font-bold text-[#262626] dark:text-[#f2efe9]"
							>{product.stock}</strong
						>
					</span>
				{/if}
			</div>

			<!-- Banner Promo Kuantitas Produk -->
			{#if product.promos && product.promos.length > 0}
				{@const p = product.promos[0]}
				<div
					class="mt-3 flex items-start gap-2.5 rounded-lg border-2 border-[#fea770] bg-[#fea770]/15 p-3.5 text-xs shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#fea770]/20"
				>
					<Sparkles
						size={18}
						strokeWidth={2.5}
						class="mt-0.5 shrink-0 text-[#262626] dark:text-[#fea770]"
					/>
					<div class="space-y-1">
						<p class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
							Spesial Promo: {p.name}
						</p>
						<p class="font-sans text-xs text-[#404040] dark:text-[#b8b5ad]">
							Beli minimal <strong class="font-mono font-bold text-[#262626] dark:text-[#f2efe9]"
								>{p.minQty} pcs</strong
							>
							(bebas campur desain varian), otomatis hemat
							<strong class="font-mono font-bold text-[#262626] dark:text-[#fea770]"
								>{formatRupiah(p.discountAmount)}</strong
							>! Diskon berlaku kelipatan saat checkout.
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Pilihan Varian (jika produk memiliki varian) -->
	{#if hasVariants}
		<div
			class="relative overflow-hidden rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<span
				class="pointer-events-none absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20"
				aria-hidden="true"
			>
				+
			</span>

			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]"
						>Pilih Varian:</span
					>
					{#if selectedVariant}
						<span class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
							Stok varian ini: <strong class="font-bold text-[#262626] dark:text-[#a2e1db]"
								>{selectedVariant.stock}</strong
							>
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
							class="flex items-center gap-1.5 rounded-lg border-2 px-3.5 py-2 font-mono text-xs font-bold transition-all duration-150 {selectedVariantId ===
							variant.id
								? '-translate-y-0.5 border-[#262626] bg-[#fea770] text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626]'
								: variantOutOfStock
									? 'cursor-not-allowed border-[#262626]/20 bg-neutral-100 text-[#404040]/40 line-through opacity-50 dark:border-[#f2efe9]/10 dark:bg-neutral-800 dark:text-[#b8b5ad]/40'
									: 'border-[#262626]/30 bg-white text-[#404040] shadow-[1px_1px_0px_#262626] hover:border-[#262626] hover:bg-[#f2efe9] dark:border-[#f2efe9]/20 dark:bg-[#252331] dark:text-[#b8b5ad] dark:hover:bg-[#1a1825]'}"
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
		</div>
	{/if}

	<!-- Deskripsi Produk: Monoline Card -->
	{#if product.description}
		<div
			class="relative overflow-hidden rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<span
				class="pointer-events-none absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20"
				aria-hidden="true"
			>
				+
			</span>

			<div class="space-y-2">
				<h2
					class="font-serif text-sm font-bold tracking-wide text-[#262626] uppercase dark:text-[#f2efe9]"
				>
					Deskripsi Produk
				</h2>
				<p
					class="font-sans text-sm leading-relaxed whitespace-pre-line text-[#404040] dark:text-[#b8b5ad]"
				>
					{product.description}
				</p>
			</div>
		</div>
	{/if}

	<!-- Kontrol Jumlah & Tambah ke Keranjang: Rolling Ticker CTA -->
	<div
		class="relative overflow-hidden rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
	>
		<span
			class="pointer-events-none absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20"
			aria-hidden="true"
		>
			+
		</span>

		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<span class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]"
					>Jumlah Pesanan:</span
				>
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => (qty = Math.max(1, qty - 1))}
						disabled={qty <= 1 || effectiveStock <= 0}
						class="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#262626] bg-white font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#f2efe9] active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-30 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
						aria-label="Kurangi jumlah"
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
						class="h-9 w-16 [appearance:textfield] rounded-lg border-2 border-[#262626] bg-[#f9f7f2] text-center font-mono text-base font-bold text-[#262626] focus:border-[#262626] focus:outline-none disabled:opacity-50 dark:border-[#a2e1db] dark:bg-[#1a1825] dark:text-[#f2efe9] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
					/>
					<button
						type="button"
						onclick={() => (qty = Math.min(effectiveStock, qty + 1))}
						disabled={qty >= effectiveStock || effectiveStock <= 0}
						class="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#262626] bg-white font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#f2efe9] active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-30 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
						aria-label="Tambah jumlah"
					>
						<Plus size={15} strokeWidth={2.75} />
					</button>
				</div>
			</div>

			<!-- Action Buttons: Dual Action (Tambah ke Keranjang vs Beli Langsung) -->
			{#if effectiveStock <= 0 || (hasVariants && !selectedVariant)}
				<button
					type="button"
					disabled
					class="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border-2 border-[#262626]/30 bg-neutral-100 py-3.5 text-sm font-bold text-[#404040]/50 opacity-60 dark:border-[#f2efe9]/20 dark:bg-neutral-800 dark:text-[#b8b5ad]/50"
				>
					<ShoppingBag size={18} strokeWidth={2.5} />
					<span>
						{effectiveStock <= 0 ? 'Stok Pilihan Ini Habis' : 'Pilih Varian Terlebih Dahulu'}
					</span>
				</button>
			{:else}
				<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
					<!-- Tombol 1 (Sekunder): + Tambah ke Keranjang -->
					<button
						type="button"
						onclick={handleAddToCart}
						disabled={isAddingToCart || isDirectBuying}
						class="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#262626] bg-white py-3.5 text-sm font-bold text-[#262626] shadow-[2.5px_2.5px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#b4a6d5]/25 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-75 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2.5px_2.5px_0px_#f2efe9] dark:hover:bg-[#b4a6d5]/20"
					>
						{#if isAddingToCart}
							<Check size={18} strokeWidth={2.75} class="text-[#065f46] dark:text-[#34d399]" />
							<span class="text-[#065f46] dark:text-[#34d399]">Ditambahkan!</span>
						{:else}
							<ShoppingBag size={18} strokeWidth={2.5} class="text-[#262626] dark:text-[#f2efe9]" />
							<span>+ Keranjang</span>
						{/if}
					</button>

					<!-- Tombol 2 (Primer): Beli Langsung (Instant Checkout) -->
					<button
						type="button"
						onclick={handleDirectBuy}
						disabled={isDirectBuying || isAddingToCart}
						class="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#262626] py-3.5 text-sm font-bold text-[#f2efe9] shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none disabled:cursor-wait disabled:opacity-85 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[3px_3px_0px_#f2efe9] dark:hover:bg-[#e0ded8]"
					>
						{#if isDirectBuying}
							<span class="inline-flex items-center gap-2">
								<Loader2 size={18} strokeWidth={2.5} class="animate-spin text-[#fea770] dark:text-[#d9532f]" />
								<span>Menuju Checkout...</span>
							</span>
						{:else}
							<span
								class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[165%]"
							>
								<Zap size={18} strokeWidth={2.5} class="text-[#fea770] dark:text-[#d9532f]" />
								<span>Beli Langsung</span>
							</span>
							<span
								class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-2 transition-transform duration-300 ease-out group-hover:translate-y-0"
								aria-hidden="true"
							>
								<Zap size={18} strokeWidth={2.5} class="text-[#fea770] dark:text-[#d9532f]" />
								<span>Beli Langsung &rarr;</span>
							</span>
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
