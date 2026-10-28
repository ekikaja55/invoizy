<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { formatRupiah } from '$lib/utils/currency';
	import Modal from '$lib/components/ui/Modal.svelte';
	import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
	import { toast } from 'svelte-sonner';
	import {
		Trash2,
		ExternalLink,
		ArrowRight,
		History,
		AlertTriangle,
		CheckCircle2,
		Clock,
		Ban
	} from '@lucide/svelte';

	interface HistoryEntry {
		orderId: string;
		token: string;
		total: number;
		createdAt: string;
	}

	interface ServerStatus {
		valid: boolean;
		paymentStatus?: 'PENDING' | 'WAITING_VERIFICATION' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
		invoiceStatus?: string;
		total?: number;
		hasProof?: boolean;
		isExpired?: boolean;
		reason?: string;
	}

	let entries = $state<HistoryEntry[]>([]);
	let serverStatuses = $state<Record<string, ServerStatus>>({});
	let isLoadingStatus = $state(true);
	let modalOpen = $state(false);
	let itemToDelete = $state<string | null>(null);

	onMount(() => {
		let loadedEntries: HistoryEntry[] = [];
		try {
			const parsed = JSON.parse(localStorage.getItem('invoizy:invoices') ?? '[]');
			if (Array.isArray(parsed)) {
				loadedEntries = parsed
					.filter((i) => typeof i?.orderId === 'string' && typeof i?.token === 'string')
					.map((i) => ({
						orderId: i.orderId,
						token: i.token,
						total: typeof i.total === 'number' ? i.total : 0,
						createdAt: typeof i.createdAt === 'string' ? i.createdAt : ''
					}));
			}
		} catch {
			loadedEntries = [];
		}

		entries = loadedEntries;

		if (loadedEntries.length > 0) {
			verifyEntriesWithServer(loadedEntries);
		} else {
			isLoadingStatus = false;
		}
	});

	async function verifyEntriesWithServer(list: HistoryEntry[]) {
		isLoadingStatus = true;
		try {
			const res = await fetch('/api/orders/verify-history', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ entries: list.map((e) => ({ orderId: e.orderId, token: e.token })) })
			});

			if (res.ok) {
				const data = await res.json();
				const map: Record<string, ServerStatus> = {};
				if (Array.isArray(data.results)) {
					for (const item of data.results) {
						map[item.orderId] = item;
					}
				}
				serverStatuses = map;
			}
		} catch (err) {
			console.error('Gagal memverifikasi status pesanan:', err);
		} finally {
			isLoadingStatus = false;
		}
	}

	function confirmDeleteSingle() {
		if (itemToDelete) {
			const id = itemToDelete;
			entries = entries.filter((e) => e.orderId !== id);
			try {
				localStorage.setItem('invoizy:invoices', JSON.stringify(entries));
				toast.success(`Pesanan #${id} dihapus dari riwayat browser.`);
			} catch {
				// abaikan
			}
			itemToDelete = null;
		}
	}

	function confirmClearHistory() {
		modalOpen = false;
		try {
			localStorage.removeItem('invoizy:invoices');
		} catch {
			// abaikan
		}
		entries = [];
		serverStatuses = {};
		toast.success('Seluruh riwayat perangkat telah dibersihkan.');
	}

	function dateLabel(iso: string): string {
		try {
			return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(iso));
		} catch {
			return iso;
		}
	}
</script>

<div class="space-y-8 pb-24">
	<!-- Page Header: Warm Monoline Editorial -->
	<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="space-y-3">
			<div
				class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#fea770] px-5 py-2 font-mono text-sm font-black tracking-widest text-[#262626] uppercase shadow-[3px_3px_0px_#262626] sm:text-base dark:border-[#fea770] dark:bg-[#1a1825] dark:text-[#fea770] dark:shadow-[3px_3px_0px_#b4a6d5]"
			>
				<span class="h-2.5 w-2.5 rounded-full border border-[#262626] bg-white"></span>
				<span>RIWAYAT PESANAN</span>
			</div>
			<h1
				class="font-serif text-3xl font-black tracking-tight text-[#262626] md:text-4xl dark:text-[#f2efe9]"
			>
				Arsip Pemesanan
			</h1>
			<p class="font-mono text-xs text-[#404040] md:text-sm dark:text-[#b8b5ad]">
				Daftar transaksi dan faktur yang pernah Anda buat di perangkat ini.
			</p>
		</div>

		{#if entries.length > 0}
			<button
				type="button"
				onclick={() => (modalOpen = true)}
				class="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border-2 border-[#991b1b] bg-[#fee2e2] px-3 py-1.5 font-mono text-xs font-bold text-[#991b1b] shadow-[2px_2px_0px_#991b1b] transition-all hover:bg-[#fecaca] active:translate-y-0.5 active:shadow-none dark:border-[#f87171] dark:bg-[#450a0a] dark:text-[#f87171]"
			>
				<Trash2 size={13} strokeWidth={2.5} />
				<span>Hapus Semua</span>
			</button>
		{/if}
	</header>

	<!-- Local-only Warning Note -->
	<div
		class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#b4a6d5]"
	>
		<span
			class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
			aria-hidden="true">+</span
		>
		<div class="flex items-center gap-2">
			<div
				class="flex h-5 w-5 items-center justify-center rounded border border-[#262626] bg-[#b4a6d5] text-[#262626]"
			>
				<span class="font-mono text-xs font-bold">i</span>
			</div>
			<p class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
				Catatan Penyimpanan Perangkat
			</p>
		</div>
		<p class="mt-1.5 font-mono text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
			Riwayat ini tersimpan otomatis di penyimpanan lokal peramban Anda. Status setiap pesanan
			diverifikasi langsung secara otomatis ke server.
		</p>
	</div>

	{#if entries.length === 0 && !isLoadingStatus}
		<div
			class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-12 text-center shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
				aria-hidden="true">+</span
			>
			<div
				class="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#fea770] text-[#262626] shadow-[2px_2px_0px_#262626]"
			>
				<History size={28} strokeWidth={2.25} />
			</div>
			<p class="mt-4 font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
				Belum Ada Riwayat Pesanan
			</p>
			<p class="mt-1 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
				Pesanan yang Anda buat akan otomatis tercatat di sini.
			</p>
			<div class="mt-6">
				<a
					href={resolve('/(public)/order')}
					class="group relative inline-flex items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#fea770] px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[2px_2px_0px_#b4a6d5]"
				>
					<span
						class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
					>
						<span>Mulai Belanja</span>
						<ArrowRight size={14} />
					</span>
					<span
						class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-1.5 transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						<span>Mulai Belanja</span>
						<ArrowRight size={14} />
					</span>
				</a>
			</div>
		</div>
	{:else if isLoadingStatus}
		<div class="space-y-4">
			<ListSkeleton rows={entries.length > 0 ? Math.min(entries.length, 4) : 3} />
		</div>
	{:else}
		<div class="space-y-4">
			{#each entries as entry (entry.orderId)}
				{@const status = serverStatuses[entry.orderId]}
				{@const isInvalid = status && !status.valid}
				{@const isPending = status?.paymentStatus === 'PENDING' && !status?.isExpired}
				{@const isWaiting = status?.paymentStatus === 'WAITING_VERIFICATION'}
				{@const isConfirmed = status?.paymentStatus === 'CONFIRMED'}
				{@const isExpired = status?.paymentStatus === 'EXPIRED' || status?.isExpired}
				{@const isCancelled = status?.paymentStatus === 'CANCELLED'}

				<div
					class="group relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
				>
					<span
						class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
						aria-hidden="true">+</span
					>
					<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div class="space-y-1.5">
							<div class="flex flex-wrap items-center gap-2.5">
								<span class="font-mono text-base font-bold text-[#262626] dark:text-[#f2efe9]">
									#{entry.orderId}
								</span>

								<!-- Status Badge Monoline -->
								{#if isInvalid}
									<span
										class="inline-flex items-center gap-1 rounded-full border border-[#991b1b] bg-[#fee2e2] px-2.5 py-0.5 font-mono text-xs font-bold text-[#991b1b] dark:border-[#f87171] dark:bg-[#450a0a] dark:text-[#f87171]"
									>
										<AlertTriangle size={12} />
										<span>Tidak Ditemukan</span>
									</span>
								{:else if isConfirmed}
									<span
										class="inline-flex items-center gap-1 rounded-full border border-[#065f46] bg-[#d1fae5] px-2.5 py-0.5 font-mono text-xs font-bold text-[#065f46] dark:border-[#a2e1db] dark:bg-[#064e3b] dark:text-[#a2e1db]"
									>
										<CheckCircle2 size={12} />
										<span>Lunas & Terverifikasi</span>
									</span>
								{:else if isWaiting}
									<span
										class="inline-flex items-center gap-1 rounded-full border border-[#3730a3] bg-[#e0e7ff] px-2.5 py-0.5 font-mono text-xs font-bold text-[#3730a3] dark:border-[#b4a6d5] dark:bg-[#312e81] dark:text-[#e0e7ff]"
									>
										<Clock size={12} />
										<span>Menunggu Verifikasi</span>
									</span>
								{:else if isExpired}
									<span
										class="inline-flex items-center gap-1 rounded-full border border-[#262626] bg-[#e5e5e5] px-2.5 py-0.5 font-mono text-xs font-bold text-[#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
									>
										<span>Kedaluwarsa</span>
									</span>
								{:else if isCancelled}
									<span
										class="inline-flex items-center gap-1 rounded-full border border-[#991b1b] bg-[#fee2e2] px-2.5 py-0.5 font-mono text-xs font-bold text-[#991b1b] dark:border-[#f87171] dark:bg-[#450a0a] dark:text-[#f87171]"
									>
										<Ban size={12} />
										<span>Dibatalkan</span>
									</span>
								{:else if isPending}
									<span
										class="inline-flex items-center gap-1 rounded-full border border-[#92400e] bg-[#fef3c7] px-2.5 py-0.5 font-mono text-xs font-bold text-[#92400e] dark:border-[#f59e0b] dark:bg-[#78350f] dark:text-[#fde68a]"
									>
										<Clock size={12} />
										<span>Menunggu Bukti Transfer</span>
									</span>
								{/if}
							</div>

							<div
								class="flex items-center gap-3 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]"
							>
								<span>{dateLabel(entry.createdAt)}</span>
								<span>•</span>
								<span class="font-bold text-[#065f46] dark:text-[#a2e1db]">
									{formatRupiah(status?.total ?? entry.total)}
								</span>
							</div>

							{#if isInvalid}
								<p
									class="mt-2 font-mono text-xs leading-relaxed text-[#991b1b] dark:text-[#f87171]"
								>
									Pesanan ini tidak ditemukan di database server (mungkin telah dibersihkan atau
									dibatalkan). Jika Anda telah melakukan pembayaran, silakan hubungi penjual dengan
									menyebutkan ID pesanan ini.
								</p>
							{/if}
						</div>

						<!-- Action Buttons -->
						<div class="flex items-center gap-2 self-end sm:self-center">
							{#if isPending}
								<a
									href="{resolve('/(public)/order/bayar/[orderId]', {
										orderId: entry.orderId
									})}?token={entry.token}"
									class="group relative inline-flex items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#fea770] px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[2px_2px_0px_#b4a6d5]"
								>
									<span
										class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
									>
										<span>Lanjut Bayar</span>
										<ArrowRight size={13} />
									</span>
									<span
										class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-1.5 transition-transform duration-300 ease-out group-hover:translate-y-0"
										aria-hidden="true"
									>
										<span>Lanjut Bayar</span>
										<ArrowRight size={13} />
									</span>
								</a>
							{:else if isWaiting || isConfirmed || isCancelled}
								<a
									href="{resolve('/invoice/[orderId]', {
										orderId: entry.orderId
									})}?token={entry.token}"
									class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
								>
									<span>Lihat Faktur</span>
									<ExternalLink size={13} />
								</a>
							{/if}

							<button
								type="button"
								onclick={() => (itemToDelete = entry.orderId)}
								class="rounded-lg p-2 text-[#404040] transition-colors hover:bg-[#fee2e2] hover:text-[#991b1b] dark:text-[#b8b5ad] dark:hover:bg-[#450a0a] dark:hover:text-[#f87171]"
								aria-label="Hapus dari riwayat perangkat"
								title="Hapus dari riwayat perangkat"
							>
								<Trash2 size={15} />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal Konfirmasi Hapus 1 Item -->
<Modal
	open={itemToDelete !== null}
	title="Hapus Pesanan dari Riwayat?"
	message={`Apakah Anda yakin ingin menghapus pesanan #${itemToDelete} dari riwayat perangkat ini? Tautan akses dan bukti transaksi lokal Anda akan dihapus dari peramban ini.`}
	danger={true}
	confirmLabel="Ya, Hapus"
	cancelLabel="Batal"
	onConfirm={confirmDeleteSingle}
	onCancel={() => (itemToDelete = null)}
/>

<!-- Modal Konfirmasi Hapus Semua -->
<Modal
	open={modalOpen}
	title="Kosongkan Riwayat?"
	message="Apakah Anda yakin ingin menghapus seluruh daftar riwayat pesanan dari peramban ini? Tindakan ini tidak dapat dibatalkan."
	danger={true}
	confirmLabel="Ya, Bersihkan"
	cancelLabel="Batal"
	onConfirm={confirmClearHistory}
	onCancel={() => (modalOpen = false)}
/>
