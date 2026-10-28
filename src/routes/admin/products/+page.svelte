<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { invalidateAll, beforeNavigate } from '$app/navigation';
	import { formatRupiah } from '$lib/utils/currency';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import Modal from '$lib/components/ui/Modal.svelte';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import { toast } from 'svelte-sonner';
	import {
		Plus,
		Pencil,
		Trash2,
		Search,
		FileSpreadsheet,
		Package,
		ArrowUpDown,
		GripVertical,
		Check,
		X
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	type ProductItem = PageData['categoriesWithProducts'][number]['products'][number];

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedCategoryFilter = $state<'all' | string>('all');
	let selectedStockFilter = $state<'all' | 'in_stock' | 'out_of_stock' | 'low_stock'>('all');
	let isBusy = $state(false);

	// Sinkronisasi filter stok dari URL query param (?stock=low)
	$effect(() => {
		const stockParam = page.url.searchParams.get('stock');
		if (stockParam === 'low') {
			selectedStockFilter = 'low_stock';
		}
	});

	// State Reorder DnD
	let activeReorderCatId = $state<string | null>(null);
	let categoryProductsMap = $state<Record<string, ProductItem[]>>({});
	let initialSnapshot = $state<Record<string, ProductItem[]>>({});
	let hasUnsavedChanges = $state(false);
	let isSaving = $state(false);
	let confirmCancelModalOpen = $state(false);
	let pendingCancelCatId = $state<string | null>(null);

	// Sinkronisasi data awal dari server saat tidak sedang dalam mode edit
	$effect(() => {
		if (!activeReorderCatId) {
			const map: Record<string, ProductItem[]> = {};
			for (const cat of data.categoriesWithProducts) {
				map[cat.id] = [...cat.products];
			}
			categoryProductsMap = map;
		}
	});

	// Navigation Guard untuk mencegah data hilang saat kabur
	beforeNavigate((navigation) => {
		if (hasUnsavedChanges) {
			const answer = window.confirm(
				'Ada perubahan susunan urutan produk yang belum disimpan. Yakin ingin keluar dari halaman?'
			);
			if (!answer) {
				navigation.cancel();
			}
		}
	});

	function startReorder(catId: string) {
		if (activeReorderCatId && hasUnsavedChanges) {
			toast.warning(
				'Selesaikan atau batalkan pengaturan urutan pada kategori saat ini terlebih dahulu.'
			);
			return;
		}
		// Reset search dan filter agar seluruh produk terlihat utuh tanpa risiko partial corruption
		searchQuery = '';
		selectedCategoryFilter = 'all';
		selectedStockFilter = 'all';

		const cat = data.categoriesWithProducts.find((c) => c.id === catId);
		if (cat) {
			categoryProductsMap[catId] = [...cat.products];
			initialSnapshot[catId] = [...cat.products];
		}
		activeReorderCatId = catId;
		hasUnsavedChanges = false;
	}

	function handleDndDrop(state: DragDropState, targetItem: ProductItem, catId: string) {
		const source = state.draggedItem as ProductItem | undefined;
		if (!source || source.id === targetItem.id) return;

		const currentList = categoryProductsMap[catId] || [];
		const fromIndex = currentList.findIndex((p) => p.id === source.id);
		const toIndex = currentList.findIndex((p) => p.id === targetItem.id);
		if (fromIndex === -1 || toIndex === -1) return;

		const updated = [...currentList];
		const [moved] = updated.splice(fromIndex, 1);
		updated.splice(toIndex, 0, moved);

		categoryProductsMap[catId] = updated;
		hasUnsavedChanges = true;
	}

	function handleCancelReorder(catId: string) {
		if (hasUnsavedChanges) {
			pendingCancelCatId = catId;
			confirmCancelModalOpen = true;
		} else {
			activeReorderCatId = null;
		}
	}

	function confirmDiscardChanges() {
		if (pendingCancelCatId && initialSnapshot[pendingCancelCatId]) {
			categoryProductsMap[pendingCancelCatId] = [...initialSnapshot[pendingCancelCatId]];
		}
		hasUnsavedChanges = false;
		activeReorderCatId = null;
		confirmCancelModalOpen = false;
		pendingCancelCatId = null;
		toast.info('Perubahan urutan dibatalkan.');
	}

	async function saveReorder(catId: string) {
		const prods = categoryProductsMap[catId];
		if (!prods || prods.length === 0) return;

		isSaving = true;
		try {
			const formData = new FormData();
			formData.append('categoryId', catId);
			formData.append('orderedIds', JSON.stringify(prods.map((p) => p.id)));

			const res = await fetch('?/reorderBatch', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				throw new Error('Gagal menghubungi server.');
			}

			hasUnsavedChanges = false;
			activeReorderCatId = null;
			toast.success('Urutan produk berhasil disimpan!');
			await invalidateAll();
		} catch (err) {
			toast.error(
				'Gagal menyimpan urutan produk: ' +
					(err instanceof Error ? err.message : 'Kesalahan jaringan.')
			);
		} finally {
			isSaving = false;
		}
	}

	// Modal Hapus
	let deleteModalOpen = $state(false);
	let productToDelete = $state<{ id: string; name: string } | null>(null);

	function openDeleteModal(prod: { id: string; name: string }) {
		productToDelete = prod;
		deleteModalOpen = true;
	}

	// Filter Produk Reaktif
	const filteredCategories = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();

		return data.categoriesWithProducts
			.filter((cat) => {
				if (selectedCategoryFilter !== 'all' && cat.id !== selectedCategoryFilter) {
					return false;
				}
				return true;
			})
			.map((cat) => {
				let prods = categoryProductsMap[cat.id] ?? cat.products;

				if (q) {
					prods = prods.filter(
						(p) =>
							p.name.toLowerCase().includes(q) ||
							(p.description && p.description.toLowerCase().includes(q))
					);
				}

				if (selectedStockFilter === 'in_stock') {
					prods = prods.filter((p) => {
						if (p.variants && p.variants.length > 0) {
							return p.variants.some((v) => v.stock > 0);
						}
						return !p.trackStock || p.stock > 0;
					});
				} else if (selectedStockFilter === 'out_of_stock') {
					prods = prods.filter((p) => {
						if (p.variants && p.variants.length > 0) {
							return p.variants.every((v) => v.stock <= 0);
						}
						return p.trackStock && p.stock <= 0;
					});
				} else if (selectedStockFilter === 'low_stock') {
					prods = prods.filter((p) => {
						if (!p.trackStock) return false;
						if (p.variants && p.variants.length > 0) {
							return p.variants.some((v) => v.stock <= 3);
						}
						return p.stock <= 3;
					});
				}

				return {
					...cat,
					products: prods
				};
			})
			.filter(
				(cat) =>
					cat.products.length > 0 || (searchQuery === '' && selectedCategoryFilter === cat.id)
			);
	});
</script>

<svelte:window
	onbeforeunload={(e) => {
		if (hasUnsavedChanges) {
			e.preventDefault();
			e.returnValue = '';
		}
	}}
/>

<BusyOverlay active={isBusy}>
	<div class="space-y-6 pb-20">
		<!-- Top Bar / Action Header -->
		<div
			class="flex flex-col gap-4 border-b-2 border-[#262626]/10 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9]/10"
		>
			<div>
				<div
					class="mb-1 inline-flex items-center gap-1.5 rounded-md border-2 border-[#262626] bg-[#e87a5d] px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626]"
				>
					<Package size={13} />
					<span>KATALOG TOKO</span>
				</div>
				<h1 class="text-2xl font-black tracking-tight text-[#262626] dark:text-[#f2efe9]">
					Manajemen Produk
				</h1>
				<p class="font-mono text-xs text-[#262626]/70 dark:text-[#f2efe9]/70">
					Kelola katalog barang, foto ber-watermark, varian ukuran/warna, dan pembaruan stok.
				</p>
			</div>

			<div class="flex flex-wrap items-center gap-2.5">
				<a
					href={resolve('/admin/products/import')}
					class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					<FileSpreadsheet size={15} />
					<span>Impor Spreadsheet</span>
				</a>

				<a
					href={resolve('/admin/products/new')}
					class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-[#262626] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
				>
					<Plus size={16} />
					<span>Tambah Produk</span>
				</a>
			</div>
		</div>

		<!-- Filter & Search Controls -->
		<div
			class="relative flex flex-col gap-3 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] md:flex-row md:items-center md:justify-between dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
				>+</span
			>
			<div class="relative max-w-md flex-1">
				<Search
					size={16}
					class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#262626]/40 dark:text-[#f2efe9]/40"
				/>
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Cari nama produk atau deskripsi..."
					class="w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/40 py-2 pr-3.5 pl-9 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
				/>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<!-- Filter Kategori -->
				<select
					bind:value={selectedCategoryFilter}
					class="rounded-lg border-2 border-[#262626] bg-white px-3 py-2 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					<option value="all">Semua Kategori ({data.categoriesWithProducts.length})</option>
					{#each data.categoriesWithProducts as cat (cat.id)}
						<option value={cat.id}>{cat.name} ({cat.products.length})</option>
					{/each}
				</select>

				<!-- Filter Stok -->
				<select
					bind:value={selectedStockFilter}
					class="rounded-lg border-2 border-[#262626] bg-white px-3 py-2 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					<option value="all">Semua Status Stok</option>
					<option value="in_stock">Tersedia (Ready)</option>
					<option value="low_stock">Stok Kritis (&le; 3 pcs)</option>
					<option value="out_of_stock">Stok Habis</option>
				</select>
			</div>
		</div>

		<!-- Empty State: Belum Ada Produk -->
		{#if data.categoriesWithProducts.length === 0}
			<div
				class="rounded-[14px_4px_14px_4px] border-2 border-dashed border-[#262626] bg-white p-12 text-center shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/40 dark:bg-[#1a1825]"
			>
				<Package size={36} class="mx-auto text-[#262626]/40 dark:text-[#f2efe9]/40" />
				<h2 class="mt-3 text-lg font-black text-[#262626] dark:text-[#f2efe9]">
					Kategori Belum Dibuat
				</h2>
				<p class="mt-1 font-mono text-xs text-[#262626]/60 dark:text-[#f2efe9]/60">
					Sebelum menambah produk, buat kategori produk terlebih dahulu di menu Kategori.
				</p>
				<a
					href={resolve('/admin/categories')}
					class="mt-4 inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-[#262626] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
				>
					<span>Ke Menu Kategori ↗</span>
				</a>
			</div>
		{:else if filteredCategories.length === 0}
			<div
				class="rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-8 text-center shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
			>
				<p class="text-base font-black text-[#262626] dark:text-[#f2efe9]">
					Tidak Ada Produk yang Cocok
				</p>
				<p class="mt-1 font-mono text-xs text-[#262626]/60 dark:text-[#f2efe9]/60">
					Coba ubah kata kunci pencarian atau reset filter kategori/stok.
				</p>
				<button
					type="button"
					onclick={() => {
						searchQuery = '';
						selectedCategoryFilter = 'all';
						selectedStockFilter = 'all';
					}}
					class="mt-3 font-mono text-xs font-bold text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400"
				>
					Reset Filter
				</button>
			</div>
		{/if}

		<!-- Daftar Produk per Kategori -->
		<div class="space-y-8">
			{#each filteredCategories as category (category.id)}
				{@const isReorderingThis = activeReorderCatId === category.id}
				{@const isReorderingOther = activeReorderCatId !== null && !isReorderingThis}

				<div
					class="space-y-3 transition-opacity duration-200 {isReorderingOther
						? 'pointer-events-none opacity-40'
						: ''}"
				>
					<!-- Category Header Bar -->
					<div
						class="flex flex-col gap-2 border-b-2 border-[#262626]/10 pb-2 sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9]/10"
					>
						<div class="flex items-center gap-2.5">
							<span
								class="rounded-md border border-[#262626] bg-[#f2efe9] px-2.5 py-1 font-mono text-xs font-black text-[#262626] shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] dark:bg-neutral-800 dark:text-[#f2efe9]"
							>
								{category.products.length} item
							</span>
							<h2 class="text-xl font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
								{category.name}
							</h2>
						</div>

						<div class="flex items-center gap-3">
							<!-- Tombol Kontrol Atur Urutan -->
							{#if !isReorderingThis}
								{#if category.products.length > 1}
									<button
										type="button"
										disabled={isReorderingOther}
										onclick={() => startReorder(category.id)}
										class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-40 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
									>
										<ArrowUpDown size={14} class="text-[#262626] dark:text-[#f2efe9]" />
										<span>Atur Urutan</span>
									</button>
								{/if}
							{:else}
								<!-- Mode Edit Aktif: Batal & Simpan -->
								<div class="flex items-center gap-2">
									<span
										class="hidden font-mono text-xs font-bold sm:inline {hasUnsavedChanges
											? 'text-amber-700 dark:text-amber-400'
											: 'text-[#262626]/50 dark:text-[#f2efe9]/50'}"
									>
										{hasUnsavedChanges ? '● Ada perubahan' : 'Belum digeser'}
									</span>
									<button
										type="button"
										onclick={() => handleCancelReorder(category.id)}
										class="inline-flex items-center gap-1 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
									>
										<X size={14} />
										<span>Batal</span>
									</button>
									<button
										type="button"
										disabled={isSaving}
										onclick={() => saveReorder(category.id)}
										class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-emerald-500 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
									>
										{#if isSaving}
											<div
												class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
											></div>
											<span>Menyimpan...</span>
										{:else}
											<Check size={14} />
											<span>Simpan Urutan</span>
										{/if}
									</button>
								</div>
							{/if}

							<a
								href="{resolve('/admin/products/new')}?category={category.id}"
								class="font-mono text-xs font-bold text-emerald-700 underline hover:text-emerald-800 sm:text-sm dark:text-emerald-400"
							>
								+ Tambah di kategori ini
							</a>
						</div>
					</div>

					{#if category.products.length === 0}
						<div
							class="rounded-lg border-2 border-dashed border-[#262626]/20 p-6 text-center font-mono text-xs text-[#262626]/60 dark:border-[#f2efe9]/20 dark:text-[#f2efe9]/60"
						>
							Belum ada produk di kategori ini.
						</div>
					{:else}
						<!-- Grid Table / Cards dengan Penegasan Border -->
						<div
							class="overflow-hidden rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white shadow-[4px_4px_0px_#262626] transition-all duration-200 dark:border-[#f2efe9]/20 dark:bg-[#1a1825] {isReorderingThis
								? 'ring-4 ring-amber-400/40'
								: ''}"
						>
							{#if isReorderingThis}
								<div
									class="flex flex-col gap-2 border-b-2 border-[#262626] bg-amber-100 px-4 py-2.5 font-mono text-xs font-black text-[#262626] sm:flex-row sm:items-center sm:justify-between dark:bg-amber-950/60 dark:text-amber-200"
								>
									<div class="flex items-center gap-2.5">
										<span class="relative flex h-2.5 w-2.5">
											<span
												class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75"
											></span>
											<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-600"
											></span>
										</span>
										<span
											>MODE ATUR URUTAN AKTIF — Geser produk ke posisi tujuan, lalu klik "Simpan
											Urutan"</span
										>
									</div>
									<span
										class="text-[11px] {hasUnsavedChanges
											? 'font-black text-amber-800 dark:text-amber-300'
											: 'opacity-70'}"
									>
										{hasUnsavedChanges
											? '● Ada perubahan belum disimpan'
											: 'Belum ada produk digeser'}
									</span>
								</div>
							{/if}

							<div class="divide-y-2 divide-[#262626]/10 dark:divide-[#f2efe9]/10">
								{#each category.products as prod, idx (prod.id)}
									{@const hasVariants = prod.variants && prod.variants.length > 0}
									{@const totalStock = hasVariants
										? prod.variants.reduce((s, v) => s + v.stock, 0)
										: prod.stock}
									{@const isOutOfStock = hasVariants
										? totalStock <= 0
										: prod.trackStock && prod.stock <= 0}

									<div
										use:draggable={{
											container: `admin-product-reorder-${category.id}`,
											dragData: prod,
											handle: '.drag-handle',
											disabled: !isReorderingThis
										}}
										use:droppable={{
											container: `admin-product-reorder-${category.id}`,
											disabled: !isReorderingThis,
											callbacks: {
												onDrop: (state) => handleDndDrop(state, prod, category.id)
											}
										}}
										class="flex flex-col gap-3 p-4 transition-colors hover:bg-[#f2efe9]/50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-neutral-800/40 {isReorderingThis
											? 'cursor-grab'
											: ''}"
									>
										<!-- Left: Drag Handle, Number Badge, Image & Info -->
										<div class="flex min-w-0 flex-1 items-start gap-3.5">
											<!-- Handle Drag & Badge Nomor Urut (Saat Mode DnD Aktif) -->
											{#if isReorderingThis}
												<div class="flex items-center self-center pr-1">
													<button
														type="button"
														class="drag-handle flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] hover:bg-neutral-100 active:cursor-grabbing dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
														aria-label="Pegang untuk memindahkan {prod.name}"
														title="Pegang titik 6 untuk memindahkan"
													>
														<GripVertical size={18} />
													</button>
												</div>

												<div class="self-center">
													<span
														class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 border-[#262626] bg-emerald-100 font-mono text-xs font-black text-emerald-900 shadow-[1px_1px_0px_#262626] dark:bg-emerald-950 dark:text-emerald-300"
													>
														#{idx + 1}
													</span>
												</div>
											{/if}

											{#if prod.imageUrls && prod.imageUrls.length > 0}
												<img
													src={prod.imageUrls[0]}
													alt={prod.name}
													class="h-14 w-14 shrink-0 rounded-lg border-2 border-[#262626] object-cover shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30"
												/>
											{:else}
												<div
													class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-[#262626] bg-neutral-100 text-[#262626]/40 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-neutral-950"
												>
													<Package size={20} />
												</div>
											{/if}

											<div class="min-w-0 flex-1">
												<div class="flex items-center gap-2">
													<h3
														class="truncate text-sm font-bold text-[#262626] sm:text-base dark:text-[#f2efe9]"
													>
														{prod.name}
													</h3>
													{#if !prod.active}
														<span
															class="rounded border border-[#262626]/30 bg-neutral-200 px-2 py-0.5 font-mono text-xs font-bold text-[#262626] dark:border-[#f2efe9]/30 dark:bg-neutral-800 dark:text-[#f2efe9]"
														>
															Nonaktif
														</span>
													{/if}
												</div>

												<div class="mt-1 flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
													<span
														class="font-mono text-sm font-black text-[#262626] sm:text-base dark:text-[#f2efe9]"
													>
														{formatRupiah(prod.priceInt)}
													</span>

													<span class="text-[#262626]/30 dark:text-[#f2efe9]/30">•</span>

													{#if hasVariants}
														<span
															class="rounded-full border border-blue-500/40 bg-blue-50 px-2.5 py-1 font-mono text-xs font-bold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
														>
															{prod.variants.length} Varian ({totalStock} stok total)
														</span>
													{:else if prod.trackStock}
														<span
															class="rounded-full border px-2.5 py-1 font-mono text-xs font-bold {isOutOfStock
																? 'border-red-500/40 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
																: 'border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}"
														>
															{isOutOfStock ? 'Stok Habis' : `Stok: ${prod.stock}`}
														</span>
													{:else}
														<span
															class="font-mono text-xs text-[#262626]/60 dark:text-[#f2efe9]/60"
														>
															Stok tidak dilacak
														</span>
													{/if}
												</div>

												{#if prod.description}
													<p
														class="mt-1.5 line-clamp-1 font-mono text-xs text-[#404040] md:text-[13px] dark:text-[#b8b5ad]"
													>
														{prod.description}
													</p>
												{/if}
											</div>
										</div>

										<!-- Right: Actions (Disembunyikan saat mode reorder aktif agar tidak salah klik) -->
										{#if !isReorderingThis}
											<div
												class="flex shrink-0 items-center justify-end gap-2 self-end sm:self-center"
											>
												<!-- Edit Link -->
												<a
													href={resolve('/admin/products/[id]/edit', { id: prod.id })}
													class="inline-flex items-center gap-1 rounded-lg border-2 border-[#262626] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
												>
													<Pencil size={14} />
													<span>Edit</span>
												</a>

												<!-- Delete Button -->
												<button
													type="button"
													onclick={() => openDeleteModal({ id: prod.id, name: prod.name })}
													class="rounded-lg border-2 border-[#262626] bg-red-50 p-2 text-red-700 shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 dark:bg-red-950/40 dark:text-red-300"
													aria-label="Hapus produk"
												>
													<Trash2 size={15} />
												</button>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Modal Konfirmasi Batal Pengaturan Urutan -->
		<Modal
			open={confirmCancelModalOpen}
			title="Batalkan Perubahan Urutan?"
			message="Anda telah mengubah susunan beberapa produk pada kategori ini. Jika dibatalkan, semua perubahan urutan yang belum disimpan akan dikembalikan ke posisi awal."
			danger={true}
			confirmLabel="Ya, Buang Perubahan"
			cancelLabel="Lanjut Mengatur"
			onConfirm={confirmDiscardChanges}
			onCancel={() => (confirmCancelModalOpen = false)}
		/>

		<!-- Modal Konfirmasi Hapus Produk -->
		{#if deleteModalOpen && productToDelete}
			<Modal
				open={deleteModalOpen}
				title="Konfirmasi Hapus Produk"
				hideActions={true}
				onCancel={() => (deleteModalOpen = false)}
			>
				<div class="space-y-4">
					<p class="text-sm text-[#262626]/80 dark:text-[#f2efe9]/80">
						Apakah Anda yakin ingin menghapus produk <strong>"{productToDelete.name}"</strong>? Foto
						produk di server penyimpanan juga akan dibersihkan.
					</p>

					<form
						method="POST"
						action="?/delete"
						use:enhance={() => {
							isBusy = true;
							return async ({ result }) => {
								isBusy = false;
								deleteModalOpen = false;
								handleFormResult(result, {
									success: 'Produk berhasil dihapus.'
								});
							};
						}}
						class="flex items-center justify-end gap-2 pt-2"
					>
						<input type="hidden" name="id" value={productToDelete.id} />
						<button
							type="button"
							onclick={() => (deleteModalOpen = false)}
							class="rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={isBusy}
							class="rounded-lg border-2 border-[#262626] bg-red-500 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50"
						>
							{isBusy ? 'Menghapus...' : 'Ya, Hapus Produk'}
						</button>
					</form>
				</div>
			</Modal>
		{/if}
	</div>
</BusyOverlay>

<style>
	/* Custom Drop Indicator Garis Oranye Tebal & Jelas */
	:global(.drop-before::before),
	:global(.drop-after::after) {
		height: 4px !important;
		background: #ff7d00 !important;
		box-shadow: 0 0 10px rgba(255, 125, 0, 0.7) !important;
		border-radius: 9999px !important;
		z-index: 30 !important;
	}

	:global(.drop-before::before) {
		top: -2px !important;
	}

	:global(.drop-after::after) {
		bottom: -2px !important;
	}

	/* Highlight Kartu Sasaran Drop */
	:global(.drag-over) {
		background-color: rgba(255, 125, 0, 0.08) !important;
		border-color: #ff7d00 !important;
	}
</style>
