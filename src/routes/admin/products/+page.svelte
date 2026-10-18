<script lang="ts">
	import { enhance } from '$app/forms';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import {
		Plus,
		Pencil,
		Trash2,
		ChevronUp,
		ChevronDown,
		X,
		ChevronRight,
		Image as ImageIcon,
		Eye
	} from '@lucide/svelte';
	import { processAndWatermarkImage } from '$lib/utils/image-watermark';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let expandedCategoryId = $state<string | null>(null);

	$effect(() => {
		if (expandedCategoryId === null && data.categoriesWithProducts.length > 0) {
			expandedCategoryId = data.categoriesWithProducts[0].id;
		}
	});

	let creatingInCategoryId = $state<string | null>(null);
	let editingId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);

	let isBusy = $state(false);
	let processingId = $state<string | null>(null);

	// state lokal untuk toggle trackStock di form create/edit (mengatur visibility field stock)
	let createTrackStock = $state(false);
	let editTrackStock = $state<Record<string, boolean>>({});

	interface VariantFormItem {
		id?: string;
		name: string;
		stock: number;
	}

	let createDescription = $state('');
	let createHasVariants = $state(false);
	let createVariants = $state<VariantFormItem[]>([]);

	let editDescription = $state<Record<string, string>>({});
	let editHasVariants = $state<Record<string, boolean>>({});
	let editVariants = $state<Record<string, VariantFormItem[]>>({});

	function addCreateVariant() {
		createVariants = [...createVariants, { name: '', stock: 0 }];
	}

	function removeCreateVariant(idx: number) {
		createVariants = createVariants.filter((_, i) => i !== idx);
	}

	function addEditVariant(productId: string) {
		editVariants[productId] = [...(editVariants[productId] ?? []), { name: '', stock: 0 }];
	}

	function removeEditVariant(productId: string, idx: number) {
		editVariants[productId] = (editVariants[productId] ?? []).filter((_, i) => i !== idx);
	}

	// state untuk kelola gambar create & edit
	let createNewFiles = $state<File[]>([]);
	let createPreviews = $state<string[]>([]);
	let editExistingImages = $state<Record<string, string[]>>({});
	let editNewFiles = $state<Record<string, File[]>>({});
	let editNewPreviews = $state<Record<string, string[]>>({});
	let isWatermarking = $state(false);

	function toggleCategory(id: string) {
		expandedCategoryId = expandedCategoryId === id ? null : id;
	}

	function startCreate(categoryId: string) {
		creatingInCategoryId = categoryId;
		createTrackStock = false;
		createDescription = '';
		createHasVariants = false;
		createVariants = [];
		createNewFiles = [];
		createPreviews = [];
	}

	function cancelCreate() {
		creatingInCategoryId = null;
		createNewFiles = [];
		createPreviews = [];
		createVariants = [];
		createDescription = '';
	}

	function startEdit(product: {
		id: string;
		trackStock: boolean;
		stock: number;
		description?: string | null;
		imageUrls?: string[] | null;
		variants?: { id?: string; name: string; stock: number }[];
	}) {
		editingId = product.id;
		editTrackStock[product.id] = product.trackStock;
		editDescription[product.id] = product.description ?? '';
		editExistingImages[product.id] = [...(product.imageUrls ?? [])];
		editNewFiles[product.id] = [];
		editNewPreviews[product.id] = [];
		const vars = (product.variants ?? []).map((v) => ({ id: v.id, name: v.name, stock: v.stock }));
		editVariants[product.id] = vars;
		editHasVariants[product.id] = vars.length > 0;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function handleCreateFiles(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		const remaining = 4 - createNewFiles.length;
		if (remaining <= 0) {
			toast.error('Maksimal 4 foto per produk.');
			input.value = '';
			return;
		}
		isWatermarking = true;
		try {
			const files = Array.from(input.files).slice(0, remaining);
			for (const f of files) {
				const wm = await processAndWatermarkImage(f, data.storeName);
				createNewFiles = [...createNewFiles, wm];
				createPreviews = [...createPreviews, URL.createObjectURL(wm)];
			}
		} catch {
			toast.error('Gagal memproses watermark foto.');
		} finally {
			isWatermarking = false;
			input.value = '';
		}
	}

	let inspectingPhoto = $state<{
		url: string;
		source: 'create' | 'edit-new' | 'edit-existing';
		index: number;
		productId?: string;
	} | null>(null);

	function openInspect(
		url: string,
		source: 'create' | 'edit-new' | 'edit-existing',
		index: number,
		productId?: string
	) {
		inspectingPhoto = { url, source, index, productId };
	}

	function deleteFromInspect() {
		if (!inspectingPhoto) return;
		const { source, index, productId } = inspectingPhoto;
		if (source === 'create') {
			removeCreatePreview(index);
		} else if (source === 'edit-existing' && productId) {
			removeEditExisting(productId, index);
		} else if (source === 'edit-new' && productId) {
			removeEditNew(productId, index);
		}
		inspectingPhoto = null;
	}

	function removeCreatePreview(index: number) {
		const targetUrl = createPreviews[index];
		if (targetUrl?.startsWith('blob:')) {
			URL.revokeObjectURL(targetUrl);
		}
		createNewFiles = createNewFiles.filter((_, i) => i !== index);
		createPreviews = createPreviews.filter((_, i) => i !== index);
	}

	async function handleEditFiles(productId: string, e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		const currentCount =
			(editExistingImages[productId]?.length ?? 0) + (editNewFiles[productId]?.length ?? 0);
		const remaining = 4 - currentCount;
		if (remaining <= 0) {
			toast.error('Maksimal 4 foto per produk.');
			input.value = '';
			return;
		}
		isWatermarking = true;
		try {
			const files = Array.from(input.files).slice(0, remaining);
			for (const f of files) {
				const wm = await processAndWatermarkImage(f, data.storeName);
				editNewFiles[productId] = [...(editNewFiles[productId] ?? []), wm];
				editNewPreviews[productId] = [
					...(editNewPreviews[productId] ?? []),
					URL.createObjectURL(wm)
				];
			}
		} catch {
			toast.error('Gagal memproses watermark foto.');
		} finally {
			isWatermarking = false;
			input.value = '';
		}
	}

	function removeEditExisting(productId: string, index: number) {
		editExistingImages[productId] = editExistingImages[productId].filter((_, i) => i !== index);
	}

	function removeEditNew(productId: string, index: number) {
		const targetUrl = editNewPreviews[productId]?.[index];
		if (targetUrl?.startsWith('blob:')) {
			URL.revokeObjectURL(targetUrl);
		}
		editNewFiles[productId] = (editNewFiles[productId] ?? []).filter((_, i) => i !== index);
		editNewPreviews[productId] = (editNewPreviews[productId] ?? []).filter((_, i) => i !== index);
	}

	function confirmDelete(id: string) {
		deletingId = id;
	}

	function cancelDelete() {
		deletingId = null;
	}
</script>

<div class="mx-auto max-w-3xl space-y-4">
	<h1 class="text-xl font-semibold">Products</h1>
	<p class="-mt-2 text-xs text-neutral-500">Urutkan tampilan dengan tombol panah di tiap baris.</p>

	{#if !data.categoriesWithProducts}
		<ListSkeleton rows={3} />
	{:else if data.categoriesWithProducts.length === 0}
		<p class="py-8 text-center text-sm text-neutral-500">
			Belum ada kategori. Buat kategori dulu di halaman Categories.
		</p>
	{:else}
		<div class="space-y-3">
			{#each data.categoriesWithProducts as category (category.id)}
				<div class="rounded-xl border border-neutral-200 dark:border-neutral-800">
					<button
						onclick={() => toggleCategory(category.id)}
						class="flex w-full items-center justify-between p-4 text-left"
					>
						<div class="flex items-center gap-2">
							<ChevronRight
								size={16}
								class="transition-transform {expandedCategoryId === category.id ? 'rotate-90' : ''}"
							/>
							<span class="font-medium">{category.name}</span>
							<span class="text-xs text-neutral-500">({category.products.length} produk)</span>
						</div>
					</button>

					{#if expandedCategoryId === category.id}
						<div class="space-y-2 border-t border-neutral-200 p-4 dark:border-neutral-800">
							<button
								onclick={() => startCreate(category.id)}
								disabled={isBusy}
								class="flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white
                       hover:bg-neutral-800 disabled:opacity-50
                       dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
							>
								<Plus size={16} />
								Produk Baru
							</button>

							{#if creatingInCategoryId === category.id}
								<form
									method="POST"
									action="?/create"
									enctype="multipart/form-data"
									use:enhance={({ formData }) => {
										isBusy = true;
										formData.delete('images');
										for (const f of createNewFiles) {
											formData.append('images', f);
										}
										if (createHasVariants) {
											const validVars = createVariants.filter((v) => v.name.trim() !== '');
											formData.set('variants', JSON.stringify(validVars));
											formData.set('trackStock', 'false');
										} else {
											formData.set('variants', '[]');
										}
										return async ({ result, update }) => {
											handleFormResult(result, { success: 'Produk berhasil ditambahkan.' });
											if (result.type === 'success') {
												creatingInCategoryId = null;
												createNewFiles = [];
												createPreviews = [];
											}
											await update({ reset: result.type === 'success' });
											isBusy = false;
										};
									}}
									class="space-y-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
								>
									<input type="hidden" name="categoryId" value={category.id} />
									<input type="hidden" name="sortOrder" value={category.products.length} />

									<div>
										<label for="create-name-{category.id}" class="block text-sm font-medium"
											>Nama Produk</label
										>
										<input
											id="create-name-{category.id}"
											name="name"
											required
											disabled={isBusy}
											placeholder="Contoh: Stiker Gintoki"
											class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                             disabled:opacity-50
                             dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
										/>
									</div>

									<div class="grid grid-cols-2 gap-3">
										<div>
											<label for="create-price-{category.id}" class="block text-sm font-medium"
												>Harga (Rp)</label
											>
											<input
												id="create-price-{category.id}"
												name="priceInt"
												type="number"
												min="0"
												required
												disabled={isBusy}
												placeholder="0"
												class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                                 disabled:opacity-50
                                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
											/>
										</div>

										<div>
											<label for="create-weight-{category.id}" class="block text-sm font-medium"
												>Berat (gram)</label
											>
											<input
												id="create-weight-{category.id}"
												name="weightGrams"
												type="number"
												min="0"
												value="0"
												required
												disabled={isBusy}
												class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                                 disabled:opacity-50
                                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
											/>
										</div>
									</div>

									<div>
										<div class="flex items-center justify-between">
											<label for="create-desc-{category.id}" class="block text-sm font-medium"
												>Deskripsi Produk</label
											>
											<span class="text-xs text-neutral-400">{createDescription.length}/1000</span>
										</div>
										<textarea
											id="create-desc-{category.id}"
											name="description"
											bind:value={createDescription}
											maxlength="1000"
											rows="3"
											disabled={isBusy}
											placeholder="Tuliskan spesifikasi produk, bahan, ukuran, petunjuk pemakaian, dll..."
											class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                             disabled:opacity-50
                             dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
										></textarea>
									</div>

									<div
										class="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
									>
										<label class="flex items-center gap-2 text-sm font-medium">
											<input type="checkbox" bind:checked={createHasVariants} disabled={isBusy} />
											Produk memiliki varian? (ukuran/warna/rasa)
										</label>

										{#if createHasVariants}
											<div
												class="mt-3 space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800"
											>
												<p class="text-xs text-neutral-500">
													Kelola stok terpisah untuk tiap varian. Harga tiap varian sama dengan
													harga produk.
												</p>

												{#if createVariants.length === 0}
													<p class="text-xs text-amber-600 italic dark:text-amber-400">
														Belum ada varian. Klik tombol di bawah untuk menambah varian.
													</p>
												{/if}

												{#each createVariants as variant, vIdx (vIdx)}
													<div class="flex items-center gap-2">
														<input
															type="text"
															bind:value={variant.name}
															placeholder="Nama varian (mis. Merah, XL)"
															disabled={isBusy}
															class="flex-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900
                                           dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
														/>
														<div class="flex items-center gap-1">
															<span class="text-xs text-neutral-400">Stok:</span>
															<input
																type="number"
																min="0"
																bind:value={variant.stock}
																disabled={isBusy}
																class="w-20 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900
                                               dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
															/>
														</div>
														<button
															type="button"
															onclick={() => removeCreateVariant(vIdx)}
															disabled={isBusy}
															class="rounded p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
															title="Hapus varian"
														>
															<X size={14} />
														</button>
													</div>
												{/each}

												<button
													type="button"
													onclick={addCreateVariant}
													disabled={isBusy}
													class="inline-flex items-center gap-1 rounded border border-dashed border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
												>
													<Plus size={12} />
													Tambah Varian
												</button>
											</div>
										{:else}
											<div class="mt-2 space-y-2">
												<label class="flex items-center gap-2 text-sm">
													<input
														type="checkbox"
														name="trackStock"
														bind:checked={createTrackStock}
														disabled={isBusy}
													/>
													Lacak Stok
												</label>

												{#if createTrackStock}
													<div>
														<label
															for="create-stock-{category.id}"
															class="block text-xs font-medium">Jumlah Stok</label
														>
														<input
															id="create-stock-{category.id}"
															name="stock"
															type="number"
															min="0"
															value="0"
															disabled={isBusy}
															class="mt-1 w-32 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900
                                             disabled:opacity-50
                                             dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
														/>
													</div>
												{/if}
											</div>
										{/if}
									</div>

									<label class="flex items-center gap-2 text-sm">
										<input type="checkbox" name="active" checked disabled={isBusy} />
										Aktif (tampil di halaman order)
									</label>

									<div>
										<span class="block text-sm font-medium">Foto Produk (Maks. 4)</span>
										<p class="text-xs text-neutral-500">
											Otomatis di-watermark @{data.storeName} & dikompresi ke WebP.
										</p>

										{#if createPreviews.length > 0}
											<div class="mt-2 flex flex-wrap gap-2">
												{#each createPreviews as prev, idx (prev)}
													<div
														class="group relative h-16 w-16 overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-700"
													>
														<button
															type="button"
															onclick={() => openInspect(prev, 'create', idx)}
															class="relative h-full w-full cursor-pointer focus:outline-none"
															title="Klik untuk periksa watermark"
														>
															<img src={prev} alt="Preview" class="h-full w-full object-cover" />
															<div
																class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
															>
																<Eye size={16} class="text-white drop-shadow" />
															</div>
														</button>
														<button
															type="button"
															onclick={() => removeCreatePreview(idx)}
															class="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-1 text-white hover:bg-black"
															title="Hapus foto"
														>
															<X size={10} />
														</button>
													</div>
												{/each}
											</div>
										{/if}

										{#if createPreviews.length < 4}
											<div class="mt-2">
												<label
													class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
												>
													<Plus size={14} />
													<span>{isWatermarking ? 'Memproses Watermark...' : 'Pilih Foto'}</span>
													<input
														type="file"
														accept="image/png,image/jpeg,image/webp"
														multiple
														onchange={handleCreateFiles}
														disabled={isBusy || isWatermarking}
														class="hidden"
													/>
												</label>
											</div>
										{/if}
									</div>

									<div class="flex gap-2">
										<button
											type="submit"
											disabled={isBusy}
											class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
										>
											{isBusy ? 'Menyimpan...' : 'Simpan'}
										</button>
										<button
											type="button"
											disabled={isBusy}
											onclick={cancelCreate}
											class="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
										>
											Batal
										</button>
									</div>
								</form>
							{/if}

							{#if category.products.length === 0}
								<p class="py-4 text-center text-sm text-neutral-500">
									Belum ada produk di kategori ini.
								</p>
							{:else}
								{#each category.products as product, index (product.id)}
									<BusyOverlay active={processingId === product.id}>
										<div class="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
											{#if editingId === product.id}
												<form
													method="POST"
													action="?/update"
													enctype="multipart/form-data"
													use:enhance={({ formData }) => {
														isBusy = true;
														processingId = product.id;
														formData.delete('images');
														for (const f of editNewFiles[product.id] ?? []) {
															formData.append('images', f);
														}
														formData.set(
															'existingImages',
															JSON.stringify(editExistingImages[product.id] ?? [])
														);
														formData.set('oldImages', JSON.stringify(product.imageUrls ?? []));
														if (editHasVariants[product.id]) {
															const validVars = (editVariants[product.id] ?? []).filter(
																(v) => v.name.trim() !== ''
															);
															formData.set('variants', JSON.stringify(validVars));
															formData.set('trackStock', 'false');
														} else {
															formData.set('variants', '[]');
														}
														return async ({ result, update }) => {
															handleFormResult(result, { success: 'Produk berhasil diperbarui.' });
															if (result.type === 'success') {
																editingId = null;
															}
															await update();
															isBusy = false;
															processingId = null;
														};
													}}
													class="space-y-3"
												>
													<input type="hidden" name="id" value={product.id} />
													<input type="hidden" name="categoryId" value={category.id} />
													<input type="hidden" name="sortOrder" value={product.sortOrder} />

													<div>
														<label for="edit-name-{product.id}" class="block text-sm font-medium"
															>Nama Produk</label
														>
														<input
															id="edit-name-{product.id}"
															name="name"
															value={product.name}
															required
															disabled={isBusy}
															class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                                     disabled:opacity-50
                                     dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
														/>
													</div>

													<div class="grid grid-cols-2 gap-3">
														<div>
															<label for="edit-price-{product.id}" class="block text-sm font-medium"
																>Harga (Rp)</label
															>
															<input
																id="edit-price-{product.id}"
																name="priceInt"
																type="number"
																min="0"
																value={product.priceInt}
																required
																disabled={isBusy}
																class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                                         disabled:opacity-50
                                         dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
															/>
														</div>

														<div>
															<label
																for="edit-weight-{product.id}"
																class="block text-sm font-medium">Berat (gram)</label
															>
															<input
																id="edit-weight-{product.id}"
																name="weightGrams"
																type="number"
																min="0"
																value={product.weightGrams}
																required
																disabled={isBusy}
																class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                                         disabled:opacity-50
                                         dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
															/>
														</div>
													</div>

													<div>
														<div class="flex items-center justify-between">
															<label for="edit-desc-{product.id}" class="block text-sm font-medium"
																>Deskripsi Produk</label
															>
															<span class="text-xs text-neutral-400"
																>{(editDescription[product.id] ?? '').length}/1000</span
															>
														</div>
														<textarea
															id="edit-desc-{product.id}"
															name="description"
															bind:value={editDescription[product.id]}
															maxlength="1000"
															rows="3"
															disabled={isBusy}
															placeholder="Tuliskan spesifikasi produk, bahan, ukuran, petunjuk pemakaian, dll..."
															class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                                disabled:opacity-50
                                dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
														></textarea>
													</div>

													<div
														class="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
													>
														<label class="flex items-center gap-2 text-sm font-medium">
															<input
																type="checkbox"
																bind:checked={editHasVariants[product.id]}
																disabled={isBusy}
															/>
															Produk memiliki varian? (ukuran/warna/rasa)
														</label>

														{#if editHasVariants[product.id]}
															<div
																class="mt-3 space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800"
															>
																<p class="text-xs text-neutral-500">
																	Kelola stok terpisah untuk tiap varian. Harga tiap varian sama
																	dengan harga produk.
																</p>

																{#if (editVariants[product.id]?.length ?? 0) === 0}
																	<p class="text-xs text-amber-600 italic dark:text-amber-400">
																		Belum ada varian. Klik tombol di bawah untuk menambah varian.
																	</p>
																{/if}

																{#each editVariants[product.id] ?? [] as variant, vIdx (vIdx)}
																	<div class="flex items-center gap-2">
																		<input
																			type="text"
																			bind:value={variant.name}
																			placeholder="Nama varian (mis. Merah, XL)"
																			disabled={isBusy}
																			class="flex-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900
                                               dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
																		/>
																		<div class="flex items-center gap-1">
																			<span class="text-xs text-neutral-400">Stok:</span>
																			<input
																				type="number"
																				min="0"
																				bind:value={variant.stock}
																				disabled={isBusy}
																				class="w-20 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900
                                                   dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
																			/>
																		</div>
																		<button
																			type="button"
																			onclick={() => removeEditVariant(product.id, vIdx)}
																			disabled={isBusy}
																			class="rounded p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
																			title="Hapus varian"
																		>
																			<X size={14} />
																		</button>
																	</div>
																{/each}

																<button
																	type="button"
																	onclick={() => addEditVariant(product.id)}
																	disabled={isBusy}
																	class="inline-flex items-center gap-1 rounded border border-dashed border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
																>
																	<Plus size={12} />
																	Tambah Varian
																</button>
															</div>
														{:else}
															<div class="mt-2 space-y-2">
																<label class="flex items-center gap-2 text-sm">
																	<input
																		type="checkbox"
																		name="trackStock"
																		bind:checked={editTrackStock[product.id]}
																		disabled={isBusy}
																	/>
																	Lacak Stok
																</label>

																{#if editTrackStock[product.id]}
																	<div>
																		<label
																			for="edit-stock-{product.id}"
																			class="block text-xs font-medium">Jumlah Stok</label
																		>
																		<input
																			id="edit-stock-{product.id}"
																			name="stock"
																			type="number"
																			min="0"
																			value={product.stock}
																			disabled={isBusy}
																			class="mt-1 w-32 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900
                                                 disabled:opacity-50
                                                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
																		/>
																	</div>
																{/if}
															</div>
														{/if}
													</div>

													<label class="flex items-center gap-2 text-sm">
														<input
															type="checkbox"
															name="active"
															checked={product.active}
															disabled={isBusy}
														/>
														Aktif (tampil di halaman order)
													</label>

													<div>
														<span class="block text-sm font-medium">Foto Produk (Maks. 4)</span>
														<p class="text-xs text-neutral-500">
															Otomatis di-watermark @{data.storeName} & dikompresi ke WebP.
														</p>

														{#if (editExistingImages[product.id]?.length ?? 0) + (editNewPreviews[product.id]?.length ?? 0) > 0}
															<div class="mt-2 flex flex-wrap gap-2">
																{#each editExistingImages[product.id] ?? [] as existingUrl, idx (existingUrl)}
																	<div
																		class="group relative h-16 w-16 overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-700"
																	>
																		<button
																			type="button"
																			onclick={() =>
																				openInspect(existingUrl, 'edit-existing', idx, product.id)}
																			class="relative h-full w-full cursor-pointer focus:outline-none"
																			title="Klik untuk periksa foto"
																		>
																			<img
																				src={existingUrl}
																				alt="Foto produk"
																				class="h-full w-full object-cover"
																			/>
																			<div
																				class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
																			>
																				<Eye size={16} class="text-white drop-shadow" />
																			</div>
																		</button>
																		<button
																			type="button"
																			onclick={() => removeEditExisting(product.id, idx)}
																			class="absolute top-0.5 right-0.5 rounded-full bg-red-600/80 p-1 text-white hover:bg-red-700"
																			title="Hapus foto ini"
																		>
																			<X size={10} />
																		</button>
																	</div>
																{/each}

																{#each editNewPreviews[product.id] ?? [] as newPrev, idx (newPrev)}
																	<div
																		class="group relative h-16 w-16 overflow-hidden rounded-lg border border-emerald-400 dark:border-emerald-600"
																	>
																		<button
																			type="button"
																			onclick={() =>
																				openInspect(newPrev, 'edit-new', idx, product.id)}
																			class="relative h-full w-full cursor-pointer focus:outline-none"
																			title="Klik untuk periksa watermark"
																		>
																			<img
																				src={newPrev}
																				alt="Foto baru"
																				class="h-full w-full object-cover"
																			/>
																			<div
																				class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
																			>
																				<Eye size={16} class="text-white drop-shadow" />
																			</div>
																		</button>
																		<button
																			type="button"
																			onclick={() => removeEditNew(product.id, idx)}
																			class="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-1 text-white hover:bg-black"
																			title="Batal upload"
																		>
																			<X size={10} />
																		</button>
																	</div>
																{/each}
															</div>
														{/if}

														{#if (editExistingImages[product.id]?.length ?? 0) + (editNewPreviews[product.id]?.length ?? 0) < 4}
															<div class="mt-2">
																<label
																	class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
																>
																	<Plus size={14} />
																	<span
																		>{isWatermarking
																			? 'Memproses Watermark...'
																			: 'Tambah Foto'}</span
																	>
																	<input
																		type="file"
																		accept="image/png,image/jpeg,image/webp"
																		multiple
																		onchange={(e) => handleEditFiles(product.id, e)}
																		disabled={isBusy || isWatermarking}
																		class="hidden"
																	/>
																</label>
															</div>
														{/if}
													</div>

													<div class="flex gap-2">
														<button
															type="submit"
															disabled={isBusy}
															class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
														>
															{isBusy ? 'Menyimpan...' : 'Simpan'}
														</button>
														<button
															type="button"
															disabled={isBusy}
															onclick={cancelEdit}
															class="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
														>
															Batal
														</button>
													</div>
												</form>
											{:else}
												<div class="flex items-center justify-between">
													<div class="flex items-center gap-3">
														{#if product.imageUrls && product.imageUrls.length > 0}
															<img
																src={product.imageUrls[0]}
																alt={product.name}
																class="h-10 w-10 shrink-0 rounded-lg border border-neutral-200 object-cover dark:border-neutral-800"
																loading="lazy"
															/>
														{:else}
															<div
																class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
															>
																<ImageIcon size={18} />
															</div>
														{/if}
														<div>
															<p class="text-sm font-medium">
																{product.name}
																{#if !product.active}
																	<span
																		class="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
																	>
																		Nonaktif
																	</span>
																{/if}
																{#if product.imageUrls && product.imageUrls.length > 1}
																	<span class="ml-1 text-xs text-neutral-400">
																		({product.imageUrls.length} foto)
																	</span>
																{/if}
															</p>
															<p class="text-xs text-neutral-500">
																Rp {product.priceInt.toLocaleString('id-ID')}
																{#if product.variants && product.variants.length > 0}
																	· <span class="font-medium text-emerald-600 dark:text-emerald-400"
																		>{product.variants.length} Varian</span
																	>
																	(Total stok: {product.variants.reduce(
																		(sum, v) => sum + v.stock,
																		0
																	)})
																{:else if product.trackStock}
																	· Stok: {product.stock}
																{/if}
															</p>
														</div>
													</div>

													<div class="flex items-center gap-1">
														<form
															method="POST"
															action="?/reorder"
															use:enhance={() => {
																isBusy = true;
																processingId = product.id;
																return async ({ result, update }) => {
																	handleFormResult(result, {
																		success: 'Urutan produk berhasil diubah.'
																	});
																	await update();
																	isBusy = false;
																	processingId = null;
																};
															}}
														>
															<input type="hidden" name="id" value={product.id} />
															<input type="hidden" name="direction" value="up" />
															<button
																type="submit"
																disabled={isBusy || index === 0}
																class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
															>
																<ChevronUp size={16} />
															</button>
														</form>

														<form
															method="POST"
															action="?/reorder"
															use:enhance={() => {
																isBusy = true;
																processingId = product.id;
																return async ({ result, update }) => {
																	handleFormResult(result, {
																		success: 'Urutan produk berhasil diubah.'
																	});
																	await update();
																	isBusy = false;
																	processingId = null;
																};
															}}
														>
															<input type="hidden" name="id" value={product.id} />
															<input type="hidden" name="direction" value="down" />
															<button
																type="submit"
																disabled={isBusy || index === category.products.length - 1}
																class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
															>
																<ChevronDown size={16} />
															</button>
														</form>

														<button
															onclick={() => startEdit(product)}
															disabled={isBusy}
															class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
														>
															<Pencil size={16} />
														</button>

														<button
															onclick={() => confirmDelete(product.id)}
															disabled={isBusy}
															class="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/20"
														>
															<Trash2 size={16} />
														</button>
													</div>
												</div>

												{#if deletingId === product.id}
													<div
														class="mt-3 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20"
													>
														<span>Hapus "{product.name}"?</span>
														<div class="flex gap-2">
															<form
																method="POST"
																action="?/delete"
																use:enhance={() => {
																	isBusy = true;
																	processingId = product.id;
																	return async ({ result, update }) => {
																		handleFormResult(result, {
																			success: 'Produk berhasil dihapus.'
																		});
																		if (result.type === 'success') {
																			deletingId = null;
																		}
																		await update();
																		isBusy = false;
																		processingId = null;
																	};
																}}
															>
																<input type="hidden" name="id" value={product.id} />
																<button
																	type="submit"
																	disabled={isBusy}
																	class="rounded bg-red-600 px-3 py-1.5 text-white disabled:opacity-50"
																>
																	{isBusy ? 'Menghapus...' : 'Ya, Hapus'}
																</button>
															</form>
															<button
																onclick={cancelDelete}
																disabled={isBusy}
																class="rounded border border-neutral-300 px-3 py-1.5 disabled:opacity-50 dark:border-neutral-700"
															>
																<X size={14} />
															</button>
														</div>
													</div>
												{/if}
											{/if}
										</div>
									</BusyOverlay>
								{/each}
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if inspectingPhoto}
		<Modal
			open={inspectingPhoto !== null}
			title="Preview Foto Produk"
			hideActions={true}
			onCancel={() => (inspectingPhoto = null)}
		>
			<div class="mt-3 space-y-3">
				<div
					class="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
				>
					<img
						src={inspectingPhoto.url}
						alt="Preview foto detail"
						class="max-h-[60vh] w-full object-contain"
					/>
				</div>

				<div class="flex items-center justify-between text-xs text-neutral-500">
					<span>
						{#if inspectingPhoto.source === 'create' || inspectingPhoto.source === 'edit-new'}
							<span
								class="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400"
							>
								✓ Watermark: @{data.storeName}
							</span>
						{:else}
							<span>Foto tersimpan</span>
						{/if}
					</span>
					<span>Foto #{inspectingPhoto.index + 1}</span>
				</div>

				<div
					class="flex justify-end gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800"
				>
					<button
						type="button"
						onclick={deleteFromInspect}
						class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
					>
						Hapus Foto Ini
					</button>
					<button
						type="button"
						onclick={() => (inspectingPhoto = null)}
						class="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
					>
						Tutup
					</button>
				</div>
			</div>
		</Modal>
	{/if}
</div>
