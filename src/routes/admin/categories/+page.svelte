<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import { Plus, Pencil, Trash2, GripVertical, Check, ArrowUpDown, X } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showCreateForm = $state(false);
	let editingId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);

	// isBusy = keamanan (cegah race condition saat create/edit/delete)
	// processingId = visual target overlay
	let isBusy = $state(false);
	let processingId = $state<string | null>(null);

	// State Reorder DnD
	let categoriesList = $state([...data.categories]);
	let initialSnapshot = $state([...data.categories]);
	let isReordering = $state(false);
	let hasUnsavedChanges = $state(false);
	let isSaving = $state(false);

	$effect(() => {
		if (!isReordering) {
			categoriesList = [...data.categories];
			initialSnapshot = [...data.categories];
		}
	});

	beforeNavigate((navigation) => {
		if (hasUnsavedChanges) {
			const answer = window.confirm(
				'Ada perubahan urutan kategori yang belum disimpan. Yakin ingin keluar dari halaman?'
			);
			if (!answer) {
				navigation.cancel();
			}
		}
	});

	function startReorder() {
		isReordering = true;
		hasUnsavedChanges = false;
		showCreateForm = false;
		editingId = null;
		deletingId = null;
		categoriesList = [...data.categories];
		initialSnapshot = [...data.categories];
	}

	function cancelReorder() {
		if (hasUnsavedChanges) {
			if (!window.confirm('Batalkan perubahan susunan urutan kategori?')) {
				return;
			}
			categoriesList = [...initialSnapshot];
			hasUnsavedChanges = false;
		}
		isReordering = false;
	}

	function handleDndDrop(state: DragDropState, targetCategory: (typeof data.categories)[0]) {
		const source = state.draggedItem as typeof targetCategory | undefined;
		if (!source || source.id === targetCategory.id) return;

		const fromIndex = categoriesList.findIndex((c) => c.id === source.id);
		const toIndex = categoriesList.findIndex((c) => c.id === targetCategory.id);
		if (fromIndex === -1 || toIndex === -1) return;

		const updated = [...categoriesList];
		const [moved] = updated.splice(fromIndex, 1);
		updated.splice(toIndex, 0, moved);

		categoriesList = updated;
		hasUnsavedChanges = true;
	}

	async function saveReorder() {
		if (categoriesList.length === 0) return;
		isSaving = true;
		try {
			const formData = new FormData();
			formData.append('orderedIds', JSON.stringify(categoriesList.map((c) => c.id)));
			const res = await fetch('?/reorderBatch', {
				method: 'POST',
				body: formData
			});
			if (!res.ok) throw new Error('Gagal menghubungi server.');
			await invalidateAll();
			hasUnsavedChanges = false;
			isReordering = false;
			toast.success('Urutan kategori berhasil disimpan!');
		} catch {
			toast.error('Gagal menyimpan urutan kategori.');
		} finally {
			isSaving = false;
		}
	}

	function startEdit(id: string) {
		editingId = id;
	}

	function cancelEdit() {
		editingId = null;
	}

	function confirmDelete(id: string) {
		deletingId = id;
	}

	function cancelDelete() {
		deletingId = null;
	}
</script>

<div class="mx-auto max-w-2xl space-y-6 pb-20">
	<!-- Top Bar Header -->
	<div
		class="flex flex-col gap-4 border-b-2 border-[#262626]/10 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9]/10"
	>
		<div>
			<div
				class="mb-1 inline-flex items-center gap-1.5 rounded-md border-2 border-[#262626] bg-[#e87a5d] px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626]"
			>
				<span>STRUKTUR KATALOG</span>
			</div>
			<h1 class="text-2xl font-black tracking-tight text-[#262626] dark:text-[#f2efe9]">
				Kategori Produk
			</h1>
			<p class="font-mono text-xs text-[#262626]/70 sm:text-[13px] dark:text-[#f2efe9]/70">
				Urutkan posisi kategori menggunakan drag-and-drop, ubah nama, atau tambah kategori baru.
			</p>
		</div>

		<div class="flex items-center gap-2">
			{#if !isReordering}
				<button
					type="button"
					onclick={startReorder}
					disabled={isBusy || data.categories.length <= 1}
					class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
				>
					<ArrowUpDown size={15} strokeWidth={2.5} />
					<span>Atur Urutan</span>
				</button>
				<button
					type="button"
					onclick={() => (showCreateForm = !showCreateForm)}
					disabled={isBusy}
					class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-[#262626] px-3.5 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9]"
				>
					<Plus size={15} strokeWidth={2.5} />
					<span>Kategori Baru</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Mode DnD Sticky Action Notice Bar -->
	{#if isReordering}
		<div
			class="flex flex-col gap-3 rounded-xl border-2 border-[#262626] bg-[#fea770]/20 p-4 shadow-[3px_3px_0px_#262626] sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9] dark:bg-[#fea770]/10 dark:shadow-[3px_3px_0px_#f2efe9]"
		>
			<div class="flex items-center gap-2.5">
				<span class="flex h-3 w-3 animate-pulse rounded-full bg-[#d9532f]"></span>
				<div>
					<p class="font-mono text-xs font-bold text-[#262626] sm:text-sm dark:text-[#f2efe9]">
						Mode Atur Urutan Aktif
					</p>
					<p class="font-mono text-xs text-[#737373] dark:text-[#a3a3a3]">
						Pegang tombol titik 6 (grip) pada kartu untuk menggeser posisi kategori.
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2 self-end sm:self-auto">
				<button
					type="button"
					onclick={cancelReorder}
					disabled={isSaving}
					class="rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#262335] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
				>
					Batal
				</button>
				<button
					type="button"
					onclick={saveReorder}
					disabled={isSaving || !hasUnsavedChanges}
					class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-[#262626] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-40 sm:text-sm dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9]"
				>
					<Check size={15} strokeWidth={2.5} />
					<span>{isSaving ? 'Menyimpan...' : 'Simpan Urutan'}</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Form Buat Kategori Baru -->
	{#if showCreateForm && !isReordering}
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				isBusy = true;
				return async ({ result, update }) => {
					handleFormResult(result, { success: 'Kategori berhasil dibuat.' });
					if (result.type === 'success') {
						showCreateForm = false;
					}
					await update({ reset: result.type === 'success' });
					isBusy = false;
				};
			}}
			class="relative space-y-4 rounded-xl border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-[4px_4px_0px_#f2efe9]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
				>+</span
			>
			<div>
				<label
					for="name"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
				>
					Nama Kategori Baru
				</label>
				<input
					id="name"
					name="name"
					placeholder="Misal: Standee, Keychain, Art Print..."
					required
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				/>
			</div>

			<div class="flex gap-2.5">
				<button
					type="submit"
					disabled={isBusy}
					class="rounded-lg border-2 border-[#262626] bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
				>
					{isBusy ? 'Menyimpan...' : 'Simpan Kategori'}
				</button>
				<button
					type="button"
					disabled={isBusy}
					onclick={() => (showCreateForm = false)}
					class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					Batal
				</button>
			</div>
		</form>
	{/if}

	<!-- Daftar Kategori dengan Support DnD -->
	{#if !data.categories}
		<ListSkeleton rows={3} />
	{:else if categoriesList.length === 0}
		<div
			class="rounded-xl border-2 border-dashed border-[#262626] bg-white p-8 text-center shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/40 dark:bg-[#1a1825]"
		>
			<p class="font-mono text-xs text-[#262626]/60 dark:text-[#f2efe9]/60">
				Belum ada kategori. Klik "Kategori Baru" untuk membuat kategori pertama Anda.
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each categoriesList as category, index (category.id)}
				<div
					use:draggable={{
						container: 'admin-categories-reorder',
						dragData: category,
						handle: '.drag-handle',
						disabled: !isReordering
					}}
					use:droppable={{
						container: 'admin-categories-reorder',
						disabled: !isReordering,
						callbacks: {
							onDrop: (state) => handleDndDrop(state, category)
						}
					}}
					class="relative rounded-xl border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] transition-all dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-[3px_3px_0px_#f2efe9] {isReordering
						? 'cursor-grab hover:bg-[#fcfbf9] dark:hover:bg-[#262335]'
						: ''}"
				>
					<BusyOverlay active={processingId === category.id}>
						<span
							class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
							>+</span
						>

						{#if editingId === category.id && !isReordering}
							<!-- Form Edit Inline -->
							<form
								method="POST"
								action="?/update"
								use:enhance={() => {
									isBusy = true;
									processingId = category.id;
									return async ({ result, update }) => {
										handleFormResult(result, { success: 'Kategori berhasil diperbarui.' });
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
								<input type="hidden" name="id" value={category.id} />
								<div>
									<label
										for="edit-name-{category.id}"
										class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
									>
										Nama Kategori
									</label>
									<input
										id="edit-name-{category.id}"
										name="name"
										value={category.name}
										required
										disabled={isBusy}
										class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
									/>
								</div>
								<input type="hidden" name="sortOrder" value={category.sortOrder} />
								<div class="flex gap-2">
									<button
										type="submit"
										disabled={isBusy}
										class="rounded-lg border-2 border-[#262626] bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
									>
										{isBusy ? 'Menyimpan...' : 'Simpan'}
									</button>
									<button
										type="button"
										disabled={isBusy}
										onclick={cancelEdit}
										class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
									>
										Batal
									</button>
								</div>
							</form>
						{:else}
							<!-- Tampilan Baris Kategori -->
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									{#if isReordering}
										<!-- Grip Handle Drag -->
										<button
											type="button"
											class="drag-handle flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg border-2 border-[#262626] bg-[#f2efe9] text-[#262626] shadow-[2px_2px_0px_#262626] hover:bg-white active:cursor-grabbing dark:border-[#f2efe9] dark:bg-[#262335] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
											aria-label="Geser urutan {category.name}"
											title="Pegang titik 6 untuk memindahkan"
										>
											<GripVertical size={18} />
										</button>
										<span
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-[#262626] bg-[#d1fae5] font-mono text-xs font-black text-[#065f46] shadow-[1px_1px_0px_#262626] sm:text-sm dark:border-[#f2efe9] dark:bg-[#064e3b] dark:text-[#a2e1db] dark:shadow-[1px_1px_0px_#f2efe9]"
										>
											#{index + 1}
										</span>
									{:else}
										<span
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-[#262626] bg-[#f2efe9] font-mono text-xs font-black text-[#262626] shadow-[1px_1px_0px_#262626] sm:text-sm dark:border-[#f2efe9] dark:bg-[#262335] dark:text-[#f2efe9] dark:shadow-[1px_1px_0px_#f2efe9]"
										>
											#{index + 1}
										</span>
									{/if}

									<div>
										<p class="text-sm font-bold text-[#262626] sm:text-base dark:text-[#f2efe9]">
											{category.name}
										</p>
										<p class="font-mono text-xs text-[#737373] sm:text-[13px] dark:text-[#a3a3a3]">
											{category.products?.length ?? 0} produk
										</p>
									</div>
								</div>

								{#if isReordering}
									<span class="font-mono text-xs font-bold text-[#737373] dark:text-[#a3a3a3]">
										Tarik untuk geser ↕
									</span>
								{:else}
									<div class="flex items-center gap-1.5">
										<button
											onclick={() => startEdit(category.id)}
											disabled={isBusy}
											title="Ubah nama"
											class="rounded-md border-2 border-[#262626] bg-white p-2 text-[#262626] shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-y-0.5 disabled:opacity-30 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9] dark:shadow-[1px_1px_0px_#f2efe9]"
										>
											<Pencil size={15} />
										</button>

										<button
											onclick={() => confirmDelete(category.id)}
											disabled={isBusy}
											title="Hapus kategori"
											class="rounded-md border-2 border-[#262626] bg-red-100 p-2 text-red-900 shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-y-0.5 disabled:opacity-30 dark:bg-red-950/60 dark:text-red-300 dark:shadow-[1px_1px_0px_#f2efe9]"
										>
											<Trash2 size={15} />
										</button>
									</div>
								{/if}
							</div>

							{#if deletingId === category.id && !isReordering}
								<div
									class="mt-3 flex flex-col gap-2 rounded-lg border-2 border-[#262626] bg-red-100 p-3 font-mono text-xs font-bold text-red-900 shadow-[2px_2px_0px_#262626] sm:flex-row sm:items-center sm:justify-between sm:text-sm dark:border-[#f2efe9] dark:bg-red-950 dark:text-red-200 dark:shadow-[2px_2px_0px_#f2efe9]"
								>
									<span
										>Hapus "{category.name}"? Seluruh produk di dalamnya juga akan terhapus.</span
									>
									<div class="flex gap-2">
										<form
											method="POST"
											action="?/delete"
											use:enhance={() => {
												isBusy = true;
												processingId = category.id;
												return async ({ result, update }) => {
													handleFormResult(result, { success: 'Kategori berhasil dihapus.' });
													if (result.type === 'success') {
														deletingId = null;
													}
													await update();
													isBusy = false;
													processingId = null;
												};
											}}
										>
											<input type="hidden" name="id" value={category.id} />
											<button
												type="submit"
												disabled={isBusy}
												class="rounded-md border-2 border-[#262626] bg-red-600 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
											>
												{isBusy ? 'Menghapus...' : 'Ya, Hapus'}
											</button>
										</form>
										<button
											onclick={cancelDelete}
											disabled={isBusy}
											class="rounded-md border-2 border-[#262626] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
										>
											<X size={15} />
										</button>
									</div>
								</div>
							{/if}
						{/if}
					</BusyOverlay>
				</div>
			{/each}
		</div>
	{/if}
</div>
