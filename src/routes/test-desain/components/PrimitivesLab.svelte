<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import { toast } from 'svelte-sonner';
	import Modal from '$lib/components/ui/Modal.svelte';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';
	import MonolineLoader from '$lib/components/ui/MonolineLoader.svelte';
	import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { formatRupiah } from '$lib/utils/currency';
	import { invoiceStatusLabel, paymentStatusLabel } from '$lib/utils/status-label';
	import { mockPaymentStatuses, mockInvoiceStatuses, mockTableOrders } from '../mock-data';
	import {
		Plus,
		Minus,
		RefreshCw,
		Copy,
		Check,
		Info,
		CheckCircle,
		AlertTriangle,
		XCircle,
		PanelRight,
		X,
		Layers
	} from '@lucide/svelte';

	// State interaktif untuk testing
	let modalDangerOpen = $state(false);
	let modalStandardOpen = $state(false);
	let testGlobalBusy = $state(false);
	let testLocalBusy = $state(false);
	let testNavigating = $state(false);
	let testDrawerOpen = $state(false);
	let testQty = $state(3);
	let testStock = $state(15);
	let testCopied = $state(false);
	let testRefreshing = $state(false);
	let testPage = $state(1);

	function triggerGlobalBusy() {
		testGlobalBusy = true;
		setTimeout(() => {
			if (testGlobalBusy) {
				testGlobalBusy = false;
				toast.success('Simulasi: Operasi fullscreen blocking selesai.');
			}
		}, 2500);
	}

	function triggerLocalBusy() {
		testLocalBusy = true;
		setTimeout(() => {
			testLocalBusy = false;
			toast.success('Simulasi: Sinkronisasi kartu lokal berhasil.');
		}, 2000);
	}

	function triggerNavigating() {
		testNavigating = true;
		setTimeout(() => {
			testNavigating = false;
			toast.info('Simulasi: Transisi rute halaman selesai.');
		}, 2000);
	}

	function triggerToast(type: 'success' | 'error' | 'warning' | 'info') {
		switch (type) {
			case 'success':
				toast.success('Transaksi berhasil diverifikasi (Status: Lunas)');
				break;
			case 'error':
				toast.error('Gagal memproses pembayaran: Waktu transfer kedaluwarsa.');
				break;
			case 'warning':
				toast.warning('Peringatan: Stok produk tersisa 2 item lagi.');
				break;
			case 'info':
				toast.info('Info: Ada pesanan baru menunggu konfirmasi admin.');
				break;
		}
	}

	function handleTestRefresh() {
		testRefreshing = true;
		setTimeout(() => {
			testRefreshing = false;
			toast.success('Katalog simulasi diperbarui.');
		}, 800);
	}

	function handleTestCopy() {
		navigator.clipboard.writeText('INVOIZY-SCRAPBOOK-2026');
		testCopied = true;
		toast.success('Kode berhasil disalin ke clipboard!');
		setTimeout(() => {
			testCopied = false;
		}, 2000);
	}

	function dateLabel(iso: string): string {
		try {
			return new Intl.DateTimeFormat('id-ID', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(new Date(iso));
		} catch {
			return iso;
		}
	}
</script>

<div class="space-y-10">
	<!-- SECTION 1: BUTTONS & ACTIONS -->
	<section
		class="space-y-4 rounded-md border-[1.5px] border-[#262626] bg-white p-6 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
	>
		<div class="border-b-[1.5px] border-[#262626]/15 pb-2 dark:border-[#f2efe9]/15">
			<div class="flex items-center justify-between">
				<h2 class="font-serif text-base font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
					1. Buttons & Actions (Warm Monoline)
				</h2>
				<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
					Solid 1.5px Border
				</span>
			</div>
			<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
				Tombol transaksi bergaris tunggal monoline dengan gravitasi visual arang pekat (#262626).
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<!-- Primary CTA Charcoal (Rolling Ticker) -->
			<button
				type="button"
				class="group relative overflow-hidden rounded-md border-[1.5px] border-[#262626] bg-[#262626] px-4 py-2 text-sm font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#e0ded8]"
			>
				<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
					Primary CTA (Arang / Krem Dark)
				</span>
				<span
					class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					Primary CTA (Arang / Krem Dark)
				</span>
			</button>

			<!-- Secondary Action Lavender Hover (Rolling Ticker) -->
			<button
				type="button"
				class="group relative overflow-hidden rounded-md border-[1.5px] border-[#262626] bg-white px-4 py-2 text-sm font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5]/40 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#b4a6d5] dark:hover:text-[#1a1825]"
			>
				<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
					Secondary (Lavender Hover)
				</span>
				<span
					class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					Secondary (Lavender Hover)
				</span>
			</button>

			<!-- Mint Outline / Option (Rolling Ticker) -->
			<button
				type="button"
				class="group relative overflow-hidden rounded-md border-[1.5px] border-[#262626] bg-[#a2e1db] px-4 py-2 text-sm font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#8ee0d9] active:translate-y-0.5 active:shadow-none"
			>
				<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
					Accent Mint (#a2e1db)
				</span>
				<span
					class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					Accent Mint (#a2e1db)
				</span>
			</button>

			<!-- Refresh / Loading (Rolling Ticker with Lock on Active) -->
			<button
				type="button"
				onclick={handleTestRefresh}
				disabled={testRefreshing}
				class="group relative overflow-hidden inline-flex items-center rounded-md border-[1.5px] border-[#262626] bg-white px-3.5 py-2 text-sm font-bold text-[#262626] shadow-[2px_2px_0px_#262626] hover:bg-[#f2efe9] disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#433e56]"
			>
				{#if testRefreshing}
					<span class="inline-flex items-center gap-2">
						<RefreshCw size={15} class="animate-spin text-[#262626] dark:text-[#f2efe9]" />
						<span>Memperbarui...</span>
					</span>
				{:else}
					<span class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
						<RefreshCw size={15} />
						<span>Refresh Data</span>
					</span>
					<span
						class="absolute inset-0 inline-flex items-center justify-center gap-2 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						<RefreshCw size={15} class="rotate-180 transition-transform duration-500" />
						<span>Refresh Data</span>
					</span>
				{/if}
			</button>

			<!-- Quick Copy Action (Rolling Ticker with Lock on Copied) -->
			<button
				type="button"
				onclick={handleTestCopy}
				class="group relative overflow-hidden inline-flex items-center rounded-md border-[1.5px] border-[#262626] bg-[#fea770] px-3.5 py-2 text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#ff9654] active:translate-y-0.5 active:shadow-none"
			>
				{#if testCopied}
					<span class="inline-flex items-center gap-1.5 text-[#065f46]">
						<Check size={14} class="stroke-[2.5]" />
						<span>Tersalin!</span>
					</span>
				{:else}
					<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
						<Copy size={14} />
						<span>Salin Kode</span>
					</span>
					<span
						class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						<Copy size={14} />
						<span>Salin Kode</span>
					</span>
				{/if}
			</button>

			<!-- Danger Crimson (Rolling Ticker) -->
			<button
				type="button"
				class="group relative overflow-hidden rounded-md border-[1.5px] border-[#c1121f] bg-[#fee2e2] px-4 py-2 text-sm font-bold text-[#991b1b] shadow-[2px_2px_0px_#c1121f] transition-all hover:bg-red-200 active:translate-y-0.5 active:shadow-none"
			>
				<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
					Danger Action
				</span>
				<span
					class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					Danger Action
				</span>
			</button>

			<!-- Disabled Button -->
			<button
				type="button"
				disabled
				class="cursor-not-allowed rounded-md border border-neutral-400 bg-neutral-200 px-4 py-2 text-sm font-bold text-neutral-500 opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500"
			>
				Disabled State
			</button>
		</div>
	</section>

	<!-- SECTION 2: TOAST NOTIFICATIONS -->
	<section
		class="space-y-4 rounded-md border-[1.5px] border-[#262626] bg-white p-6 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
	>
		<div class="border-b-[1.5px] border-[#262626]/15 pb-2 dark:border-[#f2efe9]/15">
			<h2 class="font-serif text-base font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
				2. Toast Notifications (Sonner)
			</h2>
			<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
				Feedback interaktif pop-up notifikasi untuk setiap status sistem.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2.5">
			<button
				type="button"
				onclick={() => triggerToast('success')}
				class="group relative overflow-hidden inline-flex items-center rounded-md border border-[#065f46] bg-[#d1fae5] px-3 py-1.5 text-xs font-bold text-[#065f46] shadow-[1px_1px_0px_#065f46] hover:bg-[#a7f3d0] transition-all"
			>
				<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
					<CheckCircle size={14} class="text-[#065f46]" />
					<span>Toast Success</span>
				</span>
				<span
					class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					<CheckCircle size={14} class="text-[#065f46]" />
					<span>Toast Success</span>
				</span>
			</button>

			<button
				type="button"
				onclick={() => triggerToast('error')}
				class="group relative overflow-hidden inline-flex items-center rounded-md border border-[#991b1b] bg-[#fee2e2] px-3 py-1.5 text-xs font-bold text-[#991b1b] shadow-[1px_1px_0px_#991b1b] hover:bg-red-200 transition-all"
			>
				<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
					<XCircle size={14} class="text-[#991b1b]" />
					<span>Toast Error</span>
				</span>
				<span
					class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					<XCircle size={14} class="text-[#991b1b]" />
					<span>Toast Error</span>
				</span>
			</button>

			<button
				type="button"
				onclick={() => triggerToast('warning')}
				class="group relative overflow-hidden inline-flex items-center rounded-md border border-[#92400e] bg-[#fef3c7] px-3 py-1.5 text-xs font-bold text-[#92400e] shadow-[1px_1px_0px_#92400e] hover:bg-[#fde68a] transition-all"
			>
				<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
					<AlertTriangle size={14} class="text-[#92400e]" />
					<span>Toast Warning</span>
				</span>
				<span
					class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					<AlertTriangle size={14} class="text-[#92400e]" />
					<span>Toast Warning</span>
				</span>
			</button>

			<button
				type="button"
				onclick={() => triggerToast('info')}
				class="group relative overflow-hidden inline-flex items-center rounded-md border border-[#3730a3] bg-[#e0e7ff] px-3 py-1.5 text-xs font-bold text-[#3730a3] shadow-[1px_1px_0px_#3730a3] hover:bg-[#c7d2fe] transition-all"
			>
				<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
					<Info size={14} />
					<span>Toast Info</span>
				</span>
				<span
					class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					<Info size={14} />
					<span>Toast Info</span>
				</span>
			</button>
		</div>
	</section>

	<!-- SECTION 3: OVERLAYS, DIALOGS & LOADERS PLAYGROUND -->
	<section
		class="space-y-6 rounded-md border-[1.5px] border-[#262626] bg-white p-6 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
	>
		<div class="border-b-[1.5px] border-[#262626]/15 pb-2 dark:border-[#f2efe9]/15">
			<div class="flex items-center justify-between">
				<h2 class="font-serif text-base font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
					3. Overlays, Dialogs & Loaders Playground
				</h2>
				<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
					Spatial Scope Hierarchy
				</span>
			</div>
			<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
				Pengujian seluruh tingkatan overlay: Modal konfirmasi, Fullscreen Blocking Busy, Targeted Card-Level Busy, Route Navigation, dan Mobile Drawer Sheet.
			</p>
		</div>

		<!-- SUB-SECTION A: MODAL DIALOGS -->
		<div class="space-y-2">
			<span class="font-mono text-xs font-bold uppercase text-[#404040] dark:text-[#b8b5ad]">
				A. Modal Confirmation Dialogs (Backdrop Focus Trap)
			</span>
			<div class="flex flex-wrap items-center gap-3">
				<!-- Danger Trigger Button -->
				<button
					type="button"
					onclick={() => (modalDangerOpen = true)}
					class="group relative overflow-hidden rounded-[8px_3px_7px_2px] border-[1.5px] border-[#c1121f] bg-[#fee2e2] px-4 py-2 font-sans text-xs font-bold text-[#991b1b] shadow-[2px_2px_0px_#c1121f] transition-all hover:bg-red-200 active:translate-y-0.5 active:shadow-none"
				>
					<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
						Uji Modal Bahaya (Hapus Produk)
					</span>
					<span
						class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						Uji Modal Bahaya (Hapus Produk)
					</span>
				</button>

				<!-- Standard Trigger Button -->
				<button
					type="button"
					onclick={() => (modalStandardOpen = true)}
					class="group relative overflow-hidden rounded-[8px_3px_7px_2px] border-[1.5px] border-[#262626] bg-white px-4 py-2 font-sans text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#b4a6d5] dark:hover:text-[#1a1825]"
				>
					<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
						Uji Modal Standar (Publikasi)
					</span>
					<span
						class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						Uji Modal Standar (Publikasi)
					</span>
				</button>
			</div>
		</div>

		<!-- SUB-SECTION B: FULL-SCREEN OVERLAYS -->
		<div class="space-y-2 border-t border-[#262626]/10 pt-4 dark:border-[#f2efe9]/10">
			<span class="font-mono text-xs font-bold uppercase text-[#404040] dark:text-[#b8b5ad]">
				B. Full-Screen Blocking Overlays
			</span>
			<div class="flex flex-wrap items-center gap-3">
				<!-- Global Busy Trigger -->
				<button
					type="button"
					onclick={triggerGlobalBusy}
					class="group relative overflow-hidden inline-flex items-center rounded-md border-[1.5px] border-[#262626] bg-[#262626] px-4 py-2 font-sans text-xs font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none"
				>
					<span class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
						<RefreshCw size={14} class={testGlobalBusy ? 'animate-spin' : ''} />
						<span>Uji Fullscreen Busy Overlay (2.5 detik)</span>
					</span>
					<span
						class="absolute inset-0 inline-flex items-center justify-center gap-2 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						<RefreshCw size={14} class={testGlobalBusy ? 'animate-spin' : ''} />
						<span>Uji Fullscreen Busy Overlay (2.5 detik)</span>
					</span>
				</button>

				<!-- Route Navigating Trigger -->
				<button
					type="button"
					onclick={triggerNavigating}
					class="group relative overflow-hidden inline-flex items-center rounded-md border-[1.5px] border-[#262626] bg-white px-4 py-2 font-sans text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#b4a6d5] dark:hover:text-[#1a1825]"
				>
					<span class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
						<Layers size={14} />
						<span>Uji Route Navigation Overlay (2 detik)</span>
					</span>
					<span
						class="absolute inset-0 inline-flex items-center justify-center gap-2 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						<Layers size={14} />
						<span>Uji Route Navigation Overlay (2 detik)</span>
					</span>
				</button>

				<!-- Mobile Drawer Trigger -->
				<button
					type="button"
					onclick={() => (testDrawerOpen = true)}
					class="group relative overflow-hidden inline-flex items-center rounded-md border-[1.5px] border-[#262626] bg-[#fea770] px-4 py-2 font-sans text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#ff9654] active:translate-y-0.5 active:shadow-none"
				>
					<span class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
						<PanelRight size={14} />
						<span>Uji Mobile Drawer Sheet & Backdrop</span>
					</span>
					<span
						class="absolute inset-0 inline-flex items-center justify-center gap-2 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						<PanelRight size={14} />
						<span>Uji Mobile Drawer Sheet & Backdrop</span>
					</span>
				</button>
			</div>
		</div>

		<!-- SUB-SECTION C: TARGETED CARD-LEVEL OVERLAY -->
		<div class="space-y-2 border-t border-[#262626]/10 pt-4 dark:border-[#f2efe9]/10">
			<div class="flex items-center justify-between">
				<span class="font-mono text-xs font-bold uppercase text-[#404040] dark:text-[#b8b5ad]">
					C. Targeted Card-Level Overlay (Non-blocking ke sisa layar)
				</span>
				<span class="rounded bg-[#a2e1db] px-2 py-0.5 font-mono text-[10px] font-bold text-[#262626]">
					Local Scope
				</span>
			</div>
			<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
				Overlay membekukan kartu tertentu saja saat proses mutasi, tanpa mengunci scrollbar atau memblokir elemen di luar kartu.
			</p>

			<!-- Target Card Wrapped with BusyOverlay (scope="local") -->
			<div class="max-w-md">
				<BusyOverlay active={testLocalBusy} scope="local" message="Menyinkronkan stok kartu...">
					<div
						class="rounded-md border-[1.5px] border-[#262626] bg-[#fbf9f5] p-4 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#1a1825]"
					>
						<div class="flex items-center justify-between border-b border-[#262626]/15 pb-2 dark:border-[#f2efe9]/15">
							<span class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
								Modul Inventaris #INV-109
							</span>
							<span class="font-mono text-xs font-bold text-[#065f46] dark:text-[#34d399]">
								Online
							</span>
						</div>
						<p class="mt-2 text-xs text-[#404040] dark:text-[#b8b5ad]">
							Stok fisik: 48 unit / Terpesona: 12 order / Gudang: Surabaya Hub
						</p>
						<div class="mt-3 flex items-center justify-between">
							<span class="font-mono text-xs font-bold text-[#262626] dark:text-[#f2efe9]">
								Terakhir update: 2 menit lalu
							</span>
							<button
								type="button"
								onclick={triggerLocalBusy}
								class="group relative overflow-hidden rounded-md border-[1.5px] border-[#262626] bg-white px-3 py-1 font-sans text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[1px_1px_0px_#f2efe9]"
							>
								<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
									Simulasi Sync Kartu
								</span>
								<span
									class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
									aria-hidden="true"
								>
									Simulasi Sync Kartu
								</span>
							</button>
						</div>
					</div>
				</BusyOverlay>
			</div>
		</div>

		<!-- SUB-SECTION D: 4-BOX MONOLINE BRAND LOADER (STANDALONE) -->
		<div class="space-y-3 border-t border-[#262626]/10 pt-4 dark:border-[#f2efe9]/10">
			<div class="flex items-center justify-between">
				<span class="font-mono text-xs font-bold uppercase text-[#404040] dark:text-[#b8b5ad]">
					D. 4-Box Monoline Brand Loader (Standalone & No-Text)
				</span>
				<span class="rounded bg-[#b4a6d5] px-2 py-0.5 font-mono text-[10px] font-bold text-[#262626]">
					Brand Geometry
				</span>
			</div>
			<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
				4 kotak berputar saling melengkapi dengan 4 warna brand Invoizy: Lavender, Mint, Peach, dan Arang.
			</p>

			<div class="flex flex-wrap items-center gap-8 rounded-md border-[1.5px] border-[#262626] bg-[#fbf9f5] p-5 dark:border-[#f2efe9]/30 dark:bg-[#1a1825]">
				<div class="flex flex-col items-center gap-2">
					<MonolineLoader size="sm" showLabel={true} label="Please wait..." />
					<span class="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">Small (30px)</span>
				</div>

				<div class="flex flex-col items-center gap-2">
					<MonolineLoader size="md" showLabel={true} label="Please wait..." />
					<span class="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">Medium (44px)</span>
				</div>

				<div class="flex flex-col items-center gap-2">
					<MonolineLoader size="lg" showLabel={true} label="Please wait..." />
					<span class="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">Large (58px)</span>
				</div>

				<div class="flex flex-col items-center gap-2">
					<MonolineLoader size="xl" showLabel={true} label="Please wait..." />
					<span class="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">Desktop XL (72px)</span>
				</div>

				<div class="flex flex-col items-center gap-2 border-l border-[#262626]/15 pl-8 dark:border-[#f2efe9]/15">
					<MonolineLoader size="md" showLabel={false} />
					<span class="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">Minimalis (No-Text Mode)</span>
				</div>
			</div>
		</div>

		<!-- Dialog & Overlay Components Rendering -->
		<Modal
			open={modalDangerOpen}
			title="Hapus Produk dari Katalog?"
			message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan dan semua data varian terkait akan dihapus secara permanen."
			danger={true}
			confirmLabel="Ya, Hapus Produk"
			cancelLabel="Batal"
			onConfirm={() => {
				modalDangerOpen = false;
				toast.error('Produk #CAT-082 berhasil dihapus permanen.');
			}}
			onCancel={() => (modalDangerOpen = false)}
		/>

		<Modal
			open={modalStandardOpen}
			title="Publikasikan Perubahan Katalog?"
			message="Katalog produk akan langsung diperbarui dan dapat dilihat oleh seluruh pembeli publik di halaman toko."
			danger={false}
			confirmLabel="Publikasikan Sekarang"
			cancelLabel="Kembali"
			onConfirm={() => {
				modalStandardOpen = false;
				toast.success('Katalog berhasil dipublikasikan ke pembeli!');
			}}
			onCancel={() => (modalStandardOpen = false)}
		/>

		<!-- Global Fullscreen Busy Overlay Component -->
		<BusyOverlay
			active={testGlobalBusy}
			scope="global"
			message="Please wait..."
		/>

		<!-- Route Navigation Simulator Overlay -->
		<NavigatingOverlay
			forcedActive={testNavigating}
			message="Please wait..."
		/>

		<!-- Mobile Drawer / Sheet Backdrop Simulator -->
		{#if testDrawerOpen}
			<div class="fixed inset-0 z-[998] flex justify-end">
				<!-- Backdrop -->
				<button
					type="button"
					aria-label="Tutup drawer"
					onclick={() => (testDrawerOpen = false)}
					class="absolute inset-0 cursor-default bg-[#262626]/50 backdrop-blur-xs transition-opacity dark:bg-black/70"
				></button>

				<!-- Slide-over Drawer Panel -->
				<div
					class="relative z-10 flex h-full w-full max-w-xs flex-col justify-between border-l-[1.5px] border-[#262626] bg-[#f2efe9] p-6 shadow-[-4px_0px_0px_#262626] dark:border-[#f2efe9]/40 dark:bg-[#1a1825] dark:shadow-[-4px_0px_0px_#f2efe9]"
				>
					<div>
						<div class="flex items-center justify-between border-b-[1.5px] border-[#262626]/20 pb-3 dark:border-[#f2efe9]/20">
							<div class="flex items-center gap-2">
								<PanelRight size={18} />
								<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
									Mobile Drawer
								</h3>
							</div>
							<button
								type="button"
								onclick={() => (testDrawerOpen = false)}
								class="rounded-md border border-[#262626] bg-white p-1 text-[#262626] hover:bg-neutral-100 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
								aria-label="Tutup panel"
							>
								<X size={16} />
							</button>
						</div>

						<nav class="mt-4 space-y-2">
							<a
								href="#catalog"
								onclick={(e) => {
									e.preventDefault();
									testDrawerOpen = false;
									toast.info('[Sandbox] Simulasi: Navigasi drawer ke "Katalog Produk"');
								}}
								class="flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] bg-white px-3 py-2 text-xs font-bold text-[#262626] shadow-[1.5px_1.5px_0px_#262626] hover:bg-[#b4a6d5]/30 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
							>
								Katalog Produk
							</a>
							<a
								href="#orders"
								onclick={(e) => {
									e.preventDefault();
									testDrawerOpen = false;
									toast.info('[Sandbox] Simulasi: Navigasi drawer ke "Riwayat Pesanan"');
								}}
								class="flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] bg-white px-3 py-2 text-xs font-bold text-[#262626] shadow-[1.5px_1.5px_0px_#262626] hover:bg-[#b4a6d5]/30 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
							>
								Riwayat Pesanan
							</a>
							<a
								href="#contact"
								onclick={(e) => {
									e.preventDefault();
									testDrawerOpen = false;
									toast.info('[Sandbox] Simulasi: Navigasi drawer ke "Hubungi Penjual"');
								}}
								class="flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] bg-white px-3 py-2 text-xs font-bold text-[#262626] shadow-[1.5px_1.5px_0px_#262626] hover:bg-[#b4a6d5]/30 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
							>
								Hubungi Penjual
							</a>
						</nav>
					</div>

					<div class="border-t border-[#262626]/20 pt-4 dark:border-[#f2efe9]/20">
						<button
							type="button"
							onclick={() => {
								testDrawerOpen = false;
								toast.info('Drawer ditutup.');
							}}
							class="group relative overflow-hidden flex w-full items-center justify-center rounded-md border-[1.5px] border-[#262626] bg-[#262626] py-2 text-center text-xs font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] hover:bg-[#3d3a37] dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
						>
							<span class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
								Tutup Drawer
							</span>
							<span
								class="absolute inset-0 inline-flex items-center justify-center gap-1.5 translate-y-[150%] transition-transform duration-300 ease-out group-hover:translate-y-0"
								aria-hidden="true"
							>
								Tutup Drawer
							</span>
						</button>
					</div>
				</div>
			</div>
		{/if}
	</section>

	<!-- SECTION 4: FORM CONTROLS & MANUAL STEPPER -->
	<section
		class="space-y-4 rounded-md border-[1.5px] border-[#262626] bg-white p-6 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
	>
		<div class="border-b-[1.5px] border-[#262626]/15 pb-2 dark:border-[#f2efe9]/15">
			<h2 class="font-serif text-base font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
				4. Form Controls & Manual Stepper
			</h2>
			<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
				Form input monoline bergaris tunggal tegas arang (#262626).
			</p>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<!-- Text Input -->
			<div>
				<label for="sample-input" class="mb-1 block font-mono text-xs font-bold text-[#262626] dark:text-[#f2efe9]">
					Nama Produk
				</label>
				<input
					id="sample-input"
					type="text"
					value="Keychain Akrilik Chibi A6"
					class="w-full rounded-md border-[1.5px] border-[#262626] bg-white px-3 py-2 text-sm text-[#262626] shadow-none focus:border-[#262626] focus:ring-1 focus:ring-[#262626] focus:outline-none dark:border-[#f2efe9]/40 dark:bg-[#1a1825] dark:text-[#f2efe9]"
				/>
			</div>

			<!-- Select Dropdown -->
			<div>
				<label for="sample-select" class="mb-1 block font-mono text-xs font-bold text-[#262626] dark:text-[#f2efe9]">
					Kategori Merchandise
				</label>
				<select
					id="sample-select"
					class="w-full rounded-md border-[1.5px] border-[#262626] bg-white px-3 py-2 text-sm text-[#262626] shadow-none focus:border-[#262626] focus:ring-1 focus:ring-[#262626] focus:outline-none dark:border-[#f2efe9]/40 dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					<option>Akrilik Standee</option>
					<option>Gantungan Kunci (Charm)</option>
					<option>Sticker Pack</option>
					<option>Art Print / Poster</option>
				</select>
			</div>

			<!-- Micro Stepper Cart (Simulasi Qty) -->
			<div>
				<span class="mb-1 block font-mono text-xs font-bold text-[#262626] dark:text-[#f2efe9]">
					Manual Quantity Stepper
				</span>
				<div class="flex items-center gap-2">
					<div
						class="inline-flex items-center rounded-md border-[1.5px] border-[#262626] bg-[#f2efe9] dark:border-[#f2efe9]/40 dark:bg-[#1a1825]"
					>
						<button
							type="button"
							onclick={() => testQty > 1 && testQty--}
							disabled={testQty <= 1}
							class="flex h-8 w-8 items-center justify-center text-[#262626] hover:bg-neutral-200 disabled:opacity-30 dark:text-[#f2efe9]"
							aria-label="Kurangi kuantitas"
						>
							<Minus size={14} />
						</button>
						<span class="w-10 text-center font-mono text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
							{testQty}
						</span>
						<button
							type="button"
							onclick={() => testQty < testStock && testQty++}
							disabled={testQty >= testStock}
							class="flex h-8 w-8 items-center justify-center text-[#262626] hover:bg-neutral-200 disabled:opacity-30 dark:text-[#f2efe9]"
							aria-label="Tambah kuantitas"
						>
							<Plus size={14} />
						</button>
					</div>
					<span class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
						(Stok tersisa: {testStock})
					</span>
				</div>
			</div>

			<!-- Checkbox Switch -->
			<div class="flex flex-col justify-end">
				<label class="flex items-center gap-2.5 font-mono text-xs font-bold text-[#262626] dark:text-[#f2efe9]">
					<input
						type="checkbox"
						checked
						class="h-4 w-4 rounded border-[#262626] text-[#262626] focus:ring-[#262626]"
					/>
					<span>Produk Aktif & Tampil di Katalog Buyer</span>
				</label>
			</div>
		</div>
	</section>

	<!-- SECTION 5: STATUS BADGES -->
	<section
		class="space-y-4 rounded-md border-[1.5px] border-[#262626] bg-white p-6 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
	>
		<div class="border-b-[1.5px] border-[#262626]/15 pb-2 dark:border-[#f2efe9]/15">
			<h2 class="font-serif text-base font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
				5. Semantic Status Badges (WCAG Compliant)
			</h2>
			<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
				Badge status pembayaran dan invoice dengan kontras tinggi (minimal 4.5:1).
			</p>
		</div>

		<div class="space-y-3">
			<span class="block font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
				Status Pembayaran (Payment Status):
			</span>
			<div class="flex flex-wrap gap-2">
				{#each mockPaymentStatuses as status (status)}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold {status ===
						'PAID'
							? 'border-[#065f46] bg-[#d1fae5] text-[#065f46]'
							: status === 'UNCONFIRMED'
								? 'border-[#92400e] bg-[#fef3c7] text-[#92400e]'
								: status === 'EXPIRED'
									? 'border-[#991b1b] bg-[#fee2e2] text-[#991b1b]'
									: 'border-neutral-400 bg-neutral-200 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}"
					>
						<span
							class="h-1.5 w-1.5 rounded-full {status === 'PAID'
								? 'bg-[#065f46]'
								: status === 'UNCONFIRMED'
									? 'bg-[#92400e]'
									: status === 'EXPIRED'
										? 'bg-[#991b1b]'
										: 'bg-neutral-500'}"
						></span>
						{paymentStatusLabel(status)}
					</span>
				{/each}
			</div>

			<span class="mt-4 block font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
				Status Invoice PDF (Invoice Status):
			</span>
			<div class="flex flex-wrap gap-2">
				{#each mockInvoiceStatuses as status (status)}
					<span
						class="rounded-md border border-[#262626]/30 bg-[#f2efe9] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#f2efe9]"
					>
						{invoiceStatusLabel(status)}
					</span>
				{/each}
			</div>
		</div>
	</section>

	<!-- SECTION 6: SKELETON & PAGINATION -->
	<section
		class="space-y-4 rounded-md border-[1.5px] border-[#262626] bg-white p-6 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
	>
		<div class="border-b-[1.5px] border-[#262626]/15 pb-2 dark:border-[#f2efe9]/15">
			<h2 class="font-serif text-base font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
				6. Skeleton & Pagination
			</h2>
			<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
				Komponen transisi loading state dan kontrol paginasi halaman data.
			</p>
		</div>

		<div class="space-y-6">
			<div>
				<span class="mb-2 block font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
					List Skeleton Loading State:
				</span>
				<div class="rounded-md border border-[#262626]/20 p-4 dark:border-[#f2efe9]/20">
					<ListSkeleton rows={3} />
				</div>
			</div>

			<div>
				<span class="mb-2 block font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
					Pagination Component (Halaman Aktif: {testPage}):
				</span>
				<Pagination
					page={testPage}
					totalPages={5}
					buildHref={(p: number) => `?page=${p}` as ResolvedPathname}
				/>
			</div>
		</div>
	</section>

	<!-- SECTION 7: ORDER TABLE SHOWCASE -->
	<section
		class="space-y-4 rounded-md border-[1.5px] border-[#262626] bg-white p-6 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
	>
		<div class="border-b-[1.5px] border-[#262626]/15 pb-2 dark:border-[#f2efe9]/15">
			<div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
				<h2 class="font-serif text-lg font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
					7. Data Table Showcase (Accounting Warm Monoline)
				</h2>
				<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
					Zebra Striping + Right-Aligned Numerals
				</span>
			</div>
			<p class="text-xs sm:text-sm text-[#404040] dark:text-[#b8b5ad] leading-relaxed">
				Tabel riwayat pesanan dengan pembagian tipografi fungsional: identitas pembeli menggunakan Sans-Serif jernih, nominal rupiah rata kanan, dan status akuntansi berkontras tinggi di kedua tema.
			</p>
		</div>

		<div class="overflow-x-auto rounded-md border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30">
			<table class="w-full text-left border-collapse text-xs sm:text-sm">
				<thead class="bg-[#f2efe9] font-mono text-xs font-bold uppercase tracking-wider text-[#262626] dark:bg-[#1a1825] dark:text-[#f2efe9] border-b-[1.5px] border-[#262626] dark:border-[#f2efe9]/30">
					<tr>
						<th class="px-4 py-3.5 whitespace-nowrap">Order ID</th>
						<th class="px-4 py-3.5 whitespace-nowrap">Buyer</th>
						<th class="px-4 py-3.5 text-right whitespace-nowrap">Total</th>
						<th class="px-4 py-3.5 text-center whitespace-nowrap">Status Bayar</th>
						<th class="px-4 py-3.5 text-center whitespace-nowrap">Status Invoice</th>
						<th class="px-4 py-3.5 text-right whitespace-nowrap">Tanggal</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#262626]/15 dark:divide-[#f2efe9]/15">
					{#each mockTableOrders as order (order.orderId)}
						<tr class="transition-colors hover:bg-[#b4a6d5]/20 dark:hover:bg-[#b4a6d5]/15 even:bg-[#f9f7f2]/80 dark:even:bg-[#1e1c2a]/60">
							<td class="px-4 py-3.5 font-mono text-xs sm:text-sm font-bold text-[#262626] dark:text-[#a2e1db] whitespace-nowrap">
								#{order.orderId}
							</td>
							<td class="px-4 py-3.5">
								<div class="font-sans text-sm font-bold text-[#262626] dark:text-[#f2efe9]">{order.handle}</div>
								<div class="font-sans text-xs text-[#404040] dark:text-[#b8b5ad]">{order.email}</div>
							</td>
							<td class="px-4 py-3.5 text-right font-mono text-sm sm:text-base font-bold tabular-nums text-[#262626] dark:text-[#f2efe9] whitespace-nowrap">
								{formatRupiah(order.total)}
							</td>
							<td class="px-4 py-3.5 text-center whitespace-nowrap">
								<span
									class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold {order.paymentStatus ===
									'PAID'
										? 'border-[#065f46] bg-[#d1fae5] text-[#065f46] dark:border-[#34d399]/40 dark:bg-[#065f46]/30 dark:text-[#34d399]'
										: order.paymentStatus === 'UNCONFIRMED'
											? 'border-[#92400e] bg-[#fef3c7] text-[#92400e] dark:border-[#fbbf24]/40 dark:bg-[#92400e]/30 dark:text-[#fbbf24]'
											: 'border-[#991b1b] bg-[#fee2e2] text-[#991b1b] dark:border-[#f87171]/40 dark:bg-[#991b1b]/30 dark:text-[#f87171]'}"
								>
									<span
										class="h-1.5 w-1.5 rounded-full {order.paymentStatus === 'PAID'
											? 'bg-[#065f46] dark:bg-[#34d399]'
											: order.paymentStatus === 'UNCONFIRMED'
												? 'bg-[#92400e] dark:bg-[#fbbf24]'
												: 'bg-[#991b1b] dark:bg-[#f87171]'}"
									></span>
									{paymentStatusLabel(order.paymentStatus)}
								</span>
							</td>
							<td class="px-4 py-3.5 text-center whitespace-nowrap">
								<span
									class="rounded-md border border-[#262626]/30 bg-[#f2efe9] px-2.5 py-1 font-mono text-xs font-bold text-[#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#f2efe9]"
								>
									{invoiceStatusLabel(order.invoiceStatus)}
								</span>
							</td>
							<td class="px-4 py-3.5 text-right font-sans text-xs sm:text-sm font-medium text-[#404040] dark:text-[#b8b5ad] whitespace-nowrap">
								{dateLabel(order.createdAt)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<!-- SECTION 8: TYPOGRAPHY HIERARCHY -->
	<section
		class="space-y-6 rounded-md border-[1.5px] border-[#262626] bg-white p-6 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
	>
		<div class="border-b-[1.5px] border-[#262626]/15 pb-2 dark:border-[#f2efe9]/15">
			<div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
				<h2 class="font-serif text-lg font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
					8. Typography Hierarchy (Warm Monoline)
				</h2>
				<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
					Fraunces + Plus Jakarta Sans + Space Mono
				</span>
			</div>
			<p class="text-xs sm:text-sm text-[#404040] dark:text-[#b8b5ad] leading-relaxed">
				Hierarki tipografi tiga keluarga huruf: Fraunces (Headings editorial toko seni), Plus Jakarta Sans (Teks baca antarmuka & instruksi), dan Space Mono (Nominal finansial & kode invoice).
			</p>
		</div>

		<div class="space-y-4">
			<div class="space-y-3 rounded-md border border-[#262626]/20 p-4 dark:border-[#f2efe9]/20">
				<!-- Display H1 -->
				<div class="flex flex-col gap-1 border-b border-[#262626]/10 pb-3 sm:flex-row sm:items-baseline sm:justify-between dark:border-[#f2efe9]/10">
					<div>
						<h1 class="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#262626] dark:text-[#f2efe9]">
							Display / H1 — Invoizy Store
						</h1>
						<p class="mt-0.5 text-xs sm:text-sm text-[#404040] dark:text-[#b8b5ad]">Serif berkarakter untuk judul hero utama atau nama brand toko.</p>
					</div>
					<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">font-serif text-3xl</span>
				</div>

				<!-- Heading 2 -->
				<div class="flex flex-col gap-1 border-b border-[#262626]/10 pb-3 sm:flex-row sm:items-baseline sm:justify-between dark:border-[#f2efe9]/10">
					<div>
						<h2 class="font-serif text-2xl font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
							Heading 2 — Katalog Merchandise
						</h2>
						<p class="mt-0.5 text-xs sm:text-sm text-[#404040] dark:text-[#b8b5ad]">Digunakan untuk judul halaman katalog dan sub-dashboard.</p>
					</div>
					<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">font-serif text-2xl</span>
				</div>

				<!-- Heading 3 -->
				<div class="flex flex-col gap-1 border-b border-[#262626]/10 pb-3 sm:flex-row sm:items-baseline sm:justify-between dark:border-[#f2efe9]/10">
					<div>
						<h3 class="font-serif text-xl font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
							Heading 3 — Rincian Pesanan
						</h3>
						<p class="mt-0.5 text-xs sm:text-sm text-[#404040] dark:text-[#b8b5ad]">Digunakan untuk judul section kartu transaksi atau ringkasan checkout.</p>
					</div>
					<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">font-serif text-xl</span>
				</div>

				<!-- Body Regular -->
				<div class="flex flex-col gap-1 border-b border-[#262626]/10 pb-3 sm:flex-row sm:items-baseline sm:justify-between dark:border-[#f2efe9]/10">
					<div>
						<p class="font-sans text-sm sm:text-base leading-relaxed text-[#262626] dark:text-[#f2efe9]">
							Body Regular — Masukkan alamat pengiriman lengkap beserta kode pos untuk menghitung ongkos kirim secara otomatis tanpa perlu konfirmasi manual.
						</p>
						<p class="mt-0.5 text-xs sm:text-sm text-[#404040] dark:text-[#b8b5ad]">Teks tubuh Plus Jakarta Sans untuk instruksi form dan deskripsi panjang barang.</p>
					</div>
					<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">font-sans text-sm / text-base</span>
				</div>

				<!-- Caption / Helper -->
				<div class="flex flex-col gap-1 border-b border-[#262626]/10 pb-3 sm:flex-row sm:items-baseline sm:justify-between dark:border-[#f2efe9]/10">
					<div>
						<p class="font-sans text-xs sm:text-[13px] font-medium text-[#404040] dark:text-[#b8b5ad]">
							Caption / Helper Text — Batas waktu transfer berlaku 1x24 jam sejak faktur diterbitkan.
						</p>
						<p class="mt-0.5 text-xs text-[#404040] dark:text-[#b8b5ad]">Keterangan mikro berbobot medium dengan kontras WCAG AA lolos audit.</p>
					</div>
					<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">font-sans text-xs (Medium)</span>
				</div>

				<!-- Financial Numerals -->
				<div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
					<div>
						<span class="font-mono text-base sm:text-lg font-bold tabular-nums text-[#262626] dark:text-[#a2e1db]">
							Nominal Finansial: Rp 145.000 (Monospaced Tabular)
						</span>
						<p class="mt-0.5 text-xs sm:text-sm text-[#404040] dark:text-[#b8b5ad]">Format harga barang, subtotal faktur, dan nomor order invoice.</p>
					</div>
					<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">font-mono text-base</span>
				</div>
			</div>
		</div>
	</section>
</div>
