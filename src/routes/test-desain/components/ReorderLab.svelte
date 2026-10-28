<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import { toast } from 'svelte-sonner';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { formatRupiah } from '$lib/utils/currency';
	import { mockReorderProducts, type MockReorderProduct } from '../mock-data';
	import {
		GripVertical,
		ArrowUpDown,
		Check,
		X,
		RotateCcw,
		Package,
		Pencil,
		Trash2,
		Layers,
		ChevronUp,
		ChevronDown
	} from '@lucide/svelte';

	// State Utama
	let productList = $state<MockReorderProduct[]>([...mockReorderProducts]);
	let initialSnapshot = $state<MockReorderProduct[]>([...mockReorderProducts]);

	// Mode Atur Urutan (Draft / Batch Edit Mode)
	let isReorderMode = $state(false);
	let hasUnsavedChanges = $state(false);
	let isSaving = $state(false);
	let confirmCancelModalOpen = $state(false);

	// Tab Pembanding Model
	let activeModel = $state<'dnd-batch' | 'direct-select'>('dnd-batch');

	// Navigation Guard SvelteKit: cegah admin pindah halaman saat ada perubahan urutan belum disimpan
	beforeNavigate(({ cancel }) => {
		if (isReorderMode && hasUnsavedChanges) {
			const shouldLeave = window.confirm(
				'Peringatan: Anda memiliki perubahan urutan produk yang belum disimpan. Tetap tinggalkan halaman?'
			);
			if (!shouldLeave) {
				cancel();
			}
		}
	});

	// Browser Tab/Reload Guard
	$effect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isReorderMode && hasUnsavedChanges) {
				e.preventDefault();
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});

	function startReorderMode() {
		initialSnapshot = [...productList];
		isReorderMode = true;
		hasUnsavedChanges = false;
		toast.info('Mode Atur Urutan aktif: Seret produk untuk mengubah posisi.');
	}

	function handleCancelClick() {
		if (hasUnsavedChanges) {
			confirmCancelModalOpen = true;
		} else {
			cancelReorderMode();
		}
	}

	function confirmDiscardChanges() {
		confirmCancelModalOpen = false;
		cancelReorderMode();
	}

	function cancelReorderMode() {
		if (hasUnsavedChanges) {
			productList = [...initialSnapshot];
		}
		isReorderMode = false;
		hasUnsavedChanges = false;
		toast.info('Perubahan urutan dibatalkan.');
	}

	async function saveReorderChanges() {
		isSaving = true;
		// Simulasi latency request batch ke server
		await new Promise((resolve) => setTimeout(resolve, 600));
		isSaving = false;
		isReorderMode = false;
		hasUnsavedChanges = false;
		initialSnapshot = [...productList];
		toast.success('Urutan 10 produk berhasil disimpan ke database!');
	}

	function resetAllToDefault() {
		productList = [...mockReorderProducts];
		initialSnapshot = [...mockReorderProducts];
		isReorderMode = false;
		hasUnsavedChanges = false;
		toast.success('Katalog simulasi dikembalikan ke urutan awal.');
	}

	// DnD Handler via @thisux/sveltednd (Direct Target Drop: kartu langsung menempati posisi sasaran)
	function handleDndDrop(state: DragDropState, targetItem: MockReorderProduct) {
		const source = state.draggedItem as MockReorderProduct | undefined;
		if (!source || source.id === targetItem.id) return;

		const fromIndex = productList.findIndex((p) => p.id === source.id);
		const toIndex = productList.findIndex((p) => p.id === targetItem.id);
		if (fromIndex === -1 || toIndex === -1) return;

		const updated = [...productList];
		const [moved] = updated.splice(fromIndex, 1);
		updated.splice(toIndex, 0, moved);

		productList = updated;
		hasUnsavedChanges = true;
	}

	// Direct Select Handler (Varian 2)
	function onDirectSelect(productId: string, newTargetIdx: number) {
		const currentIdx = productList.findIndex((p) => p.id === productId);
		if (currentIdx === -1 || currentIdx === newTargetIdx) return;

		const updated = [...productList];
		const [moved] = updated.splice(currentIdx, 1);
		updated.splice(newTargetIdx, 0, moved);

		productList = updated;
		toast.success(`Dipindahkan langsung ke urutan #${newTargetIdx + 1}`);
	}

	function onStepMove(productId: string, direction: 'up' | 'down') {
		const currentIdx = productList.findIndex((p) => p.id === productId);
		if (currentIdx === -1) return;
		const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
		if (targetIdx < 0 || targetIdx >= productList.length) return;

		const updated = [...productList];
		const [moved] = updated.splice(currentIdx, 1);
		updated.splice(targetIdx, 0, moved);

		productList = updated;
	}
</script>

<div class="space-y-6">
	<!-- Top Bar Lab -->
	<div
		class="flex flex-col gap-4 rounded-md border-[1.5px] border-[#262626] bg-white p-5 shadow-[2px_2px_0px_#262626] sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9]/30 dark:bg-[#252331]"
	>
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<span
					class="inline-block rounded border border-[#262626] bg-[#fea770] px-2 py-0.5 text-[11px] font-bold text-[#262626] uppercase"
				>
					SIMULASI ADMIN PRODUK
				</span>
				<h2 class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
					Eksperimen Interaksi: Mode Atur Urutan Produk (Batch Reorder)
				</h2>
			</div>
			<p class="max-w-2xl text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
				Bentuk kartu dan data di bawah ini dibuat <strong
					>sama persis dengan halaman Manajemen Produk Admin</strong
				>. Uji coba konsep: ada tombol mode penataan di header kategori, perubahan hanya tersimpan
				saat tombol ditekan lagi.
			</p>
		</div>

		<div class="flex shrink-0 flex-wrap items-center gap-2">
			<!-- Pilihan Model -->
			<div
				class="inline-flex rounded-md border-[1.5px] border-[#262626] bg-[#f2efe9] p-1 text-xs font-bold dark:border-[#f2efe9]/40 dark:bg-[#1a1825]"
			>
				<button
					type="button"
					onclick={() => {
						activeModel = 'dnd-batch';
						isReorderMode = false;
					}}
					class="rounded-md px-2.5 py-1 transition-all {activeModel === 'dnd-batch'
						? 'bg-[#262626] text-[#f2efe9] shadow-[1px_1px_0px_#262626] dark:bg-[#f2efe9] dark:text-[#262626]'
						: 'text-[#404040] hover:text-[#262626] dark:text-[#b8b5ad] dark:hover:text-[#f2efe9]'}"
				>
					Model Usulan: Toggle Mode DnD
				</button>
				<button
					type="button"
					onclick={() => {
						activeModel = 'direct-select';
						isReorderMode = false;
					}}
					class="rounded-md px-2.5 py-1 transition-all {activeModel === 'direct-select'
						? 'bg-[#262626] text-[#f2efe9] shadow-[1px_1px_0px_#262626] dark:bg-[#f2efe9] dark:text-[#262626]'
						: 'text-[#404040] hover:text-[#262626] dark:text-[#b8b5ad] dark:hover:text-[#f2efe9]'}"
				>
					Model Pembanding: Direct Select
				</button>
			</div>

			<button
				type="button"
				onclick={resetAllToDefault}
				class="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-[#262626] bg-white px-2.5 py-1.5 text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
				title="Reset ke susunan awal"
			>
				<RotateCcw size={13} />
				<span class="hidden sm:inline">Reset Awal</span>
			</button>
		</div>
	</div>

	<!-- Penjelasan Model Aktif -->
	{#if activeModel === 'dnd-batch'}
		<div
			class="flex items-center justify-between rounded-md border border-[#262626]/20 bg-[#f9f7f2] p-3.5 text-xs leading-relaxed text-[#404040] dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#b8b5ad]"
		>
			<div class="flex items-center gap-2.5">
				<span
					class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#262626] bg-[#b4a6d5] text-[10px] font-bold text-[#262626]"
				>
					i
				</span>
				<p>
					<strong>Alur Mode Atur Urutan:</strong> Klik tombol <em>"Atur Urutan Produk"</em> di pojok
					kanan kategori. Handle seret akan muncul pada tiap produk. Anda bebas menata tanpa memicu
					request network. Setelah selesai, klik <em>"Simpan Urutan"</em> (1 kali simpan batch) atau
					<em>"Batal"</em>.
				</p>
			</div>
		</div>
	{:else}
		<div
			class="flex items-center justify-between rounded-md border border-[#262626]/20 bg-[#f9f7f2] p-3.5 text-xs leading-relaxed text-[#404040] dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#b8b5ad]"
		>
			<div class="flex items-center gap-2.5">
				<span
					class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#065f46] bg-[#d1fae5] text-[10px] font-bold text-[#065f46]"
				>
					i
				</span>
				<p>
					<strong>Alur Direct Select:</strong> Setiap kartu memiliki dropdown nomor urut langsung (#1
					s.d #10) dan panah stepper. Klik nomor tujuan untuk langsung melompat seketika.
				</p>
			</div>
		</div>
	{/if}

	<!-- Kategori Section (Replika dari Admin Products) -->
	<section class="space-y-3">
		<!-- Header Kategori -->
		<div
			class="flex flex-col gap-2 border-b-[1.5px] border-[#262626]/20 pb-2 sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9]/20"
		>
			<div class="flex items-center gap-2">
				<Layers size={18} class="text-[#262626] dark:text-[#f2efe9]" />
				<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					Merchandise Edisi Chibicon
				</h3>
				<span
					class="rounded border border-[#262626] bg-[#a2e1db] px-2 py-0.5 font-mono text-xs font-bold text-[#262626]"
				>
					{productList.length} produk
				</span>
			</div>

			<!-- Tombol Kontrol Urutan Kategori -->
			{#if activeModel === 'dnd-batch'}
				<div class="flex items-center gap-2">
					{#if !isReorderMode}
						<button
							type="button"
							onclick={startReorderMode}
							class="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-[#262626] bg-white px-3 py-1.5 text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
						>
							<ArrowUpDown size={14} class="text-[#262626] dark:text-[#f2efe9]" />
							<span>Atur Urutan Produk</span>
						</button>
					{:else}
						<!-- Mode Edit Aktif: Tombol Simpan & Batal -->
						<div class="flex items-center gap-2">
							<span
								class="hidden items-center gap-1.5 font-mono text-[11px] sm:inline-flex {hasUnsavedChanges
									? 'font-black text-[#262626] dark:text-[#fea770]'
									: 'text-[#404040] dark:text-[#b8b5ad]'}"
							>
								{#if hasUnsavedChanges}
									<span
										class="inline-block h-2 w-2 rounded-full border border-[#262626] bg-[#fea770]"
									></span>
									<span>Ada perubahan urutan</span>
								{:else}
									<span>Belum ada perubahan</span>
								{/if}
							</span>

							<button
								type="button"
								onclick={handleCancelClick}
								class="inline-flex items-center gap-1 rounded-md border-[1.5px] border-[#262626] bg-white px-3 py-1.5 text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-neutral-100 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
							>
								<X size={13} strokeWidth={2.5} />
								<span>Batal</span>
							</button>

							<button
								type="button"
								disabled={isSaving}
								onclick={saveReorderChanges}
								class="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-[#262626] bg-[#262626] px-3.5 py-1.5 text-xs font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
							>
								{#if isSaving}
									<div
										class="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-[#262626]"
									></div>
									<span>Menyimpan...</span>
								{:else}
									<Check size={13} strokeWidth={2.5} />
									<span>Simpan Urutan</span>
								{/if}
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Container Tabel / List Kartu Produk (Replika 1:1 dari Admin) -->
		<div
			class="overflow-hidden rounded-md border-[1.5px] border-[#262626] transition-all duration-200 {isReorderMode
				? 'bg-[#f2efe9]/40 shadow-[4px_4px_0px_#fea770] dark:bg-[#1a1825]'
				: 'bg-white shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]'}"
		>
			{#if isReorderMode}
				<div
					class="flex flex-col gap-2 border-b-[1.5px] border-[#262626] bg-[#fea770] px-4 py-2.5 text-xs font-bold text-[#262626] sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex items-center gap-2.5">
						<span class="relative flex h-2.5 w-2.5">
							<span
								class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#262626] opacity-75"
							></span>
							<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#262626]"></span>
						</span>
						<span>MODE ATUR URUTAN AKTIF — Garis peach tebal menandai posisi mendarat produk</span>
					</div>
					<span
						class="inline-flex items-center gap-1.5 font-mono text-[11px] {hasUnsavedChanges
							? 'font-black'
							: 'opacity-80'}"
					>
						{#if hasUnsavedChanges}
							<span class="inline-block h-2 w-2 rounded-full bg-[#262626]"></span>
							<span>Ada perubahan belum disimpan</span>
						{:else}
							<span>Belum ada produk digeser</span>
						{/if}
					</span>
				</div>
			{/if}

			<div class="divide-y-[1.5px] divide-[#262626]/15 dark:divide-[#f2efe9]/15">
				{#each productList as prod, idx (prod.id)}
					{@const hasVariants = prod.variants && prod.variants.length > 0}
					{@const totalStock = hasVariants
						? prod.variants.reduce((s, v) => s + v.stock, 0)
						: prod.stock}
					{@const isOutOfStock = hasVariants ? totalStock <= 0 : prod.trackStock && prod.stock <= 0}

					<div
						use:draggable={{
							container: 'admin-product-reorder-demo',
							dragData: prod,
							handle: '.drag-handle',
							disabled: !isReorderMode
						}}
						use:droppable={{
							container: 'admin-product-reorder-demo',
							disabled: !isReorderMode,
							callbacks: {
								onDrop: (state) => handleDndDrop(state, prod)
							}
						}}
						class="flex flex-col gap-3 p-4 transition-colors hover:bg-[#f2efe9]/50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-[#1a1825]/50 {isReorderMode
							? 'cursor-grab'
							: ''}"
					>
						<!-- Left: Drag Handle, Number Badge, Image & Info -->
						<div class="flex min-w-0 flex-1 items-start gap-3.5">
							<!-- Handle Drag (Hanya muncul saat mode DnD aktif) -->
							{#if activeModel === 'dnd-batch'}
								{#if isReorderMode}
									<div class="flex items-center self-center pr-1">
										<button
											type="button"
											class="drag-handle flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border-[1.5px] border-[#262626] bg-[#f2efe9] text-[#262626] hover:bg-[#b4a6d5]/30 active:cursor-grabbing dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
											aria-label="Pegang untuk memindahkan {prod.name}"
											title="Pegang titik 6 untuk memindahkan"
										>
											<GripVertical size={18} />
										</button>
									</div>
								{/if}
							{/if}

							<!-- Badge Nomor Urut -->
							<div class="self-center">
								<span
									class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#262626] font-mono text-xs font-bold {isReorderMode
										? 'bg-[#fea770] text-[#262626]'
										: 'bg-[#f2efe9] text-[#262626] dark:border-[#f2efe9]/40 dark:bg-[#1a1825] dark:text-[#f2efe9]'}"
								>
									#{idx + 1}
								</span>
							</div>

							<!-- Thumbnail Gambar -->
							{#if prod.imageUrls && prod.imageUrls.length > 0}
								<img
									src={prod.imageUrls[0]}
									alt={prod.name}
									class="h-14 w-14 shrink-0 rounded-md border-[1.5px] border-[#262626] object-cover dark:border-[#f2efe9]/30"
								/>
							{:else}
								<div
									class="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border-[1.5px] border-[#262626] bg-[#f2efe9] text-[#262626] dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9]"
								>
									<Package size={20} />
								</div>
							{/if}

							<!-- Rincian Produk -->
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<h4
										class="truncate font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]"
									>
										{prod.name}
									</h4>
									{#if !prod.active}
										<span
											class="rounded border border-[#262626]/30 bg-[#262626]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#404040] dark:bg-[#f2efe9]/10 dark:text-[#b8b5ad]"
										>
											Nonaktif
										</span>
									{/if}
								</div>

								<div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
									<span class="font-mono font-bold text-[#262626] dark:text-[#f2efe9]">
										{formatRupiah(prod.priceInt)}
									</span>

									<span
										class="inline-block h-1 w-1 rounded-full bg-[#262626]/30 dark:bg-[#f2efe9]/30"
									></span>

									{#if hasVariants}
										<span
											class="rounded-full border border-[#262626] bg-[#b4a6d5] px-2 py-0.5 font-mono text-[11px] font-bold text-[#262626]"
										>
											{prod.variants.length} Varian ({totalStock} stok total)
										</span>
									{:else if prod.trackStock}
										<span
											class="rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold {isOutOfStock
												? 'border-[#991b1b] bg-[#fee2e2] text-[#991b1b]'
												: 'border-[#065f46] bg-[#d1fae5] text-[#065f46]'}"
										>
											{isOutOfStock ? 'Stok Habis' : `Stok: ${prod.stock}`}
										</span>
									{:else}
										<span class="font-mono text-[11px] text-[#404040] dark:text-[#b8b5ad]">
											Stok tidak dilacak
										</span>
									{/if}
								</div>

								{#if prod.description}
									<p class="mt-1 line-clamp-1 text-xs text-[#404040] dark:text-[#b8b5ad]">
										{prod.description}
									</p>
								{/if}
							</div>
						</div>

						<!-- Right: Actions & Controls -->
						<div class="flex shrink-0 items-center justify-end gap-2 self-end sm:self-center">
							{#if activeModel === 'dnd-batch'}
								{#if isReorderMode}
									<span
										class="rounded border border-[#262626] bg-[#f2efe9] px-2 py-1 font-mono text-[11px] font-bold text-[#262626] dark:bg-[#1a1825] dark:text-[#f2efe9]"
									>
										Seret untuk geser
									</span>
								{:else}
									<!-- Tombol aksi standar saat mode normal -->
									<button
										type="button"
										onclick={() => toast.info(`[Sandbox] Simulasi edit produk: ${prod.name}`)}
										class="inline-flex items-center gap-1 rounded-md border-[1.5px] border-[#262626] bg-white px-2.5 py-1.5 text-xs font-bold text-[#262626] shadow-[1.5px_1.5px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
									>
										<Pencil size={13} />
										<span>Edit</span>
									</button>
									<button
										type="button"
										onclick={() => toast.error(`[Sandbox] Simulasi hapus produk: ${prod.name}`)}
										class="rounded-md border border-[#991b1b] p-1.5 text-[#991b1b] transition-colors hover:bg-[#fee2e2]"
										aria-label="Hapus produk"
									>
										<Trash2 size={15} />
									</button>
								{/if}
							{:else}
								<!-- MODEL DIRECT SELECT (Pilihan Nomor Langsung) -->
								<div class="flex items-center gap-2">
									<div class="flex items-center gap-1">
										<label for="direct-pos-{prod.id}" class="sr-only">Posisi {prod.name}</label>
										<select
											id="direct-pos-{prod.id}"
											value={idx + 1}
											onchange={(e) => onDirectSelect(prod.id, Number(e.currentTarget.value) - 1)}
											class="h-8 rounded-md border-[1.5px] border-[#262626] bg-white px-2 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] focus:outline-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
										>
											{#each productList as pItem, pIdx (pItem.id)}
												<option value={pIdx + 1}>#{pIdx + 1}</option>
											{/each}
										</select>

										<!-- Stepper Micro Buttons -->
										<div class="flex flex-col">
											<button
												type="button"
												disabled={idx === 0}
												onclick={() => onStepMove(prod.id, 'up')}
												class="flex h-4 w-4 items-center justify-center rounded-t border-[1.5px] border-[#262626] bg-white text-[#262626] hover:bg-neutral-100 disabled:opacity-30 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
												aria-label="Naik satu urutan"
											>
												<ChevronUp size={10} />
											</button>
											<button
												type="button"
												disabled={idx === productList.length - 1}
												onclick={() => onStepMove(prod.id, 'down')}
												class="flex h-4 w-4 items-center justify-center rounded-b border-x-[1.5px] border-b-[1.5px] border-[#262626] bg-white text-[#262626] hover:bg-neutral-100 disabled:opacity-30 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
												aria-label="Turun satu urutan"
											>
												<ChevronDown size={10} />
											</button>
										</div>
									</div>

									<button
										type="button"
										onclick={() => toast.info(`[Sandbox] Simulasi edit produk: ${prod.name}`)}
										class="inline-flex items-center gap-1 rounded-md border-[1.5px] border-[#262626] bg-white px-2.5 py-1.5 text-xs font-bold text-[#262626] shadow-[1.5px_1.5px_0px_#262626] hover:bg-[#b4a6d5]/30 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
									>
										<Pencil size={13} />
										<span>Edit</span>
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Checklist Analisa Evaluasi -->
	<div
		class="space-y-2 rounded-md border-[1.5px] border-[#262626] bg-white p-5 text-xs text-[#404040] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331] dark:text-[#b8b5ad]"
	>
		<p class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
			Poin yang Bisa Anda Amati pada Simulasi Ini:
		</p>
		<ul class="list-disc space-y-1 pl-5">
			<li>
				<strong>Visual Indicator Tegas:</strong> Garis mendarat produk saat ini berwarna
				<em>Peach (#fea770)</em> monoline tebal dengan highlight target drop, menghilangkan kebingungan
				posisi drop.
			</li>
			<li>
				<strong>Proteksi Batal:</strong> Jika ada produk yang sudah digeser lalu Anda klik "Batal", muncul
				modal konfirmasi agar hasil susunan tidak terbuang karena salah klik.
			</li>
			<li>
				<strong>Navigation Guard:</strong> Jika Anda mencoba pindah halaman atau reload browser saat ada
				perubahan belum disimpan, sistem akan mencegat perpindahan tersebut.
			</li>
		</ul>
	</div>

	<!-- Modal Konfirmasi Buang Perubahan Urutan -->
	<Modal
		open={confirmCancelModalOpen}
		title="Batalkan Perubahan Urutan?"
		message="Anda telah mengubah susunan beberapa produk. Jika dibatalkan, semua perubahan urutan yang belum disimpan akan dikembalikan ke posisi awal."
		danger={true}
		confirmLabel="Ya, Buang Perubahan"
		cancelLabel="Lanjut Mengatur"
		onConfirm={confirmDiscardChanges}
		onCancel={() => (confirmCancelModalOpen = false)}
	/>
</div>

<style>
	/* Custom Drop Indicator Garis Peach Monoline Tebal & Jelas */
	:global(.drop-before::before),
	:global(.drop-after::after) {
		height: 4px !important;
		background: #fea770 !important;
		box-shadow: 0 0 8px rgba(254, 167, 112, 0.7) !important;
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
		background-color: rgba(254, 167, 112, 0.12) !important;
		border-color: #262626 !important;
	}
</style>
