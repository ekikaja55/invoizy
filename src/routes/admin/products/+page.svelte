<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { formatRupiah } from '$lib/utils/currency';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import Modal from '$lib/components/ui/Modal.svelte';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import {
		Plus,
		Pencil,
		Trash2,
		ChevronUp,
		ChevronDown,
		Search,
		FileSpreadsheet,
		Package
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedCategoryFilter = $state<'all' | string>('all');
	let selectedStockFilter = $state<'all' | 'in_stock' | 'out_of_stock'>('all');
	let isBusy = $state(false);

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
				let prods = cat.products;

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
				}

				return {
					...cat,
					products: prods
				};
			})
			.filter((cat) => cat.products.length > 0 || (searchQuery === '' && selectedCategoryFilter === cat.id));
	});
</script>

<BusyOverlay active={isBusy}>
<div class="space-y-6 pb-20">
	<!-- Top Bar / Action Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-5 dark:border-neutral-800">
		<div>
			<h1 class="font-serif text-2xl font-bold text-neutral-900 dark:text-neutral-100">
				Manajemen Produk
			</h1>
			<p class="text-xs text-neutral-500">
				Kelola katalog barang, foto ber-watermark, varian ukuran/warna, dan pembaruan stok.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2.5">
			<a
				href={resolve('/admin/products/import')}
				class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-xs transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
			>
				<FileSpreadsheet size={15} />
				<span>Impor Spreadsheet</span>
			</a>

			<a
				href={resolve('/admin/products/new')}
				class="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-neutral-800 dark:bg-papaya dark:text-ink dark:hover:bg-papaya/90"
			>
				<Plus size={16} />
				<span>Tambah Produk</span>
			</a>
		</div>
	</div>

	<!-- Filter & Search Controls -->
	<div class="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between dark:border-neutral-800 dark:bg-neutral-900">
		<div class="relative flex-1 max-w-md">
			<Search size={15} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Cari nama produk atau deskripsi..."
				class="w-full rounded-lg border border-neutral-300 bg-neutral-50 py-1.5 pr-3 pl-9 text-xs text-neutral-900 focus:border-brandy focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
			/>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<!-- Filter Kategori -->
			<select
				bind:value={selectedCategoryFilter}
				class="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-800 focus:border-brandy focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
			>
				<option value="all">Semua Kategori ({data.categoriesWithProducts.length})</option>
				{#each data.categoriesWithProducts as cat (cat.id)}
					<option value={cat.id}>{cat.name} ({cat.products.length})</option>
				{/each}
			</select>

			<!-- Filter Stok -->
			<select
				bind:value={selectedStockFilter}
				class="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-800 focus:border-brandy focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
			>
				<option value="all">Semua Status Stok</option>
				<option value="in_stock">Tersedia (Ready)</option>
				<option value="out_of_stock">Stok Habis</option>
			</select>
		</div>
	</div>

	<!-- Empty State: Belum Ada Produk -->
	{#if data.categoriesWithProducts.length === 0}
		<div class="rounded-2xl border-2 border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
			<Package size={36} class="mx-auto text-neutral-400" />
			<h2 class="mt-3 font-serif text-lg font-bold text-neutral-800 dark:text-neutral-200">
				Kategori Belum Dibuat
			</h2>
			<p class="mt-1 text-xs text-neutral-500">
				Sebelum menambah produk, buat kategori produk terlebih dahulu di menu Kategori.
			</p>
			<a
				href={resolve('/admin/categories')}
				class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white dark:bg-papaya dark:text-ink"
			>
				<span>Ke Menu Kategori</span>
			</a>
		</div>
	{:else if filteredCategories.length === 0}
		<div class="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
			<p class="font-serif text-base font-bold text-neutral-800 dark:text-neutral-200">
				Tidak Ada Produk yang Cocok
			</p>
			<p class="mt-1 text-xs text-neutral-500">
				Coba ubah kata kunci pencarian atau reset filter kategori/stok.
			</p>
			<button
				type="button"
				onclick={() => {
					searchQuery = '';
					selectedCategoryFilter = 'all';
					selectedStockFilter = 'all';
				}}
				class="mt-3 text-xs font-semibold text-brandy hover:underline dark:text-papaya"
			>
				Reset Filter
			</button>
		</div>
	{/if}

	<!-- Daftar Produk per Kategori -->
	<div class="space-y-8">
		{#each filteredCategories as category (category.id)}
			<div class="space-y-3">
				<!-- Category Header Bar -->
				<div class="flex items-center justify-between border-b border-neutral-200 pb-2 dark:border-neutral-800">
					<div class="flex items-center gap-2">
						<span class="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
							{category.products.length} item
						</span>
						<h2 class="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
							{category.name}
						</h2>
					</div>

					<a
						href="{resolve('/admin/products/new')}?category={category.id}"
						class="text-xs font-medium text-brandy hover:underline dark:text-papaya"
					>
						+ Tambah di kategori ini
					</a>
				</div>

				{#if category.products.length === 0}
					<div class="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-xs text-neutral-400 dark:border-neutral-800">
						Belum ada produk di kategori ini.
					</div>
				{:else}
					<!-- Grid Table / Cards -->
					<div class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
						<div class="divide-y divide-neutral-200 dark:divide-neutral-800">
							{#each category.products as prod, idx (prod.id)}
								{@const hasVariants = prod.variants && prod.variants.length > 0}
								{@const totalStock = hasVariants
									? prod.variants.reduce((s, v) => s + v.stock, 0)
									: prod.stock}
								{@const isOutOfStock = hasVariants
									? totalStock <= 0
									: prod.trackStock && prod.stock <= 0}

								<div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
									<!-- Left: Image & Info -->
									<div class="flex items-start gap-3.5 flex-1 min-w-0">
										{#if prod.imageUrls && prod.imageUrls.length > 0}
											<img
												src={prod.imageUrls[0]}
												alt={prod.name}
												class="h-14 w-14 shrink-0 rounded-lg border border-neutral-200 object-cover dark:border-neutral-800"
											/>
										{:else}
											<div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950">
												<Package size={20} />
											</div>
										{/if}

										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<h3 class="font-serif text-sm font-bold text-neutral-900 truncate dark:text-neutral-100">
													{prod.name}
												</h3>
												{#if !prod.active}
													<span class="rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
														Nonaktif
													</span>
												{/if}
											</div>

											<div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
												<span class="font-mono font-bold text-neutral-800 dark:text-neutral-200">
													{formatRupiah(prod.priceInt)}
												</span>

												<span class="text-neutral-300 dark:text-neutral-700">•</span>

												{#if hasVariants}
													<span class="rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
														{prod.variants.length} Varian ({totalStock} stok total)
													</span>
												{:else if prod.trackStock}
													<span
														class="rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold {isOutOfStock
															? 'bg-crimson/10 text-crimson dark:bg-crimson/20'
															: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}"
													>
														{isOutOfStock ? 'Stok Habis' : `Stok: ${prod.stock}`}
													</span>
												{:else}
													<span class="font-mono text-[11px] text-neutral-400">
														Stok tidak dilacak
													</span>
												{/if}
											</div>

											{#if prod.description}
												<p class="mt-1 line-clamp-1 text-xs text-neutral-500">
													{prod.description}
												</p>
											{/if}
										</div>
									</div>

									<!-- Right: Reorder & Actions -->
									<div class="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-center">
										<!-- Reorder Buttons -->
										<div class="flex items-center rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
											<form
												method="POST"
												action="?/reorder"
												use:enhance={() => {
													isBusy = true;
													return async ({ result, update }) => {
														handleFormResult(result, {
															failure: 'Gagal mengubah urutan produk.'
														});
														await update();
														isBusy = false;
													};
												}}
											>
												<input type="hidden" name="id" value={prod.id} />
												<input type="hidden" name="direction" value="up" />
												<button
													type="submit"
													disabled={isBusy || idx === 0}
													class="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 dark:hover:text-neutral-100"
													aria-label="Geser ke atas"
												>
													<ChevronUp size={14} />
												</button>
											</form>
											<form
												method="POST"
												action="?/reorder"
												use:enhance={() => {
													isBusy = true;
													return async ({ result, update }) => {
														handleFormResult(result, {
															failure: 'Gagal mengubah urutan produk.'
														});
														await update();
														isBusy = false;
													};
												}}
											>
												<input type="hidden" name="id" value={prod.id} />
												<input type="hidden" name="direction" value="down" />
												<button
													type="submit"
													disabled={isBusy || idx === category.products.length - 1}
													class="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 dark:hover:text-neutral-100"
													aria-label="Geser ke bawah"
												>
													<ChevronDown size={14} />
												</button>
											</form>
										</div>

										<!-- Edit Link -->
										<a
											href={resolve('/admin/products/[id]/edit', { id: prod.id })}
											class="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
										>
											<Pencil size={13} />
											<span>Edit</span>
										</a>

										<!-- Delete Button -->
										<button
											type="button"
											onclick={() => openDeleteModal({ id: prod.id, name: prod.name })}
											class="rounded-lg p-1.5 text-neutral-400 hover:bg-crimson/10 hover:text-crimson"
											aria-label="Hapus produk"
										>
											<Trash2 size={15} />
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Modal Konfirmasi Hapus Produk -->
	{#if deleteModalOpen && productToDelete}
		<Modal
			open={deleteModalOpen}
			title="Konfirmasi Hapus Produk"
			hideActions={true}
			onCancel={() => (deleteModalOpen = false)}
		>
			<div class="space-y-4">
				<p class="text-sm text-neutral-600 dark:text-neutral-300">
					Apakah Anda yakin ingin menghapus produk <strong>"{productToDelete.name}"</strong>? Foto produk di server penyimpanan juga akan dibersihkan.
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
						class="rounded-lg border border-neutral-300 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isBusy}
						class="rounded-lg bg-crimson px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-crimson/90 disabled:opacity-50"
					>
						{isBusy ? 'Menghapus...' : 'Ya, Hapus Produk'}
					</button>
				</form>
			</div>
		</Modal>
	{/if}
</div>
</BusyOverlay>
