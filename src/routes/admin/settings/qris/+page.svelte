<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
	import { resolve } from '$app/paths';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import {
		Plus,
		Pencil,
		Trash2,
		X,
		ArrowLeft,
		Eye,
		UploadCloud,
		GripVertical,
		ArrowUpDown,
		Check
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showCreateForm = $state(false);
	let editingId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);
	let preview = $state<{ label: string; imageUrl: string } | null>(null);
	let isBusy = $state(false);
	let processingId = $state<string | null>(null);

	// State DnD Reorder
	let qrisList = $state([...data.codes]);
	let initialSnapshot = $state([...data.codes]);
	let isReordering = $state(false);
	let hasUnsavedChanges = $state(false);
	let isSaving = $state(false);

	// State DND File Upload Dropzone
	let fileInputRef = $state<HTMLInputElement | null>(null);
	let selectedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let isDraggingFile = $state(false);

	$effect(() => {
		if (!isReordering) {
			qrisList = [...data.codes];
			initialSnapshot = [...data.codes];
		}
	});

	// Cleanup object URL saat unmount untuk mencegah memory leak
	$effect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	});

	beforeNavigate((navigation) => {
		if (hasUnsavedChanges) {
			const answer = window.confirm(
				'Ada perubahan urutan QRIS yang belum disimpan. Yakin ingin keluar dari halaman?'
			);
			if (!answer) {
				navigation.cancel();
			}
		}
	});

	function handleFileSelected(file: File) {
		const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
		const MAX_SIZE = 2 * 1024 * 1024; // 2MB

		if (!ALLOWED_TYPES.includes(file.type)) {
			toast.error('Format file harus PNG, JPEG, atau WebP.');
			return;
		}

		if (file.size > MAX_SIZE) {
			toast.error('Ukuran file QRIS maksimal 2MB.');
			return;
		}

		selectedFile = file;
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		previewUrl = URL.createObjectURL(file);

		// Sinkronisasi file ke native hidden input agar form standard submission berjalan normal
		if (fileInputRef) {
			const dt = new DataTransfer();
			dt.items.add(file);
			fileInputRef.files = dt.files;
		}
	}

	function handleDropFile(e: DragEvent) {
		e.preventDefault();
		isDraggingFile = false;
		if (e.dataTransfer && e.dataTransfer.files.length > 0) {
			const file = e.dataTransfer.files[0];
			handleFileSelected(file);
		}
	}

	function clearSelectedFile() {
		selectedFile = null;
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}
		if (fileInputRef) {
			fileInputRef.value = '';
		}
	}

	function startReorder() {
		isReordering = true;
		hasUnsavedChanges = false;
		showCreateForm = false;
		editingId = null;
		deletingId = null;
		qrisList = [...data.codes];
		initialSnapshot = [...data.codes];
	}

	function cancelReorder() {
		if (hasUnsavedChanges) {
			if (!window.confirm('Batalkan perubahan susunan urutan QRIS?')) {
				return;
			}
			qrisList = [...initialSnapshot];
			hasUnsavedChanges = false;
		}
		isReordering = false;
	}

	function handleDndDrop(state: DragDropState, targetQris: (typeof data.codes)[0]) {
		const source = state.draggedItem as typeof targetQris | undefined;
		if (!source || source.id === targetQris.id) return;

		const fromIndex = qrisList.findIndex((q) => q.id === source.id);
		const toIndex = qrisList.findIndex((q) => q.id === targetQris.id);
		if (fromIndex === -1 || toIndex === -1) return;

		const updated = [...qrisList];
		const [moved] = updated.splice(fromIndex, 1);
		updated.splice(toIndex, 0, moved);

		qrisList = updated;
		hasUnsavedChanges = true;
	}

	async function saveReorder() {
		if (qrisList.length === 0) return;
		isSaving = true;
		try {
			const formData = new FormData();
			formData.append('orderedIds', JSON.stringify(qrisList.map((q) => q.id)));
			const res = await fetch('?/reorderBatch', {
				method: 'POST',
				body: formData
			});
			if (!res.ok) throw new Error('Gagal menghubungi server.');
			await invalidateAll();
			hasUnsavedChanges = false;
			isReordering = false;
			toast.success('Urutan QRIS berhasil disimpan!');
		} catch {
			toast.error('Gagal menyimpan urutan QRIS.');
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl space-y-6 pb-20 select-none">
	<!-- Page Header -->
	<div
		class="flex flex-col gap-4 border-b-2 border-[#262626]/10 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9]/10"
	>
		<div class="flex items-start gap-3">
			<a
				href={resolve('/admin/settings')}
				class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				aria-label="Kembali ke Pengaturan"
			>
				<ArrowLeft size={16} />
			</a>
			<div>
				<div
					class="mb-1 inline-flex items-center gap-1.5 rounded-md border-2 border-[#262626] bg-[#e87a5d] px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626]"
				>
					<span>PEMBAYARAN QRIS</span>
				</div>
				<h1
					class="text-xl font-black tracking-tight text-[#262626] sm:text-2xl dark:text-[#f2efe9]"
				>
					Kelola Master QRIS
				</h1>
				<p class="font-mono text-xs text-[#262626]/70 sm:text-[13px] dark:text-[#f2efe9]/70">
					Unggah gambar barcode QRIS dinamis/statis untuk ditampilkan pada invoice dan checkout.
				</p>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
			{#if data.codes.length > 1 && !isReordering && !showCreateForm}
				<button
					type="button"
					onclick={startReorder}
					disabled={isBusy}
					class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:flex-initial sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					<ArrowUpDown size={14} />
					<span>Atur Urutan</span>
				</button>
			{/if}

			{#if !isReordering}
				<button
					onclick={() => {
						showCreateForm = !showCreateForm;
						if (!showCreateForm) clearSelectedFile();
					}}
					disabled={isBusy}
					class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-[#262626] bg-[#262626] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:flex-initial sm:text-sm dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
				>
					<Plus size={15} />
					<span>QRIS Baru</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Bar Navigasi Mode Reordering DnD -->
	{#if isReordering}
		<div
			class="flex flex-col gap-3 rounded-xl border-2 border-[#262626] bg-[#fea770]/20 p-4 shadow-[3px_3px_0px_#262626] sm:flex-row sm:items-center sm:justify-between dark:border-[#a2e1db] dark:bg-[#fea770]/10"
		>
			<div
				class="flex items-center gap-2 font-mono text-xs font-bold text-[#262626] dark:text-[#f2efe9]"
			>
				<GripVertical size={16} class="text-[#262626] dark:text-[#fea770]" />
				<span>Tarik & lepas kartu untuk mengubah urutan tampilan QRIS.</span>
			</div>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={cancelReorder}
					disabled={isSaving}
					class="rounded-lg border-2 border-[#262626] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[1.5px_1.5px_0px_#262626] transition-transform hover:-translate-y-0.5 disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					Batal
				</button>
				<button
					type="button"
					onclick={saveReorder}
					disabled={isSaving || !hasUnsavedChanges}
					class="flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-[#262626] px-4 py-1.5 font-mono text-xs font-bold text-white shadow-[1.5px_1.5px_0px_#262626] transition-transform hover:-translate-y-0.5 disabled:opacity-40 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
				>
					<Check size={14} />
					<span>{isSaving ? 'Menyimpan...' : 'Simpan Urutan'}</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Form Buat QRIS Baru dengan Taktil DND Dropzone & Live Preview -->
	{#if showCreateForm && !isReordering}
		<form
			method="POST"
			action="?/create"
			enctype="multipart/form-data"
			use:enhance={() => {
				isBusy = true;
				return async ({ result, update }) => {
					handleFormResult(result, { success: 'QRIS berhasil ditambahkan.' });
					if (result.type === 'success') {
						showCreateForm = false;
						clearSelectedFile();
					}
					await update({ reset: result.type === 'success' });
					isBusy = false;
				};
			}}
			class="relative space-y-5 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-6 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
				>+</span
			>

			<div>
				<label
					for="label"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>Label QRIS</label
				>
				<input
					id="label"
					name="label"
					placeholder="Misal: QRIS Statis Toko, QRIS Shopee, BCA..."
					required
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
				/>
			</div>

			<!-- Taktil DND Dropzone File Upload -->
			<div>
				<span
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
				>
					Gambar QRIS (Drag & Drop)
				</span>

				<!-- Input Native Tersembunyi (Disinkronkan secara programatik) -->
				<input
					type="file"
					name="imageFile"
					id="imageFileInput"
					accept="image/png,image/jpeg,image/webp"
					class="sr-only"
					bind:this={fileInputRef}
					required
					disabled={isBusy}
					onchange={(e) => {
						const input = e.currentTarget;
						if (input.files && input.files.length > 0) {
							handleFileSelected(input.files[0]);
						}
					}}
				/>

				{#if !previewUrl}
					<!-- Area Dropzone Kosong -->
					<div
						role="button"
						tabindex="0"
						onclick={() => fileInputRef?.click()}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								fileInputRef?.click();
							}
						}}
						ondragover={(e) => {
							e.preventDefault();
							isDraggingFile = true;
						}}
						ondragleave={() => (isDraggingFile = false)}
						ondrop={handleDropFile}
						class="mt-2 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-all sm:p-8 {isDraggingFile
							? 'scale-[1.01] border-[#fea770] bg-[#fea770]/20'
							: 'border-[#262626]/40 bg-[#f2efe9]/30 hover:border-[#262626] hover:bg-[#a2e1db]/15 dark:border-[#f2efe9]/30 dark:bg-black/20 dark:hover:border-[#a2e1db]'}"
					>
						<div
							class="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#262626] bg-white shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#1a1825]"
						>
							<UploadCloud size={24} class="text-[#262626] dark:text-[#a2e1db]" />
						</div>
						<div>
							<p class="font-mono text-xs font-bold text-[#262626] sm:text-sm dark:text-[#f2efe9]">
								Tarik & Lepas gambar QRIS ke sini
							</p>
							<p class="mt-1 font-mono text-[11px] text-[#262626]/60 dark:text-[#f2efe9]/60">
								atau <span class="underline underline-offset-2">pilih file dari perangkat</span>
							</p>
						</div>
						<div class="flex items-center gap-2">
							<span
								class="rounded border border-[#262626]/20 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-[#262626]/70 uppercase dark:bg-[#252331] dark:text-[#f2efe9]/70"
							>
								PNG / JPEG / WebP
							</span>
							<span
								class="rounded border border-[#262626]/20 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-[#262626]/70 uppercase dark:bg-[#252331] dark:text-[#f2efe9]/70"
							>
								Maks 2MB
							</span>
						</div>
					</div>
				{:else}
					<!-- Card Pratinjau Gambar Terpilih -->
					<div
						class="mt-2 flex items-center gap-4 rounded-xl border-2 border-[#262626] bg-[#f2efe9]/40 p-4 shadow-[3px_3px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#1a1825]"
					>
						<img
							src={previewUrl}
							alt="Pratinjau QRIS"
							class="h-20 w-20 shrink-0 rounded-lg border-2 border-[#262626] bg-white object-contain p-1 shadow-[2px_2px_0px_#262626]"
						/>
						<div class="min-w-0 flex-1">
							<p
								class="truncate font-mono text-xs font-black text-[#262626] sm:text-sm dark:text-[#f2efe9]"
							>
								{selectedFile?.name || 'File QRIS'}
							</p>
							<p class="mt-0.5 font-mono text-[11px] text-[#262626]/60 dark:text-[#f2efe9]/60">
								{selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB · Siap diunggah
							</p>
							<button
								type="button"
								onclick={clearSelectedFile}
								disabled={isBusy}
								class="mt-2 inline-flex items-center gap-1 rounded border border-[#262626] bg-white px-2.5 py-1 font-mono text-xs font-bold text-red-600 shadow-[1px_1px_0px_#262626] hover:bg-red-50 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-red-400"
							>
								<X size={12} />
								<span>Ganti / Hapus File</span>
							</button>
						</div>
					</div>
				{/if}
			</div>

			<div class="flex gap-2.5 pt-2">
				<button
					type="submit"
					disabled={isBusy || !selectedFile}
					class="rounded-lg border-2 border-[#262626] bg-emerald-500 px-5 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
				>
					{isBusy ? 'Mengunggah...' : 'Simpan QRIS'}
				</button>
				<button
					type="button"
					disabled={isBusy}
					onclick={() => {
						showCreateForm = false;
						clearSelectedFile();
					}}
					class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					Batal
				</button>
			</div>
		</form>
	{/if}

	<!-- Daftar QRIS Master dengan Dukungan DnD Reorder -->
	<BusyOverlay active={isBusy && !processingId}>
		<div class="space-y-3">
			{#if !data.codes}
				<ListSkeleton rows={3} />
			{:else if qrisList.length === 0}
				<div
					class="rounded-[14px_4px_14px_4px] border-2 border-dashed border-[#262626] bg-white p-8 text-center shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/40 dark:bg-[#1a1825]"
				>
					<p class="font-mono text-xs text-[#262626]/60 sm:text-[13px] dark:text-[#f2efe9]/60">
						Belum ada QRIS yang tersimpan. Klik "QRIS Baru" untuk menambahkan.
					</p>
				</div>
			{:else}
				{#each qrisList as qris, index (qris.id)}
					<div
						use:draggable={{
							container: 'admin-qris-reorder',
							dragData: qris,
							handle: '.drag-handle-qris',
							disabled: !isReordering
						}}
						use:droppable={{
							container: 'admin-qris-reorder',
							disabled: !isReordering,
							callbacks: {
								onDrop: (state) => handleDndDrop(state, qris)
							}
						}}
						class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] transition-all dark:border-[#f2efe9]/20 dark:bg-[#1a1825] {isReordering
							? 'cursor-grab hover:bg-[#fea770]/10 dark:hover:bg-[#fea770]/5'
							: ''}"
					>
						<BusyOverlay active={processingId === qris.id}>
							<span
								class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
								>+</span
							>
							<div class="flex items-start gap-3 sm:gap-4">
								<!-- Handle Drag Reorder -->
								{#if isReordering}
									<div
										class="drag-handle-qris flex h-20 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg border-2 border-dashed border-[#262626]/30 bg-neutral-100 text-[#262626]/60 transition-colors hover:border-[#262626] hover:bg-neutral-200 active:cursor-grabbing dark:border-[#f2efe9]/30 dark:bg-[#252331] dark:text-[#f2efe9]"
										title="Tarik untuk memindahkan urutan"
									>
										<GripVertical size={18} />
									</div>
								{/if}

								<img
									src={qris.imageUrl}
									alt={qris.label}
									loading="lazy"
									decoding="async"
									class="h-20 w-20 shrink-0 rounded-lg border-2 border-[#262626] bg-white object-contain p-1 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30"
								/>

								<div class="min-w-0 flex-1">
									{#if editingId === qris.id && !isReordering}
										<form
											method="POST"
											action="?/update"
											use:enhance={() => {
												isBusy = true;
												processingId = qris.id;
												return async ({ result, update }) => {
													handleFormResult(result, { success: 'QRIS berhasil diperbarui.' });
													if (result.type === 'success') editingId = null;
													await update();
													isBusy = false;
													processingId = null;
												};
											}}
											class="space-y-3"
										>
											<input type="hidden" name="id" value={qris.id} />
											<div>
												<label
													for="edit-qris-label-{qris.id}"
													class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
													>Label</label
												>
												<input
													id="edit-qris-label-{qris.id}"
													name="label"
													value={qris.label}
													required
													disabled={isBusy}
													class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
												/>
											</div>
											<label
												class="flex items-center gap-2 font-mono text-xs font-bold text-[#262626] sm:text-sm dark:text-[#f2efe9]"
											>
												<input
													type="checkbox"
													name="active"
													checked={qris.active}
													disabled={isBusy}
													class="h-4 w-4 rounded border-2 border-[#262626] text-[#262626] focus:ring-0"
												/>
												<span>Aktif (tampilkan di invoice)</span>
											</label>
											<div class="flex gap-2 pt-1">
												<button
													type="submit"
													disabled={isBusy}
													class="rounded-lg border-2 border-[#262626] bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
												>
													Simpan
												</button>
												<button
													type="button"
													disabled={isBusy}
													onclick={() => (editingId = null)}
													class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
												>
													Batal
												</button>
											</div>
										</form>
									{:else}
										<div class="flex items-center justify-between">
											<div>
												<p
													class="text-sm font-bold text-[#262626] sm:text-base dark:text-[#f2efe9]"
												>
													{qris.label}
													{#if !qris.active}
														<span
															class="ml-1.5 rounded border border-[#262626]/30 bg-neutral-200 px-2 py-0.5 font-mono text-xs font-bold text-[#262626] dark:border-[#f2efe9]/30 dark:bg-neutral-800 dark:text-[#f2efe9]"
														>
															Nonaktif
														</span>
													{/if}
												</p>
												<p
													class="font-mono text-xs text-[#262626]/60 sm:text-[13px] dark:text-[#f2efe9]/60"
												>
													Urutan #{index + 1}
												</p>
											</div>

											{#if !isReordering}
												<div class="flex items-center gap-1.5">
													<button
														onclick={() =>
															(preview = { label: qris.label, imageUrl: qris.imageUrl })}
														disabled={isBusy}
														aria-label="Pratinjau {qris.label}"
														title="Lihat Gambar"
														class="rounded-md border-2 border-[#262626] bg-white p-2 text-[#262626] shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-y-0.5 disabled:opacity-30 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
													>
														<Eye size={15} />
													</button>

													<button
														onclick={() => (editingId = qris.id)}
														disabled={isBusy}
														title="Ubah rincian"
														class="rounded-md border-2 border-[#262626] bg-white p-2 text-[#262626] shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-y-0.5 disabled:opacity-30 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
													>
														<Pencil size={15} />
													</button>

													<button
														onclick={() => (deletingId = qris.id)}
														disabled={isBusy}
														title="Hapus QRIS"
														class="rounded-md border-2 border-[#262626] bg-red-100 p-2 text-red-900 shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-y-0.5 disabled:opacity-30 dark:bg-red-950/60 dark:text-red-300"
													>
														<Trash2 size={15} />
													</button>
												</div>
											{/if}
										</div>

										{#if deletingId === qris.id && !isReordering}
											<div
												class="mt-3 flex flex-col gap-2 rounded-lg border-2 border-[#262626] bg-red-100 p-3 font-mono text-xs font-bold text-red-900 shadow-[2px_2px_0px_#262626] sm:flex-row sm:items-center sm:justify-between sm:text-sm dark:bg-red-950 dark:text-red-200"
											>
												<span>Hapus "{qris.label}"?</span>
												<div class="flex gap-2">
													<form
														method="POST"
														action="?/delete"
														use:enhance={() => {
															isBusy = true;
															processingId = qris.id;
															return async ({ result, update }) => {
																handleFormResult(result, { success: 'QRIS berhasil dihapus.' });
																if (result.type === 'success') deletingId = null;
																await update();
																isBusy = false;
																processingId = null;
															};
														}}
													>
														<input type="hidden" name="id" value={qris.id} />
														<button
															type="submit"
															disabled={isBusy}
															class="rounded-md border-2 border-[#262626] bg-red-600 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
														>
															{isBusy ? 'Menghapus...' : 'Ya, Hapus'}
														</button>
													</form>
													<button
														onclick={() => (deletingId = null)}
														disabled={isBusy}
														class="rounded-md border-2 border-[#262626] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
													>
														<X size={15} />
													</button>
												</div>
											</div>
										{/if}
									{/if}
								</div>
							</div>
						</BusyOverlay>
					</div>
				{/each}
			{/if}
		</div>
	</BusyOverlay>

	{#if preview}
		<Modal open title={preview.label} hideActions onCancel={() => (preview = null)}>
			<div
				class="overflow-hidden rounded-lg border-2 border-[#262626] shadow-[3px_3px_0px_#262626]"
			>
				<img
					src={preview.imageUrl}
					alt={preview.label}
					class="max-h-[70vh] w-full bg-white object-contain"
				/>
			</div>
		</Modal>
	{/if}
</div>
