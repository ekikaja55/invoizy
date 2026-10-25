<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { formatRupiah } from '$lib/utils/currency';
	import {
		ShoppingBag,
		Plus,
		Minus,
		Sparkles,
		Layers,
		Check,
		TrendingUp,
		Clock,
		AlertTriangle,
		ArrowRight,
		Pencil,
		Trash2,
		GripVertical,
		Eye,
		EyeOff
	} from '@lucide/svelte';

	// Mock interaktif untuk simulasi keranjang belanja di lab
	let cartItems = $state([
		{
			id: 'c-1',
			name: 'Gantungan Kunci Akrilik Hologram',
			variant: 'Karakter A (6cm)',
			price: 35000,
			qty: 2
		},
		{
			id: 'c-2',
			name: 'Sticker Pack Vinyl Doff Waterproof',
			variant: 'Set Chibi (A6)',
			price: 25000,
			qty: 1
		}
	]);

	let discountPromo = $state(5000);
	let shippingCost = $state(20000);

	const cartSubtotal = $derived(cartItems.reduce((acc, item) => acc + item.price * item.qty, 0));
	const cartTotal = $derived(cartSubtotal - discountPromo + shippingCost);

	// State interaktif simulasi penambahan produk
	let addedStates = $state<Record<string, boolean>>({});

	function handleAddToCart(productId: string, productName: string) {
		addedStates[productId] = true;
		toast.info(`Membuka rincian produk "${productName}"...`);
		setTimeout(() => {
			addedStates[productId] = false;
		}, 1500);
	}

	function handleQtyChange(itemId: string, delta: number) {
		const target = cartItems.find((i) => i.id === itemId);
		if (!target) return;
		const nextQty = target.qty + delta;
		if (nextQty <= 0) {
			cartItems = cartItems.filter((i) => i.id !== itemId);
			toast.info(`"${target.name}" dihapus dari keranjang.`);
		} else {
			target.qty = nextQty;
		}
	}

	// Mock interaktif untuk Admin Product Management Card
	let adminProducts = $state([
		{
			id: 'adm-1',
			name: 'Gantungan Kunci Akrilik Hologram',
			category: 'Merchandise',
			priceInt: 35000,
			stock: 24,
			hasVariants: true,
			variantsCount: 3,
			trackStock: true,
			active: true,
			imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80',
			description: 'Akrilik dua sisi dengan glitter pelangi tebal 4mm.'
		},
		{
			id: 'adm-2',
			name: 'Poster Art Print Satin A4',
			category: 'Art Print',
			priceInt: 40000,
			stock: 2,
			hasVariants: false,
			variantsCount: 0,
			trackStock: true,
			active: true,
			imageUrl: 'https://images.unsplash.com/photo-1579783901586-7880cb2497a3?w=300&auto=format&fit=crop&q=80',
			description: 'Kertas art carton 260gsm laminasi doff satin tahan air.'
		},
		{
			id: 'adm-3',
			name: 'Enamel Pin Edisi Spesial Festival',
			category: 'Aksesoris',
			priceInt: 55000,
			stock: 0,
			hasVariants: false,
			variantsCount: 0,
			trackStock: true,
			active: false,
			imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80',
			description: 'Pin logam hard enamel finishing emas, stok diarsipkan.'
		}
	]);

	function handleToggleAdminProduct(id: string) {
		const target = adminProducts.find((p) => p.id === id);
		if (target) {
			target.active = !target.active;
			if (target.active) {
				toast.success(`"${target.name}" diaktifkan dan tampil di katalog pembeli.`);
			} else {
				toast.info(`"${target.name}" dinonaktifkan (disembunyikan dari pembeli).`);
			}
		}
	}

	function handleSimulateEdit(name: string) {
		toast.info(`Simulasi: Membuka formulir edit untuk "${name}".`);
	}

	function handleSimulateDelete(name: string) {
		toast.warning(`Simulasi: Konfirmasi hapus untuk "${name}".`);
	}
</script>

<div class="space-y-12">
	<!-- HEADER EXPLANATION -->
	<div class="rounded-md border-[1.5px] border-[#262626] bg-white p-5 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]">
		<h2 class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
			Cards & Modules Showcase
		</h2>
		<p class="mt-1 text-xs text-[#404040] dark:text-[#b8b5ad]">
			Koleksi kartu antarmuka pembeli dan pengelola dengan presisi garis monoline arang (#262626).
		</p>
	</div>

	<!-- SECTION 1: PUBLIC BUYER PRODUCT CARDS -->
	<section class="space-y-4">
		<div class="flex items-center justify-between border-b-[1.5px] border-[#262626]/20 pb-2 dark:border-[#f2efe9]/20">
			<div>
				<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					1. Public Buyer Product Cards (Katalog Dagangan)
				</h3>
				<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
					Kartu produk pembeli: seluruh kartu clickable dengan rolling action footer interaktif saat hover di desktop (dan selalu tampil di layar mobile).
				</p>
			</div>
			<span class="rounded-full border border-[#262626] bg-[#a2e1db] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626]">
				3 Kondisi Kartu
			</span>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<!-- CARD 1: SINGLE ITEM DENGAN PRICE TAG PROMO (CLICKABLE CARD DENGAN ROLLING ACTION FOOTER) -->
			<div
				role="button"
				tabindex="0"
				onclick={() => handleAddToCart('p1', 'Gantungan Kunci Akrilik Hologram')}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleAddToCart('p1', 'Gantungan Kunci Akrilik Hologram');
					}
				}}
				class="group relative flex flex-col justify-between rounded-md border-[1.5px] border-[#262626] bg-white p-4 shadow-none cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
			>
				<!-- Hanging Price Tag Badge (Pojok Kiri Atas Luar Card) -->
				<div
					class="absolute -top-3.5 -left-3 z-20 -rotate-6 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105"
				>
					<div
						class="relative flex items-center gap-2 rounded-r-md rounded-l-[4px] border-[1.5px] border-[#262626] bg-[#fea770] py-1.5 pr-3.5 pl-2.5 shadow-[3px_3px_0px_#262626]"
					>
						<!-- Punched Eyelet Hole -->
						<span
							class="h-2.5 w-2.5 shrink-0 rounded-full border-[1.5px] border-[#262626] bg-white shadow-inner"
							aria-hidden="true"
						></span>

						<!-- Price Tag Label -->
						<span class="font-mono text-xs sm:text-[13px] font-black uppercase tracking-wider text-[#262626]">
							Hemat Rp 5.000
						</span>
					</div>
				</div>

				<div>
					<!-- Photo Container -->
					<div
						class="relative mb-3.5 block overflow-hidden rounded-md border border-[#262626] bg-[#f2efe9]"
					>
						<img
							src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80"
							alt="Gantungan Kunci Akrilik Hologram"
							class="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-102"
						/>
						<span
							class="absolute right-2 bottom-2 rounded-md border border-[#262626] bg-white/90 px-2 py-0.5 font-mono text-[10px] font-bold text-[#262626] backdrop-blur-xs"
						>
							Edisi Chibicon
						</span>
					</div>

					<h4 class="font-serif text-lg font-bold text-[#262626] transition-colors group-hover:text-[#b4a6d5] dark:text-[#f2efe9] dark:group-hover:text-[#a2e1db]">
						Gantungan Kunci Akrilik Hologram
					</h4>

					<p class="mt-1 font-mono text-base font-bold text-[#262626] dark:text-[#a2e1db]">
						{formatRupiah(35000)}
					</p>

					<!-- Promo Detail Note (Tanpa Sparkles) -->
					<p class="mt-1.5 text-xs font-medium text-[#404040] dark:text-[#b8b5ad]">
						Beli min. 2 pcs diskon Rp 5.000
					</p>

					<p class="mt-2 line-clamp-2 text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
						Gantungan akrilik dua sisi dengan laminasi glitter pelangi tebal 4mm, tahan air dan anti gores.
					</p>

					<div class="mt-3 flex items-center gap-2">
						<!-- Stock Badge (Mint) -->
						<span
							class="rounded-full border border-[#262626] bg-[#a2e1db] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626]"
						>
							Stok: 18 pcs
						</span>
					</div>
				</div>

				<!-- Card Footer: Rolling Action Container -->
				<div class="mt-4 border-t border-[#262626]/15 pt-3 dark:border-[#f2efe9]/15">
					<div
						class="relative h-10 w-full overflow-hidden rounded-md border-[1.5px] border-[#262626] bg-white transition-all duration-300 dark:border-[#f2efe9]/30 dark:bg-[#252331]"
					>
						<!-- Desktop State Awal: "Detail Produk" dengan icon Eye -->
						<div
							class="hidden sm:flex h-full w-full items-center justify-center gap-2 px-3 text-xs font-bold text-[#262626] transition-transform duration-300 ease-out group-hover:-translate-y-full dark:text-[#f2efe9]"
						>
							<Eye size={15} class="text-[#262626] dark:text-[#f2efe9]" />
							<span>Detail Produk</span>
						</div>

						<!-- Desktop Hover & Mobile Permanen: "Detail Produk" dengan icon ArrowRight -->
						<div
							class="flex sm:absolute sm:inset-0 h-full w-full items-center justify-center gap-2 bg-[#262626] px-3 text-xs font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-transform duration-300 ease-out sm:translate-y-full sm:group-hover:translate-y-0 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9]"
						>
							{#if addedStates['p1']}
								<Check size={14} class="text-[#a2e1db] dark:text-[#065f46]" />
								<span>Membuka Detail...</span>
							{:else}
								<span>Detail Produk</span>
								<ArrowRight size={14} class="transition-transform duration-200 group-hover:translate-x-0.5" />
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- CARD 2: DENGAN VARIAN (CLICKABLE CARD DENGAN ROLLING ACTION FOOTER) -->
			<div
				role="button"
				tabindex="0"
				onclick={() => handleAddToCart('p2', 'Art Print Poster Tebal 260gsm')}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleAddToCart('p2', 'Art Print Poster Tebal 260gsm');
					}
				}}
				class="group relative flex flex-col justify-between rounded-md border-[1.5px] border-[#262626] bg-white p-4 shadow-none cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
			>
				<div>
					<div
						class="relative mb-3.5 block overflow-hidden rounded-md border border-[#262626] bg-[#f2efe9]"
					>
						<img
							src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80"
							alt="Art Print Poster Tebal"
							class="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-102"
						/>
						<span
							class="absolute right-2 bottom-2 rounded-md border border-[#262626] bg-white/90 px-2 py-0.5 font-mono text-[10px] font-bold text-[#262626] backdrop-blur-xs"
						>
							+2 varian
						</span>
					</div>

					<h4 class="font-serif text-lg font-bold text-[#262626] transition-colors group-hover:text-[#b4a6d5] dark:text-[#f2efe9] dark:group-hover:text-[#a2e1db]">
						Art Print Poster Tebal 260gsm
					</h4>

					<p class="mt-1 font-mono text-base font-bold text-[#262626] dark:text-[#a2e1db]">
						{formatRupiah(25000)}
					</p>

					<p class="mt-2 line-clamp-2 text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
						Kertas art carton dengan laminasi doff satin. Tersedia pilihan ukuran A4 dan A5.
					</p>

					<div class="mt-3 flex items-center gap-2">
						<!-- Variant Badge (Lavender) -->
						<span
							class="inline-flex items-center gap-1 rounded-full border border-[#262626] bg-[#b4a6d5] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626]"
						>
							<Layers size={12} strokeWidth={2.5} />
							<span>2 Varian Ukuran</span>
						</span>
					</div>
				</div>

				<!-- Card Footer: Rolling Action Container -->
				<div class="mt-4 border-t border-[#262626]/15 pt-3 dark:border-[#f2efe9]/15">
					<div
						class="relative h-10 w-full overflow-hidden rounded-md border-[1.5px] border-[#262626] bg-white transition-all duration-300 dark:border-[#f2efe9]/30 dark:bg-[#252331]"
					>
						<!-- Desktop State Awal: "Detail Produk" dengan icon Eye -->
						<div
							class="hidden sm:flex h-full w-full items-center justify-center gap-2 px-3 text-xs font-bold text-[#262626] transition-transform duration-300 ease-out group-hover:-translate-y-full dark:text-[#f2efe9]"
						>
							<Eye size={15} class="text-[#262626] dark:text-[#f2efe9]" />
							<span>Detail Produk</span>
						</div>

						<!-- Desktop Hover & Mobile Permanen: "Detail Produk" dengan icon ArrowRight -->
						<div
							class="flex sm:absolute sm:inset-0 h-full w-full items-center justify-center gap-2 bg-[#262626] px-3 text-xs font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-transform duration-300 ease-out sm:translate-y-full sm:group-hover:translate-y-0 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9]"
						>
							{#if addedStates['p2']}
								<Check size={14} class="text-[#a2e1db] dark:text-[#065f46]" />
								<span>Membuka Detail...</span>
							{:else}
								<span>Detail Produk</span>
								<ArrowRight size={14} class="transition-transform duration-200 group-hover:translate-x-0.5" />
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- CARD 3: PRODUK STOK HABIS (OUT OF STOCK - STATIS TANPA ROLLING) -->
			<div
				class="group relative flex flex-col justify-between rounded-md border-[1.5px] border-[#262626]/40 bg-[#f9f7f2] p-4 opacity-80 cursor-not-allowed dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
			>
				<div>
					<div
						class="relative mb-3.5 block overflow-hidden rounded-md border border-[#262626]/40 bg-neutral-200 grayscale"
					>
						<img
							src="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80"
							alt="Sticker Pack Vinyl"
							class="h-44 w-full object-cover"
						/>
						<div
							class="absolute inset-0 flex items-center justify-center bg-black/40"
						>
							<span
								class="rounded-md border border-[#c1121f] bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#c1121f] uppercase shadow-[1px_1px_0px_#c1121f]"
							>
								STOK HABIS
							</span>
						</div>
					</div>

					<h4 class="font-serif text-lg font-bold text-neutral-600 dark:text-neutral-400">
						Sticker Pack Vinyl Doff Waterproof
					</h4>

					<p class="mt-1 font-mono text-base font-bold text-neutral-500">
						{formatRupiah(20000)}
					</p>

					<p class="mt-2 line-clamp-2 text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
						Stiker vinyl anti-air dengan kiss-cut presisi tinggi. Sedang dalam proses cetak ulang batch berikutnya.
					</p>

					<div class="mt-3">
						<!-- Danger Badge -->
						<span
							class="rounded-full border border-[#c1121f] bg-[#fee2e2] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#991b1b]"
						>
							Stok Habis (0 pcs)
						</span>
					</div>
				</div>

				<div class="mt-4 border-t border-[#262626]/15 pt-3 dark:border-[#f2efe9]/15">
					<div
						class="flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[#262626]/30 bg-neutral-200 text-xs font-bold text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500"
					>
						<span>Barang Tidak Tersedia</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- SECTION 2: ADMIN PRODUCT MANAGEMENT CARDS -->
	<section class="space-y-4">
		<div class="flex items-center justify-between border-b-[1.5px] border-[#262626]/20 pb-2 dark:border-[#f2efe9]/20">
			<div>
				<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					2. Admin Product Management Cards (Daftar Produk Pengelola)
				</h3>
				<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
					Baris manajemen produk pengelola: toggle visibilitas, status stok monoline, aksi edit, dan hapus.
				</p>
			</div>
			<span class="rounded-full border border-[#262626] bg-[#b4a6d5] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626]">
				Admin Catalog Row
			</span>
		</div>

		<!-- Container Card List -->
		<div class="overflow-hidden rounded-md border-[1.5px] border-[#262626] bg-white shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]">
			<div class="divide-y-[1.5px] divide-[#262626]/15 dark:divide-[#f2efe9]/15">
				{#each adminProducts as prod (prod.id)}
					<div
						class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors {prod.active
							? 'hover:bg-[#f2efe9]/50 dark:hover:bg-[#1a1825]/50'
							: 'bg-neutral-100/70 opacity-75 dark:bg-neutral-900/50'}"
					>
						<!-- Left: Grip, Thumbnail & Product Information -->
						<div class="flex items-start gap-3.5 flex-1 min-w-0">
							<div class="flex items-center self-center text-[#262626]/40 dark:text-[#f2efe9]/40">
								<span
									class="flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-[#262626]/30 bg-[#f2efe9] hover:bg-neutral-200 active:cursor-grabbing dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
									title="Grip untuk simulasi geser urutan"
								>
									<GripVertical size={16} />
								</span>
							</div>

							<!-- Image Thumbnail -->
							<div class="relative shrink-0">
								<img
									src={prod.imageUrl}
									alt={prod.name}
									class="h-16 w-16 rounded-md border border-[#262626] object-cover {prod.active ? '' : 'grayscale'}"
								/>
								{#if !prod.active}
									<span class="absolute -bottom-1 -right-1 rounded bg-[#262626] px-1 py-0.2 font-mono text-[9px] font-bold text-white">
										OFF
									</span>
								{/if}
							</div>

							<!-- Meta info -->
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<h4 class="font-serif text-sm sm:text-base font-bold text-[#262626] truncate dark:text-[#f2efe9]">
										{prod.name}
									</h4>

									<!-- Badge Kategori -->
									<span class="rounded-md border border-[#262626]/30 bg-[#f2efe9] px-2 py-0.5 font-mono text-[10px] font-bold text-[#262626] dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9]">
										{prod.category}
									</span>

									{#if !prod.active}
										<span class="rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
											Nonaktif
										</span>
									{/if}
								</div>

								<!-- Price & Stock Pills -->
								<div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
									<span class="font-mono font-bold text-[#262626] dark:text-[#a2e1db]">
										{formatRupiah(prod.priceInt)}
									</span>

									<span class="inline-block h-1 w-1 rounded-full bg-[#262626]/30 dark:bg-[#f2efe9]/30"></span>

									{#if prod.hasVariants}
										<span class="inline-flex items-center gap-1 rounded-full border border-[#262626] bg-[#b4a6d5] px-2 py-0.5 font-mono text-[11px] font-bold text-[#262626]">
											<Layers size={11} />
											<span>{prod.variantsCount} Varian ({prod.stock} total stok)</span>
										</span>
									{:else if prod.stock <= 0}
										<span class="rounded-full border border-[#c1121f] bg-[#fee2e2] px-2 py-0.5 font-mono text-[11px] font-bold text-[#991b1b]">
											Stok Habis
										</span>
									{:else if prod.stock <= 3}
										<span class="rounded-full border border-[#92400e] bg-[#fef3c7] px-2 py-0.5 font-mono text-[11px] font-bold text-[#92400e]">
											Sisa Kritis: {prod.stock} pcs
										</span>
									{:else}
										<span class="rounded-full border border-[#262626] bg-[#a2e1db] px-2 py-0.5 font-mono text-[11px] font-bold text-[#262626]">
											Stok: {prod.stock} pcs
										</span>
									{/if}
								</div>

								<p class="mt-1 line-clamp-1 text-xs text-[#404040] dark:text-[#b8b5ad]">
									{prod.description}
								</p>
							</div>
						</div>

						<!-- Right: Visibility Switch & Action Buttons -->
						<div class="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#262626]/15">
							<!-- Toggle Visibility -->
							<button
								type="button"
								onclick={() => handleToggleAdminProduct(prod.id)}
								class="inline-flex items-center gap-1.5 rounded-md border border-[#262626] bg-white px-2.5 py-1.5 font-mono text-xs font-bold transition-all hover:bg-[#f2efe9] active:translate-y-0.5 dark:border-[#f2efe9]/30 dark:bg-[#1a1825]"
								title={prod.active ? 'Klik untuk sembunyikan dari pembeli' : 'Klik untuk tampilkan di katalog'}
							>
								{#if prod.active}
									<Eye size={14} class="text-[#065f46]" />
									<span class="text-[#065f46]">Aktif</span>
								{:else}
									<EyeOff size={14} class="text-neutral-400" />
									<span class="text-neutral-500">Mati</span>
								{/if}
							</button>

							<!-- Edit Button -->
							<button
								type="button"
								onclick={() => handleSimulateEdit(prod.name)}
								class="inline-flex items-center gap-1 rounded-md border-[1.5px] border-[#262626] bg-white px-2.5 py-1.5 font-sans text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9]/30 dark:bg-[#252331] dark:text-[#f2efe9]"
							>
								<Pencil size={13} class="text-[#262626] dark:text-[#f2efe9]" />
								<span>Edit</span>
							</button>

							<!-- Delete Button -->
							<button
								type="button"
								onclick={() => handleSimulateDelete(prod.name)}
								class="inline-flex items-center justify-center rounded-md border border-[#c1121f] bg-[#fee2e2] p-1.5 text-[#991b1b] shadow-[1px_1px_0px_#c1121f] transition-all hover:bg-red-200 active:translate-y-0.5 active:shadow-none"
								title="Hapus produk"
								aria-label="Hapus produk {prod.name}"
							>
								<Trash2 size={14} />
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- SECTION 3: ADMIN METRIC & STAT CARDS -->
	<section class="space-y-4">
		<div class="flex items-center justify-between border-b-[1.5px] border-[#262626]/20 pb-2 dark:border-[#f2efe9]/20">
			<div>
				<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					3. Admin Dashboard Stat Cards
				</h3>
				<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
					Kartu metrik performa toko berbingkai monoline tunggal.
				</p>
			</div>
			<span class="rounded-full border border-[#262626] bg-[#a2e1db] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626]">
				Dashboard KPI
			</span>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- STAT 1: TOTAL OMSET -->
			<div
				class="relative overflow-hidden rounded-[12px_4px_12px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#f2efe9]"
			>
				<span class="absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20">+</span>
				<div class="flex items-center justify-between text-[#404040] dark:text-[#b8b5ad]">
					<span class="font-mono text-xs font-bold">Total Omset</span>
					<TrendingUp size={20} class="text-[#065f46] dark:text-[#34d399]" />
				</div>
				<p class="mt-2 font-mono text-2xl font-black text-[#262626] dark:text-[#f2efe9]">
					{formatRupiah(14850000)}
				</p>
				<div class="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-[#065f46] dark:text-[#34d399]">
					<span class="font-bold">+12.4%</span>
					<span class="text-neutral-500 dark:text-neutral-400">vs minggu lalu</span>
				</div>
			</div>

			<!-- STAT 2: TOTAL ORDER -->
			<div
				class="relative overflow-hidden rounded-[12px_4px_12px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#f2efe9]"
			>
				<span class="absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20">+</span>
				<div class="flex items-center justify-between text-[#404040] dark:text-[#b8b5ad]">
					<span class="font-mono text-xs font-bold">Total Pesanan</span>
					<ShoppingBag size={20} class="text-[#3730a3] dark:text-[#818cf8]" />
				</div>
				<p class="mt-2 font-mono text-2xl font-black text-[#262626] dark:text-[#f2efe9]">
					142 Order
				</p>
				<div class="mt-2 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
					<span class="font-bold text-[#262626] dark:text-[#f2efe9]">134</span> lunas diverifikasi
				</div>
			</div>

			<!-- STAT 3: BUTUH VERIFIKASI -->
			<div
				class="relative overflow-hidden rounded-[12px_4px_12px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#f2efe9]"
			>
				<span class="absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20">+</span>
				<div class="flex items-center justify-between text-[#404040] dark:text-[#b8b5ad]">
					<span class="font-mono text-xs font-bold">Perlu Konfirmasi</span>
					<Clock size={20} class="text-[#92400e] dark:text-[#fbbf24]" />
				</div>
				<p class="mt-2 font-mono text-2xl font-black text-[#92400e] dark:text-[#fbbf24]">
					5 Transaksi
				</p>
				<div class="mt-2 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
					Menunggu verifikasi bukti
				</div>
			</div>

			<!-- STAT 4: PRODUK MENIPIS -->
			<div
				class="relative overflow-hidden rounded-[12px_4px_12px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#f2efe9]"
			>
				<span class="absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20">+</span>
				<div class="flex items-center justify-between text-[#404040] dark:text-[#b8b5ad]">
					<span class="font-mono text-xs font-bold">Peringatan Stok</span>
					<AlertTriangle size={20} class="text-[#991b1b] dark:text-[#f87171]" />
				</div>
				<p class="mt-2 font-mono text-2xl font-black text-[#991b1b] dark:text-[#f87171]">
					3 Produk
				</p>
				<div class="mt-2 text-[11px] font-mono font-bold text-[#991b1b] dark:text-[#f87171]">
					Stok tersisa di bawah 5 pcs
				</div>
			</div>
		</div>
	</section>

	<!-- SECTION 4: ORDER SUMMARY / CART CARD -->
	<section class="space-y-4">
		<div class="flex items-center justify-between border-b-[1.5px] border-[#262626]/20 pb-2 dark:border-[#f2efe9]/20">
			<div>
				<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					4. Order Summary & Cart Card
				</h3>
				<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
					Modul ringkasan pesanan sebelum checkout: rincian subtotal, promo peach, dan tombol bayar arang pekat.
				</p>
			</div>
			<span class="rounded-full border border-[#262626] bg-[#fea770] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626]">
				Checkout Flow
			</span>
		</div>

		<div class="relative max-w-xl mx-auto rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-6 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#f2efe9]">
			<span class="absolute top-2 right-2 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20">+</span>
			<div class="flex items-center justify-between border-b-[1.5px] border-[#262626]/15 pb-3 dark:border-[#f2efe9]/15">
				<h4 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9] flex items-center gap-2">
					<ShoppingBag size={18} class="text-[#262626] dark:text-[#f2efe9]" />
					<span>Ringkasan Keranjang ({cartItems.length} barang)</span>
				</h4>
				<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
					Simulasi Interaktif
				</span>
			</div>

			<!-- Daftar Item -->
			<ul class="divide-y divide-[#262626]/10 py-3 dark:divide-[#f2efe9]/10">
				{#each cartItems as item (item.id)}
					<li class="flex items-center justify-between py-2.5 text-xs">
						<div class="min-w-0 flex-1 pr-3">
							<p class="font-serif font-bold text-[#262626] dark:text-[#f2efe9] truncate">{item.name}</p>
							<p class="font-mono text-[11px] text-[#404040] dark:text-[#b8b5ad]">{item.variant}</p>
							<p class="font-mono font-bold text-[#262626] mt-0.5 dark:text-[#a2e1db]">{formatRupiah(item.price)}</p>
						</div>

						<div class="flex items-center gap-2 shrink-0">
							<div class="flex items-center rounded-md border border-[#262626] bg-[#f2efe9] dark:border-[#f2efe9]/30 dark:bg-[#1a1825]">
								<button
									type="button"
									onclick={() => handleQtyChange(item.id, -1)}
									class="p-1 hover:bg-neutral-200 active:bg-neutral-300"
									aria-label="Kurang satu"
								>
									<Minus size={12} />
								</button>
								<span class="w-6 text-center font-mono font-bold text-xs">{item.qty}</span>
								<button
									type="button"
									onclick={() => handleQtyChange(item.id, 1)}
									class="p-1 hover:bg-neutral-200 active:bg-neutral-300"
									aria-label="Tambah satu"
								>
									<Plus size={12} />
								</button>
							</div>

							<span class="w-20 text-right font-mono font-bold text-[#262626] dark:text-[#f2efe9]">
								{formatRupiah(item.price * item.qty)}
							</span>
						</div>
					</li>
				{/each}
			</ul>

			<!-- Rincian Biaya (Perforated Receipt Tear-Line) -->
			<div class="border-t-[1.5px] border-dashed border-[#262626]/30 pt-3 space-y-1.5 text-xs font-mono dark:border-[#f2efe9]/30">
				<div class="flex justify-between text-[#404040] dark:text-[#b8b5ad]">
					<span>Subtotal Barang:</span>
					<span class="font-bold text-[#262626] dark:text-[#f2efe9]">{formatRupiah(cartSubtotal)}</span>
				</div>

				<div class="flex justify-between text-[#991b1b] dark:text-red-400">
					<span class="flex items-center gap-1">
						<Sparkles size={12} />
						<span>Diskon Promo:</span>
					</span>
					<span class="font-bold">-{formatRupiah(discountPromo)}</span>
				</div>

				<div class="flex justify-between text-[#404040] dark:text-[#b8b5ad]">
					<span>Pengiriman (JNE Reguler):</span>
					<span class="font-bold text-[#262626] dark:text-[#f2efe9]">{formatRupiah(shippingCost)}</span>
				</div>
			</div>

			<!-- Total Pembayaran (Accounting Double Monoline Rule) -->
			<div class="mt-4 flex items-center justify-between border-t-2 border-b-2 border-double border-[#262626] py-2.5 dark:border-[#f2efe9]">
				<span class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					Total Pembayaran
				</span>
				<span class="font-mono text-xl font-black text-[#262626] dark:text-[#a2e1db]">
					{formatRupiah(cartTotal)}
				</span>
			</div>

			<!-- Tombol Lanjut Checkout -->
			<div class="mt-5">
				<button
					type="button"
					onclick={() => toast.success('Simulasi: Berlanjut ke pengisian data pembeli & metode pengiriman.')}
					class="flex w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-[#262626] bg-[#262626] py-3 text-sm font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#e0ded8]"
				>
					<span>Lanjut ke Pengisian Data</span>
					<ArrowRight size={16} />
				</button>
			</div>
		</div>
	</section>
</div>
