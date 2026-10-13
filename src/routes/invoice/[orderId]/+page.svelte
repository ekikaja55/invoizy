<script lang="ts">
	import InvoiceDocument from '$lib/components/invoice/InvoiceDocument.svelte';
	import { resolve } from '$app/paths';
	import { FILE_PREFIX } from '$lib/constants';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft, Download } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let downloading = $state(false);

	// Tombol Kembali sadar konteks: dari admin → detail order, dari buyer → riwayat.
	// `from` hanya petunjuk UI — gerbang akses tetap access_token.
	const backHref = $derived(
		data.from === 'admin'
			? resolve('/admin/orders/[id]', { id: data.order.orderId })
			: resolve('/order/riwayat')
	);

	async function downloadPdf() {
		downloading = true;
		try {
			// Token ikut dari URL yang sedang dibuka — tanpa plumbing tambahan.
			const pdfUrl = `${window.location.pathname}/pdf${window.location.search}`;
			const res = await fetch(pdfUrl);
			const type = res.headers.get('content-type') ?? '';
			if (!res.ok || !type.includes('pdf')) throw new Error('not-a-pdf');

			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${FILE_PREFIX}-invoice-${data.order.orderId}.pdf`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			toast.success('Invoice terunduh.');
		} catch {
			toast.error('Gagal mengunduh otomatis. Dibuka di tab baru.');
			window.open(`${window.location.pathname}/pdf${window.location.search}`, '_blank');
		} finally {
			downloading = false;
		}
	}
</script>

<svelte:head>
	<title>Invoice {data.order.orderId}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
	<div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 pt-6">
		<a
			href={backHref}
			class="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
			       hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
		>
			<ArrowLeft size={16} />
			Kembali
		</a>
		<button
			onclick={downloadPdf}
			disabled={downloading}
			class="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white
			       disabled:opacity-50 dark:bg-white dark:text-neutral-900"
		>
			<Download size={16} />
			{downloading ? 'Mengunduh...' : 'Unduh PDF'}
		</button>
	</div>
	<InvoiceDocument
		order={data.order}
		settings={data.settings}
		paymentMethods={data.paymentMethods}
		qrisCodes={data.qrisCodes}
		mode="web"
	/>
</div>
