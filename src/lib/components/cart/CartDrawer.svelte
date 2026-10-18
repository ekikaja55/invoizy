<script lang="ts">
	import { cart, type CartProduct } from '$lib/stores/cart.svelte';
	import { formatRupiah } from '$lib/utils/currency';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight } from '@lucide/svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	let isDrawerOpen = $state(false);
	let itemToDelete = $state<CartProduct | null>(null);
	let confirmClearOpen = $state(false);

	const currentPath = $derived(page.url.pathname);
	const isExcludedRoute = $derived(
		currentPath.startsWith('/order/checkout') ||
		currentPath.startsWith('/order/sukses') ||
		currentPath.startsWith('/invoice') ||
		currentPath.startsWith('/admin')
	);

	function openDrawer() {
		isDrawerOpen = true;
	}

	function closeDrawer() {
		isDrawerOpen = false;
	}

	function handleDecrement(item: CartProduct) {
		if (item.qty <= 1) {
			itemToDelete = item;
		} else {
			cart.addOrUpdateItem(item, item.qty - 1);
			cart.setShipping(null);
		}
	}

	function handleIncrement(item: CartProduct) {
		cart.addOrUpdateItem(item, item.qty + 1);
		cart.setShipping(null);
	}

	function confirmDeleteItem() {
		if (itemToDelete) {
			cart.addOrUpdateItem(itemToDelete, 0);
			cart.setShipping(null);
			itemToDelete = null;
			if (cart.isEmpty) {
				isDrawerOpen = false;
			}
		}
	}

	function confirmClearCart() {
		cart.clear();
		confirmClearOpen = false;
		isDrawerOpen = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (isDrawerOpen && e.key === 'Escape') {
			closeDrawer();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if !cart.isEmpty && !isExcludedRoute}
	<!-- Floating Bottom Cart Bar -->
	<div
		class="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-3.5 backdrop-blur shadow-lg dark:border-neutral-800 dark:bg-neutral-950/95"
	>
		<div class="mx-auto flex max-w-3xl items-center justify-between pr-16 md:pl-24 md:pr-0">
			<!-- Klik sisi kiri untuk membuka Drawer Keranjang -->
			<button
				type="button"
				onclick={openDrawer}
				class="group flex items-center gap-3 text-left transition-opacity hover:opacity-80"
				aria-label="Buka keranjang belanja"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white transition-transform group-hover:scale-105 dark:bg-white dark:text-neutral-900"
				>
					<ShoppingBag size={18} />
				</div>
				<div>
					<p class="text-xs font-medium text-neutral-500 dark:text-neutral-400">
						{cart.itemCount} item · <span class="underline underline-offset-2">Cek rincian</span>
					</p>
					<p class="text-base font-bold text-neutral-900 dark:text-white leading-tight">
						{formatRupiah(cart.total)}
					</p>
				</div>
			</button>

			<!-- Tombol Cek & Tombol Lanjut Checkout -->
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={openDrawer}
					class="hidden sm:inline-flex items-center rounded-lg border border-neutral-300 px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
				>
					Cek Keranjang
				</button>
				<a
					href={resolve('/(public)/order/checkout')}
					class="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
				>
					<span>Checkout</span>
					<ArrowRight size={16} />
				</a>
			</div>
		</div>
	</div>
{/if}

<!-- Slide-over / Bottom Sheet Drawer -->
{#if isDrawerOpen && !isExcludedRoute}
	<div class="fixed inset-0 z-50 flex justify-end">
		<!-- Backdrop -->
		<button
			type="button"
			aria-label="Tutup keranjang"
			onclick={closeDrawer}
			class="fixed inset-0 cursor-default bg-black/50 backdrop-blur-xs transition-opacity"
		></button>

		<!-- Drawer Panel: Bottom sheet di mobile, right-drawer di tablet/desktop -->
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Keranjang Belanja"
			class="relative flex w-full flex-col bg-white shadow-2xl transition-all dark:bg-neutral-900
			       max-h-[85vh] rounded-t-2xl sm:max-h-full sm:h-full sm:max-w-md sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-neutral-200 sm:dark:border-neutral-800"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800"
			>
				<div class="flex items-center gap-2">
					<h2 class="text-base font-bold text-neutral-900 dark:text-white">Keranjang Belanja</h2>
					<span
						class="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
					>
						{cart.itemCount}
					</span>
				</div>

				<div class="flex items-center gap-2">
					{#if !cart.isEmpty}
						<button
							type="button"
							onclick={() => (confirmClearOpen = true)}
							class="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
						>
							<Trash2 size={13} />
							<span>Kosongkan</span>
						</button>
					{/if}
					<button
						type="button"
						onclick={closeDrawer}
						class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
						aria-label="Tutup"
					>
						<X size={18} />
					</button>
				</div>
			</div>

			<!-- Body: Daftar Item -->
			<div class="flex-1 overflow-y-auto p-4 space-y-3">
				{#if cart.isEmpty}
					<div class="flex flex-col items-center justify-center py-16 text-center text-neutral-500">
						<ShoppingBag size={40} class="text-neutral-300 dark:text-neutral-700" />
						<p class="mt-3 text-sm font-semibold">Keranjang belanja kosong</p>
						<p class="mt-1 text-xs text-neutral-400">Pilih produk di katalog untuk ditambahkan.</p>
					</div>
				{:else}
					{#each cart.items as item (item.variantId ? `${item.productId}:${item.variantId}` : item.productId)}
						<div
							class="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5 transition-colors dark:border-neutral-800 dark:bg-neutral-900/40"
						>
							<div class="flex-1 min-w-0">
								<h3 class="text-sm font-semibold text-neutral-900 dark:text-white truncate">
									{item.name}
								</h3>
								<div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
									{#if item.variantName}
										<span
											class="rounded bg-neutral-200/70 px-1.5 py-0.5 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
										>
											{item.variantName}
										</span>
									{/if}
									<span class="text-neutral-500 dark:text-neutral-400">
										{formatRupiah(item.price)}
									</span>
								</div>
								<p class="mt-1 text-xs font-semibold text-neutral-900 dark:text-white">
									Subtotal: {formatRupiah(item.price * item.qty)}
								</p>
							</div>

							<!-- Kontrol Qty & Tombol Hapus -->
							<div class="flex flex-col items-end gap-2">
								<button
									type="button"
									onclick={() => (itemToDelete = item)}
									class="text-neutral-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
									aria-label={`Hapus ${item.name}`}
								>
									<Trash2 size={16} />
								</button>

								<div
									class="flex items-center rounded-lg border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800"
								>
									<button
										type="button"
										onclick={() => handleDecrement(item)}
										class="flex h-7 w-7 items-center justify-center rounded-l-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
										aria-label="Kurangi jumlah"
									>
										<Minus size={13} />
									</button>
									<span class="w-8 text-center text-xs font-bold text-neutral-900 dark:text-white">
										{item.qty}
									</span>
									<button
										type="button"
										onclick={() => handleIncrement(item)}
										class="flex h-7 w-7 items-center justify-center rounded-r-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
										aria-label="Tambah jumlah"
									>
										<Plus size={13} />
									</button>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			{#if !cart.isEmpty}
				<div class="border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
					<div class="mb-3 flex items-center justify-between text-sm">
						<span class="text-neutral-500">Total Belanja</span>
						<span class="text-base font-bold text-neutral-900 dark:text-white">
							{formatRupiah(cart.total)}
						</span>
					</div>

					<a
						href={resolve('/(public)/order/checkout')}
						onclick={closeDrawer}
						class="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
					>
						<span>Lanjut ke Checkout</span>
						<ArrowRight size={16} />
					</a>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Modal Konfirmasi Hapus 1 Item -->
<Modal
	open={itemToDelete !== null}
	title="Hapus Produk?"
	message={`Apakah Anda yakin ingin menghapus "${itemToDelete?.name}${itemToDelete?.variantName ? ` (${itemToDelete.variantName})` : ''}" dari keranjang belanja?`}
	danger={true}
	confirmLabel="Ya, Hapus"
	cancelLabel="Batal"
	onConfirm={confirmDeleteItem}
	onCancel={() => (itemToDelete = null)}
/>

<!-- Modal Konfirmasi Kosongkan Keranjang -->
<Modal
	open={confirmClearOpen}
	title="Kosongkan Keranjang?"
	message="Semua produk yang ada di dalam keranjang belanja akan dihapus. Anda yakin ingin melanjutkan?"
	danger={true}
	confirmLabel="Ya, Kosongkan"
	cancelLabel="Batal"
	onConfirm={confirmClearCart}
	onCancel={() => (confirmClearOpen = false)}
/>
