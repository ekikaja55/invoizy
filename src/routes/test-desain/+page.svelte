<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import { toast } from 'svelte-sonner';
	import ThemeToggle from '$lib/components/nav/ThemeToggle.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import InvoiceDocument from '$lib/components/invoice/InvoiceDocument.svelte';
	import { formatRupiah } from '$lib/utils/currency';
	import { invoiceStatusLabel, paymentStatusLabel } from '$lib/utils/status-label';
	import { mockInvoice, mockStatuses, mockTableOrders } from './mock-data';
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
		Sparkles
	} from '@lucide/svelte';

	// State interaktif untuk testing
	let modalOpen = $state(false);
	let testQty = $state(3);
	let testStock = $state(15);
	let testCopied = $state(false);
	let testRefreshing = $state(false);
	let activeTab = $state<'components' | 'invoice'>('components');
	let testPage = $state(1);

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
			return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(iso));
		} catch {
			return iso;
		}
	}
</script>

<div
	class="min-h-screen bg-papaya font-sans text-ink transition-colors selection:bg-tangerine selection:text-white dark:bg-ink dark:text-papaya"
>
	<!-- Sticky Top Bar (z-30 per Design System scale) -->
	<header
		class="sticky top-0 z-30 border-b-2 border-brandy bg-papaya/95 px-4 py-3 shadow-[0_2px_0px_#78290f] backdrop-blur-xs dark:border-papaya/20 dark:bg-ink/95 dark:shadow-[0_2px_0px_rgba(255,236,209,0.15)]"
	>
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-2">
					<span
						class="inline-block -rotate-2 rounded-xs border-2 border-brandy bg-tangerine px-2.5 py-0.5 text-xs font-black tracking-wider text-white shadow-[2px_2px_0px_#78290f]"
					>
						SANDBOX
					</span>
					<h1 class="font-headline text-base font-bold sm:text-xl tracking-tight text-ink dark:text-papaya">
						Invoizy Scrapbook Design System
					</h1>
				</div>
				<p class="mt-0.5 text-xs text-brandy/80 dark:text-papaya/70">
					Eksplorasi visual Organic Maximalism & Digital Scrapbook.
					<span class="font-handwriting text-sm font-bold text-teal dark:text-tangerine">
						~ From sketch to life ~
					</span>
				</p>
			</div>

			<div class="flex items-center gap-2">
				<div
					class="rounded-lg border-2 border-brandy bg-white p-1 shadow-[2px_2px_0px_#78290f] dark:border-papaya/30 dark:bg-ink"
				>
					<ThemeToggle />
				</div>
			</div>
		</div>

		<!-- Nav Tabs -->
		<div class="mx-auto mt-3 flex max-w-5xl gap-2">
			<button
				type="button"
				onclick={() => (activeTab = 'components')}
				class="rounded-[8px_4px_7px_3px] px-3.5 py-1.5 text-xs font-bold transition-all {activeTab ===
				'components'
					? 'border-2 border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f]'
					: 'border-2 border-transparent text-ink/80 hover:bg-brandy/10 dark:text-papaya/80 dark:hover:bg-papaya/10'}"
			>
				UI Components & Controls
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'invoice')}
				class="rounded-[6px_8px_4px_7px] px-3.5 py-1.5 text-xs font-bold transition-all {activeTab ===
				'invoice'
					? 'border-2 border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f]'
					: 'border-2 border-transparent text-ink/80 hover:bg-brandy/10 dark:text-papaya/80 dark:hover:bg-papaya/10'}"
			>
				Invoice Document Preview
			</button>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 py-8">
		{#if activeTab === 'components'}
			<div class="space-y-10">
				<!-- SECTION 1: BUTTONS & ACTIONS -->
				<section
					class="space-y-4 rounded-2xl border-2 border-brandy bg-white p-6 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/80 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
				>
					<div class="border-b border-brandy/15 pb-2 dark:border-papaya/15">
						<div class="flex items-center justify-between">
							<h2 class="font-headline text-base font-bold tracking-tight text-teal dark:text-tangerine">
								1. Buttons & Tactile Actions
							</h2>
							<span class="font-handwriting text-sm font-bold text-brandy dark:text-papaya/60">
								Asymmetrical & Hard Offset
							</span>
						</div>
						<p class="text-xs text-brandy/70 dark:text-papaya/60">
							Tombol taktil dengan hard offset shadow Brandy, variasi asimetris, dan efek klik fisik.
						</p>
					</div>

					<div class="flex flex-wrap items-center gap-3">
						<!-- Primary CTA Tangerine -->
						<button
							type="button"
							class="rounded-[14px_6px_12px_8px] border-2 border-brandy bg-tangerine px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0px_#78290f] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#78290f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
						>
							Primary CTA (Tangerine)
						</button>

						<!-- Secondary Teal -->
						<button
							type="button"
							class="rounded-[8px_14px_6px_12px] border-2 border-brandy bg-teal px-4 py-2 text-sm font-bold text-papaya shadow-[3px_3px_0px_#78290f] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#78290f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
						>
							Secondary Teal
						</button>

						<!-- Paper Outline -->
						<button
							type="button"
							class="rounded-lg border-2 border-brandy bg-papaya/40 px-4 py-2 text-sm font-bold text-ink shadow-[3px_3px_0px_#78290f] transition-all hover:bg-papaya active:shadow-none dark:bg-ink dark:text-papaya"
						>
							Paper Outline
						</button>

						<!-- Refresh / Loading -->
						<button
							type="button"
							onclick={handleTestRefresh}
							disabled={testRefreshing}
							class="inline-flex items-center gap-2 rounded-lg border-2 border-brandy bg-white px-3.5 py-2 text-sm font-bold text-ink shadow-[3px_3px_0px_#78290f] hover:bg-papaya/30 disabled:opacity-50 dark:bg-ink dark:text-papaya"
						>
							<RefreshCw size={15} class={testRefreshing ? 'animate-spin text-tangerine' : ''} />
							<span>{testRefreshing ? 'Memperbarui...' : 'Refresh Data'}</span>
						</button>

						<!-- Quick Copy Action with Scrapbook Tape Effect -->
						<button
							type="button"
							onclick={handleTestCopy}
							class="inline-flex items-center gap-1.5 rounded-xs border-2 border-brandy bg-yellow-200 px-3 py-2 text-xs font-black text-ink shadow-[2px_2px_0px_#78290f] transition-transform hover:rotate-1 active:scale-95"
						>
							{#if testCopied}
								<Check size={14} class="text-forest" />
								<span>Tersalin!</span>
							{:else}
								<Copy size={14} />
								<span>Salin Kode</span>
							{/if}
						</button>

						<!-- Danger / Crimson -->
						<button
							type="button"
							class="rounded-[10px_4px_12px_6px] border-2 border-brandy bg-crimson px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0px_#78290f] transition-all hover:bg-red-700 active:shadow-none"
						>
							Danger Crimson
						</button>

						<!-- Disabled Button -->
						<button
							type="button"
							disabled
							class="cursor-not-allowed rounded-lg border-2 border-neutral-400 bg-neutral-200 px-4 py-2 text-sm font-bold text-neutral-500 opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500"
						>
							Disabled State
						</button>
					</div>
				</section>

				<!-- SECTION 2: TOAST NOTIFICATIONS -->
				<section
					class="space-y-4 rounded-2xl border-2 border-brandy bg-white p-6 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/80 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
				>
					<div class="border-b border-brandy/15 pb-2 dark:border-papaya/15">
						<h2 class="font-headline text-base font-bold tracking-tight text-teal dark:text-tangerine">
							2. Toast Notifications (Sonner)
						</h2>
						<p class="text-xs text-brandy/70 dark:text-papaya/60">
							Notifikasi melayang bergaya "kertas tempel" dengan warna semantik terverifikasi.
						</p>
					</div>

					<div class="flex flex-wrap gap-2.5">
						<button
							type="button"
							onclick={() => triggerToast('success')}
							class="inline-flex items-center gap-1.5 rounded-lg border-2 border-brandy bg-forest px-3.5 py-2 text-xs font-bold text-white shadow-[2px_2px_0px_#78290f] hover:brightness-110 active:shadow-none"
						>
							<CheckCircle size={14} />
							Trigger Success (Forest)
						</button>

						<button
							type="button"
							onclick={() => triggerToast('error')}
							class="inline-flex items-center gap-1.5 rounded-lg border-2 border-brandy bg-crimson px-3.5 py-2 text-xs font-bold text-white shadow-[2px_2px_0px_#78290f] hover:brightness-110 active:shadow-none"
						>
							<XCircle size={14} />
							Trigger Error (Crimson)
						</button>

						<button
							type="button"
							onclick={() => triggerToast('warning')}
							class="inline-flex items-center gap-1.5 rounded-lg border-2 border-brandy bg-tangerine px-3.5 py-2 text-xs font-bold text-white shadow-[2px_2px_0px_#78290f] hover:brightness-110 active:shadow-none"
						>
							<AlertTriangle size={14} />
							Trigger Warning (Tangerine)
						</button>

						<button
							type="button"
							onclick={() => triggerToast('info')}
							class="inline-flex items-center gap-1.5 rounded-lg border-2 border-brandy bg-teal px-3.5 py-2 text-xs font-bold text-papaya shadow-[2px_2px_0px_#78290f] hover:brightness-110 active:shadow-none"
						>
							<Info size={14} />
							Trigger Info (Teal)
						</button>
					</div>
				</section>

				<!-- SECTION 3: MODAL DIALOG -->
				<section
					class="space-y-4 rounded-2xl border-2 border-brandy bg-white p-6 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/80 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
				>
					<div class="border-b border-brandy/15 pb-2 dark:border-papaya/15">
						<h2 class="font-headline text-base font-bold tracking-tight text-teal dark:text-tangerine">
							3. Interactive Modal Dialog
						</h2>
						<p class="text-xs text-brandy/70 dark:text-papaya/60">
							Komponen modal dengan solid overlay (Ink Black 80%), border tebal, dan hard shadow.
						</p>
					</div>

					<div>
						<button
							type="button"
							onclick={() => (modalOpen = true)}
							class="rounded-lg border-2 border-brandy bg-papaya/60 px-4 py-2 text-sm font-bold text-ink shadow-[3px_3px_0px_#78290f] hover:bg-papaya active:shadow-none dark:bg-ink dark:text-papaya"
						>
							Buka Modal Konfirmasi
						</button>

						<Modal
							open={modalOpen}
							title="Konfirmasi Tindakan"
							message="Ini adalah pratinjau komponen modal dialog Invoizy. Komponen ini dirancang dengan backdrop solid Ink Black 80% untuk performa prima tanpa beban blur berlebih."
							confirmLabel="Ya, Lanjutkan"
							cancelLabel="Batal"
							onCancel={() => (modalOpen = false)}
							onConfirm={() => {
								modalOpen = false;
								toast.success('Aksi modal dikonfirmasi!');
							}}
						/>
					</div>
				</section>

				<!-- SECTION 4: FORM CONTROLS & STEPPER (JALAN TENGAH: PRESISI FUNGSIONAL) -->
				<section
					class="space-y-5 rounded-2xl border-2 border-brandy bg-white p-6 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/80 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
				>
					<div class="border-b border-brandy/15 pb-2 dark:border-papaya/15">
						<div class="flex items-center justify-between">
							<h2 class="font-headline text-base font-bold tracking-tight text-teal dark:text-tangerine">
								4. Form Controls & Manual Stepper
							</h2>
							<span class="rounded-xs bg-brandy/10 px-2 py-0.5 font-mono text-[11px] font-bold text-brandy dark:bg-papaya/10 dark:text-papaya">
								DISIPLIN PRESISI
							</span>
						</div>
						<p class="text-xs text-brandy/70 dark:text-papaya/60">
							Prinsip "Jalan Tengah": input data pengguna tetap presisi geometris agar mudah diklik, sedangkan kontainer mempertahankan estetika kanvas.
						</p>
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<label for="sample-text" class="block text-xs font-bold text-ink dark:text-papaya">
								Input Teks Standar
							</label>
							<input
								id="sample-text"
								type="text"
								placeholder="Ketik teks di sini..."
								class="mt-1 w-full rounded-lg border-2 border-brandy/40 bg-white px-3 py-2 text-sm text-ink placeholder:text-brandy/40 focus:border-brandy focus:outline-none dark:border-papaya/30 dark:bg-ink dark:text-papaya dark:placeholder:text-papaya/40"
							/>
						</div>

						<div>
							<label for="sample-select" class="block text-xs font-bold text-ink dark:text-papaya">
								Select Dropdown Kategori
							</label>
							<select
								id="sample-select"
								class="mt-1 w-full rounded-lg border-2 border-brandy/40 bg-white px-3 py-2 text-sm text-ink focus:border-brandy focus:outline-none dark:border-papaya/30 dark:bg-ink dark:text-papaya"
							>
								<option value="all">Semua Kategori</option>
								<option value="sticker">Vinyl Sticker Pack</option>
								<option value="merch">Enamel Pin / Merchandise</option>
							</select>
						</div>
					</div>

					<!-- Qty Stepper Test -->
					<div
						class="rounded-xl border-2 border-brandy bg-papaya/30 p-4 dark:border-papaya/30 dark:bg-ink/50"
					>
						<div class="flex items-center justify-between">
							<span class="font-headline text-xs font-bold tracking-wider text-brandy uppercase dark:text-tangerine">
								Manual Number Stepper (Product Detail Style)
							</span>
							<span class="font-mono text-xs font-bold text-teal dark:text-papaya/70">
								Stok: {testStock} pcs
							</span>
						</div>
						<p class="text-xs text-brandy/70 dark:text-papaya/60">
							Bisa diketik angka manual langsung (belasan/puluhan), otomatis clamp ke stok saat blur.
						</p>

						<div class="mt-3 flex items-center gap-2">
							<button
								type="button"
								onclick={() => (testQty = Math.max(1, testQty - 1))}
								disabled={testQty <= 1}
								class="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-brandy bg-white shadow-[2px_2px_0px_#78290f] hover:bg-papaya active:shadow-none disabled:opacity-30 dark:border-papaya/30 dark:bg-ink dark:hover:bg-ink/80"
							>
								<Minus size={15} />
							</button>
							<input
								type="number"
								min="1"
								max={testStock}
								bind:value={testQty}
								onblur={() => {
									if (!testQty || testQty < 1) testQty = 1;
									if (testQty > testStock) testQty = testStock;
								}}
								class="h-9 w-16 rounded-lg border-2 border-brandy bg-white text-center font-mono text-base font-bold text-ink focus:border-brandy focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:border-papaya/30 dark:bg-ink dark:text-papaya"
							/>
							<button
								type="button"
								onclick={() => (testQty = Math.min(testStock, testQty + 1))}
								disabled={testQty >= testStock}
								class="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-brandy bg-white shadow-[2px_2px_0px_#78290f] hover:bg-papaya active:shadow-none disabled:opacity-30 dark:border-papaya/30 dark:bg-ink dark:hover:bg-ink/80"
							>
								<Plus size={15} />
							</button>
							<span class="ml-3 text-xs text-brandy dark:text-papaya/80">
								Qty: <strong class="font-mono text-ink dark:text-papaya">{testQty}</strong>
								· Subtotal:
								<strong class="font-headline font-bold text-tangerine">
									{formatRupiah(testQty * 25000)}
								</strong>
							</span>
						</div>
					</div>
				</section>

				<!-- SECTION 5: STATUS LABELS & BADGES (SEMANTIC COLORS) -->
				<section
					class="space-y-4 rounded-2xl border-2 border-brandy bg-white p-6 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/80 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
				>
					<div class="border-b border-brandy/15 pb-2 dark:border-papaya/15">
						<h2 class="font-headline text-base font-bold tracking-tight text-teal dark:text-tangerine">
							5. Semantic Status Badges
						</h2>
						<p class="text-xs text-brandy/70 dark:text-papaya/60">
							Pemetaan status transaksi menggunakan warna resmi: Forest Emerald (Sukses), Crimson (Gagal), Tangerine (Pending), dan Stormy Teal.
						</p>
					</div>

					<div class="overflow-x-auto rounded-xl border-2 border-brandy/20 dark:border-papaya/20">
						<table class="w-full text-left text-sm">
							<thead>
								<tr class="border-b-2 border-brandy/20 bg-papaya/40 text-xs font-bold uppercase tracking-wider text-brandy dark:border-papaya/20 dark:bg-ink/80 dark:text-papaya/70">
									<th class="px-3 py-2.5">Raw Value</th>
									<th class="px-3 py-2.5">Invoice Badge</th>
									<th class="px-3 py-2.5">Payment Badge</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-brandy/15 dark:divide-papaya/10">
								{#each mockStatuses as s (s.invoice + s.payment)}
									<tr class="hover:bg-papaya/20 dark:hover:bg-papaya/5">
										<td class="px-3 py-2.5 font-mono text-xs text-brandy/80 dark:text-papaya/60">
											{s.invoice} / {s.payment}
										</td>
										<td class="px-3 py-2.5">
											{#if s.invoice === 'SENT'}
												<span class="inline-flex items-center rounded-xs border border-forest/50 bg-forest/15 px-2 py-0.5 text-xs font-bold text-forest">
													{invoiceStatusLabel(s.invoice)}
												</span>
											{:else if s.invoice === 'FAILED'}
												<span class="inline-flex items-center rounded-xs border border-crimson/50 bg-crimson/15 px-2 py-0.5 text-xs font-bold text-crimson">
													{invoiceStatusLabel(s.invoice)}
												</span>
											{:else if s.invoice === 'READY'}
												<span class="inline-flex items-center rounded-xs border border-tangerine/50 bg-tangerine/15 px-2 py-0.5 text-xs font-bold text-tangerine">
													{invoiceStatusLabel(s.invoice)}
												</span>
											{:else}
												<span class="inline-flex items-center rounded-xs border border-teal/50 bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal">
													{invoiceStatusLabel(s.invoice)}
												</span>
											{/if}
										</td>
										<td class="px-3 py-2.5">
											{#if s.payment === 'PAID'}
												<span class="inline-flex items-center rounded-xs border border-forest/50 bg-forest/15 px-2 py-0.5 text-xs font-bold text-forest">
													{paymentStatusLabel(s.payment)}
												</span>
											{:else if s.payment === 'EXPIRED'}
												<span class="inline-flex items-center rounded-xs border border-crimson/50 bg-crimson/15 px-2 py-0.5 text-xs font-bold text-crimson">
													{paymentStatusLabel(s.payment)}
												</span>
											{:else}
												<span class="inline-flex items-center rounded-xs border border-tangerine/50 bg-tangerine/15 px-2 py-0.5 text-xs font-bold text-tangerine">
													{paymentStatusLabel(s.payment)}
												</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>

				<!-- SECTION 6: SKELETON & PAGINATION -->
				<section
					class="space-y-4 rounded-2xl border-2 border-brandy bg-white p-6 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/80 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
				>
					<div class="border-b border-brandy/15 pb-2 dark:border-papaya/15">
						<h2 class="font-headline text-base font-bold tracking-tight text-teal dark:text-tangerine">
							6. Skeleton & Pagination
						</h2>
						<p class="text-xs text-brandy/70 dark:text-papaya/60">
							Placeholder loading shimmer dan kontrol navigasi halaman dengan hard shadow.
						</p>
					</div>

					<div class="space-y-2">
						<p class="text-xs font-bold text-brandy dark:text-papaya/70">List Skeleton Loading:</p>
						<div class="rounded-xl border border-brandy/20 p-3 dark:border-papaya/20">
							<ListSkeleton rows={3} />
						</div>
					</div>

					<div class="border-t border-brandy/15 pt-4 dark:border-papaya/15">
						<p class="text-xs font-bold text-brandy dark:text-papaya/70">Pagination Component:</p>
						<div class="mt-2">
							<Pagination
								page={testPage}
								totalPages={5}
								buildHref={(p) => (`/test-desain?page=${p}` as ResolvedPathname)}
							/>
						</div>
					</div>
				</section>

				<!-- SECTION 7: DATA TABLE SHOWCASE (BENTO EDITORIAL GRID) -->
				<section
					class="space-y-4 rounded-2xl border-2 border-brandy bg-white p-6 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/80 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
				>
					<div class="border-b border-brandy/15 pb-2 dark:border-papaya/15">
						<div class="flex items-center justify-between">
							<h2 class="font-headline text-base font-bold tracking-tight text-teal dark:text-tangerine">
								7. Data Table Showcase (Bento Editorial Grid)
							</h2>
							<span class="font-handwriting text-sm font-bold text-brandy dark:text-papaya/70">
								Editorial Grid Clean Lines
							</span>
						</div>
						<p class="text-xs text-brandy/70 dark:text-papaya/60">
							Tabel pesanan rapi dan terstruktur dengan border solid Brandy, font monospace pada Order ID, dan badge semantik.
						</p>
					</div>

					<div class="overflow-x-auto rounded-xl border-2 border-brandy dark:border-papaya/30">
						<table class="w-full min-w-160 text-left text-sm">
							<thead>
								<tr
									class="border-b-2 border-brandy bg-papaya/50 text-xs font-bold uppercase tracking-wider text-brandy dark:border-papaya/20 dark:bg-ink/90 dark:text-papaya/70"
								>
									<th class="px-4 py-3">Order ID</th>
									<th class="px-4 py-3">Buyer Handle</th>
									<th class="px-4 py-3 text-right">Total</th>
									<th class="px-4 py-3">Status Invoice</th>
									<th class="px-4 py-3">Status Bayar</th>
									<th class="px-4 py-3">Tanggal</th>
									<th class="px-4 py-3 text-center">Aksi</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-brandy/15 dark:divide-papaya/10">
								{#each mockTableOrders as o (o.orderId)}
									<tr class="transition-colors hover:bg-papaya/30 dark:hover:bg-papaya/5">
										<td class="px-4 py-3">
											<span class="font-mono font-bold text-ink dark:text-papaya">
												{o.orderId}
											</span>
											<span class="ml-1 text-xs text-brandy/70 dark:text-papaya/60">({o.itemQty} item)</span>
										</td>
										<td class="px-4 py-3">
											<span class="font-bold text-ink dark:text-papaya">{o.handle}</span>
											<span class="block text-xs text-brandy/70 dark:text-papaya/60">{o.email}</span>
										</td>
										<td class="px-4 py-3 text-right font-headline font-bold text-ink dark:text-papaya">
											{formatRupiah(o.total)}
										</td>
										<td class="px-4 py-3 text-xs">
											<span
												class="inline-flex items-center rounded-xs border px-2 py-0.5 text-xs font-bold {o.invoiceStatus === 'SENT' ? 'border-forest/50 bg-forest/15 text-forest' : o.invoiceStatus === 'READY' ? 'border-tangerine/50 bg-tangerine/15 text-tangerine' : o.invoiceStatus === 'FAILED' ? 'border-crimson/50 bg-crimson/15 text-crimson' : 'border-teal/50 bg-teal/15 text-teal'}"
											>
												{invoiceStatusLabel(o.invoiceStatus)}
											</span>
										</td>
										<td class="px-4 py-3 text-xs">
											<span
												class="inline-flex items-center rounded-xs border px-2 py-0.5 text-xs font-bold {o.paymentStatus === 'PAID' ? 'border-forest/50 bg-forest/15 text-forest' : o.paymentStatus === 'UNCONFIRMED' ? 'border-tangerine/50 bg-tangerine/15 text-tangerine' : o.paymentStatus === 'EXPIRED' ? 'border-crimson/50 bg-crimson/15 text-crimson' : 'border-teal/50 bg-teal/15 text-teal'}"
											>
												{paymentStatusLabel(o.paymentStatus)}
											</span>
										</td>
										<td class="px-4 py-3 text-xs font-mono text-brandy/80 dark:text-papaya/70">
											{dateLabel(o.createdAt)}
										</td>
										<td class="px-4 py-3 text-center">
											<button
												type="button"
												onclick={() => toast.info(`Melihat detail pesanan ${o.orderId}`)}
												class="rounded-md border-2 border-brandy bg-papaya/50 px-2.5 py-1 text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] hover:bg-papaya active:shadow-none dark:bg-ink dark:text-papaya"
											>
												Detail
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>

				<!-- SECTION 8: TYPOGRAPHY, STAMPS & SCRAPBOOK ACCENTS -->
				<section
					class="space-y-6 rounded-2xl border-2 border-brandy bg-white p-6 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/80 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
				>
					<div class="border-b border-brandy/15 pb-2 dark:border-papaya/15">
						<div class="flex items-center justify-between">
							<h2 class="font-headline text-base font-bold tracking-tight text-teal dark:text-tangerine">
								8. Typography & Digital Scrapbook Accents
							</h2>
							<span class="inline-flex items-center gap-1 font-handwriting text-sm font-bold text-tangerine">
								<Sparkles size={14} /> Full Aesthetic Palette
							</span>
						</div>
						<p class="text-xs text-brandy/70 dark:text-papaya/60">
							Hierarki tipografi `@fontsource` mandiri (Fraunces, Caveat, Plus Jakarta Sans, Space Mono) berpadu stempel fisik dan stiker scrapbook.
						</p>
					</div>

					<!-- 8.1 Heading & Display Hierarchy -->
					<div class="space-y-4">
						<span class="font-headline text-xs font-bold tracking-wider text-brandy uppercase dark:text-tangerine">
							Scale & Hierarki Font
						</span>
						<div class="space-y-3 rounded-xl border-2 border-brandy/20 p-4 dark:border-papaya/20">
							<div class="flex flex-col gap-1 border-b border-brandy/15 pb-3 sm:flex-row sm:items-baseline sm:justify-between dark:border-papaya/15">
								<div>
									<h1 class="font-headline text-3xl font-extrabold tracking-tight text-ink dark:text-papaya">
										Display / H1 — Invoizy Store
									</h1>
									<p class="text-xs text-brandy/70 dark:text-papaya/60">Font Fraunces Serif untuk judul landing hero atau banner toko.</p>
								</div>
								<span class="font-mono text-xs text-brandy/60 dark:text-papaya/50">font-headline text-3xl</span>
							</div>

							<div class="flex flex-col gap-1 border-b border-brandy/15 pb-3 sm:flex-row sm:items-baseline sm:justify-between dark:border-papaya/15">
								<div>
									<h2 class="font-headline text-2xl font-bold text-teal dark:text-tangerine">
										Heading 2 — Katalog Merchandise
									</h2>
									<p class="text-xs text-brandy/70 dark:text-papaya/60">Digunakan untuk judul halaman publik atau admin.</p>
								</div>
								<span class="font-mono text-xs text-brandy/60 dark:text-papaya/50">font-headline text-2xl</span>
							</div>

							<div class="flex flex-col gap-1 border-b border-brandy/15 pb-3 sm:flex-row sm:items-baseline sm:justify-between dark:border-papaya/15">
								<div>
									<h3 class="font-headline text-xl font-bold text-ink dark:text-papaya">
										Heading 3 — Rincian Pesanan
									</h3>
									<p class="text-xs text-brandy/70 dark:text-papaya/60">Digunakan untuk judul section atau kartu ringkasan.</p>
								</div>
								<span class="font-mono text-xs text-brandy/60 dark:text-papaya/50">font-headline text-xl</span>
							</div>

							<div class="flex flex-col gap-1 border-b border-brandy/15 pb-3 sm:flex-row sm:items-baseline sm:justify-between dark:border-papaya/15">
								<div>
									<h4 class="font-sans text-base font-bold text-teal dark:text-tangerine">
										Heading 4 / Subtitle — Konfirmasi Pembayaran
									</h4>
									<p class="text-xs text-brandy/70 dark:text-papaya/60">Digunakan untuk sub-bagian form atau item label.</p>
								</div>
								<span class="font-mono text-xs text-brandy/60 dark:text-papaya/50">font-sans text-base font-bold</span>
							</div>

							<div class="flex flex-col gap-1 border-b border-brandy/15 pb-3 sm:flex-row sm:items-baseline sm:justify-between dark:border-papaya/15">
								<div>
									<p class="font-sans text-sm text-ink/90 dark:text-papaya/90">
										Body Regular — Masukkan alamat pengiriman lengkap beserta kode pos untuk menghitung ongkos kirim secara otomatis.
									</p>
									<p class="text-xs text-brandy/70 dark:text-papaya/60">Teks tubuh Plus Jakarta Sans untuk instruksi dan deskripsi produk.</p>
								</div>
								<span class="font-mono text-xs text-brandy/60 dark:text-papaya/50">font-sans text-sm</span>
							</div>

							<div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
								<div>
									<span class="font-mono text-[10px] font-bold tracking-wider text-brandy uppercase dark:text-papaya/60">
										Microcopy / Tag — STATUS INVOICE RESMI
									</span>
									<p class="text-xs text-brandy/70 dark:text-papaya/60">Label micro-tag transaksional.</p>
								</div>
								<span class="font-mono text-xs text-brandy/60 dark:text-papaya/50">font-mono text-[10px]</span>
							</div>
						</div>
					</div>

					<!-- 8.2 Scrapbook Stickers & Rubber Stamp Showcase -->
					<div class="space-y-4">
						<span class="font-headline text-xs font-bold tracking-wider text-brandy uppercase dark:text-tangerine">
							Scrapbook Accents & Physical Rubber Stamps
						</span>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<!-- Stiker Kertas Tempel -->
							<div class="relative rounded-xl border-2 border-brandy bg-papaya/50 p-4 dark:border-papaya/30 dark:bg-ink">
								<span class="block text-xs font-mono text-brandy/70 dark:text-papaya/60">Tape Sticker Accent:</span>
								<div class="mt-3 inline-block -rotate-2 rounded-xs border-2 border-brandy bg-yellow-200 px-3 py-1 shadow-[2px_2px_0px_#78290f]">
									<span class="font-handwriting text-lg font-bold text-brandy">
										✨ Best Seller Sticker Pack!
									</span>
								</div>
							</div>

							<!-- Stempel Cap Lunas (Forest) -->
							<div class="relative flex flex-col items-center justify-center rounded-xl border-2 border-brandy bg-papaya/50 p-4 dark:border-papaya/30 dark:bg-ink">
								<span class="block w-full text-left text-xs font-mono text-brandy/70 dark:text-papaya/60">Cap Lunas (Rubber Stamp):</span>
								<div class="mt-2 inline-block -rotate-6 rounded-xs border-3 border-forest px-3 py-1 shadow-[2px_2px_0px_#2b9348]">
									<span class="font-headline text-lg font-black tracking-widest text-forest uppercase">
										VERIFIED LUNAS
									</span>
								</div>
							</div>

							<!-- Stempel Cap Batal (Crimson) -->
							<div class="relative flex flex-col items-center justify-center rounded-xl border-2 border-brandy bg-papaya/50 p-4 dark:border-papaya/30 dark:bg-ink">
								<span class="block w-full text-left text-xs font-mono text-brandy/70 dark:text-papaya/60">Cap Gagal (Rubber Stamp):</span>
								<div class="mt-2 inline-block rotate-3 rounded-xs border-3 border-crimson px-3 py-1 shadow-[2px_2px_0px_#c1121f]">
									<span class="font-headline text-lg font-black tracking-widest text-crimson uppercase">
										EXPIRED / BATAL
									</span>
								</div>
							</div>
						</div>

						<div class="flex flex-wrap gap-4 rounded-xl border-2 border-brandy/20 p-3 text-sm dark:border-papaya/20">
							<div>
								<span class="block text-xs text-brandy/70 dark:text-papaya/60">Strikethrough Diskon:</span>
								<span class="font-mono text-xs font-medium text-brandy/50 line-through dark:text-papaya/40">Rp 75.000</span>
								<span class="ml-1 font-headline font-bold text-forest">Rp 50.000</span>
							</div>
							<div>
								<span class="block text-xs text-brandy/70 dark:text-papaya/60">Highlight Kode Unik:</span>
								<span>
									Transfer tepat <mark class="rounded-xs bg-yellow-300 px-1 py-0.5 font-mono font-bold text-ink">3 digit terakhir</mark>
								</span>
							</div>
							<div>
								<span class="block text-xs text-brandy/70 dark:text-papaya/60">Underline Accent:</span>
								<span class="font-bold underline decoration-tangerine underline-offset-4">Batas konfirmasi 24 jam</span>
							</div>
						</div>
					</div>

					<!-- 8.3 Monospace Tokens -->
					<div class="space-y-4">
						<span class="font-headline text-xs font-bold tracking-wider text-brandy uppercase dark:text-tangerine">
							Monospace Tokens (Space Mono)
						</span>
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<div class="rounded-xl border-2 border-brandy bg-papaya/30 p-4 dark:border-papaya/20 dark:bg-ink/50">
								<span class="block font-mono text-xs text-brandy/70 dark:text-papaya/60">Order ID Token</span>
								<span class="mt-1 block font-mono text-base font-bold text-ink dark:text-papaya">
									#INV-2026-0042
								</span>
							</div>
							<div class="rounded-xl border-2 border-brandy bg-papaya/30 p-4 dark:border-papaya/20 dark:bg-ink/50">
								<span class="block font-mono text-xs text-brandy/70 dark:text-papaya/60">Pickup Passcode</span>
								<span class="mt-1 block font-mono text-xl font-black tracking-widest text-tangerine">
									PKUP-8821
								</span>
							</div>
							<div class="rounded-xl border-2 border-brandy bg-papaya/30 p-4 dark:border-papaya/20 dark:bg-ink/50">
								<span class="block font-mono text-xs text-brandy/70 dark:text-papaya/60">Status Code Constant</span>
								<code class="mt-2 inline-block rounded-xs border border-brandy/30 bg-white px-2 py-0.5 font-mono text-xs font-bold text-teal dark:bg-ink dark:text-papaya">
									ORDER_STATUS = 'PAID'
								</code>
							</div>
						</div>
					</div>

					<!-- 8.4 Prose Article / Rich Content -->
					<div class="space-y-3">
						<span class="font-headline text-xs font-bold tracking-wider text-brandy uppercase dark:text-tangerine">
							Prose Article Format (@tailwindcss/typography)
						</span>
						<div class="rounded-xl border-2 border-brandy/20 bg-papaya/20 p-5 dark:border-papaya/20 dark:bg-white/5">
							<article class="prose prose-sm dark:prose-invert max-w-none">
								<p>
									<strong>Catatan Toko:</strong> Seluruh pesanan yang diverifikasi sebelum pukul 15.00 WIB
									akan diproses pada hari yang sama. Kami menyertakan invoice cetak fisik bergaya scrapbook di dalam paket kiriman.
								</p>
								<ul>
									<li>Pengiriman kurir reguler: estimasi 2–3 hari kerja dengan resi otomatis.</li>
									<li>Ambil di tempat (Self-Pickup): wajib menunjukkan <em>Pickup Passcode</em> yang valid.</li>
								</ul>
								<blockquote>
									"Kualitas cetak stiker vinyl anti-air dengan laminasi doff premium."
								</blockquote>
							</article>
						</div>
					</div>
				</section>
			</div>
		{:else}
			<!-- TAB 2: INVOICE DOCUMENT PREVIEW -->
			<div class="space-y-4">
				<div
					class="flex items-center justify-between rounded-xl border-2 border-brandy bg-white p-4 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
				>
					<div>
						<h2 class="font-headline text-base font-bold text-ink dark:text-papaya">
							Digital Scrapbook & Neo-Brutalist Invoice Document
						</h2>
						<p class="text-xs text-brandy/70 dark:text-papaya/60">
							Pratinjau fidelitas cetak nota kasir retro web & PDF dari file <code>mock-data.ts</code>.
						</p>
					</div>
					<span
						class="inline-block -rotate-2 rounded-xs border-2 border-brandy bg-yellow-300 px-2.5 py-1 text-xs font-black text-ink shadow-[2px_2px_0px_#78290f]"
					>
						PRINT-ACCURATE
					</span>
				</div>

				<div
					class="overflow-hidden rounded-2xl border-3 border-brandy bg-papaya/40 p-4 shadow-[8px_8px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[8px_8px_0px_rgba(255,236,209,0.2)]"
				>
					<InvoiceDocument
						order={mockInvoice.order}
						settings={mockInvoice.settings}
						paymentMethods={mockInvoice.paymentMethods}
						qrisCodes={mockInvoice.qrisCodes}
						mode="web"
					/>
				</div>
			</div>
		{/if}
	</main>
</div>
