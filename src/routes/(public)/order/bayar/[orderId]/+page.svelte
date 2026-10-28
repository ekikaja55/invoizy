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
			const downloadUrl = `/api/qris/download?url=${encodeURIComponent(url)}`;
			const res = await fetch(downloadUrl);
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
			toast.success('Kode QRIS berhasil diunduh ke galeri!', { id: toastId });
		} catch {
			toast.error('Gagal mengunduh otomatis, membuka gambar langsung...', { id: toastId });
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

	const minutesDisplay = $derived(String(Math.floor(remainingSeconds / 60)).padStart(2, '0'));
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
	<!-- Page Header: Warm Monoline Editorial -->
	<header class="space-y-3">
		<div
			class="inline-flex items-center gap-2 rounded-full border-2 border-[#262626] bg-[#fea770] px-3.5 py-1 font-mono text-xs font-bold tracking-widest text-[#262626] uppercase shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9]"
		>
			<span class="inline-block h-2 w-2 rounded-full border border-[#262626] bg-white"></span>
			<span>{data.isReupload ? 'UNGGAH ULANG BUKTI' : 'INSTRUKSI PEMBAYARAN'}</span>
		</div>
		<h1
			class="font-serif text-3xl font-black tracking-tight text-[#262626] md:text-4xl dark:text-[#f2efe9]"
		>
			{data.isReupload ? 'Kirim Ulang Bukti Transfer' : 'Selesaikan Pembayaran'}
		</h1>
		<p class="font-mono text-xs text-[#404040] md:text-sm dark:text-[#b8b5ad]">
			{data.isReupload
				? 'Bukti sebelumnya belum jelas atau nominal belum sesuai. Silakan kirimkan foto bukti transfer yang valid.'
				: 'Stok produk Anda telah dikunci sementara. Silakan transfer dan unggah bukti pembayaran.'}
		</p>
	</header>

	<!-- Countdown Timer Card -->
	<div
		class="relative rounded-[14px_4px_14px_4px] border-2 p-5 shadow-[4px_4px_0px_#262626] transition-transform duration-150 {isExpired
			? 'border-[#991b1b] bg-[#fee2e2]/30 text-[#991b1b] dark:border-[#f87171] dark:bg-[#450a0a]/40 dark:text-[#f87171]'
			: 'border-[#262626] bg-white text-[#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[4px_4px_0px_#b4a6d5]'}"
	>
		<span
			class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
			aria-hidden="true">+</span
		>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-[#262626] {isExpired
						? 'bg-[#fee2e2] text-[#991b1b]'
						: 'bg-[#fea770] text-[#262626]'} shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]"
				>
					<Clock size={20} strokeWidth={2.5} />
				</div>
				<div>
					<p
						class="font-mono text-xs font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad]"
					>
						{isExpired ? 'Batas Waktu Telah Habis' : 'Selesaikan Pembayaran Dalam'}
					</p>
					<p
						class="font-mono text-2xl font-black {isExpired
							? 'text-[#991b1b] dark:text-[#f87171]'
							: 'text-[#262626] dark:text-[#a2e1db]'}"
					>
						{isExpired ? '00:00 (Kedaluwarsa)' : `${minutesDisplay}:${secondsDisplay}`}
					</p>
				</div>
			</div>

			<div class="text-left sm:text-right">
				<span class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">ID Pesanan</span>
				<p class="font-mono text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					#{data.order.orderId}
				</p>
			</div>
		</div>

		{#if isExpired}
			<div
				class="mt-4 border-t border-[#991b1b]/30 pt-3 font-mono text-xs leading-relaxed text-[#991b1b] dark:text-[#f87171]"
			>
				Waktu pembayaran telah habis. Pesanan ini telah kedaluwarsa dan stok barang telah
				dikembalikan ke inventaris toko. Silakan buat pesanan baru di katalog.
				<div class="mt-3">
					<a
						href={resolve('/(public)/order')}
						class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#991b1b] bg-[#fee2e2] px-3 py-1.5 font-mono text-xs font-bold text-[#991b1b] shadow-[2px_2px_0px_#991b1b] transition-all hover:bg-[#fecaca] active:translate-y-0.5 active:shadow-none"
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
		class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[3px_3px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#b4a6d5]"
	>
		<span
			class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
			aria-hidden="true">+</span
		>
		<div
			class="flex items-center justify-between border-b border-[#262626]/15 pb-3 dark:border-[#f2efe9]/15"
		>
			<span
				class="font-mono text-xs font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad]"
			>
				Total yang Harus Ditransfer
			</span>
			<span
				class="rounded border border-[#262626] bg-[#f2efe9] px-2 py-0.5 font-mono text-xs font-bold text-[#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
			>
				{data.order.items.length} item
			</span>
		</div>
		<div
			class="mt-3.5 flex items-baseline justify-between border-b-2 border-double border-[#262626]/40 pb-2 dark:border-[#f2efe9]/40"
		>
			<span class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]"
				>Total Tagihan Final</span
			>
			<span class="font-mono text-2xl font-black text-[#065f46] dark:text-[#a2e1db]">
				{formatRupiah(data.order.total)}
			</span>
		</div>
	</div>

	<!-- Pilihan Metode Pembayaran (QRIS & Transfer Bank) -->
	{#if !isExpired}
		<div class="space-y-4">
			<div class="flex items-center gap-2">
				<span class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">◈</span>
				<h2 class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
					Rekening & Saluran Pembayaran
				</h2>
			</div>

			<!-- QRIS Codes -->
			{#if data.qrisCodes.length > 0}
				<div
					class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
				>
					<span
						class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
						aria-hidden="true">+</span
					>
					<div
						class="flex items-center gap-2.5 border-b border-[#262626]/15 pb-3 dark:border-[#f2efe9]/15"
					>
						<div
							class="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#b4a6d5] text-[#262626] shadow-[1px_1px_0px_#262626]"
						>
							<QrCode size={15} />
						</div>
						<h3 class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
							Scan QRIS (Mendukung Semua Bank & E-Wallet)
						</h3>
					</div>

					<div class="mt-4 flex flex-col items-center justify-center gap-3">
						{#each data.qrisCodes as qris (qris.id)}
							<div class="text-center">
								<img
									src={qris.imageUrl}
									alt={qris.label}
									class="mx-auto max-h-64 rounded-lg border-2 border-[#262626] object-contain shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]"
								/>
								<p class="mt-2.5 font-mono text-xs font-bold text-[#262626] dark:text-[#f2efe9]">
									{qris.label}
								</p>
								<div class="mt-2">
									<button
										type="button"
										onclick={() => downloadQris(qris.imageUrl)}
										disabled={isDownloadingQris}
										class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#a2e1db] active:translate-y-0.5 active:shadow-none disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
									>
										<Download size={14} />
										<span>{isDownloadingQris ? 'Mengunduh...' : 'Unduh QRIS'}</span>
									</button>
								</div>
							</div>
						{/each}
						<p class="text-center font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
							Buka aplikasi BCA / Mandiri / GoPay / OVO / Dana / ShopeePay Anda, lalu scan QRIS di
							atas.
						</p>
					</div>
				</div>
			{/if}

			<!-- Bank Accounts -->
			{#if data.paymentMethods.length > 0}
				<div
					class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
				>
					<span
						class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
						aria-hidden="true">+</span
					>
					<div
						class="flex items-center gap-2.5 border-b border-[#262626]/15 pb-3 dark:border-[#f2efe9]/15"
					>
						<div
							class="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#a2e1db] text-[#262626] shadow-[1px_1px_0px_#262626]"
						>
							<CreditCard size={15} />
						</div>
						<h3 class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
							Transfer Rekening Bank
						</h3>
					</div>

					<div class="mt-4 divide-y divide-[#262626]/15 dark:divide-[#f2efe9]/15">
						{#each data.paymentMethods as method, idx (method.id)}
							<div class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<div class="flex items-center gap-2">
										<span
											class="rounded border border-[#262626] bg-[#fea770] px-2 py-0.5 font-mono text-xs font-bold text-[#262626]"
										>
											{method.label}
										</span>
										<span class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad]"
											>a.n. {method.accountHolder}</span
										>
									</div>
									<p
										class="mt-1 font-mono text-base font-bold tracking-wider text-[#262626] dark:text-[#f2efe9]"
									>
										{method.accountNumber}
									</p>
									{#if method.note}
										<p
											class="mt-0.5 font-mono text-[11px] text-[#404040]/70 dark:text-[#b8b5ad]/70"
										>
											{method.note}
										</p>
									{/if}
								</div>

								<button
									type="button"
									onclick={() => copyToClipboard(method.accountNumber, idx)}
									class="inline-flex items-center gap-1.5 self-start rounded-lg border-2 border-[#262626] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
								>
									{#if copiedIndex === idx}
										<Check size={14} class="text-[#065f46] dark:text-[#a2e1db]" />
										<span class="text-[#065f46] dark:text-[#a2e1db]">Tersalin</span>
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
			class="relative space-y-4 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
				aria-hidden="true">+</span
			>
			<input type="hidden" name="token" value={data.order.accessToken} />
			<div class="border-b border-[#262626]/15 pb-3.5 dark:border-[#f2efe9]/15">
				<div class="flex items-center gap-2.5">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#fea770] text-[#262626] shadow-[2px_2px_0px_#262626]"
					>
						<UploadCloud size={16} strokeWidth={2.5} />
					</div>
					<div>
						<h2
							class="font-serif text-lg leading-tight font-bold text-[#262626] dark:text-[#f2efe9]"
						>
							Unggah Bukti Transfer
						</h2>
					</div>
				</div>
				<p class="mt-1.5 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
					Setelah transfer berhasil, unggah foto tangkapan layar (screenshot) bukti transfer
					m-banking atau struk pembayaran Anda.
				</p>
			</div>

			<!-- Pilihan Metode Pembayaran Digunakan -->
			<div>
				<label
					for="paymentMethod"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:text-[#f2efe9]"
				>
					Metode yang Digunakan untuk Membayar
				</label>
				<select
					id="paymentMethod"
					name="paymentMethod"
					bind:value={selectedPaymentMethod}
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] focus:ring-2 focus:ring-[#fea770] focus:outline-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
				>
					<option value="QRIS">QRIS Toko</option>
					{#each data.paymentMethods as m (m.id)}
						<option value={`Transfer Bank ${m.label}`}
							>Transfer Bank {m.label} ({m.accountNumber})</option
						>
					{/each}
				</select>
			</div>

			<!-- Area Upload Bukti -->
			<div>
				<span
					class="block font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:text-[#f2efe9]"
				>
					Foto Bukti Pembayaran <span class="text-[#991b1b] dark:text-[#f87171]">*</span>
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
						<div
							class="relative max-w-xs overflow-hidden rounded-lg border-2 border-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]"
						>
							<img
								src={previewUrl}
								alt="Preview Bukti Transfer"
								class="max-h-60 w-full object-contain"
							/>
						</div>
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => fileInputEl?.click()}
								disabled={isBusy}
								class="rounded-lg border-2 border-[#262626] bg-[#f2efe9] px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#fea770] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9]"
							>
								Ganti Foto
							</button>
							<button
								type="button"
								onclick={clearProofFile}
								disabled={isBusy}
								class="rounded-lg border-2 border-[#991b1b] bg-[#fee2e2] px-3 py-1.5 font-mono text-xs font-bold text-[#991b1b] shadow-[2px_2px_0px_#991b1b] transition-all hover:bg-[#fecaca] active:translate-y-0.5 active:shadow-none dark:border-[#f87171] dark:bg-[#450a0a] dark:text-[#f87171]"
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
						class="mt-2 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#262626]/40 bg-[#f9f7f2] p-6 text-center transition-colors hover:border-[#262626] hover:bg-[#f2efe9] dark:border-[#f2efe9]/40 dark:bg-[#1a1825]"
					>
						<UploadCloud size={32} class="text-[#262626]/60 dark:text-[#f2efe9]/60" />
						<span class="mt-2 font-mono text-xs font-bold text-[#262626] dark:text-[#f2efe9]">
							Pilih Foto Bukti Transfer
						</span>
						<span class="font-mono text-[11px] text-[#404040] dark:text-[#b8b5ad]">
							Format PNG, JPG, JPEG, atau WebP (Maksimal 5MB)
						</span>
					</button>
				{/if}
			</div>

			<input type="hidden" name="isReupload" value={data.isReupload ? 'true' : 'false'} />

			<!-- Submit Button with Rolling Ticker -->
			<button
				type="submit"
				disabled={isBusy || !proofFile}
				class="group relative flex w-full items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#fea770] py-3.5 font-mono text-base font-bold text-[#262626] shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:border-[#262626]/30 disabled:bg-[#262626]/10 disabled:text-[#262626]/40 disabled:shadow-none dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[3px_3px_0px_#b4a6d5]"
			>
				<span
					class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
				>
					<Send size={18} strokeWidth={2.5} />
					<span
						>{isBusy
							? 'Mengunggah Bukti Pembayaran...'
							: data.isReupload
								? 'Kirim Ulang Bukti Pembayaran'
								: 'Kirim Bukti Pembayaran'}</span
					>
				</span>
				<span
					class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-2 transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					<Send size={18} strokeWidth={2.5} />
					<span
						>{isBusy
							? 'Mengunggah Bukti Pembayaran...'
							: data.isReupload
								? 'Kirim Ulang Bukti Pembayaran'
								: 'Kirim Bukti Pembayaran'}</span
					>
				</span>
			</button>
		</form>
	{/if}
</div>

{#if isBusy}
	<div
		class="fixed inset-0 z-[999] flex touch-none flex-col items-center justify-center overscroll-none bg-[#262626]/60 p-4 text-center backdrop-blur-xs select-none"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onwheel={preventScroll}
		ontouchmove={preventScroll}
	>
		<div
			class="relative w-full max-w-sm space-y-4 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-[#f2efe9] p-6 shadow-[5px_5px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[5px_5px_0px_#f2efe9]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
				aria-hidden="true">+</span
			>
			<div
				class="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-[#262626]/20 border-t-[#fea770]"
			></div>
			<div class="space-y-1">
				<p class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
					Mengunggah Bukti Pembayaran...
				</p>
				<p class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
					Sedang menyimpan foto dan memperbarui status pesanan Anda.
				</p>
			</div>
		</div>
	</div>
{/if}
