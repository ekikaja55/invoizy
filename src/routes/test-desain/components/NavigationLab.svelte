<script lang="ts">
	import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
	import MobileFab from '$lib/components/nav/MobileFab.svelte';
	import type { NavItem } from '$lib/constants';
	import {
		LayoutDashboard,
		ShoppingCart,
		Package,
		FolderTree,
		Tag,
		Settings,
		Home,
		ShoppingBag,
		History,
		Smartphone,
		Monitor,
		CheckCircle,
		Sparkles
	} from '@lucide/svelte';

	// Nav items untuk mode Admin
	const adminNavItems: NavItem[] = [
		{ label: 'Dashboard', hoverLabel: 'Buka Rekap', href: '/admin', icon: LayoutDashboard },
		{ label: 'Pesanan', hoverLabel: 'Cek Order', href: '/admin/orders', icon: ShoppingCart },
		{ label: 'Katalog Produk', hoverLabel: 'Kelola Item', href: '/admin/products', icon: Package },
		{ label: 'Kategori', hoverLabel: 'Atur Kategori', href: '/admin/categories', icon: FolderTree },
		{ label: 'Kupon Promo', hoverLabel: 'Kupon Diskon', href: '/admin/promo', icon: Tag },
		{ label: 'Pengaturan Toko', hoverLabel: 'Atur Toko', href: '/admin/settings', icon: Settings }
	];

	// Nav items untuk mode Pembeli (Public Buyer)
	const publicNavItems: NavItem[] = [
		{ label: 'Beranda Toko', hoverLabel: 'Ke Beranda', href: '/', icon: Home },
		{ label: 'Katalog Belanja', hoverLabel: 'Katalog Produk', href: '/order', icon: ShoppingBag },
		{ label: 'Lacak Pesanan', hoverLabel: 'Cek Status', href: '/order/riwayat', icon: History }
	];

	// Kontak toko untuk simulasi flyout & accordion
	const mockContact = {
		wa: '6281234567890',
		instagram: 'cho.lazey'
	};

	let selectedRole = $state<'admin' | 'public'>('admin');
	const currentNavItems = $derived(selectedRole === 'admin' ? adminNavItems : publicNavItems);
</script>

<div class="space-y-12">
	<!-- HEADER EXPLANATION -->
	<div
		class="rounded-md border-[1.5px] border-[#262626] bg-white p-5 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
	>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
					Navigation & Mobile FAB Showcase
				</h2>
				<p class="mt-1 text-xs text-[#404040] dark:text-[#b8b5ad]">
					Eksplorasi komponen navigasi desktop (<code
						class="font-mono text-[#262626] dark:text-[#a2e1db]">SidebarNav</code
					>) dan mobile (<code class="font-mono text-[#262626] dark:text-[#a2e1db]">MobileFab</code
					>) dengan presisi Warm Monoline.
				</p>
			</div>

			<!-- Role Switcher Control -->
			<div
				class="inline-flex rounded-md border-[1.5px] border-[#262626] bg-[#f2efe9] p-1 dark:border-[#f2efe9]/40 dark:bg-[#1a1825]"
			>
				<button
					type="button"
					onclick={() => (selectedRole = 'admin')}
					class="rounded-md px-3 py-1 text-xs font-bold transition-all {selectedRole === 'admin'
						? 'bg-[#262626] text-[#f2efe9] shadow-[1px_1px_0px_#262626] dark:bg-[#f2efe9] dark:text-[#262626]'
						: 'text-[#404040] hover:text-[#262626] dark:text-[#b8b5ad] dark:hover:text-[#f2efe9]'}"
				>
					Mode Admin ({adminNavItems.length} menu)
				</button>
				<button
					type="button"
					onclick={() => (selectedRole = 'public')}
					class="rounded-md px-3 py-1 text-xs font-bold transition-all {selectedRole === 'public'
						? 'bg-[#262626] text-[#f2efe9] shadow-[1px_1px_0px_#262626] dark:bg-[#f2efe9] dark:text-[#262626]'
						: 'text-[#404040] hover:text-[#262626] dark:text-[#b8b5ad] dark:hover:text-[#f2efe9]'}"
				>
					Mode Pembeli ({publicNavItems.length} menu)
				</button>
			</div>
		</div>
	</div>

	<!-- SECTION 1: DESKTOP SIDEBAR NAV CANVAS -->
	<section class="space-y-4">
		<div
			class="flex items-center justify-between border-b-[1.5px] border-[#262626]/20 pb-2 dark:border-[#f2efe9]/20"
		>
			<div class="flex items-center gap-2">
				<Monitor size={18} class="text-[#262626] dark:text-[#f2efe9]" />
				<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					1. Desktop Sidebar Navigation (Live Sandbox)
				</h3>
			</div>
			<span
				class="rounded-full border border-[#262626] bg-[#b4a6d5] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626]"
			>
				Interactive Desktop Frame
			</span>
		</div>

		<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
			Sidebar navigasi kombinasi 4 warna MonolineLoader: background Peach (#fea770), sudut
			rounded-xl, cluster ornamen 4 warna, auto-expand saat tertutup, dan text roller effect
			interaktif.
		</p>

		<!-- Desktop Frame Simulator Container -->
		<div
			class="drafting-grid relative min-h-[460px] overflow-visible rounded-md border-[1.5px] border-[#262626] bg-[#f9f7f2] p-6 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#1a1825]"
		>
			<div class="flex flex-col items-start gap-6 lg:flex-row">
				<!-- Embedded Live SidebarNav with staticPosition={true} -->
				<div class="shrink-0">
					<SidebarNav
						items={currentNavItems}
						isAdmin={selectedRole === 'admin'}
						contact={mockContact}
						staticPosition={true}
						preventNavigation={true}
					/>
				</div>

				<!-- Mock Page Content Panel to show layout relationship -->
				<div
					class="w-full flex-1 rounded-md border-[1.5px] border-[#262626] bg-white p-5 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
				>
					<div class="border-b border-[#262626]/15 pb-3 dark:border-[#f2efe9]/15">
						<span
							class="font-mono text-[11px] font-bold text-[#404040] uppercase dark:text-[#b8b5ad]"
						>
							Area Konten Halaman ({selectedRole === 'admin' ? 'Admin Dashboard' : 'Katalog Toko'})
						</span>
						<h4 class="mt-1 font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
							Uji Fitur & Aksesibilitas Sidebar Nav
						</h4>
					</div>

					<div class="mt-4 space-y-3 text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
						<div class="flex items-start gap-2.5">
							<CheckCircle size={15} class="mt-0.5 shrink-0 text-[#065f46]" />
							<div>
								<strong class="font-bold text-[#262626] dark:text-[#f2efe9]"
									>Hover-to-Expand (Auto Buka):</strong
								>
								Saat sidebar diciutkan (ikon saja), arahkan kursor ke sidebar untuk membukanya secara
								instan tanpa harus mengklik tombol.
							</div>
						</div>

						<div class="flex items-start gap-2.5">
							<CheckCircle size={15} class="mt-0.5 shrink-0 text-[#065f46]" />
							<div>
								<strong class="font-bold text-[#262626] dark:text-[#f2efe9]"
									>Vertical Text Roller Effect:</strong
								>
								Arahkan kursor ke label menu untuk melihat animasi teks bergulir vertikal yang mulus dan
								taktil dengan proteksi aksesibilitas screen reader.
							</div>
						</div>

						<div class="flex items-start gap-2.5">
							<CheckCircle size={15} class="mt-0.5 shrink-0 text-[#065f46]" />
							<div>
								<strong class="font-bold text-[#262626] dark:text-[#f2efe9]"
									>Estetika Blocky & Ornamen Sudut:</strong
								>
								Komponen dan menu memakai sudut kotak tegas (<code class="font-mono"
									>rounded-none</code
								>, border 2px) dengan ornamen aksen geometris monoline di sudut kontainer.
							</div>
						</div>

						<div class="flex items-start gap-2.5">
							<CheckCircle size={15} class="mt-0.5 shrink-0 text-[#065f46]" />
							<div>
								<strong class="font-bold text-[#262626] dark:text-[#f2efe9]"
									>Flyout Popover Kontak & Tema:</strong
								>
								Menu kontak saluran WhatsApp / Instagram dan penukaran tema terpadu di bagian bawah sidebar.
							</div>
						</div>
					</div>

					<div
						class="mt-6 rounded-md border border-[#262626]/20 bg-[#f2efe9] p-3 font-mono text-[11px] text-[#404040] dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#b8b5ad]"
					>
						Status Terpilih: {selectedRole.toUpperCase()} — {currentNavItems.length} Navigasi Aktif
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- SECTION 2: MOBILE VIEWPORT SANDBOX & FAB -->
	<section class="space-y-4">
		<div
			class="flex items-center justify-between border-b-[1.5px] border-[#262626]/20 pb-2 dark:border-[#f2efe9]/20"
		>
			<div class="flex items-center gap-2">
				<Smartphone size={18} class="text-[#262626] dark:text-[#f2efe9]" />
				<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					2. Mobile Viewport Sandbox & Floating Action Button (FAB)
				</h3>
			</div>
			<span
				class="rounded-full border border-[#262626] bg-[#fea770] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626]"
			>
				Phone Screen 360×620px
			</span>
		</div>

		<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
			Simulator layar sentuh ponsel pintar: klik tombol floating bulat peach di pojok kanan bawah
			bingkai HP untuk menguji ekspansi menu, navigasi accordion kontak, dan backdrop overlay.
		</p>

		<!-- Centered Mobile Phone Mockup Frame -->
		<div class="flex justify-center py-4">
			<div
				class="relative flex h-[620px] w-[360px] flex-col justify-between overflow-hidden rounded-[36px] border-[3px] border-[#262626] bg-[#f2efe9] shadow-[6px_6px_0px_#262626] dark:border-[#f2efe9]/40 dark:bg-[#1a1825] dark:shadow-[6px_6px_0px_#f2efe9]"
			>
				<!-- Phone Top Speaker & Camera Notch -->
				<div
					class="relative z-20 flex items-center justify-center border-b border-[#262626]/15 bg-[#f2efe9] pt-3 pb-2 dark:border-[#f2efe9]/15 dark:bg-[#1a1825]"
				>
					<div class="flex items-center gap-2">
						<span
							class="h-3 w-3 rounded-full border border-[#262626]/40 bg-[#262626]/20 dark:border-[#f2efe9]/40 dark:bg-[#f2efe9]/20"
						></span>
						<span class="h-1.5 w-12 rounded-full bg-[#262626]/30 dark:bg-[#f2efe9]/30"></span>
					</div>
				</div>

				<!-- Phone Screen Body with Mock Store View -->
				<div class="relative z-10 flex-1 space-y-3 overflow-y-auto px-4 py-3">
					<!-- Mini Store Header -->
					<div
						class="flex items-center justify-between border-b-[1.5px] border-[#262626] pb-2 dark:border-[#f2efe9]/30"
					>
						<div>
							<span class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
								Cho Lazey Studio
							</span>
							<p class="text-[10px] text-[#404040] dark:text-[#b8b5ad]">Katalog Chibicon 2026</p>
						</div>
						<span
							class="rounded border border-[#262626] bg-[#a2e1db] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#262626]"
						>
							{selectedRole === 'admin' ? 'ADMIN' : 'BUYER'}
						</span>
					</div>

					<!-- Sample Mock Product Cards in Mobile Viewport -->
					<div
						class="rounded-md border-[1.5px] border-[#262626] bg-white p-2.5 shadow-[1.5px_1.5px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
					>
						<div class="flex gap-2.5">
							<div
								class="h-14 w-14 shrink-0 overflow-hidden rounded border border-[#262626] bg-[#f2efe9]"
							>
								<img
									src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=120&auto=format&fit=crop&q=80"
									alt="Gantungan Kunci"
									class="h-full w-full object-cover"
								/>
							</div>
							<div class="min-w-0 flex-1">
								<h5
									class="truncate font-serif text-xs font-bold text-[#262626] dark:text-[#f2efe9]"
								>
									Gantungan Kunci Akrilik
								</h5>
								<p class="font-mono text-[11px] font-bold text-[#262626] dark:text-[#a2e1db]">
									Rp 35.000
								</p>
								<span
									class="py-0.2 mt-0.5 inline-block rounded bg-[#fea770] px-1 font-mono text-[9px] font-bold text-[#262626]"
								>
									Hemat Rp 5.000
								</span>
							</div>
						</div>
					</div>

					<div
						class="rounded-md border-[1.5px] border-[#262626] bg-white p-2.5 shadow-[1.5px_1.5px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
					>
						<div class="flex gap-2.5">
							<div
								class="h-14 w-14 shrink-0 overflow-hidden rounded border border-[#262626] bg-[#f2efe9]"
							>
								<img
									src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=120&auto=format&fit=crop&q=80"
									alt="Art Print Poster"
									class="h-full w-full object-cover"
								/>
							</div>
							<div class="min-w-0 flex-1">
								<h5
									class="truncate font-serif text-xs font-bold text-[#262626] dark:text-[#f2efe9]"
								>
									Art Print Poster Tebal
								</h5>
								<p class="font-mono text-[11px] font-bold text-[#262626] dark:text-[#a2e1db]">
									Rp 25.000
								</p>
								<span
									class="py-0.2 mt-0.5 inline-block rounded bg-[#b4a6d5] px-1 font-mono text-[9px] font-bold text-[#262626]"
								>
									2 Varian Ukuran
								</span>
							</div>
						</div>
					</div>

					<div
						class="rounded-md border border-[#262626]/20 bg-[#f9f7f2] p-2.5 text-center dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
					>
						<Sparkles size={14} class="mx-auto text-[#262626] dark:text-[#f2efe9]" />
						<p class="mt-1 text-[11px] font-bold text-[#262626] dark:text-[#f2efe9]">
							Ketuk Tombol FAB di Bawah
						</p>
						<p class="text-[10px] text-[#404040] dark:text-[#b8b5ad]">
							Untuk membuka menu drawer seluler
						</p>
					</div>
				</div>

				<!-- LIVE EMBEDDED MobileFab Component anchored inside Phone Frame -->
				<MobileFab
					items={currentNavItems}
					isAdmin={selectedRole === 'admin'}
					contact={mockContact}
					staticPosition={true}
					preventNavigation={true}
				/>

				<!-- Phone Bottom Home Indicator Bar -->
				<div
					class="relative z-20 flex justify-center border-t border-[#262626]/10 bg-[#f2efe9] py-2 dark:border-[#f2efe9]/10 dark:bg-[#1a1825]"
				>
					<span class="h-1 w-28 rounded-full bg-[#262626]/40 dark:bg-[#f2efe9]/40"></span>
				</div>
			</div>
		</div>
	</section>
</div>
