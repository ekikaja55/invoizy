<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { formatRupiah } from '$lib/utils/currency';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { ArrowLeft, MessageSquare } from '@lucide/svelte';
	import { invoiceStatusLabel, paymentStatusLabel } from '$lib/utils/status-label';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import { toast } from 'svelte-sonner';
	import { waLink } from '$lib/utils/contact';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let isBusy = $state(false);

	let waModalOpen = $state(false);
	let selectedTemplate = $state<'unpaid' | 'paid' | 'ready' | 'basic'>('unpaid');
	let customMessage = $state('');

	// Modal konfirmasi perubahan status bayar
	let pendingPaymentStatus = $state<string>('');
	$effect(() => {
		pendingPaymentStatus = data.order.paymentStatus;
	});
	let isConfirmPaymentModalOpen = $state(false);
	let paymentFormEl = $state<HTMLFormElement | null>(null);

	function openPaymentConfirm() {
		if (pendingPaymentStatus === data.order.paymentStatus) {
			toast.info('Status pembayaran tidak berubah.');
			return;
		}
		isConfirmPaymentModalOpen = true;
	}

	function executePaymentChange() {
		isConfirmPaymentModalOpen = false;
		if (paymentFormEl) {
			paymentFormEl.requestSubmit();
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
		unpaid: `Halo kak *${data.order.handle}*! Terima kasih sudah order fanmerch cho.lazey ✨\n\nPesanan:\n${itemsSummaryText}\nTotal: *${formatRupiah(data.order.total)}*\nStatus: *Menunggu Pembayaran*\n\nSilakan cek rekening transfer & selesaikan pembayaran melalui invoice berikut:\n${effectiveInvoiceUrl}\n\nTerima kasih banyak! 💕`,
		paid: `Halo kak *${data.order.handle}*! Terima kasih sudah pre-order fanmerch cho.lazey!! ✨\nPembayaran sebesar *${formatRupiah(data.order.total)}* atas nama @${data.order.handle} sudah kami terima ya! Terima kasih banyak 💕\n\nPesanan:\n${itemsSummaryText}\nTotal: *${formatRupiah(data.order.total)}*\nStatus: *Lunas*\n\n${
			data.order.shippingType === 'MAIL_ORDER'
				? `Mohon dibantu untuk checkout link pengirimannya di Shopee berikut ya kak:\n${shopeeLink}\n\n📦 Estimasi Paket Siap Dikirim: Pasca Event Pameran Chibiconxi\n(Konter ekspedisi aktif hari kerja Senin-Jumat)\n\nNanti Kakak akan diberitahukan kembali saat resi sudah keluar. See ya! ✨`
				: `Metode Pengambilan: *${data.order.shippingLabel}*\n\nSilakan tunjukkan ID Pesanan #${data.order.orderId} atau invoice ini ke penjaga booth saat mengambil barang:\n${effectiveInvoiceUrl}\n\nSampai jumpa di venue Chibiconxi! ✨`
		}`,
		ready: `Halo kak *${data.order.handle}*, pesanan #${data.order.orderId} kamu sudah siap diambil di booth!\n\nID Pesanan: #${data.order.orderId}\nDetail Invoice: ${effectiveInvoiceUrl}\n\nSampai jumpa di booth kami! ✨`,
		basic: `Halo kak *${data.order.handle}*, terkait pesanan #${data.order.orderId}.\nTautan invoice: ${effectiveInvoiceUrl}`
	});

	function openWaModal() {
		if (data.order.paymentStatus === 'CONFIRMED') {
			selectedTemplate = 'paid';
		} else {
			selectedTemplate = 'unpaid';
		}
		customMessage = templates[selectedTemplate];
		waModalOpen = true;
	}

	function onSelectTemplate(key: 'unpaid' | 'paid' | 'ready' | 'basic') {
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
			onclick={openWaModal}
			disabled={isBusy}
			class="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-neutral-900 px-4 py-2 text-sm font-medium text-white
             hover:bg-neutral-800 disabled:opacity-50 dark:border-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
		>
			<MessageSquare size={16} />
			Hubungi Buyer via WA
		</button>
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
					disabled={isBusy}
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
					disabled={isBusy}
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
					disabled={isBusy}
					title="Untuk invoice yang sudah dikirim manual via WA"
					class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
                 hover:bg-neutral-100 disabled:opacity-50
                 dark:border-neutral-700 dark:hover:bg-white/10"
				>
					Tandai terkirim (WA)
				</button>
			</form>
		</div>

		<form
			bind:this={paymentFormEl}
			method="POST"
			action="?/setPayment"
			use:enhance={() => {
				isBusy = true;
				return async ({ result, update }) => {
					handleFormResult(result, {
						success: 'Status pembayaran diperbarui & PDF otomatis dibuat ulang.',
						failure: 'Gagal mengubah status pembayaran.'
					});
					if (result.type === 'success') await update();
					isBusy = false;
				};
			}}
			class="flex items-center gap-2"
		>
			<label for="paymentStatus" class="text-sm text-neutral-500">Status bayar</label>
			<select
				id="paymentStatus"
				name="paymentStatus"
				bind:value={pendingPaymentStatus}
				disabled={isBusy}
				class="min-w-0 flex-1 truncate rounded-lg border border-neutral-300 bg-white py-2 pr-8 pl-3 text-sm
               disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
			>
				{#each ['PENDING', 'CONFIRMED', 'CANCELLED'] as s (s)}
					<option value={s}>{paymentStatusLabel(s)}</option>
				{/each}
			</select>
			<button
				type="button"
				onclick={openPaymentConfirm}
				disabled={isBusy || pendingPaymentStatus === data.order.paymentStatus}
				class="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white
               hover:bg-neutral-800 disabled:opacity-50
               dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
			>
				Simpan
			</button>
		</form>
	</div>
</div>

<Modal
	open={isConfirmPaymentModalOpen}
	title="Konfirmasi Perubahan Status Pembayaran"
	message="Ubah status pesanan #{data.order.orderId} menjadi {paymentStatusLabel(pendingPaymentStatus)}? Sistem akan otomatis memperbarui data dan membuat ulang stempel status di PDF invoice."
	confirmLabel="Ya, Perbarui"
	cancelLabel="Batal"
	onConfirm={executePaymentChange}
	onCancel={() => {
		pendingPaymentStatus = data.order.paymentStatus;
		isConfirmPaymentModalOpen = false;
	}}
/>

<Modal
	open={waModalOpen}
	title="Hubungi Buyer via WhatsApp"
	hideActions={true}
	onCancel={() => (waModalOpen = false)}
>
	<div class="mt-3 space-y-3">
		<div>
			<span class="block text-xs font-semibold uppercase text-neutral-500">Pilih Template Pesan</span>
			<div class="mt-2 grid grid-cols-2 gap-2 text-xs">
				<button
					type="button"
					onclick={() => onSelectTemplate('unpaid')}
					class="rounded-lg border p-2 text-left font-medium transition-colors {selectedTemplate === 'unpaid' ? 'border-neutral-900 bg-neutral-100 font-semibold dark:border-white dark:bg-neutral-800' : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900'}"
				>
					Tagihan Belum Bayar
				</button>
				<button
					type="button"
					onclick={() => onSelectTemplate('paid')}
					class="rounded-lg border p-2 text-left font-medium transition-colors {selectedTemplate === 'paid' ? 'border-neutral-900 bg-neutral-100 font-semibold dark:border-white dark:bg-neutral-800' : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900'}"
				>
					Konfirmasi Lunas
				</button>
				<button
					type="button"
					onclick={() => onSelectTemplate('ready')}
					class="rounded-lg border p-2 text-left font-medium transition-colors {selectedTemplate === 'ready' ? 'border-neutral-900 bg-neutral-100 font-semibold dark:border-white dark:bg-neutral-800' : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900'}"
				>
					Pesanan Siap Diambil
				</button>
				<button
					type="button"
					onclick={() => onSelectTemplate('basic')}
					class="rounded-lg border p-2 text-left font-medium transition-colors {selectedTemplate === 'basic' ? 'border-neutral-900 bg-neutral-100 font-semibold dark:border-white dark:bg-neutral-800' : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900'}"
				>
					Info Ringkas / Dasar
				</button>
			</div>
		</div>

		<div>
			<label for="waMessageText" class="block text-xs font-semibold uppercase text-neutral-500">
				Draf Pesan (Bisa diedit)
			</label>
			<textarea
				id="waMessageText"
				rows="6"
				bind:value={customMessage}
				class="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
			></textarea>
			<p class="mt-1 text-[11px] text-neutral-500">
				Teks ini akan otomatis dimuat ke WhatsApp. Anda tetap bisa mengedit atau menambah teks di WhatsApp sebelum mengirim.
			</p>
		</div>

		<div class="mt-4 flex justify-end gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
			<button
				type="button"
				onclick={() => (waModalOpen = false)}
				class="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
			>
				Batal
			</button>
			{#if waHref}
				<a
					href={waHref}
					target="_blank"
					rel="external noopener noreferrer"
					onclick={() => (waModalOpen = false)}
					class="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400"
				>
					Buka WhatsApp
				</a>
			{:else}
				<span class="rounded-lg bg-neutral-200 px-3 py-1.5 text-xs text-neutral-500 dark:bg-neutral-800">
					Nomor HP tidak valid
				</span>
			{/if}
		</div>
	</div>
</Modal>
</BusyOverlay>
