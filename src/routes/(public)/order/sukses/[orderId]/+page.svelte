<script lang="ts">
	import { cart } from '$lib/stores/cart.svelte';
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { FILE_PREFIX } from '$lib/constants';
	import { downloadFile } from '$lib/utils/download';
	import { waLink } from '$lib/utils/contact';
	import { toast } from 'svelte-sonner';
	import { CheckCircle2 } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Query ditempel manual (token UUID aman-URL); path tetap via resolve().
	const invoiceHref = $derived(
		data.token
			? (`${resolve('/invoice/[orderId]', { orderId: data.orderId })}?token=${data.token}` as ResolvedPathname)
			: null
	);

	// Order sukses dibuat → kosongkan keranjang (sekali, saat halaman dimuat).
	$effect(() => {
		untrack(() => cart.clear());
	});

	let downloading = $state(false);

	// PDF sudah jadi saat halaman ini tampil (dibuat sinkron waktu submit).
	const pdfHref = $derived(
		data.token
			? (`${resolve('/invoice/[orderId]/pdf', { orderId: data.orderId })}?token=${data.token}` as ResolvedPathname)
			: null
	);

	async function doDownload() {
		if (!pdfHref) return;
		downloading = true;
		try {
			await downloadFile(pdfHref, `${FILE_PREFIX}-invoice-${data.orderId}.pdf`);
			toast.success('Invoice terunduh.');
		} catch {
			toast.error('PDF belum siap. Buka lewat link invoice atau hubungi admin.');
		} finally {
			downloading = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center py-16 text-center">
	<CheckCircle2 size={48} class="text-green-600 dark:text-green-400" />
	<h1 class="mt-4 text-2xl font-semibold">Pesanan berhasil dibuat!</h1>
	<p class="mt-2 text-sm text-neutral-500">
		ID pesanan kamu:
		<span class="font-mono font-semibold text-neutral-900 dark:text-neutral-100"
			>{data.orderId}</span
		>
	</p>
	{#if data.emailEnabled}
		<p class="mt-1 text-sm text-neutral-500">
			Invoice akan dikirim ke email kamu. Simpan ID pesanan untuk memudahkan konfirmasi.
		</p>
	{:else}
		<p class="mt-2 text-sm text-neutral-500">
			Simpan ID pesanan ini, lalu hubungi admin via tombol di bawah untuk menerima link invoice
			kamu.
		</p>
	{/if}
	{#if data.contact}
		{@const wa = waLink(data.contact, `Halo, saya order ${data.orderId}, minta link invoice.`)}
		{#if wa}
			<a
				href={wa}
				target="_blank"
				rel="external"
				class="mt-4 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white
               hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
			>
				Hubungi Admin via WA
			</a>
		{:else}
			<p class="mt-4 text-sm text-neutral-500">Hubungi admin: {data.contact}</p>
		{/if}
	{/if}
	{#if invoiceHref}
		<a
			href={invoiceHref}
			class="mt-4 rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium
             hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
		>
			Lihat Invoice
		</a>
	{/if}
	{#if pdfHref}
		<p class="mt-4 text-sm font-medium">Simpan buktinya — unduh invoice-nya sekarang.</p>
		<button
			onclick={doDownload}
			disabled={downloading}
			class="mt-2 rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium
             hover:bg-neutral-100 disabled:opacity-50
             dark:border-neutral-700 dark:hover:bg-white/10"
		>
			{downloading ? 'Mengunduh...' : 'Unduh Invoice (PDF)'}
		</button>
	{/if}
	<p class="mt-3 text-xs text-neutral-500">
		Invoice ini juga tersimpan di
		<a
			href={resolve('/order/riwayat')}
			class="underline hover:text-neutral-800 dark:hover:text-neutral-200"
		>
			Riwayat
		</a>
		perangkat ini.
	</p>
	<a
		href={resolve('/order')}
		class="mt-6 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white
           hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
	>
		Kembali ke Order
	</a>
</div>
