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
	<div class="mx-auto max-w-4xl space-y-6">
		<!-- Page Header: Judul tanpa ikon samping sesuai feedback testing -->
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-xl font-bold text-neutral-900 dark:text-neutral-100">
					Promo Diskon
				</h1>
				<p class="mt-1 text-xs text-neutral-500">
					Atur promo bertingkat per produk (misal: beli 3 stiker diskon Rp 3.000). Berlaku kelipatan & lintas varian.
				</p>
			</div>

			<button
				type="button"
				onclick={openCreateModal}
				disabled={data.products.length === 0}
				class="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
			>
				<Plus size={16} />
				<span>Tambah Promo</span>
			</button>
		</div>

		<!-- Info Box: Cara Kerja Promo -->
		<div
			class="rounded-xl border border-teal/20 bg-teal/5 p-4 text-xs text-teal dark:border-teal/30 dark:bg-teal/10 dark:text-teal/90"
		>
			<div class="flex items-start gap-2.5">
				<Sparkles size={16} class="mt-0.5 shrink-0" />
				<div class="space-y-1">
					<p class="font-bold text-sm">Bagaimana Aturan Promo Dihitung?</p>
					<p class="leading-relaxed">
						Promo diikat ke <strong>Produk Tertentu</strong>. Jika produk tersebut memiliki beberapa varian (misal: 5 varian desain stiker), pembeli bebas mencampur varian asalkan total kuantitas produk tersebut mencapai syarat minimal. Diskon dihitung otomatis secara <strong>kelipatan</strong> saat checkout.
					</p>
				</div>
			</div>
		</div>

		<!-- Promo Table / List -->
		{#if data.promos.length === 0}
			<div
				class="rounded-2xl border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-800"
			>
				<h2 class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
					Belum Ada Promo
				</h2>
				<p class="mx-auto mt-1 max-w-sm text-xs text-neutral-500">
					Buat promo kuantitas pertama Anda untuk memicu pembelian paket merchandise di booth pameran offline.
				</p>
				<div class="mt-4">
					<button
						type="button"
						onclick={openCreateModal}
						disabled={data.products.length === 0}
						class="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
					>
						<Plus size={14} />
						<span>Buat Promo Sekarang</span>
					</button>
				</div>
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
						<tr>
							<th class="p-4">Nama Promo</th>
							<th class="p-4">Target Produk</th>
							<th class="p-4">Syarat & Diskon</th>
							<th class="p-4 text-center">Status</th>
							<th class="p-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
						{#each data.promos as promo (promo.id)}
							<tr class="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
								<td class="p-4 font-semibold text-neutral-900 dark:text-neutral-100">
									{promo.name}
								</td>
								<td class="p-4">
									<p class="font-medium text-neutral-900 dark:text-neutral-100">
										{promo.product.name}
									</p>
									<p class="font-mono text-xs text-neutral-500">
										{promo.product.category.name} · {formatRupiah(promo.product.priceInt)}/pcs
									</p>
								</td>
								<td class="p-4">
									<div class="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-mono font-medium dark:bg-neutral-800">
										<span>Beli ≥ <strong>{promo.minQty} pcs</strong></span>
										<span>→</span>
										<span class="text-teal font-bold dark:text-tangerine">Potongan {formatRupiah(promo.discountAmount)}</span>
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
											title={promo.active ? 'Klik untuk nonaktifkan promo' : 'Klik untuk aktifkan promo'}
											class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 {promo.active ? 'bg-teal dark:bg-teal' : 'bg-neutral-300 dark:bg-neutral-700'}"
										>
											<span class="sr-only">Toggle Status Promo</span>
											<span
												aria-hidden="true"
												class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out {promo.active ? 'translate-x-5' : 'translate-x-0'}"
											></span>
										</button>
									</form>
								</td>
								<td class="p-4 text-right">
									<div class="inline-flex items-center gap-1">
										<button
											type="button"
											onclick={() => openEditModal(promo)}
											disabled={isBusy}
											class="rounded p-1.5 text-neutral-400 hover:text-neutral-900 disabled:opacity-50 dark:hover:text-neutral-100"
											title="Edit Promo"
										>
											<Pencil size={16} />
										</button>
										<button
											type="button"
											onclick={() => (promoToDelete = promo.id)}
											disabled={isBusy}
											class="rounded p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
											title="Hapus Promo"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
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
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
	>
		<div
			class="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
		>
			<h2 class="text-lg font-bold text-neutral-900 dark:text-neutral-100">
				Buat Promo Diskon Baru
			</h2>
			<p class="mt-1 text-xs text-neutral-500">
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
					<label for="create_productId" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
						Pilih Produk Sasaran
					</label>
					<select
						id="create_productId"
						name="productId"
						bind:value={selectedProductId}
						required
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
					>
						{#each data.products as prod (prod.id)}
							<option value={prod.id}>
								{prod.name} ({prod.category.name} - {formatRupiah(prod.priceInt)})
							</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="create_name" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
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
						class="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="create_minQty" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
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
							class="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
						/>
					</div>

					<div>
						<label for="create_discountAmount" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
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
							class="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
						/>
					</div>
				</div>

				<!-- Pratinjau Aturan -->
				<div class="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
					<p class="font-semibold text-neutral-900 dark:text-neutral-100">Contoh Simulasi:</p>
					<p class="mt-0.5">
						Setiap kelipatan <strong>{minQty} pcs</strong> dari produk ini, pembeli akan otomatis mendapatkan potongan harga sebesar <strong>{formatRupiah(discountAmount)}</strong>.
					</p>
				</div>

				<div class="flex items-center justify-end gap-2.5 pt-3">
					<button
						type="button"
						onclick={() => (isCreateModalOpen = false)}
						disabled={isBusy}
						class="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isBusy}
						class="rounded-lg bg-neutral-900 px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
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
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
	>
		<div
			class="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
		>
			<h2 class="text-lg font-bold text-neutral-900 dark:text-neutral-100">
				Edit Promo Diskon
			</h2>
			<p class="mt-1 text-xs text-neutral-500">
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
					<label for="edit_productId" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
						Produk Sasaran
					</label>
					<select
						id="edit_productId"
						name="productId"
						bind:value={editProductId}
						required
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
					>
						{#each data.products as prod (prod.id)}
							<option value={prod.id}>
								{prod.name} ({prod.category.name} - {formatRupiah(prod.priceInt)})
							</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="edit_name" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
						Nama Label Promo
					</label>
					<input
						id="edit_name"
						name="name"
						type="text"
						bind:value={editPromoName}
						required
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="edit_minQty" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
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
							class="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
						/>
					</div>

					<div>
						<label for="edit_discountAmount" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
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
							class="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
						/>
					</div>
				</div>

				<div class="flex items-center justify-end gap-2.5 pt-3">
					<button
						type="button"
						onclick={() => (isEditModalOpen = false)}
						disabled={isBusy}
						class="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isBusy}
						class="rounded-lg bg-neutral-900 px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
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