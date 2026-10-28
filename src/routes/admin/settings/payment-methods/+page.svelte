<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
	import { resolve } from '$app/paths';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import {
		Plus,
		Pencil,
		Trash2,
		X,
		ArrowLeft,
		GripVertical,
		ArrowUpDown,
		Check,
		CreditCard,
		Building2,
		Wallet,
		Copy
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showCreateForm = $state(false);
	let editingId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);
	let isBusy = $state(false);
	let processingId = $state<string | null>(null);

	// State DnD Reorder
	let methodsList = $state([...data.methods]);
	let initialSnapshot = $state([...data.methods]);
	let isReordering = $state(false);
	let hasUnsavedChanges = $state(false);
	let isSaving = $state(false);

	$effect(() => {
		if (!isReordering) {
			methodsList = [...data.methods];
			initialSnapshot = [...data.methods];
		}
	});

	beforeNavigate((navigation) => {
		if (hasUnsavedChanges) {
			const answer = window.confirm(
				'Ada perubahan urutan rekening yang belum disimpan. Yakin ingin keluar dari halaman?'
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
		methodsList = [...data.methods];
		initialSnapshot = [...data.methods];
	}

	function cancelReorder() {
		if (hasUnsavedChanges) {
			if (!window.confirm('Batalkan perubahan susunan urutan rekening?')) {
				return;
			}
			methodsList = [...initialSnapshot];
			hasUnsavedChanges = false;
		}
		isReordering = false;
	}

	function handleDndDrop(state: DragDropState, targetMethod: (typeof data.methods)[0]) {
		const source = state.draggedItem as typeof targetMethod | undefined;
		if (!source || source.id === targetMethod.id) return;

		const fromIndex = methodsList.findIndex((m) => m.id === source.id);
		const toIndex = methodsList.findIndex((m) => m.id === targetMethod.id);
		if (fromIndex === -1 || toIndex === -1) return;

		const updated = [...methodsList];
		const [moved] = updated.splice(fromIndex, 1);
		updated.splice(toIndex, 0, moved);

		methodsList = updated;
		hasUnsavedChanges = true;
	}

	async function saveReorder() {
		if (methodsList.length === 0) return;
		isSaving = true;
		try {
			const formData = new FormData();
			formData.append('orderedIds', JSON.stringify(methodsList.map((m) => m.id)));
			const res = await fetch('?/reorderBatch', {
				method: 'POST',
				body: formData
			});
			if (!res.ok) throw new Error('Gagal menghubungi server.');
			await invalidateAll();
			hasUnsavedChanges = false;
			isReordering = false;
			toast.success('Urutan rekening berhasil disimpan!');
		} catch {
			toast.error('Gagal menyimpan urutan rekening.');
		} finally {
			isSaving = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success('Nomor rekening disalin ke clipboard');
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
					<span>REKENING TRANSFER</span>
				</div>
				<h1
					class="text-xl font-black tracking-tight text-[#262626] sm:text-2xl dark:text-[#f2efe9]"
				>
					Bank & Virtual Account
				</h1>
				<p class="font-mono text-xs text-[#262626]/70 sm:text-[13px] dark:text-[#f2efe9]/70">
					Urutkan tampilan rekening pada invoice web pembeli dengan mudah via drag & drop.
				</p>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
			{#if data.methods.length > 1 && !isReordering && !showCreateForm}
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
					onclick={() => (showCreateForm = !showCreateForm)}
					disabled={isBusy}
					class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-[#262626] bg-[#262626] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:flex-initial sm:text-sm dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
				>
					<Plus size={15} />
					<span>Metode Baru</span>
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
				<span>Tarik & lepas kartu untuk mengatur urutan rekening di invoice.</span>
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

	<!-- Form Buat Metode Baru -->
	{#if showCreateForm && !isReordering}
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				isBusy = true;
				return async ({ result, update }) => {
					handleFormResult(result, { success: 'Metode pembayaran berhasil ditambahkan.' });
					if (result.type === 'success') showCreateForm = false;
					await update({ reset: result.type === 'success' });
					isBusy = false;
				};
			}}
			class="relative space-y-4 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-6 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
				>+</span
			>
			<input type="hidden" name="sortOrder" value={methodsList.length} />

			<div>
				<label
					for="type"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>Jenis Saluran</label
				>
				<select
					id="type"
					name="type"
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
				>
					<option value="bank">Bank Transfer</option>
					<option value="va">Virtual Account</option>
					<option value="other">E-Wallet / Lainnya</option>
				</select>
			</div>

			<div>
				<label
					for="label"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>Label Bank / Nama E-Wallet</label
				>
				<input
					id="label"
					name="label"
					placeholder="BCA, Mandiri, OVO, GoPay, dst."
					required
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
				/>
			</div>

			<div>
				<label
					for="accountNumber"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>Nomor Rekening / No. Virtual Account</label
				>
				<input
					id="accountNumber"
					name="accountNumber"
					placeholder="Contoh: 8210987654"
					required
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
				/>
			</div>

			<div>
				<label
					for="accountHolder"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>Atas Nama Pemilik Rekening</label
				>
				<input
					id="accountHolder"
					name="accountHolder"
					placeholder="Nama sesuai buku tabungan / akun"
					required
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
				/>
			</div>

			<div>
				<label
					for="note"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>Catatan Khusus (Opsional)</label
				>
				<input
					id="note"
					name="note"
					placeholder="Misal: Cantumkan 3 digit kode unik order pada berita transfer"
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
				/>
			</div>

			<label
				class="flex items-center gap-2 font-mono text-xs font-bold text-[#262626] sm:text-sm dark:text-[#f2efe9]"
			>
				<input
					type="checkbox"
					name="active"
					checked
					disabled={isBusy}
					class="h-4 w-4 rounded border-2 border-[#262626] text-[#262626] focus:ring-0"
				/>
				<span>Aktif (tampilkan di invoice pembayaran)</span>
			</label>

			<div class="flex gap-2.5 pt-2">
				<button
					type="submit"
					disabled={isBusy}
					class="rounded-lg border-2 border-[#262626] bg-emerald-500 px-5 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
				>
					{isBusy ? 'Menyimpan...' : 'Simpan Rekening'}
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

	<!-- Daftar Metode Rekening dengan Dukungan DnD Reorder -->
	<BusyOverlay active={isBusy && !processingId}>
		<div class="space-y-3">
			{#if !data.methods}
				<ListSkeleton rows={3} />
			{:else if methodsList.length === 0}
				<div
					class="rounded-[14px_4px_14px_4px] border-2 border-dashed border-[#262626] bg-white p-8 text-center shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/40 dark:bg-[#1a1825]"
				>
					<p class="font-mono text-xs text-[#262626]/60 sm:text-[13px] dark:text-[#f2efe9]/60">
						Belum ada metode pembayaran rekening yang tersimpan. Klik "Metode Baru" untuk
						menambahkan.
					</p>
				</div>
			{:else}
				{#each methodsList as method (method.id)}
					<div
						use:draggable={{
							container: 'admin-methods-reorder',
							dragData: method,
							handle: '.drag-handle-method',
							disabled: !isReordering
						}}
						use:droppable={{
							container: 'admin-methods-reorder',
							disabled: !isReordering,
							callbacks: {
								onDrop: (state) => handleDndDrop(state, method)
							}
						}}
						class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] transition-all dark:border-[#f2efe9]/20 dark:bg-[#1a1825] {isReordering
							? 'cursor-grab hover:bg-[#fea770]/10 dark:hover:bg-[#fea770]/5'
							: ''}"
					>
						<BusyOverlay active={processingId === method.id}>
							<span
								class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
								>+</span
							>
							{#if editingId === method.id && !isReordering}
								<form
									method="POST"
									action="?/update"
									use:enhance={() => {
										isBusy = true;
										processingId = method.id;
										return async ({ result, update }) => {
											handleFormResult(result, {
												success: 'Metode pembayaran berhasil diperbarui.'
											});
											if (result.type === 'success') editingId = null;
											await update();
											isBusy = false;
											processingId = null;
										};
									}}
									class="space-y-3"
								>
									<input type="hidden" name="id" value={method.id} />
									<input type="hidden" name="sortOrder" value={method.sortOrder} />

									<div>
										<label
											for="edit-type-{method.id}"
											class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
											>Jenis Saluran</label
										>
										<select
											id="edit-type-{method.id}"
											name="type"
											value={method.type}
											disabled={isBusy}
											class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
										>
											<option value="bank">Bank Transfer</option>
											<option value="va">Virtual Account</option>
											<option value="other">E-Wallet / Lainnya</option>
										</select>
									</div>

									<div>
										<label
											for="edit-label-{method.id}"
											class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
											>Label</label
										>
										<input
											id="edit-label-{method.id}"
											name="label"
											value={method.label}
											required
											disabled={isBusy}
											class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
										/>
									</div>

									<div>
										<label
											for="edit-account-{method.id}"
											class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
											>Nomor Rekening / VA</label
										>
										<input
											id="edit-account-{method.id}"
											name="accountNumber"
											value={method.accountNumber}
											required
											disabled={isBusy}
											class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
										/>
									</div>

									<div>
										<label
											for="edit-holder-{method.id}"
											class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
											>Atas Nama</label
										>
										<input
											id="edit-holder-{method.id}"
											name="accountHolder"
											value={method.accountHolder}
											required
											disabled={isBusy}
											class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
										/>
									</div>

									<div>
										<label
											for="edit-note-{method.id}"
											class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
											>Catatan (opsional)</label
										>
										<input
											id="edit-note-{method.id}"
											name="note"
											value={method.note ?? ''}
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
											checked={method.active}
											disabled={isBusy}
											class="h-4 w-4 rounded border-2 border-[#262626] text-[#262626] focus:ring-0"
										/>
										<span>Aktif (tampilkan di invoice)</span>
									</label>

									<div class="flex gap-2.5 pt-2">
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
											onclick={() => (editingId = null)}
											class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
										>
											Batal
										</button>
									</div>
								</form>
							{:else}
								<div class="flex items-center justify-between gap-3">
									<div class="flex items-center gap-3">
										<!-- Handle Drag Reorder -->
										{#if isReordering}
											<div
												class="drag-handle-method flex h-14 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg border-2 border-dashed border-[#262626]/30 bg-neutral-100 text-[#262626]/60 transition-colors hover:border-[#262626] hover:bg-neutral-200 active:cursor-grabbing dark:border-[#f2efe9]/30 dark:bg-[#252331] dark:text-[#f2efe9]"
												title="Tarik untuk memindahkan urutan"
											>
												<GripVertical size={18} />
											</div>
										{:else}
											<div
												class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#fea770]/20 text-[#262626] shadow-[1.5px_1.5px_0px_#262626] dark:border-[#a2e1db] dark:text-[#f2efe9]"
											>
												{#if method.type === 'bank'}
													<Building2 size={18} />
												{:else if method.type === 'va'}
													<CreditCard size={18} />
												{:else}
													<Wallet size={18} />
												{/if}
											</div>
										{/if}

										<div>
											<div class="flex items-center gap-2">
												<span
													class="py-0.2 rounded border border-[#262626] bg-[#a2e1db] px-1.5 font-mono text-[9px] font-black text-[#262626] uppercase shadow-[1px_1px_0px_#262626]"
												>
													{method.type.toUpperCase()}
												</span>
												<p
													class="text-sm font-extrabold text-[#262626] sm:text-base dark:text-[#f2efe9]"
												>
													{method.label}
												</p>
												{#if !method.active}
													<span
														class="py-0.2 rounded border border-[#262626]/30 bg-neutral-200 px-1.5 font-mono text-[10px] font-bold text-[#262626] dark:border-[#f2efe9]/30 dark:bg-neutral-800 dark:text-[#f2efe9]"
													>
														Nonaktif
													</span>
												{/if}
											</div>
											<div class="mt-1 flex items-center gap-2">
												<span
													class="font-mono text-xs font-bold text-[#262626] sm:text-sm dark:text-[#f2efe9]"
												>
													{method.accountNumber}
												</span>
												<button
													type="button"
													onclick={() => copyToClipboard(method.accountNumber)}
													title="Salin nomor rekening"
													class="text-[#262626]/50 hover:text-[#262626] dark:text-[#f2efe9]/50 dark:hover:text-[#f2efe9]"
												>
													<Copy size={12} />
												</button>
												<span class="text-xs text-[#262626]/40 dark:text-[#f2efe9]/40">·</span>
												<span class="font-mono text-xs text-[#262626]/70 dark:text-[#f2efe9]/70">
													a.n. {method.accountHolder}
												</span>
											</div>
											{#if method.note}
												<p class="mt-0.5 font-mono text-[11px] text-[#e87a5d] dark:text-[#fea770]">
													* {method.note}
												</p>
											{/if}
										</div>
									</div>

									{#if !isReordering}
										<div class="flex items-center gap-1.5">
											<button
												onclick={() => (editingId = method.id)}
												disabled={isBusy}
												title="Ubah rincian"
												class="rounded-md border-2 border-[#262626] bg-white p-2 text-[#262626] shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-y-0.5 disabled:opacity-30 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
											>
												<Pencil size={15} />
											</button>

											<button
												onclick={() => (deletingId = method.id)}
												disabled={isBusy}
												title="Hapus metode"
												class="rounded-md border-2 border-[#262626] bg-red-100 p-2 text-red-900 shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-y-0.5 disabled:opacity-30 dark:bg-red-950/60 dark:text-red-300"
											>
												<Trash2 size={15} />
											</button>
										</div>
									{/if}
								</div>

								{#if deletingId === method.id && !isReordering}
									<div
										class="mt-3 flex flex-col gap-2 rounded-lg border-2 border-[#262626] bg-red-100 p-3 font-mono text-xs font-bold text-red-900 shadow-[2px_2px_0px_#262626] sm:flex-row sm:items-center sm:justify-between sm:text-sm dark:bg-red-950 dark:text-red-200"
									>
										<span>Hapus rekening "{method.label}"?</span>
										<div class="flex gap-2">
											<form
												method="POST"
												action="?/delete"
												use:enhance={() => {
													isBusy = true;
													processingId = method.id;
													return async ({ result, update }) => {
														handleFormResult(result, {
															success: 'Metode pembayaran berhasil dihapus.'
														});
														if (result.type === 'success') deletingId = null;
														await update();
														isBusy = false;
														processingId = null;
													};
												}}
											>
												<input type="hidden" name="id" value={method.id} />
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
						</BusyOverlay>
					</div>
				{/each}
			{/if}
		</div>
	</BusyOverlay>
</div>
