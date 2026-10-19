<script lang="ts">
	import InvoiceDocument from '$lib/components/invoice/InvoiceDocument.svelte';
	import { resolve } from '$app/paths';
	import { ArrowLeft, Printer } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Tombol Kembali sadar konteks: dari admin → detail order, dari buyer → riwayat.
	// `from` hanya petunjuk UI — gerbang akses tetap access_token.
	const backHref = $derived(
		data.from === 'admin'
			? resolve('/admin/orders/[id]', { id: data.order.orderId })
			: resolve('/order/riwayat')
	);

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>Invoice #{data.order.orderId} — {data.settings.storeName || 'cho.lazey - CHIBICONXI CATALOGUE'}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-papaya text-ink transition-colors dark:bg-ink dark:text-papaya py-6 px-4 pb-20 print:p-0 print:bg-white print:text-black">
	<!-- Top Action Navigation Bar -->
	<div class="no-print mx-auto flex max-w-3xl items-center justify-between gap-3 pb-6 pt-2 print:hidden">
		<a
			href={backHref}
			class="inline-flex items-center gap-2 rounded-[8px_14px_6px_12px] border-2 border-brandy bg-white px-4 py-2 text-sm font-bold text-ink shadow-[3px_3px_0px_#78290f] transition-all hover:bg-papaya/40 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[3px_3px_0px_rgba(255,236,209,0.2)]"
		>
			<ArrowLeft size={16} strokeWidth={2.5} />
			<span>Kembali</span>
		</a>

		<button
			type="button"
			onclick={handlePrint}
			class="inline-flex items-center gap-2 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-tangerine px-5 py-2 text-sm font-bold text-white shadow-[3px_3px_0px_#78290f] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#78290f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
		>
			<Printer size={16} strokeWidth={2.5} />
			<span>Cetak / Simpan PDF</span>
		</button>
	</div>

	<!-- Main Document Canvas -->
	<main class="mx-auto max-w-3xl">
		<InvoiceDocument
			order={data.order}
			settings={data.settings}
			paymentMethods={data.paymentMethods}
			qrisCodes={data.qrisCodes}
			mode="web"
		/>
	</main>
</div>

<style>
	@media print {
		:global(body) {
			background-color: #ffffff !important;
			color: #000000 !important;
		}
		.no-print {
			display: none !important;
		}
	}
</style>
