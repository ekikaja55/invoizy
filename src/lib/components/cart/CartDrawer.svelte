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
	const isAllowedRoute = $derived(
		currentPath === '/order' ||
			currentPath === '/order/' ||
			currentPath.startsWith('/order/products/')
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

{#if !cart.isEmpty && isAllowedRoute}
	<!-- Floating Bottom Cart Bar: Warm Monoline Bar -->
	<div
		class="drafting-grid fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#262626] bg-[#f2efe9]/95 p-3.5 shadow-[0_-4px_0px_#262626] backdrop-blur-xs dark:border-[#a2e1db] dark:bg-[#1a1825]/95 dark:shadow-[0_-4px_0px_#b4a6d5]"
	>
		<div class="mx-auto flex max-w-4xl items-center justify-between pr-16 lg:pr-4 lg:pl-32">
			<!-- Klik sisi kiri untuk membuka Drawer Keranjang -->
			<button
				type="button"
				onclick={openDrawer}
				class="group flex items-center gap-3 text-left transition-opacity hover:opacity-85"
				aria-label="Buka keranjang belanja"
			>
				<div
					class="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#fea770] text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform group-hover:scale-105 dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626]"
				>
					<ShoppingBag size={20} strokeWidth={2.5} />
				</div>
				<div>
					<p class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
						{cart.itemCount} item · <span class="underline underline-offset-2">Cek rincian</span>
					</p>
					<p class="font-mono text-base leading-tight font-bold text-[#065f46] dark:text-[#a2e1db]">
						{formatRupiah(cart.total)}
					</p>
				</div>
			</button>

			<!-- Tombol Cek & Tombol Lanjut Checkout (Rolling Ticker) -->
			<div class="flex items-center gap-2.5">
				<button
					type="button"
					onclick={openDrawer}
					class="hidden items-center rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none sm:inline-flex dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
				>
					Cek Keranjang
				</button>
				<a
					href={resolve('/(public)/order/checkout')}
					class="group relative inline-flex items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#fea770] px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[2px_2px_0px_#b4a6d5]"
				>
					<span
						class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
					>
						<span>Checkout</span>
						<ArrowRight size={14} strokeWidth={2.5} />
					</span>
					<span
						class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-1.5 transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						<span>Checkout</span>
						<ArrowRight size={14} strokeWidth={2.5} />
					</span>
				</a>
			</div>
		</div>
	</div>
{/if}

<!-- Slide-over / Bottom Sheet Drawer -->
{#if isDrawerOpen && isAllowedRoute}
	<div class="fixed inset-0 z-50 flex justify-end">
		<!-- Backdrop -->
		<button
			type="button"
			aria-label="Tutup keranjang"
			onclick={closeDrawer}
			class="fixed inset-0 cursor-default bg-[#262626]/70 backdrop-blur-xs transition-opacity dark:bg-black/85"
		></button>

		<!-- Drawer Panel: Full screen di mobile, right-drawer di tablet/desktop -->
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Keranjang Belanja"
			class="drafting-grid relative flex h-full max-h-none w-full flex-col rounded-none border-x-0 border-t-0 border-[#262626] bg-[#f2efe9] text-[#262626] shadow-none transition-all sm:h-full sm:max-h-full sm:max-w-md sm:rounded-none sm:rounded-l-2xl sm:border-t-0 sm:border-r-0 sm:border-b-0 sm:border-l-2 sm:border-[#262626] sm:shadow-[-8px_0px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#1a1825] dark:text-[#f2efe9] dark:shadow-[-8px_0px_0px_#b4a6d5]"
		>
			<!-- Header: Apricot Monoline Header (Lega & Rapi) -->
			<div
				class="flex items-center justify-between gap-4 border-b-2 border-[#262626] bg-[#fea770] px-5 py-4.5 text-[#262626]"
			>
				<div class="flex items-center gap-3">
					<h2 class="font-serif text-lg font-bold">Keranjang Belanja</h2>
					<span
						class="rounded-md border-2 border-[#262626] bg-[#a2e1db] px-2.5 py-0.5 font-mono text-xs font-bold shadow-[1px_1px_0px_#262626]"
					>
						{cart.itemCount} item
					</span>
				</div>

				<div class="flex items-center gap-2.5">
					{#if !cart.isEmpty}
						<button
							type="button"
							onclick={() => (confirmClearOpen = true)}
							class="flex h-8 w-8 items-center justify-center rounded-md border-2 border-[#262626] bg-[#fee2e2] text-[#991b1b] shadow-[1px_1px_0px_#262626] transition-all hover:bg-red-200 active:translate-y-0.5 active:shadow-none"
							title="Kosongkan keranjang"
							aria-label="Kosongkan keranjang"
						>
							<Trash2 size={15} strokeWidth={2.5} />
						</button>
					{/if}
					<button
						type="button"
						onclick={closeDrawer}
						class="flex h-8 w-8 items-center justify-center rounded-md border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none"
						aria-label="Tutup"
					>
						<X size={16} strokeWidth={2.75} />
					</button>
				</div>
			</div>

			<!-- Body: Daftar Item -->
			<div class="flex-1 space-y-3 overflow-y-auto p-4">
				{#if cart.isEmpty}
					<div class="flex flex-col items-center justify-center py-16 text-center">
						<ShoppingBag
							size={40}
							strokeWidth={2}
							class="text-[#404040]/40 dark:text-[#b8b5ad]/30"
						/>
						<p class="mt-3 font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
							Keranjang belanja kosong
						</p>
						<p class="mt-1 font-sans text-sm text-[#404040] dark:text-[#b8b5ad]">
							Pilih produk di katalog untuk ditambahkan.
						</p>
					</div>
				{:else}
					{#each cart.items as item (item.variantId ? `${item.productId}:${item.variantId}` : item.productId)}
						<div
							class="group relative flex items-start justify-between gap-3 rounded-lg border-2 border-[#262626] bg-white p-3.5 shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db]/40 dark:bg-[#252331] dark:shadow-[3px_3px_0px_#b4a6d5]"
						>
							<div class="min-w-0 flex-1">
								<h3
									class="truncate font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]"
								>
									{item.name}
								</h3>
								<div class="mt-1 flex flex-wrap items-center gap-2">
									{#if item.variantName}
										<span
											class="rounded-md border border-[#262626] bg-[#b4a6d5]/30 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#262626] dark:border-[#a2e1db]/40 dark:bg-[#b4a6d5]/20 dark:text-[#f2efe9]"
										>
											{item.variantName}
										</span>
									{/if}
									<span class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
										{formatRupiah(item.price)}
									</span>
								</div>
								<p class="mt-1.5 font-mono text-xs font-bold text-[#065f46] dark:text-[#a2e1db]">
									Subtotal: {formatRupiah(item.price * item.qty)}
								</p>
							</div>

							<!-- Kontrol Qty & Tombol Hapus -->
							<div class="flex flex-col items-end gap-2.5">
								<button
									type="button"
									onclick={() => (itemToDelete = item)}
									class="-mr-1 p-1.5 text-[#404040]/50 transition-colors hover:text-[#991b1b] dark:text-[#b8b5ad]/50 dark:hover:text-red-400"
									aria-label={`Hapus ${item.name}`}
								>
									<Trash2 size={15} strokeWidth={2.5} />
								</button>

								<!-- Stepper Monoline persis CardsLab (Touch Target Nyaman Jempol >= 28px) -->
								<div
									class="flex items-center rounded-md border border-[#262626] bg-[#f9f7f2] dark:border-[#f2efe9]/30 dark:bg-[#1a1825]"
								>
									<button
										type="button"
										onclick={() => handleDecrement(item)}
										class="flex h-7 w-7 items-center justify-center text-[#262626] transition-colors hover:bg-neutral-200 active:bg-neutral-300 dark:text-[#f2efe9] dark:hover:bg-neutral-800"
										aria-label="Kurangi jumlah"
									>
										<Minus size={13} strokeWidth={2.75} />
									</button>
									<span
										class="w-7 text-center font-mono text-xs font-bold text-[#262626] dark:text-[#f2efe9]"
									>
										{item.qty}
									</span>
									<button
										type="button"
										onclick={() => handleIncrement(item)}
										class="flex h-7 w-7 items-center justify-center text-[#262626] transition-colors hover:bg-neutral-200 active:bg-neutral-300 dark:text-[#f2efe9] dark:hover:bg-neutral-800"
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

			<!-- Footer: Double-Underline Accounting & Rolling Ticker CTA -->
			{#if !cart.isEmpty}
				<div
					class="border-t-2 border-[#262626] bg-white p-4.5 dark:border-[#a2e1db] dark:bg-[#252331]"
				>
					{#if cart.discountTotal > 0}
						<div class="mb-1.5 flex items-center justify-between font-mono text-xs">
							<span class="text-[#404040] dark:text-[#b8b5ad]">Subtotal</span>
							<span class="font-bold text-[#262626] dark:text-[#f2efe9]"
								>{formatRupiah(cart.subtotal)}</span
							>
						</div>
						<div
							class="mb-2.5 flex items-center justify-between font-mono text-xs text-[#991b1b] dark:text-[#f87171]"
						>
							<span class="font-bold">Hemat Diskon Promo</span>
							<span class="font-bold">-{formatRupiah(cart.discountTotal)}</span>
						</div>
					{/if}
					<div
						class="mb-4 flex items-center justify-between border-b-2 border-double border-[#262626]/40 pb-2 dark:border-[#f2efe9]/40"
					>
						<span class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]"
							>Total Belanja</span
						>
						<span class="font-mono text-xl font-black text-[#065f46] dark:text-[#a2e1db]">
							{formatRupiah(cart.total)}
						</span>
					</div>

					<!-- Primary Checkout CTA with Rolling Ticker -->
					<a
						href={resolve('/(public)/order/checkout')}
						onclick={closeDrawer}
						class="group relative flex w-full items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#fea770] py-3 text-sm font-bold text-[#262626] shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[3px_3px_0px_#b4a6d5]"
					>
						<span
							class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
						>
							<span>Lanjut ke Checkout</span>
							<ArrowRight size={16} strokeWidth={2.5} />
						</span>
						<span
							class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-2 transition-transform duration-300 ease-out group-hover:translate-y-0"
							aria-hidden="true"
						>
							<span>Lanjut ke Checkout</span>
							<ArrowRight size={16} strokeWidth={2.5} />
						</span>
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
