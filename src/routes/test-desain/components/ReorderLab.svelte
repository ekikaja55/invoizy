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
		class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border-2 border-brandy bg-white p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
	>
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<span
					class="inline-block -rotate-1 rounded-xs border-2 border-brandy bg-tangerine px-2 py-0.5 text-[11px] font-black uppercase text-white shadow-[1px_1px_0px_#78290f]"
				>
					SIMULASI ADMIN PRODUK
				</span>
				<h2 class="font-headline text-lg font-bold text-ink dark:text-papaya">
					Eksperimen Interaksi: Mode Atur Urutan Produk (Batch Reorder)
				</h2>
			</div>
			<p class="text-xs text-brandy/80 dark:text-papaya/70 leading-relaxed max-w-2xl">
				Bentuk kartu dan data di bawah ini dibuat <strong>sama persis dengan halaman Manajemen Produk Admin</strong>.
				Uji coba konsep: ada tombol mode penataan di header kategori, perubahan hanya tersimpan saat tombol ditekan lagi.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2 shrink-0">
			<!-- Pilihan Model -->
			<div class="flex items-center rounded-lg border border-neutral-300 bg-neutral-100 p-0.5 text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-800">
				<button
					type="button"
					onclick={() => { activeModel = 'dnd-batch'; isReorderMode = false; }}
					class="rounded-md px-2.5 py-1 transition-all {activeModel === 'dnd-batch'
						? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
						: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'}"
				>
					Model Usulan: Toggle Mode DnD
				</button>
				<button
					type="button"
					onclick={() => { activeModel = 'direct-select'; isReorderMode = false; }}
					class="rounded-md px-2.5 py-1 transition-all {activeModel === 'direct-select'
						? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
						: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'}"
				>
					Model Pembanding: Direct Select
				</button>
			</div>

			<button
				type="button"
				onclick={resetAllToDefault}
				class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
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
			class="flex items-center justify-between rounded-lg border-2 border-brandy/30 bg-papaya/40 p-3.5 text-xs leading-relaxed text-brandy dark:border-papaya/20 dark:bg-ink/40 dark:text-papaya"
		>
			<div class="flex items-center gap-2.5">
				<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brandy text-[10px] font-bold text-white dark:bg-papaya dark:text-ink">
					i
				</span>
				<p>
					<strong>Alur Mode Atur Urutan:</strong> Klik tombol <em>"Atur Urutan Produk"</em> di pojok kanan kategori. Handle seret akan muncul pada tiap produk. Anda bebas menata tanpa memicu request network. Setelah selesai, klik <em>"Simpan Urutan"</em> (1 kali simpan batch) atau <em>"Batal"</em>.
				</p>
			</div>
		</div>
	{:else}
		<div
			class="flex items-center justify-between rounded-lg border-2 border-brandy/30 bg-papaya/40 p-3.5 text-xs leading-relaxed text-brandy dark:border-papaya/20 dark:bg-ink/40 dark:text-papaya"
		>
			<div class="flex items-center gap-2.5">
				<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest text-[10px] font-bold text-white">
					i
				</span>
				<p>
					<strong>Alur Direct Select:</strong> Setiap kartu memiliki dropdown nomor urut langsung (#1 s.d #10) dan panah stepper. Klik nomor tujuan untuk langsung melompat seketika.
				</p>
			</div>
		</div>
	{/if}

	<!-- Kategori Section (Replika dari Admin Products) -->
	<section class="space-y-3">
		<!-- Header Kategori -->
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-2 dark:border-neutral-800">
			<div class="flex items-center gap-2">
				<Layers size={18} class="text-neutral-500" />
				<h3 class="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
					Merchandise Edisi Chibicon
				</h3>
				<span class="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
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
							class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-xs transition-colors hover:bg-neutral-50 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
						>
							<ArrowUpDown size={14} class="text-neutral-500" />
							<span>Atur Urutan Produk</span>
						</button>
					{:else}
						<!-- Mode Edit Aktif: Tombol Simpan & Batal -->
						<div class="flex items-center gap-2">
							<span class="hidden sm:inline font-mono text-[11px] {hasUnsavedChanges ? 'text-tangerine font-bold' : 'text-neutral-500'}">
								{hasUnsavedChanges ? '● Ada perubahan urutan' : 'Belum ada perubahan'}
							</span>

							<button
								type="button"
								onclick={handleCancelClick}
								class="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
							>
								<X size={13} />
								<span>Batal</span>
							</button>

							<button
								type="button"
								disabled={isSaving}
								onclick={saveReorderChanges}
								class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
							>
								{#if isSaving}
									<div class="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
									<span>Menyimpan...</span>
								{:else}
									<Check size={13} />
									<span>Simpan Urutan</span>
								{/if}
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Container Tabel / List Kartu Produk (Replika 1:1 dari Admin) -->
		<div class="overflow-hidden rounded-xl border-2 transition-all duration-200 {isReorderMode ? 'border-tangerine bg-white shadow-[0_0_0_4px_rgba(255,125,0,0.15)] dark:border-tangerine dark:bg-neutral-900' : 'border-neutral-300 bg-white shadow-xs dark:border-neutral-700 dark:bg-neutral-900'}">
			{#if isReorderMode}
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-tangerine/30 bg-tangerine/15 px-4 py-2.5 text-xs font-bold text-ink dark:bg-tangerine/20 dark:text-papaya">
					<div class="flex items-center gap-2.5">
						<span class="relative flex h-2.5 w-2.5">
							<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-tangerine opacity-75"></span>
							<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-tangerine"></span>
						</span>
						<span>MODE ATUR URUTAN AKTIF — Garis oranye tebal menandai posisi mendarat produk</span>
					</div>
					<span class="font-mono text-[11px] {hasUnsavedChanges ? 'text-tangerine font-black' : 'opacity-70'}">
						{hasUnsavedChanges ? '● Ada perubahan belum disimpan' : 'Belum ada produk digeser'}
					</span>
				</div>
			{/if}

			<div class="divide-y-2 divide-neutral-300 dark:divide-neutral-700">
				{#each productList as prod, idx (prod.id)}
					{@const hasVariants = prod.variants && prod.variants.length > 0}
					{@const totalStock = hasVariants
						? prod.variants.reduce((s, v) => s + v.stock, 0)
						: prod.stock}
					{@const isOutOfStock = hasVariants
						? totalStock <= 0
						: prod.trackStock && prod.stock <= 0}

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
						class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 {isReorderMode ? 'cursor-grab' : ''}"
					>
						<!-- Left: Drag Handle, Number Badge, Image & Info -->
						<div class="flex items-start gap-3.5 flex-1 min-w-0">
							<!-- Handle Drag (Hanya muncul saat mode DnD aktif) -->
							{#if activeModel === 'dnd-batch'}
								{#if isReorderMode}
									<div class="flex items-center self-center pr-1">
										<button
											type="button"
											class="drag-handle touch-none flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg border border-neutral-300 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 active:cursor-grabbing dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
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
								<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold {isReorderMode
									? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
									: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}">
									#{idx + 1}
								</span>
							</div>

							<!-- Thumbnail Gambar -->
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

							<!-- Rincian Produk -->
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<h4 class="font-serif text-sm font-bold text-neutral-900 truncate dark:text-neutral-100">
										{prod.name}
									</h4>
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

						<!-- Right: Actions & Controls -->
						<div class="flex items-center justify-end gap-2 shrink-0 self-end sm:self-center">
							{#if activeModel === 'dnd-batch'}
								{#if isReorderMode}
									<span class="rounded bg-neutral-100 px-2 py-1 font-mono text-[11px] text-neutral-500 dark:bg-neutral-800">
										Seret untuk geser
									</span>
								{:else}
									<!-- Tombol aksi standar saat mode normal -->
									<button
										type="button"
										class="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
									>
										<Pencil size={13} />
										<span>Edit</span>
									</button>
									<button
										type="button"
										class="rounded-lg p-1.5 text-neutral-400 hover:bg-crimson/10 hover:text-crimson"
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
											class="h-8 rounded-lg border border-neutral-300 bg-white px-2 font-mono text-xs font-bold text-neutral-800 shadow-xs focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
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
												class="flex h-4 w-4 items-center justify-center rounded-t border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 disabled:opacity-20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
												aria-label="Naik satu urutan"
											>
												<ChevronUp size={10} />
											</button>
											<button
												type="button"
												disabled={idx === productList.length - 1}
												onclick={() => onStepMove(prod.id, 'down')}
												class="flex h-4 w-4 items-center justify-center rounded-b border-x border-b border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 disabled:opacity-20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
												aria-label="Turun satu urutan"
											>
												<ChevronDown size={10} />
											</button>
										</div>
									</div>

									<button
										type="button"
										class="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
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
		class="rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400 space-y-2"
	>
		<p class="font-bold text-neutral-900 dark:text-neutral-100">
			Poin yang Bisa Anda Amati pada Simulasi Ini:
		</p>
		<ul class="list-disc pl-5 space-y-1">
			<li>
				<strong>Visual Indicator Tegas:</strong> Garis mendarat produk saat ini berwarna <em>Tangerine oranye 4px</em> dengan glow jelas dan highlight kartu target, menghilangkan kebingungan posisi drop.
			</li>
			<li>
				<strong>Proteksi Batal:</strong> Jika ada produk yang sudah digeser lalu Anda klik "Batal", muncul modal konfirmasi agar hasil susunan tidak terbuang karena salah klik.
			</li>
			<li>
				<strong>Navigation Guard:</strong> Jika Anda mencoba pindah halaman atau reload browser saat ada perubahan belum disimpan, sistem akan mencegat perpindahan tersebut.
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
