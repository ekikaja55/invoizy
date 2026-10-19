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
		class="fixed inset-x-0 bottom-0 z-40 border-t-2 border-brandy bg-papaya/95 p-3.5 backdrop-blur-xs shadow-[0_-4px_12px_rgba(120,41,15,0.15)] dark:border-papaya/30 dark:bg-ink/95"
	>
		<div class="mx-auto flex max-w-3xl items-center justify-between pr-16 md:pl-24 md:pr-0">
			<!-- Klik sisi kiri untuk membuka Drawer Keranjang -->
			<button
				type="button"
				onclick={openDrawer}
				class="group flex items-center gap-3 text-left transition-opacity hover:opacity-85"
				aria-label="Buka keranjang belanja"
			>
				<div
					class="flex h-11 w-11 items-center justify-center rounded-[8px_3px_7px_2px] border-2 border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f] transition-transform group-hover:scale-105"
				>
					<ShoppingBag size={20} strokeWidth={2.5} />
				</div>
				<div>
					<p class="font-mono text-xs font-bold text-brandy/80 dark:text-papaya/70">
						{cart.itemCount} item · <span class="underline underline-offset-2">Cek rincian</span>
					</p>
					<p class="font-mono text-base font-bold text-teal leading-tight dark:text-teal/90">
						{formatRupiah(cart.total)}
					</p>
				</div>
			</button>

			<!-- Tombol Cek & Tombol Lanjut Checkout -->
			<div class="flex items-center gap-2.5">
				<button
					type="button"
					onclick={openDrawer}
					class="hidden sm:inline-flex items-center rounded-[8px_3px_7px_2px] border-2 border-brandy bg-papaya px-3.5 py-2 font-mono text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] transition-all hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
				>
					Cek Keranjang
				</button>
				<a
					href={resolve('/(public)/order/checkout')}
					class="flex items-center gap-2 rounded-[8px_3px_7px_2px] border-2 border-brandy bg-tangerine px-4 py-2 font-mono text-xs font-bold text-white shadow-[3px_3px_0px_#78290f] transition-all hover:bg-[#e06d00] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
				>
					<span>Checkout</span>
					<ArrowRight size={15} strokeWidth={2.5} />
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
			class="fixed inset-0 cursor-default bg-ink/70 backdrop-blur-xs transition-opacity dark:bg-ink/85"
		></button>

		<!-- Drawer Panel: Bottom sheet di mobile, right-drawer di tablet/desktop -->
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Keranjang Belanja"
			class="relative flex w-full flex-col bg-papaya shadow-2xl transition-all dark:bg-ink
			       max-h-[85vh] rounded-t-[20px_16px_0px_0px] border-t-2 border-x-2 border-brandy shadow-[0_-8px_0px_#78290f]
			       sm:max-h-full sm:h-full sm:max-w-md sm:rounded-none sm:rounded-l-[20px_0px_0px_16px] sm:border-l-2 sm:border-t-0 sm:border-r-0 sm:border-b-0 sm:border-brandy sm:shadow-[-8px_0px_0px_#78290f] dark:border-papaya/30 dark:shadow-[-8px_0px_0px_rgba(255,236,209,0.2)]"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between border-b-2 border-brandy/20 px-5 py-4 dark:border-papaya/20"
			>
				<div class="flex items-center gap-2.5">
					<h2 class="font-serif text-lg font-bold text-ink dark:text-papaya">Keranjang Belanja</h2>
					<span
						class="rounded-[5px_2px_4px_1px] border border-brandy/40 bg-brandy/10 px-2 py-0.5 font-mono text-xs font-bold text-brandy dark:border-papaya/40 dark:bg-papaya/10 dark:text-papaya"
					>
						{cart.itemCount}
					</span>
				</div>

				<div class="flex items-center gap-2">
					{#if !cart.isEmpty}
						<button
							type="button"
							onclick={() => (confirmClearOpen = true)}
							class="flex items-center gap-1.5 rounded-[6px_2px_5px_1px] border border-crimson/30 bg-crimson/10 px-2.5 py-1.5 font-mono text-xs font-bold text-crimson transition-colors hover:bg-crimson/20"
						>
							<Trash2 size={13} strokeWidth={2.5} />
							<span>Kosongkan</span>
						</button>
					{/if}
					<button
						type="button"
						onclick={closeDrawer}
						class="flex h-8 w-8 items-center justify-center rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya text-ink shadow-[2px_2px_0px_#78290f] transition-all hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
						aria-label="Tutup"
					>
						<X size={16} strokeWidth={2.75} />
					</button>
				</div>
			</div>

			<!-- Body: Daftar Item -->
			<div class="flex-1 overflow-y-auto p-4 space-y-3">
				{#if cart.isEmpty}
					<div class="flex flex-col items-center justify-center py-16 text-center">
						<ShoppingBag size={40} strokeWidth={2} class="text-brandy/40 dark:text-papaya/30" />
						<p class="mt-3 font-serif text-base font-bold text-ink dark:text-papaya">Keranjang belanja kosong</p>
						<p class="mt-1 font-handwriting text-xl font-semibold text-teal dark:text-papaya/90">Pilih produk di katalog untuk ditambahkan.</p>
					</div>
				{:else}
					{#each cart.items as item (item.variantId ? `${item.productId}:${item.variantId}` : item.productId)}
						<div
							class="flex items-start justify-between gap-3 rounded-[12px_5px_10px_4px] border-2 border-brandy bg-white/70 p-3.5 shadow-[3px_3px_0px_#78290f] transition-colors dark:border-papaya/25 dark:bg-ink/80 dark:shadow-[3px_3px_0px_rgba(255,236,209,0.15)]"
						>
							<div class="flex-1 min-w-0">
								<h3 class="font-serif text-sm font-bold text-ink truncate dark:text-papaya">
									{item.name}
								</h3>
								<div class="mt-1 flex flex-wrap items-center gap-2">
									{#if item.variantName}
										<span
											class="rounded-[4px_2px_4px_2px] border border-forest/30 bg-forest/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-forest"
										>
											{item.variantName}
										</span>
									{/if}
									<span class="font-mono text-xs text-brandy/80 dark:text-papaya/70">
										{formatRupiah(item.price)}
									</span>
								</div>
								<p class="mt-1.5 font-mono text-xs font-bold text-teal dark:text-teal/90">
									Subtotal: {formatRupiah(item.price * item.qty)}
								</p>
							</div>

							<!-- Kontrol Qty & Tombol Hapus -->
							<div class="flex flex-col items-end gap-2.5">
								<button
									type="button"
									onclick={() => (itemToDelete = item)}
									class="text-brandy/50 transition-colors hover:text-crimson dark:text-papaya/50 dark:hover:text-crimson"
									aria-label={`Hapus ${item.name}`}
								>
									<Trash2 size={15} strokeWidth={2.5} />
								</button>

								<div
									class="flex items-center gap-1"
								>
									<button
										type="button"
										onclick={() => handleDecrement(item)}
										class="flex h-7 w-7 items-center justify-center rounded-[4px_2px_3px_1px] border-2 border-brandy bg-papaya text-ink shadow-[1px_1px_0px_#78290f] transition-all hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[1px_1px_0px_rgba(255,236,209,0.2)]"
										aria-label="Kurangi jumlah"
									>
										<Minus size={13} strokeWidth={2.75} />
									</button>
									<span class="w-7 text-center font-mono text-xs font-bold text-ink dark:text-papaya">
										{item.qty}
									</span>
									<button
										type="button"
										onclick={() => handleIncrement(item)}
										class="flex h-7 w-7 items-center justify-center rounded-[4px_2px_3px_1px] border-2 border-brandy bg-papaya text-ink shadow-[1px_1px_0px_#78290f] transition-all hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[1px_1px_0px_rgba(255,236,209,0.2)]"
										aria-label="Tambah jumlah"
									>
										<Plus size={13} strokeWidth={2.75} />
									</button>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			{#if !cart.isEmpty}
				<div class="border-t-2 border-brandy/20 bg-papaya/80 p-4 dark:border-papaya/20 dark:bg-ink/90">
					<div class="mb-3.5 flex items-center justify-between text-sm">
						<span class="font-serif text-sm font-bold text-ink dark:text-papaya">Total Belanja</span>
						<span class="font-mono text-xl font-bold text-teal dark:text-teal/90">
							{formatRupiah(cart.total)}
						</span>
					</div>

					<a
						href={resolve('/(public)/order/checkout')}
						onclick={closeDrawer}
						class="flex w-full items-center justify-center gap-2 rounded-[10px_5px_9px_4px] border-2 border-brandy bg-tangerine px-4 py-3 font-mono text-sm font-bold text-white shadow-[4px_4px_0px_#78290f] transition-all hover:bg-[#e06d00] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
					>
						<span>Lanjut ke Checkout</span>
						<ArrowRight size={16} strokeWidth={2.5} />
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
