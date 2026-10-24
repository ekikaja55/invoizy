<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionResult } from '@sveltejs/kit';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import {
		ArrowLeft,
		Save,
		Plus,
		Trash2,
		UploadCloud
	} from '@lucide/svelte';
	import { processAndWatermarkImage } from '$lib/utils/image-watermark';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isBusy = $state(false);
	let selectedCategoryId = $state(data.product.categoryId);
	let productName = $state(data.product.name);
	let priceInt = $state<number>(data.product.priceInt);
	let weightGrams = $state(data.product.weightGrams);
	let trackStock = $state(data.product.trackStock);
	let stock = $state<number>(data.product.stock);
	let description = $state(data.product.description);
	let active = $state(data.product.active);
	let sortOrder = $state(data.product.sortOrder);

	// Image state: foto eksisting dari storage
	let existingImages = $state<string[]>([...data.product.imageUrls]);

	// New images uploader state
	interface ImagePreview {
		id: string;
		file: File;
		previewUrl: string;
	}
	let newImages = $state<ImagePreview[]>([]);
	let isProcessingImages = $state(false);

	const totalImagesCount = $derived(existingImages.length + newImages.length);

	// Variant state
	interface VariantItem {
		id?: string;
		name: string;
		stock: number;
		trackStock: boolean;
	}
	let hasVariants = $state(data.product.variants.length > 0);
	let variants = $state<VariantItem[]>(
		data.product.variants.map((v) => ({
			id: v.id,
			name: v.name,
			stock: v.stock,
			trackStock: v.trackStock
		}))
	);

	function addVariant() {
		variants = [
			...variants,
			{
				name: '',
				stock: 0,
				trackStock: true
			}
		];
	}

	function removeVariant(index: number) {
		variants = variants.filter((_, idx) => idx !== index);
		if (variants.length === 0) {
			hasVariants = false;
		}
	}

	function removeExistingImage(url: string) {
		existingImages = existingImages.filter((u) => u !== url);
	}

	async function handleImageSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const remainingSlots = 4 - totalImagesCount;
		if (remainingSlots <= 0) {
			toast.error('Maksimal 4 gambar per produk.');
			return;
		}

		const filesToProcess = Array.from(input.files).slice(0, remainingSlots);
		isProcessingImages = true;

		try {
			for (const file of filesToProcess) {
				const processedFile = await processAndWatermarkImage(file, data.storeName);
				const previewUrl = URL.createObjectURL(processedFile);
				newImages = [
					...newImages,
					{
						id: `img-${Date.now()}-${Math.random()}`,
						file: processedFile,
						previewUrl
					}
				];
			}
			toast.success(`${filesToProcess.length} foto baru berhasil diproses.`);
		} catch (err) {
			console.error(err);
			toast.error('Gagal memproses gambar.');
		} finally {
			isProcessingImages = false;
			input.value = '';
		}
	}

	function removeNewImage(index: number) {
		const target = newImages[index];
		if (target) {
			URL.revokeObjectURL(target.previewUrl);
			newImages = newImages.filter((_, idx) => idx !== index);
		}
	}

	// Payload generator untuk use:enhance
	function prepareFormData({ formData }: { formData: FormData }) {
		isBusy = true;

		formData.delete('images');
		for (const img of newImages) {
			formData.append('images', img.file);
		}

		formData.set('existingImages', JSON.stringify(existingImages));

		if (hasVariants && variants.length > 0) {
			const validVariants = variants
				.filter((v) => v.name.trim() !== '')
				.map((v) => ({
					id: v.id,
					name: v.name.trim(),
					stock: Number(v.stock) || 0,
					trackStock: v.trackStock
				}));
			formData.set('variants', JSON.stringify(validVariants));
		} else {
			formData.delete('variants');
		}

		return async ({ result }: { result: ActionResult }) => {
			isBusy = false;
			handleFormResult(result, {
				success: 'Perubahan produk berhasil disimpan!'
			});
		};
	}
</script>

<BusyOverlay active={isBusy}>
<div class="mx-auto max-w-4xl space-y-6 pb-20">
	<!-- Header Bar -->
	<div class="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
		<div class="flex items-center gap-3">
			<a
				href={resolve('/admin/products')}
				class="rounded-lg border border-neutral-300 p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
				aria-label="Kembali ke daftar produk"
			>
				<ArrowLeft size={18} />
			</a>
			<div>
				<h1 class="font-serif text-2xl font-bold text-neutral-900 dark:text-neutral-100">
					Edit Produk
				</h1>
				<p class="text-xs text-neutral-500">
					Perbarui rincian katalog, kelola foto, dan sesuaikan stok varian.
				</p>
			</div>
		</div>

		<a
			href={resolve('/admin/products')}
			class="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
		>
			Batal
		</a>
	</div>

	<!-- Form Penuh -->
	<form
		method="POST"
		enctype="multipart/form-data"
		use:enhance={prepareFormData}
		class="space-y-6"
	>
		<input type="hidden" name="sortOrder" value={sortOrder} />

		<!-- Section: Informasi Dasar -->
		<div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
			<h2 class="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
				Informasi Katalog
			</h2>

			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<div>
					<label for="categoryId" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
						Kategori Produk <span class="text-crimson">*</span>
					</label>
					<select
						id="categoryId"
						name="categoryId"
						bind:value={selectedCategoryId}
						required
						disabled={isBusy}
						class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brandy focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
					>
						{#each data.categories as cat (cat.id)}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="name" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
						Nama Produk <span class="text-crimson">*</span>
					</label>
					<input
						id="name"
						name="name"
						type="text"
						bind:value={productName}
						placeholder="Nama produk"
						required
						disabled={isBusy}
						class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brandy focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
					/>
				</div>

				<div>
					<label for="priceInt" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
						Harga Satuan (Rupiah) <span class="text-crimson">*</span>
					</label>
					<input
						id="priceInt"
						name="priceInt"
						type="number"
						bind:value={priceInt}
						min="0"
						step="1000"
						required
						disabled={isBusy}
						class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brandy focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
					/>
				</div>

				<div>
					<label for="weightGrams" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
						Perkiraan Berat (gram)
					</label>
					<input
						id="weightGrams"
						name="weightGrams"
						type="number"
						bind:value={weightGrams}
						min="0"
						disabled={isBusy}
						class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brandy focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
					/>
				</div>
			</div>

			<div class="mt-4">
				<div class="flex items-center justify-between">
					<label for="description" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
						Deskripsi Produk (Opsional)
					</label>
					<span class="text-xs text-neutral-400">{description.length}/1000</span>
				</div>
				<textarea
					id="description"
					name="description"
					bind:value={description}
					rows="3"
					maxlength="1000"
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brandy focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
				></textarea>
			</div>

			<div class="mt-4 flex items-center gap-2">
				<input
					id="active"
					name="active"
					type="checkbox"
					bind:checked={active}
					disabled={isBusy}
					class="h-4 w-4 rounded border-neutral-300 text-brandy focus:ring-brandy"
				/>
				<label for="active" class="text-xs font-medium text-neutral-800 dark:text-neutral-200">
					Aktifkan produk di katalog publik
				</label>
			</div>
		</div>

		<!-- Section: Inventaris & Stok -->
		<div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
						Inventaris & Manajemen Stok
					</h2>
					<p class="text-xs text-neutral-500">
						Atur batas kuantitas dan sistem varian produk.
					</p>
				</div>

				<div class="flex items-center gap-2">
					<input
						id="trackStock"
						name="trackStock"
						type="checkbox"
						bind:checked={trackStock}
						disabled={isBusy}
						class="h-4 w-4 rounded border-neutral-300 text-brandy focus:ring-brandy"
					/>
					<label for="trackStock" class="text-xs font-medium text-neutral-800 dark:text-neutral-200">
						Lacak Jumlah Stok
					</label>
				</div>
			</div>

			{#if !hasVariants}
				<div class="mt-4 max-w-xs">
					<label for="stock" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
						Jumlah Stok Tersedia
					</label>
					<input
						id="stock"
						name="stock"
						type="number"
						bind:value={stock}
						min="0"
						disabled={isBusy || !trackStock}
						class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 disabled:opacity-50 focus:border-brandy focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
					/>
				</div>
			{/if}

			<!-- Opsi Varian -->
			<div class="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<input
							id="hasVariants"
							type="checkbox"
							bind:checked={hasVariants}
							disabled={isBusy}
							class="h-4 w-4 rounded border-neutral-300 text-brandy focus:ring-brandy"
						/>
						<label for="hasVariants" class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
							Produk memiliki varian ukuran / warna / tipe
						</label>
					</div>

					{#if hasVariants}
						<button
							type="button"
							onclick={addVariant}
							disabled={isBusy}
							class="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
						>
							<Plus size={14} />
							<span>Tambah Varian</span>
						</button>
					{/if}
				</div>

				{#if hasVariants}
					<div class="mt-4 space-y-3">
						{#if variants.length === 0}
							<div class="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500 dark:border-neutral-700">
								Belum ada baris varian. Klik "Tambah Varian" untuk mulai menambahkan opsi.
							</div>
						{/if}

						{#each variants as item, idx (item.id || idx)}
							<div class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
								<div class="flex-1">
									<input
										type="text"
										bind:value={item.name}
										placeholder="Nama varian"
										required
										disabled={isBusy}
										class="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-brandy focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
									/>
								</div>
								<div class="w-28">
									<input
										type="number"
										bind:value={item.stock}
										min="0"
										placeholder="Stok"
										disabled={isBusy || !item.trackStock}
										class="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 disabled:opacity-50 focus:border-brandy focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
									/>
								</div>
								<button
									type="button"
									onclick={() => removeVariant(idx)}
									disabled={isBusy}
									class="rounded-md p-1.5 text-neutral-400 hover:bg-crimson/10 hover:text-crimson"
									aria-label="Hapus varian"
								>
									<Trash2 size={15} />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Section: Upload Foto Produk -->
		<div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
						Galeri Foto Produk
					</h2>
					<p class="text-xs text-neutral-500">
						Maksimal 4 gambar.
					</p>
				</div>
				<span class="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
					{totalImagesCount}/4 Foto
				</span>
			</div>

			<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
				<!-- Foto yang sudah tersimpan -->
				{#each existingImages as url (url)}
					<div class="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950">
						<img
							src={url}
							alt="Foto produk"
							class="h-full w-full object-cover"
						/>
						<button
							type="button"
							onclick={() => removeExistingImage(url)}
							disabled={isBusy}
							class="absolute right-2 top-2 rounded-full bg-neutral-900/80 p-1.5 text-white transition-opacity hover:bg-crimson group-hover:opacity-100"
							aria-label="Hapus foto tersimpan"
						>
							<Trash2 size={13} />
						</button>
					</div>
				{/each}

				<!-- Foto baru yang baru dipilih -->
				{#each newImages as img, idx (img.id)}
					<div class="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950">
						<img
							src={img.previewUrl}
							alt="Preview foto baru"
							class="h-full w-full object-cover"
						/>
						<button
							type="button"
							onclick={() => removeNewImage(idx)}
							disabled={isBusy}
							class="absolute right-2 top-2 rounded-full bg-neutral-900/80 p-1.5 text-white transition-opacity hover:bg-crimson group-hover:opacity-100"
							aria-label="Hapus foto baru"
						>
							<Trash2 size={13} />
						</button>
					</div>
				{/each}

				{#if totalImagesCount < 4}
					<label
						class="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 transition-colors hover:border-brandy dark:border-neutral-700 dark:hover:border-papaya"
					>
						<UploadCloud size={24} class="text-neutral-400" />
						<span class="mt-2 text-[11px] font-medium text-neutral-500">Tambah Foto</span>
						<input
							type="file"
							accept="image/*"
							multiple
							disabled={isBusy || isProcessingImages}
							onchange={handleImageSelect}
							class="hidden"
						/>
					</label>
				{/if}
			</div>
		</div>

		<!-- Action Footer -->
		<div class="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
			<a
				href={resolve('/admin/products')}
				class="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
			>
				Batal
			</a>
			<button
				type="submit"
				disabled={isBusy || isProcessingImages}
				class="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 disabled:opacity-50 dark:bg-papaya dark:text-ink dark:hover:bg-papaya/90"
			>
				<Save size={15} />
				<span>{isBusy ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
			</button>
		</div>
	</form>
</div>
</BusyOverlay>
