<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { enhance, applyAction } from '$app/forms';
	import { resolve } from '$app/paths';
	import { formatRupiah } from '$lib/utils/currency';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import { cart } from '$lib/stores/cart.svelte';
	import {
		Clock,
		Copy,
		QrCode,
		CreditCard,
		UploadCloud,
		Send,
		Check,
		ShoppingBag,
		Download
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isBusy = $state(false);
	let selectedPaymentMethod = $state('QRIS');
	let proofFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let copiedIndex = $state<number | null>(null);
	let fileInputEl = $state<HTMLInputElement | null>(null);
	let isDownloadingQris = $state(false);

	$effect(() => {
		if (isBusy) {
			const prevBodyOverflow = document.body.style.overflow;
			const prevHtmlOverflow = document.documentElement.style.overflow;
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = prevBodyOverflow;
				document.documentElement.style.overflow = prevHtmlOverflow;
			};
		}
	});

	function preventScroll(e: Event) {
		e.preventDefault();
	}

	async function downloadQris(url: string) {
		if (isDownloadingQris) return;
		isDownloadingQris = true;
		const toastId = toast.loading('Mengunduh kode QRIS...');
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error('Gagal mengunduh file gambar');
			const blob = await res.blob();
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = 'cholazey-qris.png';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(blobUrl);
			toast.success('Kode QRIS berhasil diunduh!', { id: toastId });
		} catch {
			toast.error('Gagal mengunduh QRIS langsung, membuka gambar...', { id: toastId });
			window.open(url, '_blank');
		} finally {
			isDownloadingQris = false;
		}
	}

	// Bersihkan keranjang belanja saat pembeli telah tiba di halaman pembayaran pesanan ini
	onMount(() => {
		cart.clear();
	});

	function computeRemaining(expiresAt: string | null) {
		if (!expiresAt) return 0;
		const target = new Date(expiresAt).getTime();
		return Math.max(0, Math.floor((target - Date.now()) / 1000));
	}

	// Server-driven countdown timer
	const targetTimestamp = $derived(
		data.order.expiresAt ? new Date(data.order.expiresAt).getTime() : 0
	);

	let remainingSeconds = $state(0);

	$effect(() => {
		if (targetTimestamp <= 0) return;
		remainingSeconds = untrack(() => computeRemaining(data.order.expiresAt));

		const interval = setInterval(() => {
			const diff = Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000));
			remainingSeconds = diff;
			if (diff <= 0) {
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	});

	const isExpired = $derived(targetTimestamp > 0 && remainingSeconds <= 0);

	const minutesDisplay = $derived(
		String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
	);
	const secondsDisplay = $derived(String(remainingSeconds % 60).padStart(2, '0'));

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];
		if (file.size > 5 * 1024 * 1024) {
			toast.error('Ukuran foto bukti transfer maksimal 5MB.');
			return;
		}

		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}

		proofFile = file;
		previewUrl = URL.createObjectURL(file);
		toast.success('Foto bukti pembayaran dipilih.');
	}

	function clearProofFile() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		previewUrl = null;
		proofFile = null;
		if (fileInputEl) {
			fileInputEl.value = '';
		}
	}

	async function copyToClipboard(text: string, index: number) {
		try {
			await navigator.clipboard.writeText(text);
			copiedIndex = index;
			toast.success('Nomor rekening berhasil disalin!');
			setTimeout(() => {
				if (copiedIndex === index) copiedIndex = null;
			}, 2000);
		} catch {
			toast.error('Gagal menyalin nomor rekening.');
		}
	}
</script>

<div class="mx-auto max-w-2xl space-y-6 pb-28">
	<!-- Scrapbook Header -->
	<header class="space-y-3">
		<div
			class="inline-block -rotate-2 rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya px-3.5 py-1.5 font-mono text-xs font-bold tracking-widest text-brandy uppercase shadow-[2px_2px_0px_#78290f] md:text-sm dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
		>
			{data.isReupload ? 'UNGGAH ULANG BUKTI' : 'INSTRUKSI PEMBAYARAN'}
		</div>
		<h1
			class="font-serif text-3xl font-bold tracking-normal text-ink md:text-4xl dark:text-papaya"
		>
			{data.isReupload ? 'Kirim Ulang Bukti Transfer' : 'Selesaikan Pembayaran'}
		</h1>
		<p class="font-handwriting text-2xl font-semibold leading-snug text-teal md:text-3xl dark:text-papaya/90">
			{data.isReupload
				? 'Bukti sebelumnya belum jelas atau nominal belum sesuai. Silakan kirimkan foto bukti transfer yang valid.'
				: 'Stok produk Anda telah dikunci sementara. Silakan transfer dan unggah bukti pembayaran.'}
		</p>
	</header>

	<!-- Countdown Timer Card -->
	<div
		class="relative -rotate-1 rounded-[14px_6px_12px_8px] border-2 p-5 shadow-[4px_4px_0px_#78290f] transition-transform duration-150 hover:rotate-0 {isExpired
			? 'border-crimson bg-crimson/10 text-crimson dark:border-crimson/60 dark:bg-crimson/20 dark:shadow-[4px_4px_0px_rgba(193,18,31,0.3)]'
			: 'border-brandy bg-papaya text-ink dark:border-papaya/30 dark:bg-ink dark:text-papaya dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]'}"
	>
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
			<div class="flex items-center gap-3">
				<div
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px_3px_7px_2px] border-2 border-brandy {isExpired
						? 'bg-crimson text-white'
						: 'bg-tangerine text-white'} shadow-[2px_2px_0px_#78290f]"
				>
					<Clock size={20} strokeWidth={2.5} />
				</div>
				<div>
					<p class="font-mono text-xs font-bold uppercase tracking-wider text-brandy/80 dark:text-papaya/80">
						{isExpired ? 'Batas Waktu Telah Habis' : 'Selesaikan Pembayaran Dalam'}
					</p>
					<p class="font-mono text-2xl font-black {isExpired ? 'text-crimson' : 'text-brandy dark:text-papaya'}">
						{isExpired ? '00:00 (Kedaluwarsa)' : `${minutesDisplay}:${secondsDisplay}`}
					</p>
				</div>
			</div>

			<div class="text-left sm:text-right">
				<span class="font-mono text-xs text-brandy/70 dark:text-papaya/70">ID Pesanan</span>
				<p class="font-mono text-base font-bold text-ink dark:text-papaya">#{data.order.orderId}</p>
			</div>
		</div>

		{#if isExpired}
			<div class="mt-4 border-t border-crimson/30 pt-3 text-xs leading-relaxed text-crimson">
				Waktu pembayaran telah habis. Pesanan ini telah kedaluwarsa dan stok barang telah dikembalikan ke inventaris toko. Silakan buat pesanan baru di katalog.
				<div class="mt-3">
					<a
						href={resolve('/(public)/order')}
						class="inline-flex items-center gap-1.5 rounded-[6px_2px_5px_1px] border-2 border-crimson bg-crimson px-3 py-1.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#78290f]"
					>
						<ShoppingBag size={14} />
						<span>Kembali ke Katalog</span>
					</a>
				</div>
			</div>
		{/if}
	</div>

	<!-- Total Tagihan -->
	<div
		class="rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/50 p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
	>
		<div class="flex items-center justify-between border-b border-brandy/20 pb-3 dark:border-papaya/20">
			<span class="font-mono text-xs font-bold text-brandy/80 dark:text-papaya/80 uppercase">
				Total yang Harus Ditransfer
			</span>
			<span class="font-mono text-xs font-medium text-brandy/60 dark:text-papaya/60">
				{data.order.items.length} item
			</span>
		</div>
		<div class="mt-3 flex items-baseline justify-between">
			<span class="font-serif text-sm font-bold text-ink dark:text-papaya">Total Tagihan Final</span>
			<span class="font-mono text-2xl font-black text-brandy dark:text-tangerine">
				{formatRupiah(data.order.total)}
			</span>
		</div>
	</div>

	<!-- Pilihan Metode Pembayaran (QRIS & Transfer Bank) -->
	{#if !isExpired}
		<div class="space-y-4">
			<h2 class="font-serif text-lg font-bold text-ink dark:text-papaya">
				Rekening & Saluran Pembayaran
			</h2>

			<!-- QRIS Codes -->
			{#if data.qrisCodes.length > 0}
				<div
					class="rounded-[14px_6px_12px_8px] border-2 border-brandy bg-white p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-neutral-900"
				>
					<div class="flex items-center gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-800">
						<QrCode size={18} class="text-brandy dark:text-papaya" />
						<h3 class="font-serif text-sm font-bold text-ink dark:text-papaya">
							Scan QRIS (Mendukung Semua Bank & E-Wallet)
						</h3>
					</div>

					<div class="mt-4 flex flex-col items-center justify-center gap-3">
						{#each data.qrisCodes as qris (qris.id)}
							<div class="text-center">
								<img
									src={qris.imageUrl}
									alt={qris.label}
									class="mx-auto max-h-64 rounded-lg border-2 border-brandy object-contain shadow-xs dark:border-papaya/40"
								/>
								<p class="mt-2 font-mono text-xs font-semibold text-brandy dark:text-papaya">
									{qris.label}
								</p>
								<div class="mt-2">
									<button
										type="button"
										onclick={() => downloadQris(qris.imageUrl)}
										disabled={isDownloadingQris}
										class="inline-flex items-center gap-1.5 rounded-[6px_2px_5px_1px] border border-neutral-300 bg-neutral-50 px-3 py-1.5 font-mono text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
									>
										<Download size={14} />
										<span>{isDownloadingQris ? 'Mengunduh...' : 'Unduh QRIS'}</span>
									</button>
								</div>
							</div>
						{/each}
						<p class="text-center font-sans text-xs text-neutral-500">
							Buka aplikasi BCA / Mandiri / GoPay / OVO / Dana / ShopeePay Anda, lalu scan QRIS di atas.
						</p>
					</div>
				</div>
			{/if}

			<!-- Bank Accounts -->
			{#if data.paymentMethods.length > 0}
				<div
					class="rounded-[14px_6px_12px_8px] border-2 border-brandy bg-white p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-neutral-900"
				>
					<div class="flex items-center gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-800">
						<CreditCard size={18} class="text-brandy dark:text-papaya" />
						<h3 class="font-serif text-sm font-bold text-ink dark:text-papaya">
							Transfer Rekening Bank
						</h3>
					</div>

					<div class="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
						{#each data.paymentMethods as method, idx (method.id)}
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3">
								<div>
									<div class="flex items-center gap-2">
										<span class="rounded bg-papaya px-2 py-0.5 font-mono text-xs font-bold text-brandy dark:bg-ink dark:text-papaya">
											{method.label}
										</span>
										<span class="text-xs text-neutral-500">a.n. {method.accountHolder}</span>
									</div>
									<p class="mt-1 font-mono text-sm font-bold tracking-wider text-ink dark:text-neutral-100">
										{method.accountNumber}
									</p>
									{#if method.note}
										<p class="mt-0.5 text-[11px] text-neutral-400">{method.note}</p>
									{/if}
								</div>

								<button
									type="button"
									onclick={() => copyToClipboard(method.accountNumber, idx)}
									class="inline-flex items-center gap-1.5 self-start rounded-[6px_2px_5px_1px] border border-neutral-300 bg-neutral-50 px-3 py-1.5 font-mono text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
								>
									{#if copiedIndex === idx}
										<Check size={14} class="text-emerald-600" />
										<span class="text-emerald-600">Tersalin</span>
									{:else}
										<Copy size={14} />
										<span>Salin No. Rek</span>
									{/if}
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Form Upload Bukti Pembayaran -->
		<form
			method="POST"
			action="?/uploadProof&token={data.order.accessToken}"
			enctype="multipart/form-data"
			use:enhance={() => {
				isBusy = true;
				return async ({ result }) => {
					if (result.type === 'redirect') {
						await applyAction(result);
						return;
					}
					isBusy = false;
					handleFormResult(result, {
						failure: 'Gagal mengunggah bukti pembayaran.'
					});
					await applyAction(result);
				};
			}}
			class="space-y-4 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/50 p-5 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
		>
			<input type="hidden" name="token" value={data.order.accessToken} />
			<div class="border-b border-brandy/20 pb-3 dark:border-papaya/20">
				<h2 class="font-serif text-lg font-bold text-ink dark:text-papaya">
					Unggah Bukti Transfer
				</h2>
				<p class="font-sans text-xs text-brandy/80 dark:text-papaya/70">
					Setelah transfer berhasil, unggah foto tangkapan layar (screenshot) bukti transfer m-banking atau struk pembayaran Anda.
				</p>
			</div>

			<!-- Pilihan Metode Pembayaran Digunakan -->
			<div>
				<label for="paymentMethod" class="block font-mono text-xs font-bold text-ink dark:text-papaya">
					Metode yang Digunakan untuk Membayar
				</label>
				<select
					id="paymentMethod"
					name="paymentMethod"
					bind:value={selectedPaymentMethod}
					disabled={isBusy}
					class="mt-1 w-full rounded-[8px_3px_7px_2px] border-2 border-brandy bg-white px-3.5 py-2 font-sans text-xs text-ink focus:border-brandy focus:outline-none dark:border-papaya/40 dark:bg-ink dark:text-papaya"
				>
					<option value="QRIS">QRIS Toko</option>
					{#each data.paymentMethods as m (m.id)}
						<option value={`Transfer Bank ${m.label}`}>Transfer Bank {m.label} ({m.accountNumber})</option>
					{/each}
				</select>
			</div>

			<!-- Area Upload Bukti -->
			<div>
				<span class="block font-mono text-xs font-bold text-ink dark:text-papaya">
					Foto Bukti Pembayaran <span class="text-crimson">*</span>
				</span>

				<!-- Elemen input file tunggal dan persisten di form -->
				<input
					bind:this={fileInputEl}
					id="proof"
					type="file"
					name="proof"
					accept="image/*"
					class="hidden"
					disabled={isBusy}
					onchange={handleFileSelect}
				/>

				{#if previewUrl}
					<div class="mt-2 space-y-2">
						<div class="relative rounded-lg border-2 border-brandy overflow-hidden max-w-xs shadow-[2px_2px_0px_#78290f]">
							<img src={previewUrl} alt="Preview Bukti Transfer" class="w-full object-contain max-h-60" />
						</div>
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => fileInputEl?.click()}
								disabled={isBusy}
								class="rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya px-3 py-1.5 font-mono text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] hover:bg-tangerine hover:text-white"
							>
								Ganti Foto
							</button>
							<button
								type="button"
								onclick={clearProofFile}
								disabled={isBusy}
								class="rounded-[6px_2px_5px_1px] border-2 border-crimson/50 bg-crimson/10 px-3 py-1.5 font-mono text-xs font-bold text-crimson hover:bg-crimson hover:text-white"
							>
								Hapus
							</button>
						</div>
					</div>
				{:else}
					<button
						type="button"
						onclick={() => fileInputEl?.click()}
						disabled={isBusy}
						class="mt-2 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-brandy/50 bg-white/60 p-6 text-center cursor-pointer transition-colors hover:border-brandy hover:bg-white dark:border-papaya/40 dark:bg-ink/60"
					>
						<UploadCloud size={32} class="text-brandy/60 dark:text-papaya/60" />
						<span class="mt-2 font-mono text-xs font-bold text-ink dark:text-papaya">
							Pilih Foto Bukti Transfer
						</span>
						<span class="text-[11px] text-brandy/60 dark:text-papaya/60">
							Format PNG, JPG, JPEG, atau WebP (Maksimal 5MB)
						</span>
					</button>
				{/if}
			</div>

			<input type="hidden" name="isReupload" value={data.isReupload ? 'true' : 'false'} />

			<button
				type="submit"
				disabled={isBusy || !proofFile}
				class="flex w-full items-center justify-center gap-2 rounded-[10px_5px_9px_4px] border-2 border-brandy bg-tangerine px-5 py-3.5 font-mono text-base font-bold text-white shadow-[4px_4px_0px_#78290f] transition-all hover:bg-[#e06d00] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:border-brandy/30 disabled:bg-brandy/20 disabled:text-brandy/40 disabled:shadow-none"
			>
				<Send size={18} strokeWidth={2.5} />
				<span>{isBusy ? 'Mengunggah Bukti Pembayaran...' : (data.isReupload ? 'Kirim Ulang Bukti Pembayaran' : 'Kirim Bukti Pembayaran')}</span>
			</button>
		</form>
	{/if}
</div>

{#if isBusy}
	<div
		class="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-center select-none touch-none overscroll-none"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onwheel={preventScroll}
		ontouchmove={preventScroll}
	>
		<div
			class="-rotate-1 rounded-[16px_8px_14px_6px] border-2 border-brandy bg-papaya p-6 shadow-[6px_6px_0px_#78290f] max-w-sm w-full space-y-4 dark:border-papaya/40 dark:bg-ink dark:shadow-[6px_6px_0px_rgba(255,236,209,0.3)]"
		>
			<div
				class="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-brandy/30 border-t-tangerine"
			></div>
			<div class="space-y-1">
				<p class="font-headline text-lg font-bold text-ink dark:text-papaya">
					Mengunggah Bukti Pembayaran...
				</p>
				<p class="font-sans text-xs text-brandy/80 dark:text-papaya/70">
					Sedang menyimpan foto dan memperbarui status pesanan Anda.
				</p>
			</div>
		</div>
	</div>
{/if}
