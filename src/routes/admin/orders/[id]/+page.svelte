<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { formatRupiah } from '$lib/utils/currency';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { ArrowLeft, MessageSquare, AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Mail, Send } from '@lucide/svelte';
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
		data.order.invoiceUrl || (typeof window !== 'undefined' ? `${window.location.origin}${invoiceHref}` : '')
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
		data.storeSettings?.shopeeCheckoutUrl ||
			'https://shopee.co.id/cholazey.store'
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
<div class="space-y-6 pb-16">
	<div class="flex items-center gap-3">
		<a
			href={resolve('/admin/orders')}
			aria-label="Kembali ke daftar order"
			class="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300
             hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
		>
			<ArrowLeft size={16} />
		</a>
		<div>
			<h1 class="text-xl font-semibold">Order {data.order.orderId}</h1>
			<p class="mt-1 text-sm text-neutral-500">{createdLabel}</p>
		</div>
	</div>

	{#if isOrderExpired}
		<div class="flex items-start gap-3 rounded-xl border-2 border-amber-500/50 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">
			<AlertTriangle size={20} class="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
			<div class="space-y-1 text-sm">
				<p class="font-bold">Pesanan Ini Telah Kedaluwarsa</p>
				<p class="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
					Batas waktu pembayaran pesanan ini telah habis{expiresLabel ? ` pada ${expiresLabel}` : ''}.
					Stok barang pesanan telah dikembalikan ke inventaris katalog toko. Seluruh tombol aksi verifikasi dan pembuatan invoice dinonaktifkan.
				</p>
			</div>
		</div>
	{/if}

	<div class="grid gap-3 rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
		<div class="flex justify-between">
			<span class="text-neutral-500">Buyer</span>
			<span class="font-medium">{data.order.handle} · {data.order.email}</span>
		</div>
		<div class="flex justify-between gap-4">
			<span class="shrink-0 text-neutral-500">No. HP</span>
			<span class="text-right font-medium">{data.order.phone}</span>
		</div>
		<div class="flex justify-between gap-4">
			<span class="shrink-0 text-neutral-500">Alamat</span>
			<span class="text-right">{data.order.address}</span>
		</div>
		{#if data.order.note}
			<div class="flex justify-between gap-4">
				<span class="text-neutral-500">Catatan</span>
				<span class="text-right">{data.order.note}</span>
			</div>
		{/if}
		<div class="flex justify-between">
			<span class="text-neutral-500">Total</span>
			<span class="font-semibold">{formatRupiah(data.order.total)}</span>
		</div>
		<div class="flex justify-between">
			<span class="text-neutral-500">Invoice</span>
			<span class="font-medium">{invoiceStatusLabel(data.order.invoiceStatus)}</span>
		</div>
		<div class="flex justify-between">
			<span class="text-neutral-500">Pembayaran</span>
			<span class="font-medium">{paymentStatusLabel(data.order.paymentStatus)}</span>
		</div>
		{#if data.order.paymentMethod}
			<div class="flex justify-between">
				<span class="text-neutral-500">Metode Bayar</span>
				<span class="font-medium">{data.order.paymentMethod}</span>
			</div>
		{/if}
		<div class="flex justify-between">
			<span class="text-neutral-500">Terakhir diubah</span>
			<span>{updatedLabel}</span>
		</div>
		{#if data.order.error}
			<p class="rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
				{data.order.error}
			</p>
		{/if}
	</div>

	<!-- Section Bukti Pembayaran -->
	<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
		<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Bukti Pembayaran Buyer</h2>

		{#if data.order.paymentProofUrl}
			<div class="mt-3 space-y-3">
				<div class="flex flex-col sm:flex-row sm:items-start gap-4">
					<a
						href={data.order.paymentProofUrl}
						target="_blank"
						rel="external noopener noreferrer"
						class="group relative block max-w-xs overflow-hidden rounded-lg border-2 border-neutral-300 dark:border-neutral-700 hover:opacity-90"
					>
						<img
							src={data.order.paymentProofUrl}
							alt="Bukti Transfer #{data.order.orderId}"
							class="max-h-64 w-auto object-contain"
						/>
						<span class="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] text-white">
							Buka Ukuran Penuh
						</span>
					</a>

					<div class="space-y-2 text-sm flex-1">
						<div>
							<span class="text-xs text-neutral-500">Saluran Bayar:</span>
							<p class="font-semibold">{data.order.paymentMethod || 'QRIS / Transfer Bank'}</p>
						</div>
						{#if data.order.paymentProofUploadedAt}
							<div>
								<span class="text-xs text-neutral-500">Waktu Diunggah:</span>
								<p class="font-medium text-xs">
									{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.order.paymentProofUploadedAt))}
								</p>
							</div>
						{/if}

						<div class="pt-2">
							<span class="text-xs text-neutral-500">Aksi Verifikasi Admin:</span>
							<div class="mt-1.5 flex flex-wrap gap-2">
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
												(bannerEl || waSectionEl)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
											}
										};
									}}
								>
									<input type="hidden" name="paymentStatus" value="CONFIRMED" />
									<button
										type="submit"
										disabled={isBusy || isOrderExpired || data.order.paymentStatus === 'CONFIRMED'}
										class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
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
												(bannerEl || waSectionEl)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
											}
										};
									}}
								>
									<input type="hidden" name="paymentStatus" value="PENDING" />
									<button
										type="submit"
										disabled={isBusy || isOrderExpired || data.order.paymentStatus === 'PENDING'}
										class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
									>
										<span>Tolak Bukti (Minta Upload Ulang)</span>
									</button>
								</form>
							</div>

							<div class="mt-2.5 rounded-lg border border-neutral-200 bg-neutral-50/80 p-2.5 text-[11px] leading-relaxed text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
								<p>
									<span class="font-bold text-neutral-800 dark:text-neutral-200">Alur Penolakan Bukti:</span>
									Menolak bukti akan mengembalikan status ke <em>Menunggu Pembayaran</em>, mereset batas kedaluwarsa 30 menit ke depan, dan mengosongkan bukti lama agar pembeli dapat mengunggah ulang. Panel WhatsApp otomatis terbuka untuk mengabari pembeli.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<p class="mt-2 text-xs text-neutral-400">
				Buyer belum mengunggah bukti pembayaran untuk pesanan ini.
			</p>
		{/if}
	</div>

	<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
		<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Item</h2>
		<ul class="mt-3 space-y-2 text-sm">
			{#each data.order.items as item (item.nameSnapshot + (item.variantNameSnapshot ?? '') + item.qty + item.priceSnapshot)}
				<li class="flex items-center justify-between">
					<div>
						<span>{item.nameSnapshot}</span>
						{#if item.variantNameSnapshot}
							<span
								class="ml-1.5 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
							>
								{item.variantNameSnapshot}
							</span>
						{/if}
						<span class="text-neutral-500"> × {item.qty}</span>
					</div>
					<span>{formatRupiah(item.subtotal)}</span>
				</li>
			{/each}
		</ul>
	</div>

	<div class="flex flex-wrap gap-2">
		<a
			href={invoiceHref}
			class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
             hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
		>
			Buka Invoice
		</a>
		{#if data.order.invoiceUrl}
			<button
				onclick={copyInvoiceLink}
				disabled={isBusy}
				class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
               hover:bg-neutral-100 disabled:opacity-50
               dark:border-neutral-700 dark:hover:bg-white/10"
			>
				Salin link WA
			</button>
		{/if}
		<button
			onclick={toggleWaAccordion}
			disabled={isBusy}
			class="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-neutral-900 px-4 py-2 text-sm font-medium text-white
             hover:bg-neutral-800 disabled:opacity-50 dark:border-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
		>
			<MessageSquare size={16} />
			<span>{waAccordionOpen ? 'Tutup Panel WA' : 'Hubungi Buyer via WA'}</span>
		</button>
	</div>

	{#if resendBanner.show}
		<div
			bind:this={bannerEl}
			class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border p-4 text-sm transition-all {resendBanner.type === 'confirmed'
				? 'border-emerald-300 bg-emerald-50/90 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
				: 'border-amber-300 bg-amber-50/90 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'}"
		>
			<div class="flex items-start gap-3">
				<div
					class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg {resendBanner.type === 'confirmed'
						? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-neutral-950'
						: 'bg-amber-600 text-white dark:bg-amber-500 dark:text-neutral-950'}"
				>
					<Mail size={16} />
				</div>
				<div class="space-y-0.5">
					<p class="font-bold text-sm">
						{resendBanner.type === 'confirmed'
							? 'Faktur Lunas Berhasil Dibuat Ulang'
							: 'Status Diperbarui: Menunggu Bukti Ulang'}
					</p>
					<p class="text-xs leading-relaxed opacity-90">
						{resendBanner.type === 'confirmed'
							? `Faktur PDF berstempel lunas telah diperbarui di sistem. Direkomendasikan untuk mengirim salinan terbaru ini ke email pembeli (${data.order.email}).`
							: `Batas waktu pembayaran diperpanjang 30 menit & PDF diperbarui. Direkomendasikan mengirim salinan instruksi ini ke email pembeli.`}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2 self-end sm:self-center shrink-0">
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
						class="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-semibold text-xs shadow-xs transition-colors {resendBanner.type === 'confirmed'
							? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400'
							: 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400'}"
					>
						<Send size={13} />
						<span>Kirim Email Sekarang</span>
					</button>
				</form>

				<button
					type="button"
					onclick={() => (resendBanner.show = false)}
					class="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
				>
					Abaikan
				</button>
			</div>
		</div>
	{/if}

	<!-- Accordion: Panel WhatsApp Buyer yang Lapang -->
	<div
		bind:this={waSectionEl}
		class="rounded-xl border border-neutral-200 bg-white transition-all dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden shadow-xs"
	>
		<button
			type="button"
			onclick={toggleWaAccordion}
			class="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
		>
			<div class="flex items-center gap-2.5">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
					<MessageSquare size={18} />
				</div>
				<div>
					<h2 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
						Kirim Pesan WhatsApp ke Buyer
					</h2>
					<p class="text-xs text-neutral-500">
						{data.order.handle} ({data.order.phone || 'Nomor HP tidak tercantum'})
					</p>
				</div>
			</div>
			<div class="flex items-center gap-1.5 text-xs text-neutral-500">
				<span>{waAccordionOpen ? 'Tutup Panel' : 'Buka Draf Pesan'}</span>
				{#if waAccordionOpen}
					<ChevronUp size={16} />
				{:else}
					<ChevronDown size={16} />
				{/if}
			</div>
		</button>

		{#if waAccordionOpen}
			<div class="border-t border-neutral-200 p-4 sm:p-5 space-y-4 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30">
				<div>
					<span class="block text-xs font-semibold uppercase text-neutral-500 tracking-wider">Pilih Template Pesan</span>
					<div class="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
						<button
							type="button"
							onclick={() => onSelectTemplate('verified')}
							class="rounded-lg border p-2.5 text-left transition-colors {selectedTemplate === 'verified' ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200' : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'}"
						>
							<div class="font-bold">Bukti Sah (Lunas)</div>
							<div class="text-[11px] opacity-75 mt-0.5">Konfirmasi lunas & link Shopee</div>
						</button>
						<button
							type="button"
							onclick={() => onSelectTemplate('unclear')}
							class="rounded-lg border p-2.5 text-left transition-colors {selectedTemplate === 'unclear' ? 'border-amber-600 bg-amber-50/60 font-semibold text-amber-900 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200' : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'}"
						>
							<div class="font-bold">Bukti Tidak Jelas</div>
							<div class="text-[11px] opacity-75 mt-0.5">Minta upload ulang foto transfer</div>
						</button>
						<button
							type="button"
							onclick={() => onSelectTemplate('ready')}
							class="rounded-lg border p-2.5 text-left transition-colors {selectedTemplate === 'ready' ? 'border-blue-600 bg-blue-50/60 font-semibold text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200' : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'}"
						>
							<div class="font-bold">Siap Diambil</div>
							<div class="text-[11px] opacity-75 mt-0.5">Pengambilan barang di booth</div>
						</button>
						<button
							type="button"
							onclick={() => onSelectTemplate('basic')}
							class="rounded-lg border p-2.5 text-left transition-colors {selectedTemplate === 'basic' ? 'border-neutral-900 bg-neutral-100 font-semibold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white' : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'}"
						>
							<div class="font-bold">Info Ringkas</div>
							<div class="text-[11px] opacity-75 mt-0.5">Tautan faktur invoice dasar</div>
						</button>
					</div>
				</div>

				<div>
					<label for="waMessageText" class="block text-xs font-semibold uppercase text-neutral-500 tracking-wider">
						Draf Pesan WhatsApp (Bisa Diubah Langsung)
					</label>
					<textarea
						id="waMessageText"
						rows="7"
						bind:value={customMessage}
						class="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white p-3 font-mono text-xs text-neutral-900 leading-relaxed placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
						placeholder="Ketik pesan yang ingin dikirimkan ke pembeli..."
					></textarea>
					<p class="mt-1 text-[11px] text-neutral-500">
						Teks di atas akan otomatis dimuat ke aplikasi WhatsApp saat Anda menekan tombol di bawah.
					</p>
				</div>

				<div class="flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-800">
					<button
						type="button"
						onclick={() => (waAccordionOpen = false)}
						class="rounded-lg border border-neutral-300 px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-white/10"
					>
						Tutup Panel
					</button>

					{#if waHref}
						<a
							href={waHref}
							target="_blank"
							rel="external noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400"
						>
							<span>Buka Chat WhatsApp</span>
							<ExternalLink size={14} />
						</a>
					{:else}
						<span class="rounded-lg bg-neutral-200 px-3.5 py-2 text-xs text-neutral-500 dark:bg-neutral-800">
							Nomor WhatsApp tidak valid
						</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<div class="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
		<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Aksi</h2>

		<div class="flex flex-wrap gap-2">
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
					class="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white
                 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
				>
					Generate ulang PDF
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
					class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
                 hover:bg-neutral-100 disabled:opacity-50
                 dark:border-neutral-700 dark:hover:bg-white/10"
				>
					Kirim ulang email
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
					class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
                 hover:bg-neutral-100 disabled:opacity-50
                 dark:border-neutral-700 dark:hover:bg-white/10"
				>
					Tandai terkirim (WA)
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
						class="rounded-lg border border-red-300 bg-red-50/70 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
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
	message={`Apakah Anda yakin ingin membatalkan pesanan #${data.order.orderId}? Status akan berubah menjadi Batal (Void) dan stok barang pesanan akan otomatis dikembalikan ke inventaris katalog toko.`}
	danger={true}
	confirmLabel="Ya, Batalkan Pesanan"
	cancelLabel="Tutup"
	onConfirm={executeCancelOrder}
	onCancel={() => (isCancelOrderModalOpen = false)}
/>
</BusyOverlay>
