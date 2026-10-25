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

<div class="drafting-grid min-h-screen bg-[#f2efe9] font-sans text-[#262626] transition-colors selection:bg-[#fea770] selection:text-[#262626] dark:bg-[#1a1825] dark:text-[#f2efe9] py-6 px-4 pb-20 print:p-0 print:bg-white print:text-black">
	<!-- Top Action Navigation Bar -->
	<div class="no-print mx-auto flex max-w-3xl items-center justify-between gap-3 pb-6 pt-2 print:hidden">
		<a
			href={backHref}
			class="inline-flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] bg-white px-4 py-2 font-sans text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#b4a6d5] dark:hover:text-[#1a1825]"
		>
			<ArrowLeft size={16} strokeWidth={2.5} />
			<span>Kembali</span>
		</a>

		<button
			type="button"
			onclick={handlePrint}
			class="inline-flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] bg-[#262626] px-4 py-2 font-sans text-xs font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#e0ded8]"
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
