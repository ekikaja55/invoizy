<script lang="ts">
	import { enhance } from '$app/forms';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import { formatRupiah } from '$lib/utils/currency';
	import Modal from '$lib/components/ui/Modal.svelte';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import { Plus, Trash2, Pencil, Sparkles } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isCreateModalOpen = $state(false);
	let isEditModalOpen = $state(false);
	let isBusy = $state(false);
	let promoToDelete = $state<string | null>(null);

	// Form State Tambah Promo
	let selectedProductId = $state('');
	let promoName = $state('');
	let minQty = $state(3);
	let discountAmount = $state(3000);

	// Form State Edit Promo
	let editPromoId = $state('');
	let editProductId = $state('');
	let editPromoName = $state('');
	let editMinQty = $state(3);
	let editDiscountAmount = $state(3000);

	let deleteFormEl = $state<HTMLFormElement | null>(null);

	function openCreateModal() {
		if (data.products.length > 0) {
			selectedProductId = data.products[0].id;
			promoName = 'Beli 3 Diskon 3rb';
			minQty = 3;
			discountAmount = 3000;
		}
		isCreateModalOpen = true;
	}

	function openEditModal(promo: (typeof data.promos)[number]) {
		editPromoId = promo.id;
		editProductId = promo.productId;
		editPromoName = promo.name;
		editMinQty = promo.minQty;
		editDiscountAmount = promo.discountAmount;
		isEditModalOpen = true;
	}

	function confirmDeletePromo() {
		if (!promoToDelete) return;
		if (deleteFormEl) {
			deleteFormEl.requestSubmit();
		}
	}
</script>

<svelte:head>
	<title>Promo Diskon — Admin</title>
</svelte:head>

<BusyOverlay active={isBusy}>
	<div class="mx-auto max-w-4xl space-y-6 pb-20">
		<!-- Page Header -->
		<div
			class="flex flex-col gap-3 border-b-2 border-[#262626]/10 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9]/10"
		>
			<div>
				<div
					class="mb-1 inline-flex items-center gap-1.5 rounded-md border-2 border-[#262626] bg-[#e87a5d] px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626]"
				>
					<Sparkles size={13} />
					<span>DISKON & PROMOSI</span>
				</div>
				<h1 class="text-2xl font-black tracking-tight text-[#262626] dark:text-[#f2efe9]">
					Promo Diskon
				</h1>
				<p class="font-mono text-xs text-[#262626]/70 sm:text-[13px] dark:text-[#f2efe9]/70">
					Atur promo bertingkat per produk (misal: beli 3 stiker diskon Rp 3.000). Berlaku kelipatan
					& lintas varian.
				</p>
			</div>

			<button
				type="button"
				onclick={openCreateModal}
				disabled={data.products.length === 0}
				class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#262626] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
			>
				<Plus size={16} />
				<span>Tambah Promo</span>
			</button>
		</div>

		<!-- Info Box: Cara Kerja Promo -->
		<div
			class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-[#b4a6d5]/20 p-4 font-mono text-xs text-[#262626] shadow-[3px_3px_0px_#262626] sm:text-[13px] dark:border-[#f2efe9]/20 dark:bg-[#b4a6d5]/10 dark:text-[#f2efe9]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
				>+</span
			>
			<div class="flex items-start gap-2.5">
				<Sparkles size={16} class="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
				<div class="space-y-1">
					<p class="text-sm font-bold sm:text-base">Bagaimana Aturan Promo Dihitung?</p>
					<p class="leading-relaxed opacity-90">
						Promo diikat ke <strong>Produk Tertentu</strong>. Jika produk tersebut memiliki beberapa
						varian (misal: 5 varian desain stiker), pembeli bebas mencampur varian asalkan total
						kuantitas produk tersebut mencapai syarat minimal. Diskon dihitung otomatis secara
						<strong>kelipatan</strong> saat checkout.
					</p>
				</div>
			</div>
		</div>

		<!-- Promo Table / List -->
		{#if data.promos.length === 0}
			<div
				class="rounded-[14px_4px_14px_4px] border-2 border-dashed border-[#262626] bg-white p-10 text-center shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/40 dark:bg-[#1a1825]"
			>
				<h2 class="text-base font-black text-[#262626] sm:text-lg dark:text-[#f2efe9]">
					Belum Ada Promo
				</h2>
				<p
					class="mx-auto mt-1 max-w-sm font-mono text-xs text-[#262626]/60 sm:text-[13px] dark:text-[#f2efe9]/60"
				>
					Buat promo kuantitas pertama Anda untuk memicu pembelian paket merchandise di booth
					pameran offline.
				</p>
				<div class="mt-4">
					<button
						type="button"
						onclick={openCreateModal}
						disabled={data.products.length === 0}
						class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#262626] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
					>
						<Plus size={15} />
						<span>Buat Promo Sekarang</span>
					</button>
				</div>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
			>
				<div class="overflow-x-auto">
					<table class="w-full min-w-[640px] text-left text-sm">
					<thead
						class="border-b-2 border-[#262626] bg-[#f2efe9] font-mono text-xs font-black tracking-wider text-[#262626] uppercase dark:border-[#f2efe9]/20 dark:bg-black/30 dark:text-[#f2efe9]"
					>
						<tr>
							<th class="p-4">Nama Promo</th>
							<th class="p-4">Target Produk</th>
							<th class="p-4">Syarat & Diskon</th>
							<th class="p-4 text-center">Status</th>
							<th class="p-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y-2 divide-[#262626]/10 dark:divide-[#f2efe9]/10">
						{#each data.promos as promo (promo.id)}
							<tr class="transition-colors hover:bg-[#f2efe9]/50 dark:hover:bg-neutral-800/40">
								<td class="p-4 text-sm font-bold text-[#262626] sm:text-base dark:text-[#f2efe9]">
									{promo.name}
								</td>
								<td class="p-4">
									<p class="text-sm font-bold text-[#262626] sm:text-base dark:text-[#f2efe9]">
										{promo.product.name}
									</p>
									<p
										class="font-mono text-xs text-[#262626]/60 sm:text-[13px] dark:text-[#f2efe9]/60"
									>
										{promo.product.category.name} · {formatRupiah(promo.product.priceInt)}/pcs
									</p>
								</td>
								<td class="p-4">
									<div
										class="inline-flex items-center gap-1.5 rounded-md border border-[#262626] bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] sm:text-[13px] dark:border-[#f2efe9] dark:bg-emerald-950/60 dark:text-emerald-300"
									>
										<span>Beli ≥ <strong>{promo.minQty} pcs</strong></span>
										<span>→</span>
										<span class="font-black text-emerald-700 dark:text-emerald-300"
											>Potongan {formatRupiah(promo.discountAmount)}</span
										>
									</div>
								</td>
								<td class="p-4 text-center">
									<!-- Toggle Switch Sakelar UI -->
									<form
										method="POST"
										action="?/toggle"
										use:enhance={() => {
											isBusy = true;
											return async ({ result, update }) => {
												handleFormResult(result, {
													success: promo.active ? 'Promo dinonaktifkan.' : 'Promo diaktifkan.',
													failure: 'Gagal mengubah status promo.'
												});
												if (result.type === 'success') await update();
												isBusy = false;
											};
										}}
										class="inline-flex items-center justify-center"
									>
										<input type="hidden" name="id" value={promo.id} />
										<input type="hidden" name="active" value={promo.active ? 'false' : 'true'} />
										<button
											type="submit"
											disabled={isBusy}
											role="switch"
											aria-checked={promo.active}
											title={promo.active
												? 'Klik untuk nonaktifkan promo'
												: 'Klik untuk aktifkan promo'}
											class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-[#262626] transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 {promo.active
												? 'bg-emerald-500'
												: 'bg-neutral-300 dark:bg-neutral-700'}"
										>
											<span class="sr-only">Toggle Status Promo</span>
											<span
												aria-hidden="true"
												class="pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full border border-[#262626] bg-white shadow-xs transition duration-200 ease-in-out {promo.active
													? 'translate-x-5'
													: 'translate-x-0.5'}"
											></span>
										</button>
									</form>
								</td>
								<td class="p-4 text-right">
									<div class="inline-flex items-center gap-1.5">
										<button
											type="button"
											onclick={() => openEditModal(promo)}
											disabled={isBusy}
											class="rounded-md border-2 border-[#262626] bg-white p-2 text-[#262626] shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-y-0.5 disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
											title="Edit Promo"
										>
											<Pencil size={15} />
										</button>
										<button
											type="button"
											onclick={() => (promoToDelete = promo.id)}
											disabled={isBusy}
											class="rounded-md border-2 border-[#262626] bg-red-100 p-2 text-red-900 shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-y-0.5 disabled:opacity-50 dark:bg-red-950/60 dark:text-red-300"
											title="Hapus Promo"
										>
											<Trash2 size={15} />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
		{/if}
	</div>
</BusyOverlay>

<!-- Form Tersembunyi untuk Hapus Promo -->
<form
	bind:this={deleteFormEl}
	method="POST"
	action="?/delete"
	use:enhance={() => {
		isBusy = true;
		return async ({ result, update }) => {
			handleFormResult(result, {
				success: 'Promo berhasil dihapus.',
				failure: 'Gagal menghapus promo.'
			});
			if (result.type === 'success') await update();
			isBusy = false;
			promoToDelete = null;
		};
	}}
	class="hidden"
>
	<input type="hidden" name="id" value={promoToDelete ?? ''} />
</form>

<!-- Modal Tambah Promo Baru -->
{#if isCreateModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
		<div
			class="relative w-full max-w-lg rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-6 shadow-[6px_6px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
				>+</span
			>
			<h2 class="text-xl font-black text-[#262626] sm:text-2xl dark:text-[#f2efe9]">
				Buat Promo Diskon Baru
			</h2>
			<p class="mt-1 font-mono text-xs text-[#262626]/60 sm:text-[13px] dark:text-[#f2efe9]/60">
				Tentukan produk sasaran, syarat minimal kuantitas pembelian, dan nominal potongan harga.
			</p>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					isBusy = true;
					return async ({ result, update }) => {
						if (result.type === 'success') {
							toast.success('Promo baru berhasil ditambahkan!');
							isCreateModalOpen = false;
							await update();
						} else {
							handleFormResult(result, { failure: 'Gagal membuat promo.' });
						}
						isBusy = false;
					};
				}}
				class="mt-5 space-y-4 text-left"
			>
				<div>
					<label
						for="create_productId"
						class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>
						Pilih Produk Sasaran
					</label>
					<select
						id="create_productId"
						name="productId"
						bind:value={selectedProductId}
						required
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 p-2.5 font-mono text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
					>
						{#each data.products as prod (prod.id)}
							<option value={prod.id}>
								{prod.name} ({prod.category.name} - {formatRupiah(prod.priceInt)})
							</option>
						{/each}
					</select>
				</div>

				<div>
					<label
						for="create_name"
						class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>
						Nama Label Promo
					</label>
					<input
						id="create_name"
						name="name"
						type="text"
						bind:value={promoName}
						required
						placeholder="Mis. Beli 3 Diskon 3rb"
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 p-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label
							for="create_minQty"
							class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>
							Syarat Min. Kuantitas (pcs)
						</label>
						<input
							id="create_minQty"
							name="minQty"
							type="number"
							min="1"
							bind:value={minQty}
							required
							disabled={isBusy}
							class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 p-2.5 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
						/>
					</div>

					<div>
						<label
							for="create_discountAmount"
							class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>
							Nominal Diskon (Rp)
						</label>
						<input
							id="create_discountAmount"
							name="discountAmount"
							type="number"
							min="0"
							step="500"
							bind:value={discountAmount}
							required
							disabled={isBusy}
							class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 p-2.5 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
						/>
					</div>
				</div>

				<!-- Pratinjau Aturan -->
				<div
					class="rounded-lg border-2 border-[#262626]/20 bg-[#f2efe9]/50 p-3 font-mono text-xs text-[#262626] sm:text-[13px] dark:border-[#f2efe9]/20 dark:bg-black/20 dark:text-[#f2efe9]"
				>
					<p class="font-black text-[#262626] dark:text-[#f2efe9]">Contoh Simulasi:</p>
					<p class="mt-0.5">
						Setiap kelipatan <strong>{minQty} pcs</strong> dari produk ini, pembeli akan otomatis
						mendapatkan potongan harga sebesar <strong>{formatRupiah(discountAmount)}</strong>.
					</p>
				</div>

				<div class="flex items-center justify-end gap-2.5 pt-3">
					<button
						type="button"
						onclick={() => (isCreateModalOpen = false)}
						disabled={isBusy}
						class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isBusy}
						class="rounded-lg border-2 border-[#262626] bg-emerald-500 px-5 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
					>
						{isBusy ? 'Menyimpan...' : 'Simpan Promo'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal Edit Promo -->
{#if isEditModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
		<div
			class="relative w-full max-w-lg rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-6 shadow-[6px_6px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
				>+</span
			>
			<h2 class="text-xl font-black text-[#262626] sm:text-2xl dark:text-[#f2efe9]">
				Edit Promo Diskon
			</h2>
			<p class="mt-1 font-mono text-xs text-[#262626]/60 sm:text-[13px] dark:text-[#f2efe9]/60">
				Perbarui pengaturan promo untuk produk ini.
			</p>

			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					isBusy = true;
					return async ({ result, update }) => {
						if (result.type === 'success') {
							toast.success('Promo berhasil diperbarui!');
							isEditModalOpen = false;
							await update();
						} else {
							handleFormResult(result, { failure: 'Gagal memperbarui promo.' });
						}
						isBusy = false;
					};
				}}
				class="mt-5 space-y-4 text-left"
			>
				<input type="hidden" name="id" value={editPromoId} />

				<div>
					<label
						for="edit_productId"
						class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>
						Produk Sasaran
					</label>
					<select
						id="edit_productId"
						name="productId"
						bind:value={editProductId}
						required
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 p-2.5 font-mono text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
					>
						{#each data.products as prod (prod.id)}
							<option value={prod.id}>
								{prod.name} ({prod.category.name} - {formatRupiah(prod.priceInt)})
							</option>
						{/each}
					</select>
				</div>

				<div>
					<label
						for="edit_name"
						class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>
						Nama Label Promo
					</label>
					<input
						id="edit_name"
						name="name"
						type="text"
						bind:value={editPromoName}
						required
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 p-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label
							for="edit_minQty"
							class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>
							Syarat Min. Kuantitas (pcs)
						</label>
						<input
							id="edit_minQty"
							name="minQty"
							type="number"
							min="1"
							bind:value={editMinQty}
							required
							disabled={isBusy}
							class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 p-2.5 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
						/>
					</div>

					<div>
						<label
							for="edit_discountAmount"
							class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>
							Nominal Diskon (Rp)
						</label>
						<input
							id="edit_discountAmount"
							name="discountAmount"
							type="number"
							min="0"
							step="500"
							bind:value={editDiscountAmount}
							required
							disabled={isBusy}
							class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 p-2.5 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
						/>
					</div>
				</div>

				<div class="flex items-center justify-end gap-2.5 pt-3">
					<button
						type="button"
						onclick={() => (isEditModalOpen = false)}
						disabled={isBusy}
						class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isBusy}
						class="rounded-lg border-2 border-[#262626] bg-emerald-500 px-5 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
					>
						{isBusy ? 'Menyimpan...' : 'Simpan Perubahan'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal Konfirmasi Hapus Promo -->
<Modal
	open={promoToDelete !== null}
	title="Hapus Promo Diskon?"
	message="Aturan promo ini akan dihapus permanen. Pesanan yang sudah selesai dibuat sebelumnya tidak akan terpengaruh. Lanjutkan?"
	danger={true}
	confirmLabel="Ya, Hapus"
	cancelLabel="Batal"
	onConfirm={confirmDeletePromo}
	onCancel={() => (promoToDelete = null)}
/>
