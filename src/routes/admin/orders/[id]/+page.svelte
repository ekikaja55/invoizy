<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { formatRupiah } from '$lib/utils/currency';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import {
		ArrowLeft,
		MessageSquare,
		AlertTriangle,
		ChevronDown,
		ChevronUp,
		ExternalLink,
		Mail,
		Send
	} from '@lucide/svelte';
	import { invoiceStatusLabel, paymentStatusLabel } from '$lib/utils/status-label';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import { toast } from 'svelte-sonner';
	import { waLink } from '$lib/utils/contact';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let isBusy = $state(false);

	let waAccordionOpen = $state(false);
	let selectedTemplate = $state<'verified' | 'unclear' | 'ready' | 'basic'>('verified');
	let customMessage = $state('');

	// Modal konfirmasi pembatalan pesanan (Void)
	let isCancelOrderModalOpen = $state(false);
	let cancelFormEl = $state<HTMLFormElement | null>(null);

	// Banner rekomendasi kirim ulang email setelah status & PDF berhasil di-regenerate
	let resendBanner = $state<{
		show: boolean;
		type: 'confirmed' | 'rejected';
	}>({
		show: false,
		type: 'confirmed'
	});
	let bannerEl = $state<HTMLDivElement | null>(null);
	let waSectionEl = $state<HTMLDivElement | null>(null);

	const isOrderExpired = $derived(data.order.paymentStatus === 'EXPIRED');

	function executeCancelOrder() {
		isCancelOrderModalOpen = false;
		if (cancelFormEl) {
			cancelFormEl.requestSubmit();
		}
	}

	async function copyInvoiceLink() {
		if (!data.order.invoiceUrl) {
			toast.error('Link invoice belum tersedia.');
			return;
		}
		try {
			await navigator.clipboard.writeText(data.order.invoiceUrl);
			toast.success('Link invoice disalin. Tempel ke WA buyer.');
		} catch {
			toast.error('Gagal menyalin link.');
		}
	}

	// Query ditempel manual (token UUID aman-URL); path tetap via resolve().
	const invoiceHref = $derived(
		`${resolve('/invoice/[orderId]', { orderId: data.order.orderId })}?token=${data.order.accessToken}&from=admin` as ResolvedPathname
	);

	const effectiveInvoiceUrl = $derived(
		data.order.invoiceUrl ||
			(typeof window !== 'undefined' ? `${window.location.origin}${invoiceHref}` : '')
	);

	const reuploadPaymentUrl = $derived(
		typeof window !== 'undefined'
			? `${window.location.origin}/order/bayar/${data.order.orderId}?token=${data.order.accessToken}&reupload=true`
			: `/order/bayar/${data.order.orderId}?token=${data.order.accessToken}&reupload=true`
	);

	const itemsSummaryText = $derived(
		data.order.items
			.map(
				(i) =>
					`- ${i.nameSnapshot}${i.variantNameSnapshot ? ` (${i.variantNameSnapshot})` : ''} × ${i.qty}`
			)
			.join('\n')
	);

	const shopeeLink = $derived(
		data.storeSettings?.shopeeCheckoutUrl || 'https://shopee.co.id/cholazey.store'
	);

	const templates = $derived({
		verified: `Halo kak *${data.order.handle}*! Pembayaran sebesar *${formatRupiah(data.order.total)}* untuk pesanan #${data.order.orderId} telah kami verifikasi dan dinyatakan sah. Terima kasih banyak!\n\nPesanan:\n${itemsSummaryText}\nTotal: *${formatRupiah(data.order.total)}*\nStatus: *Lunas*\n\n${
			data.order.shippingType === 'MAIL_ORDER'
				? `Mohon dibantu untuk checkout link pengirimannya di Shopee berikut ya kak:\n${shopeeLink}\n\nEstimasi Paket Siap Dikirim: Pasca Event Pameran Chibiconxi\n(Konter ekspedisi aktif hari kerja Senin-Jumat)\n\nNanti Kakak akan diberitahukan kembali saat resi sudah keluar.`
				: `Metode Pengambilan: *${data.order.shippingLabel}*\n\nSilakan tunjukkan ID Pesanan #${data.order.orderId} atau tautan faktur ini ke penjaga booth saat mengambil barang:\n${effectiveInvoiceUrl}\n\nSampai jumpa di venue Chibiconxi!`
		}`,
		unclear: `Halo kak *${data.order.handle}*, terkait pesanan #${data.order.orderId}.\nMohon maaf, bukti pembayaran yang Kakak kirimkan belum dapat kami verifikasi karena foto kurang jelas atau nominal transfer belum sesuai.\n\nTotal tagihan: *${formatRupiah(data.order.total)}*\nBatas waktu pembayaran telah kami perpanjang 30 menit. Mohon bantuannya untuk mengunggah ulang foto bukti transfer yang valid melalui tautan berikut:\n${reuploadPaymentUrl}\n\nTerima kasih!`,
		ready: `Halo kak *${data.order.handle}*, pesanan #${data.order.orderId} kamu sudah siap diambil di booth pameran Chibiconxi!\n\nID Pesanan: #${data.order.orderId}\nDetail Faktur: ${effectiveInvoiceUrl}\n\nSampai jumpa di booth kami!`,
		basic: `Halo kak *${data.order.handle}*, terkait pesanan #${data.order.orderId}.\nTautan faktur invoice: ${effectiveInvoiceUrl}`
	});

	function toggleWaAccordion() {
		waAccordionOpen = !waAccordionOpen;
		if (waAccordionOpen && !customMessage) {
			if (data.order.paymentStatus === 'CONFIRMED') {
				selectedTemplate = 'verified';
			} else if (data.order.paymentStatus === 'WAITING_VERIFICATION') {
				selectedTemplate = 'unclear';
			} else {
				selectedTemplate = 'basic';
			}
			customMessage = templates[selectedTemplate];
		}
	}

	function onSelectTemplate(key: 'verified' | 'unclear' | 'ready' | 'basic') {
		selectedTemplate = key;
		customMessage = templates[key];
	}

	const waHref = $derived(waLink(data.order.phone, customMessage) || '');

	const createdLabel = $derived(
		new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(data.order.createdAt)
		)
	);

	const updatedLabel = $derived(
		new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(data.order.updatedAt)
		)
	);

	const expiresLabel = $derived(
		data.order.expiresAt
			? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
					new Date(data.order.expiresAt)
				)
			: null
	);
</script>

<BusyOverlay active={isBusy}>
	{#if !data.order}
		<div class="space-y-6 pb-16">
			<div class="h-8 w-48 animate-pulse rounded bg-[#262626]/15 dark:bg-[#f2efe9]/20"></div>
			<ListSkeleton rows={4} />
		</div>
	{:else}
		<div class="space-y-6 pb-16">
			<div class="flex items-center gap-3">
				<a
					href={resolve('/admin/orders')}
					aria-label="Kembali ke daftar order"
					class="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					<ArrowLeft size={16} />
				</a>
				<div>
					<h1
						class="text-xl font-black tracking-tight text-[#262626] sm:text-2xl dark:text-[#f2efe9]"
					>
						Order <span class="font-mono text-emerald-700 dark:text-emerald-400"
							>#{data.order.orderId}</span
						>
					</h1>
					<p class="mt-0.5 font-mono text-xs text-[#262626]/60 dark:text-[#f2efe9]/60">
						{createdLabel}
					</p>
				</div>
			</div>

			{#if isOrderExpired}
				<div
					class="relative flex items-start gap-3 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-amber-50 p-4 text-[#262626] shadow-[3px_3px_0px_#262626] dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200"
				>
					<AlertTriangle size={20} class="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
					<div class="space-y-1 text-sm">
						<p class="font-black">Pesanan Ini Telah Kedaluwarsa</p>
						<p class="font-mono text-xs leading-relaxed text-amber-900 dark:text-amber-300">
							Batas waktu pembayaran pesanan ini telah habis{expiresLabel
								? ` pada ${expiresLabel}`
								: ''}. Stok barang pesanan telah dikembalikan ke inventaris katalog toko. Seluruh
							tombol aksi verifikasi dan pembuatan invoice dinonaktifkan.
						</p>
					</div>
				</div>
			{/if}

			<div
				class="relative grid gap-3.5 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 text-sm shadow-[4px_4px_0px_#262626] md:text-base dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
			>
				<span
					class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
					>+</span
				>
				<div
					class="flex items-center justify-between border-b border-[#262626]/10 pb-3 dark:border-[#f2efe9]/10"
				>
					<span
						class="font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>Buyer</span
					>
					<span class="font-bold text-[#262626] dark:text-[#f2efe9]"
						>{data.order.handle} ·
						<span class="font-mono text-xs font-medium text-[#404040] dark:text-[#b8b5ad]"
							>{data.order.email}</span
						></span
					>
				</div>
				<div
					class="flex items-center justify-between gap-4 border-b border-[#262626]/10 pb-3 dark:border-[#f2efe9]/10"
				>
					<span
						class="shrink-0 font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>No. HP</span
					>
					<span class="text-right font-mono text-sm font-medium text-[#262626] dark:text-[#f2efe9]"
						>{data.order.phone}</span
					>
				</div>
				<div
					class="flex items-center justify-between gap-4 border-b border-[#262626]/10 pb-3 dark:border-[#f2efe9]/10"
				>
					<span
						class="shrink-0 font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>Alamat</span
					>
					<span class="text-right text-sm text-[#262626] sm:text-base dark:text-[#f2efe9]"
						>{data.order.address}</span
					>
				</div>
				{#if data.order.note}
					<div
						class="flex items-center justify-between gap-4 border-b border-[#262626]/10 pb-3 dark:border-[#f2efe9]/10"
					>
						<span
							class="font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
							>Catatan</span
						>
						<span
							class="text-right text-xs text-[#262626]/80 italic sm:text-sm dark:text-[#f2efe9]/80"
							>{data.order.note}</span
						>
					</div>
				{/if}
				<div
					class="flex items-center justify-between border-b border-[#262626]/10 pb-3 dark:border-[#f2efe9]/10"
				>
					<span
						class="font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>Total</span
					>
					<span class="font-mono text-lg font-black text-[#262626] dark:text-[#f2efe9]"
						>{formatRupiah(data.order.total)}</span
					>
				</div>
				<div
					class="flex items-center justify-between border-b border-[#262626]/10 pb-3 dark:border-[#f2efe9]/10"
				>
					<span
						class="font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>Invoice</span
					>
					<span
						class="inline-flex items-center rounded-md border border-[#262626] bg-neutral-100 px-2.5 py-1 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] dark:bg-neutral-800 dark:text-[#f2efe9]"
					>
						{invoiceStatusLabel(data.order.invoiceStatus)}
					</span>
				</div>
				<div
					class="flex items-center justify-between border-b border-[#262626]/10 pb-3 dark:border-[#f2efe9]/10"
				>
					<span
						class="font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>Pembayaran</span
					>
					<span
						class="inline-flex items-center rounded-md border border-[#262626] px-2.5 py-1 font-mono text-xs font-bold shadow-[1px_1px_0px_#262626] {data
							.order.paymentStatus === 'CONFIRMED'
							? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
							: data.order.paymentStatus === 'EXPIRED'
								? 'bg-[#262626] text-white dark:border-[#f2efe9]/40 dark:bg-neutral-800 dark:text-neutral-200'
								: data.order.paymentStatus === 'CANCELLED'
									? 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-300'
									: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'}"
					>
						{paymentStatusLabel(data.order.paymentStatus)}
					</span>
				</div>
				{#if data.order.paymentMethod}
					<div
						class="flex items-center justify-between border-b border-[#262626]/10 pb-3 dark:border-[#f2efe9]/10"
					>
						<span
							class="font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
							>Metode Bayar</span
						>
						<span class="font-mono text-sm font-medium text-[#262626] dark:text-[#f2efe9]"
							>{data.order.paymentMethod}</span
						>
					</div>
				{/if}
				<div class="flex items-center justify-between">
					<span
						class="font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>Terakhir diubah</span
					>
					<span class="font-mono text-xs font-medium text-[#404040] dark:text-[#b8b5ad]"
						>{updatedLabel}</span
					>
				</div>
				{#if data.order.error}
					<p
						class="rounded-lg border-2 border-red-500 bg-red-50 p-3 font-mono text-xs text-red-700 shadow-[2px_2px_0px_#262626] sm:text-sm dark:bg-red-950 dark:text-red-300"
					>
						{data.order.error}
					</p>
				{/if}
			</div>

			<!-- Section Bukti Pembayaran -->
			<div
				class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
			>
				<span
					class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
					>+</span
				>
				<h2
					class="font-serif text-base font-bold tracking-tight text-[#262626] sm:text-lg dark:text-[#f2efe9]"
				>
					Bukti Pembayaran Buyer
				</h2>

				{#if data.order.paymentProofUrl}
					<div class="mt-4 space-y-3">
						<div class="flex flex-col gap-4 sm:flex-row sm:items-start">
							<a
								href={data.order.paymentProofUrl}
								target="_blank"
								rel="external noopener noreferrer"
								class="group relative block w-fit max-w-xs overflow-hidden rounded-lg border-2 border-[#262626] bg-[#f2efe9] shadow-[3px_3px_0px_#262626] transition-transform hover:-translate-y-0.5 dark:border-[#f2efe9]/40 dark:bg-[#1a1825]"
							>
								<img
									src={data.order.paymentProofUrl}
									alt="Bukti Transfer #{data.order.orderId}"
									class="block max-h-72 w-auto object-contain"
								/>
								<span
									class="absolute right-1 bottom-1 rounded border border-white/20 bg-black/85 px-2 py-0.5 font-mono text-[11px] text-white backdrop-blur-xs transition-opacity group-hover:bg-black"
								>
									Buka Ukuran Penuh ↗
								</span>
							</a>

							<div class="flex-1 space-y-2.5 text-sm">
								<div>
									<span
										class="font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
										>Saluran Bayar:</span
									>
									<p class="text-sm font-bold text-[#262626] sm:text-base dark:text-[#f2efe9]">
										{data.order.paymentMethod || 'QRIS / Transfer Bank'}
									</p>
								</div>
								{#if data.order.paymentProofUploadedAt}
									<div>
										<span
											class="font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
											>Waktu Diunggah:</span
										>
										<p
											class="font-mono text-xs font-medium text-[#262626]/80 sm:text-sm dark:text-[#f2efe9]/80"
										>
											{new Intl.DateTimeFormat('id-ID', {
												dateStyle: 'medium',
												timeStyle: 'short'
											}).format(new Date(data.order.paymentProofUploadedAt))}
										</p>
									</div>
								{/if}

								<div class="pt-2">
									<span
										class="font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
										>Aksi Verifikasi Admin:</span
									>
									<div class="mt-2.5 flex flex-wrap gap-2.5">
										<form
											method="POST"
											action="?/setPayment"
											use:enhance={() => {
												isBusy = true;
												return async ({ result, update }) => {
													isBusy = false;
													handleFormResult(result, {
														success: 'Bukti pembayaran dinyatakan sah. Status: Lunas.'
													});
													if (result.type === 'success') {
														await update();
														const resData = result.data as { pdfRegenerated?: boolean } | undefined;
														if (resData?.pdfRegenerated) {
															resendBanner = { show: true, type: 'confirmed' };
														}
														await tick();
														(bannerEl || waSectionEl)?.scrollIntoView({
															behavior: 'smooth',
															block: 'center'
														});
													}
												};
											}}
										>
											<input type="hidden" name="paymentStatus" value="CONFIRMED" />
											<button
												type="submit"
												disabled={isBusy ||
													isOrderExpired ||
													data.order.paymentStatus === 'CONFIRMED'}
												class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-emerald-500 px-4 py-2.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
											>
												<span>Tandai Bukti Sah (Lunas)</span>
											</button>
										</form>

										<form
											method="POST"
											action="?/setPayment"
											use:enhance={() => {
												isBusy = true;
												return async ({ result, update }) => {
													isBusy = false;
													handleFormResult(result, {
														success: 'Bukti ditolak. Waktu pesanan diperpanjang 30 menit.'
													});
													if (result.type === 'success') {
														await update();
														waAccordionOpen = true;
														onSelectTemplate('unclear');
														const resData = result.data as { pdfRegenerated?: boolean } | undefined;
														if (resData?.pdfRegenerated) {
															resendBanner = { show: true, type: 'rejected' };
														}
														await tick();
														(bannerEl || waSectionEl)?.scrollIntoView({
															behavior: 'smooth',
															block: 'center'
														});
													}
												};
											}}
										>
											<input type="hidden" name="paymentStatus" value="PENDING" />
											<button
												type="submit"
												disabled={isBusy ||
													isOrderExpired ||
													data.order.paymentStatus === 'PENDING'}
												class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-amber-200 px-4 py-2.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:bg-amber-400"
											>
												<span>Tolak Bukti (Minta Upload Ulang)</span>
											</button>
										</form>
									</div>

									<div
										class="mt-3 rounded-lg border border-[#262626]/20 bg-[#f2efe9]/60 p-3 font-sans text-xs leading-relaxed text-[#262626]/90 sm:text-sm dark:border-[#f2efe9]/20 dark:bg-black/30 dark:text-[#f2efe9]/90"
									>
										<p>
											<span class="font-bold text-[#262626] dark:text-[#f2efe9]"
												>Alur Penolakan Bukti:</span
											>
											Menolak bukti akan mengembalikan status ke <em>Menunggu Pembayaran</em>,
											mereset batas kedaluwarsa 30 menit ke depan, dan mengosongkan bukti lama agar
											pembeli dapat mengunggah ulang. Panel WhatsApp otomatis terbuka untuk
											mengabari pembeli.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<p class="mt-3 font-mono text-xs text-[#404040] sm:text-sm dark:text-[#b8b5ad]">
						Buyer belum mengunggah bukti pembayaran untuk pesanan ini.
					</p>
				{/if}
			</div>

			<div
				class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
			>
				<span
					class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
					>+</span
				>
				<h2
					class="font-serif text-base font-bold tracking-tight text-[#262626] sm:text-lg dark:text-[#f2efe9]"
				>
					Item Pesanan
				</h2>
				<ul class="mt-3 divide-y divide-[#262626]/10 text-sm dark:divide-[#f2efe9]/10">
					{#each data.order.items as item (item.nameSnapshot + (item.variantNameSnapshot ?? '') + item.qty + item.priceSnapshot)}
						<li class="flex items-center justify-between py-2.5">
							<div>
								<span class="text-sm font-bold text-[#262626] sm:text-base dark:text-[#f2efe9]"
									>{item.nameSnapshot}</span
								>
								{#if item.variantNameSnapshot}
									<span
										class="ml-1.5 rounded border border-[#262626]/30 bg-neutral-100 px-2 py-0.5 font-mono text-xs font-bold text-[#262626] dark:border-[#f2efe9]/30 dark:bg-neutral-800 dark:text-[#f2efe9]"
									>
										{item.variantNameSnapshot}
									</span>
								{/if}
								<span
									class="font-mono text-xs font-bold text-[#404040] sm:text-sm dark:text-[#b8b5ad]"
								>
									× {item.qty}</span
								>
							</div>
							<span
								class="font-mono text-sm font-bold text-[#262626] sm:text-base dark:text-[#f2efe9]"
								>{formatRupiah(item.subtotal)}</span
							>
						</li>
					{/each}
				</ul>
			</div>

			<div class="flex flex-wrap gap-2.5">
				<a
					href={invoiceHref}
					class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					Buka Invoice ↗
				</a>
				{#if data.order.invoiceUrl}
					<button
						onclick={copyInvoiceLink}
						disabled={isBusy}
						class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
					>
						Salin Link WA
					</button>
				{/if}
				<button
					onclick={toggleWaAccordion}
					disabled={isBusy}
					class="flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-[#262626] px-4 py-2.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
				>
					<MessageSquare size={16} />
					<span>{waAccordionOpen ? 'Tutup Panel WA' : 'Hubungi Buyer via WA'}</span>
				</button>
			</div>

			{#if resendBanner.show}
				<div
					bind:this={bannerEl}
					class="relative flex flex-col justify-between gap-3.5 rounded-[14px_4px_14px_4px] border-2 border-[#262626] p-4 text-sm shadow-[3px_3px_0px_#262626] transition-all sm:flex-row sm:items-center {resendBanner.type ===
					'confirmed'
						? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200'
						: 'bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200'}"
				>
					<div class="flex items-start gap-3">
						<div
							class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#262626] {resendBanner.type ===
							'confirmed'
								? 'bg-emerald-600 text-white'
								: 'bg-amber-600 text-white'}"
						>
							<Mail size={16} />
						</div>
						<div class="space-y-0.5">
							<p class="text-sm font-black">
								{resendBanner.type === 'confirmed'
									? 'Faktur Lunas Berhasil Dibuat Ulang'
									: 'Status Diperbarui: Menunggu Bukti Ulang'}
							</p>
							<p class="font-mono text-xs leading-relaxed opacity-90 sm:text-sm">
								{resendBanner.type === 'confirmed'
									? `Faktur PDF berstempel lunas telah diperbarui di sistem. Direkomendasikan untuk mengirim salinan terbaru ini ke email pembeli (${data.order.email}).`
									: `Batas waktu pembayaran diperpanjang 30 menit & PDF diperbarui. Direkomendasikan mengirim salinan instruksi ini ke email pembeli.`}
							</p>
						</div>
					</div>

					<div class="flex shrink-0 items-center gap-2 self-end sm:self-center">
						<form
							method="POST"
							action="?/resend"
							use:enhance={() => {
								isBusy = true;
								return async ({ result, update }) => {
									handleFormResult(result, {
										success: 'Email faktur terbaru berhasil dikirim ke pembeli.',
										failure: 'Gagal mengirim ulang email faktur.'
									});
									if (result.type === 'success') {
										await update();
										resendBanner.show = false;
									}
									isBusy = false;
								};
							}}
						>
							<button
								type="submit"
								disabled={isBusy}
								class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm {resendBanner.type ===
								'confirmed'
									? 'bg-emerald-600 dark:bg-emerald-500 dark:text-neutral-950'
									: 'bg-amber-600 dark:bg-amber-500 dark:text-neutral-950'}"
							>
								<Send size={14} />
								<span>Kirim Email Sekarang</span>
							</button>
						</form>

						<button
							type="button"
							onclick={() => (resendBanner.show = false)}
							class="rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						>
							Abaikan
						</button>
					</div>
				</div>
			{/if}

			<!-- Accordion: Panel WhatsApp Buyer yang Lapang -->
			<div
				bind:this={waSectionEl}
				class="overflow-hidden rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white shadow-[4px_4px_0px_#262626] transition-all dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
			>
				<button
					type="button"
					onclick={toggleWaAccordion}
					class="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-[#f2efe9]/50 dark:hover:bg-neutral-800/50"
				>
					<div class="flex items-center gap-2.5">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#262626] bg-emerald-100 text-emerald-800 shadow-[1px_1px_0px_#262626] dark:bg-emerald-950/60 dark:text-emerald-300"
						>
							<MessageSquare size={18} />
						</div>
						<div>
							<h2 class="text-sm font-black text-[#262626] sm:text-base dark:text-[#f2efe9]">
								Kirim Pesan WhatsApp ke Buyer
							</h2>
							<p class="font-mono text-xs text-[#404040] sm:text-sm dark:text-[#b8b5ad]">
								{data.order.handle} ({data.order.phone || 'Nomor HP tidak tercantum'})
							</p>
						</div>
					</div>
					<div
						class="flex items-center gap-1.5 font-mono text-xs font-bold text-[#262626]/70 sm:text-sm dark:text-[#f2efe9]/70"
					>
						<span>{waAccordionOpen ? 'Tutup Panel' : 'Buka Draf Pesan'}</span>
						{#if waAccordionOpen}
							<ChevronUp size={16} />
						{:else}
							<ChevronDown size={16} />
						{/if}
					</div>
				</button>

				{#if waAccordionOpen}
					<div
						class="space-y-4 border-t-2 border-[#262626] bg-[#f2efe9]/30 p-4 sm:p-5 dark:border-[#f2efe9]/20 dark:bg-black/20"
					>
						<div>
							<span
								class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
								>Pilih Template Pesan</span
							>
							<div
								class="mt-2.5 grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2 sm:text-sm lg:grid-cols-4"
							>
								<button
									type="button"
									onclick={() => onSelectTemplate('verified')}
									class="rounded-lg border-2 p-3 text-left transition-all {selectedTemplate ===
									'verified'
										? 'border-[#262626] bg-emerald-100 font-bold text-emerald-950 shadow-[2px_2px_0px_#262626] dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200'
										: 'border-[#262626]/20 bg-white text-[#262626] shadow-[1px_1px_0px_#262626] hover:border-[#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#f2efe9]'}"
								>
									<div class="text-xs font-black sm:text-sm">Bukti Sah (Lunas)</div>
									<div class="mt-0.5 font-mono text-xs opacity-80">
										Konfirmasi lunas & link Shopee
									</div>
								</button>
								<button
									type="button"
									onclick={() => onSelectTemplate('unclear')}
									class="rounded-lg border-2 p-3 text-left transition-all {selectedTemplate ===
									'unclear'
										? 'border-[#262626] bg-amber-100 font-bold text-amber-950 shadow-[2px_2px_0px_#262626] dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200'
										: 'border-[#262626]/20 bg-white text-[#262626] shadow-[1px_1px_0px_#262626] hover:border-[#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#f2efe9]'}"
								>
									<div class="text-xs font-black sm:text-sm">Bukti Tidak Jelas</div>
									<div class="mt-0.5 font-mono text-xs opacity-80">
										Minta upload ulang foto transfer
									</div>
								</button>
								<button
									type="button"
									onclick={() => onSelectTemplate('ready')}
									class="rounded-lg border-2 p-3 text-left transition-all {selectedTemplate ===
									'ready'
										? 'border-[#262626] bg-blue-100 font-bold text-blue-950 shadow-[2px_2px_0px_#262626] dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200'
										: 'border-[#262626]/20 bg-white text-[#262626] shadow-[1px_1px_0px_#262626] hover:border-[#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#f2efe9]'}"
								>
									<div class="text-xs font-black sm:text-sm">Siap Diambil</div>
									<div class="mt-0.5 font-mono text-xs opacity-80">Pengambilan barang di booth</div>
								</button>
								<button
									type="button"
									onclick={() => onSelectTemplate('basic')}
									class="rounded-lg border-2 p-3 text-left transition-all {selectedTemplate ===
									'basic'
										? 'border-[#262626] bg-neutral-200 font-bold text-neutral-900 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-neutral-800 dark:text-white'
										: 'border-[#262626]/20 bg-white text-[#262626] shadow-[1px_1px_0px_#262626] hover:border-[#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#f2efe9]'}"
								>
									<div class="text-xs font-black sm:text-sm">Info Ringkas</div>
									<div class="mt-0.5 font-mono text-xs opacity-80">Tautan faktur invoice dasar</div>
								</button>
							</div>
						</div>

						<div>
							<label
								for="waMessageText"
								class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
							>
								Draf Pesan WhatsApp (Bisa Diubah Langsung)
							</label>
							<textarea
								id="waMessageText"
								rows="7"
								bind:value={customMessage}
								class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-white p-3.5 font-mono text-xs leading-relaxed text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#f2efe9]"
								placeholder="Ketik pesan yang ingin dikirimkan ke pembeli..."></textarea>
							<p class="mt-1.5 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
								Teks di atas akan otomatis dimuat ke aplikasi WhatsApp saat Anda menekan tombol di
								bawah.
							</p>
						</div>

						<div
							class="flex items-center justify-between border-t border-[#262626]/10 pt-3.5 dark:border-[#f2efe9]/10"
						>
							<button
								type="button"
								onclick={() => (waAccordionOpen = false)}
								class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
							>
								Tutup Panel
							</button>

							{#if waHref}
								<a
									href={waHref}
									target="_blank"
									rel="external noopener noreferrer"
									class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-emerald-500 px-5 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:bg-emerald-600"
								>
									<span>Buka Chat WhatsApp</span>
									<ExternalLink size={15} />
								</a>
							{:else}
								<span
									class="rounded-lg border border-[#262626]/20 bg-neutral-200 px-4 py-2 font-mono text-xs text-neutral-500 sm:text-sm dark:bg-neutral-800"
								>
									Nomor WhatsApp tidak valid
								</span>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<div
				class="relative space-y-3 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
			>
				<span
					class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
					>+</span
				>
				<h2
					class="font-mono text-xs font-black tracking-wider text-[#262626] uppercase dark:text-[#f2efe9]"
				>
					Aksi Pesanan
				</h2>

				<div class="flex flex-wrap gap-2.5">
					<form
						method="POST"
						action="?/regenerate"
						use:enhance={() => {
							isBusy = true;
							return async ({ result, update }) => {
								handleFormResult(result, {
									success: 'PDF berhasil dibuat ulang.',
									failure: 'Gagal generate ulang PDF.'
								});
								if (result.type === 'success') await update();
								isBusy = false;
							};
						}}
					>
						<button
							type="submit"
							disabled={isBusy || isOrderExpired}
							class="rounded-lg border-2 border-[#262626] bg-[#262626] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
						>
							Generate Ulang PDF
						</button>
					</form>

					<form
						method="POST"
						action="?/resend"
						use:enhance={() => {
							isBusy = true;
							return async ({ result, update }) => {
								handleFormResult(result, {
									success: 'Email berhasil dikirim ulang.',
									failure: 'Gagal mengirim ulang email.'
								});
								if (result.type === 'success') await update();
								isBusy = false;
							};
						}}
					>
						<button
							type="submit"
							disabled={isBusy || isOrderExpired}
							class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						>
							Kirim Ulang Email
						</button>
					</form>

					<form
						method="POST"
						action="?/markSent"
						use:enhance={() => {
							isBusy = true;
							return async ({ result, update }) => {
								handleFormResult(result, {
									success: 'Ditandai terkirim.',
									failure: 'Gagal menandai terkirim.'
								});
								if (result.type === 'success') await update();
								isBusy = false;
							};
						}}
					>
						<button
							type="submit"
							disabled={isBusy || isOrderExpired}
							title="Untuk invoice yang sudah dikirim manual via WA"
							class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						>
							Tandai Terkirim (WA)
						</button>
					</form>

					{#if data.order.paymentStatus !== 'CANCELLED' && data.order.paymentStatus !== 'EXPIRED'}
						<form
							bind:this={cancelFormEl}
							method="POST"
							action="?/setPayment"
							use:enhance={() => {
								isBusy = true;
								return async ({ result, update }) => {
									handleFormResult(result, {
										success: 'Pesanan berhasil dibatalkan (Void) dan stok dikembalikan.',
										failure: 'Gagal membatalkan pesanan.'
									});
									if (result.type === 'success') await update();
									isBusy = false;
								};
							}}
						>
							<input type="hidden" name="paymentStatus" value="CANCELLED" />
							<button
								type="button"
								onclick={() => (isCancelOrderModalOpen = true)}
								disabled={isBusy}
								class="rounded-lg border-2 border-[#262626] bg-red-100 px-4 py-2 font-mono text-xs font-bold text-red-900 shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 dark:bg-red-950 dark:text-red-200"
							>
								Batalkan Pesanan (Void)
							</button>
						</form>
					{/if}
				</div>
			</div>
		</div>

		<Modal
			open={isCancelOrderModalOpen}
			title="Batalkan Pesanan (Void)?"
			message={`Apakah Anda yakin ingin membatalkan pesanan #${data.order?.orderId ?? ''}? Status akan berubah menjadi Batal (Void) dan stok barang pesanan akan otomatis dikembalikan ke inventaris katalog toko.`}
			danger={true}
			confirmLabel="Ya, Batalkan Pesanan"
			cancelLabel="Tutup"
			onConfirm={executeCancelOrder}
			onCancel={() => (isCancelOrderModalOpen = false)}
		/>
	{/if}
</BusyOverlay>
