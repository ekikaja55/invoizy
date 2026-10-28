<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionResult } from '@sveltejs/kit';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import { ArrowLeft, Save, Plus, Trash2, UploadCloud } from '@lucide/svelte';
	import { processAndWatermarkImage } from '$lib/utils/image-watermark';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isBusy = $state(false);
	let selectedCategoryId = $state(data.categories[0]?.id ?? '');
	let productName = $state('');
	let priceInt = $state<number | ''>('');
	let weightGrams = $state(0);
	let trackStock = $state(true);
	let stock = $state<number>(0);
	let description = $state('');
	let active = $state(true);

	// Image uploader state
	interface ImagePreview {
		id: string;
		file: File;
		previewUrl: string;
	}
	let images = $state<ImagePreview[]>([]);
	let isProcessingImages = $state(false);

	// Variant state
	interface VariantItem {
		id: string;
		name: string;
		stock: number;
		trackStock: boolean;
	}
	let hasVariants = $state(false);
	let variants = $state<VariantItem[]>([]);

	function addVariant() {
		variants = [
			...variants,
			{
				id: `var-${Date.now()}-${variants.length}`,
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

	async function handleImageSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const remainingSlots = 4 - images.length;
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
				images = [
					...images,
					{
						id: `img-${Date.now()}-${Math.random()}`,
						file: processedFile,
						previewUrl
					}
				];
			}
			toast.success(`${filesToProcess.length} gambar berhasil diproses dengan watermark.`);
		} catch (err) {
			console.error(err);
			toast.error('Gagal memproses gambar.');
		} finally {
			isProcessingImages = false;
			input.value = '';
		}
	}

	function removeImage(index: number) {
		const target = images[index];
		if (target) {
			URL.revokeObjectURL(target.previewUrl);
			images = images.filter((_, idx) => idx !== index);
		}
	}

	// Payload generator untuk use:enhance
	function prepareFormData({ formData }: { formData: FormData }) {
		isBusy = true;

		// Hapus field images mentah dari file input biasa
		formData.delete('images');
		// Masukkan file hasil watermark yang sudah diproses
		for (const img of images) {
			formData.append('images', img.file);
		}

		// Masukkan varian jika aktif
		if (hasVariants && variants.length > 0) {
			const validVariants = variants
				.filter((v) => v.name.trim() !== '')
				.map((v) => ({
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
				success: 'Produk berhasil ditambahkan!'
			});
		};
	}
</script>

<BusyOverlay active={isBusy}>
	<div class="mx-auto max-w-4xl space-y-6 pb-20">
		<!-- Header Bar -->
		<div
			class="flex items-center justify-between border-b-2 border-[#262626]/10 pb-4 dark:border-[#f2efe9]/10"
		>
			<div class="flex items-center gap-3">
				<a
					href={resolve('/admin/products')}
					class="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
					aria-label="Kembali ke daftar produk"
				>
					<ArrowLeft size={16} />
				</a>
				<div>
					<h1
						class="text-xl font-black tracking-tight text-[#262626] sm:text-2xl dark:text-[#f2efe9]"
					>
						Tambah Produk Baru
					</h1>
					<p class="font-mono text-xs text-[#262626]/70 sm:text-[13px] dark:text-[#f2efe9]/70">
						Isi informasi katalog, foto dengan watermark otomatis, dan varian stok.
					</p>
				</div>
			</div>

			<a
				href={resolve('/admin/products')}
				class="rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
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
			<!-- Section: Informasi Dasar -->
			<div
				class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-6 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-[4px_4px_0px_#f2efe9]"
			>
				<span
					class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
					>+</span
				>
				<h2 class="font-serif text-lg font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
					Informasi Katalog
				</h2>

				<div class="mt-4 grid gap-4 sm:grid-cols-2">
					<div>
						<label
							for="categoryId"
							class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>
							Kategori Produk <span class="text-red-500">*</span>
						</label>
						<select
							id="categoryId"
							name="categoryId"
							bind:value={selectedCategoryId}
							required
							disabled={isBusy}
							class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						>
							{#each data.categories as cat (cat.id)}
								<option value={cat.id}>{cat.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<label
							for="name"
							class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>
							Nama Produk <span class="text-red-500">*</span>
						</label>
						<input
							id="name"
							name="name"
							type="text"
							bind:value={productName}
							placeholder="Misal: Acrylic Standee Chibi Ver."
							required
							disabled={isBusy}
							class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						/>
					</div>

					<div>
						<label
							for="priceInt"
							class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>
							Harga Satuan (Rupiah) <span class="text-red-500">*</span>
						</label>
						<input
							id="priceInt"
							name="priceInt"
							type="number"
							bind:value={priceInt}
							min="0"
							step="1000"
							placeholder="25000"
							required
							disabled={isBusy}
							class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs font-bold text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						/>
					</div>

					<div>
						<label
							for="weightGrams"
							class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>
							Perkiraan Berat (gram)
						</label>
						<input
							id="weightGrams"
							name="weightGrams"
							type="number"
							bind:value={weightGrams}
							min="0"
							disabled={isBusy}
							class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						/>
					</div>
				</div>

				<div class="mt-4">
					<div class="flex items-center justify-between">
						<label
							for="description"
							class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>
							Deskripsi Produk (Opsional)
						</label>
						<span class="font-mono text-xs text-[#262626]/50 dark:text-[#f2efe9]/50"
							>{description.length}/1000</span
						>
					</div>
					<textarea
						id="description"
						name="description"
						bind:value={description}
						rows="3"
						maxlength="1000"
						placeholder="Tuliskan spesifikasi bahan, ukuran dimensi, atau catatan detail lainnya..."
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
					></textarea>
				</div>

				<div class="mt-4 flex items-center gap-2">
					<input
						id="active"
						name="active"
						type="checkbox"
						bind:checked={active}
						disabled={isBusy}
						class="h-4 w-4 rounded border-2 border-[#262626] text-[#262626] focus:ring-0"
					/>
					<label
						for="active"
						class="font-mono text-xs font-bold text-[#262626] sm:text-sm dark:text-[#f2efe9]"
					>
						Aktifkan produk di katalog publik
					</label>
				</div>
			</div>

			<!-- Section: Inventaris & Stok -->
			<div
				class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-6 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-[4px_4px_0px_#f2efe9]"
			>
				<span
					class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
					>+</span
				>
				<div class="flex items-center justify-between">
					<div>
						<h2
							class="font-serif text-lg font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]"
						>
							Inventaris & Manajemen Stok
						</h2>
						<p class="font-mono text-xs text-[#262626]/60 sm:text-[13px] dark:text-[#f2efe9]/60">
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
							class="h-4 w-4 rounded border-2 border-[#262626] text-[#262626] focus:ring-0"
						/>
						<label
							for="trackStock"
							class="font-mono text-xs font-bold text-[#262626] sm:text-sm dark:text-[#f2efe9]"
						>
							Lacak Jumlah Stok
						</label>
					</div>
				</div>

				{#if !hasVariants}
					<div class="mt-4 max-w-xs">
						<label
							for="stock"
							class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>
							Jumlah Stok Tersedia
						</label>
						<input
							id="stock"
							name="stock"
							type="number"
							bind:value={stock}
							min="0"
							disabled={isBusy || !trackStock}
							class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:outline-none disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						/>
					</div>
				{/if}

				<!-- Opsi Varian -->
				<div class="mt-6 border-t-2 border-[#262626]/10 pt-4 dark:border-[#f2efe9]/10">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<input
								id="hasVariants"
								type="checkbox"
								bind:checked={hasVariants}
								disabled={isBusy}
								class="h-4 w-4 rounded border-2 border-[#262626] text-[#262626] focus:ring-0"
							/>
							<label
								for="hasVariants"
								class="font-mono text-xs font-bold text-[#262626] sm:text-sm dark:text-[#f2efe9]"
							>
								Produk memiliki varian ukuran / warna / tipe
							</label>
						</div>

						{#if hasVariants}
							<button
								type="button"
								onclick={addVariant}
								disabled={isBusy}
								class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
							>
								<Plus size={15} />
								<span>Tambah Varian</span>
							</button>
						{/if}
					</div>

					{#if hasVariants}
						<div class="mt-4 space-y-3">
							{#if variants.length === 0}
								<div
									class="rounded-lg border-2 border-dashed border-[#262626]/20 p-4 text-center font-mono text-xs text-[#262626]/60 sm:text-[13px] dark:border-[#f2efe9]/20 dark:text-[#f2efe9]/60"
								>
									Belum ada baris varian. Klik "Tambah Varian" untuk mulai menambahkan opsi.
								</div>
							{/if}

							{#each variants as item, idx (item.id)}
								<div
									class="flex items-center gap-3 rounded-lg border-2 border-[#262626] bg-[#f2efe9]/40 p-3 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-black/20"
								>
									<div class="flex-1">
										<input
											type="text"
											bind:value={item.name}
											placeholder="Nama varian (e.g. Size M, Ver. A)"
											required
											disabled={isBusy}
											class="w-full rounded-md border-2 border-[#262626] bg-white px-3 py-2 font-mono text-xs text-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9]"
										/>
									</div>
									<div class="w-32">
										<input
											type="number"
											bind:value={item.stock}
											min="0"
											placeholder="Stok"
											disabled={isBusy || !item.trackStock}
											class="w-full rounded-md border-2 border-[#262626] bg-white px-3 py-2 font-mono text-xs font-bold text-[#262626] focus:outline-none disabled:opacity-50 sm:text-sm dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9]"
										/>
									</div>
									<button
										type="button"
										onclick={() => removeVariant(idx)}
										disabled={isBusy}
										class="rounded-md border-2 border-[#262626] bg-red-100 p-2 text-red-900 shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 dark:bg-red-950/60 dark:text-red-300"
										aria-label="Hapus varian"
									>
										<Trash2 size={16} />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Section: Upload Foto Produk -->
			<div
				class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-6 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-[4px_4px_0px_#f2efe9]"
			>
				<span
					class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
					>+</span
				>
				<div class="flex items-center justify-between">
					<div>
						<h2
							class="font-serif text-lg font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]"
						>
							Galeri Foto Produk
						</h2>
						<p class="font-mono text-xs text-[#262626]/60 sm:text-[13px] dark:text-[#f2efe9]/60">
							Maksimal 4 gambar. Foto otomatis dikonversi ke WebP dan dibubuhi watermark
							perlindungan karya.
						</p>
					</div>
					<span
						class="rounded-md border border-[#262626] bg-[#f2efe9] px-3 py-1 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] dark:bg-neutral-800 dark:text-[#f2efe9]"
					>
						{images.length}/4 Foto
					</span>
				</div>

				<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
					{#each images as img, idx (img.id)}
						<div
							class="group relative aspect-square overflow-hidden rounded-lg border-2 border-[#262626] bg-neutral-100 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-neutral-950"
						>
							<img
								src={img.previewUrl}
								alt="Preview foto {idx + 1}"
								class="h-full w-full object-cover"
							/>
							<button
								type="button"
								onclick={() => removeImage(idx)}
								disabled={isBusy}
								class="absolute top-2 right-2 rounded-md border border-[#262626] bg-red-500 p-2 text-white shadow-[1px_1px_0px_#262626] transition-transform hover:scale-105"
								aria-label="Hapus foto"
							>
								<Trash2 size={14} />
							</button>
						</div>
					{/each}

					{#if images.length < 4}
						<label
							class="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#262626] bg-[#f2efe9]/40 transition-colors hover:bg-white dark:border-[#f2efe9]/40 dark:bg-black/20 dark:hover:bg-[#1a1825]"
						>
							<UploadCloud size={26} class="text-[#262626]/50 dark:text-[#f2efe9]/50" />
							<span
								class="mt-2 font-mono text-xs font-bold text-[#262626]/70 sm:text-[13px] dark:text-[#f2efe9]/70"
								>Unggah Foto</span
							>
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
			<div
				class="flex items-center justify-end gap-3 border-t-2 border-[#262626]/10 pt-4 dark:border-[#f2efe9]/10"
			>
				<a
					href={resolve('/admin/products')}
					class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					Batal
				</a>
				<button
					type="submit"
					disabled={isBusy || isProcessingImages}
					class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#262626] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
				>
					<Save size={16} />
					<span>{isBusy ? 'Menyimpan...' : 'Simpan Produk Baru'}</span>
				</button>
			</div>
		</form>
	</div>
</BusyOverlay>
