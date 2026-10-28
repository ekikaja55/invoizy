<script lang="ts">
	import InvoiceDocument from '$lib/components/invoice/InvoiceDocument.svelte';
	import { resolve } from '$app/paths';
	import { ArrowLeft, Printer, Download } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Tombol Kembali sadar konteks: dari admin → detail order, dari buyer → riwayat.
	// `from` hanya petunjuk UI — gerbang akses tetap access_token.
	const backHref = $derived(
		data.from === 'admin'
			? resolve('/admin/orders/[id]', { id: data.order.orderId })
			: resolve('/order/riwayat')
	);

	const pdfDownloadHref = $derived(
		data.order.accessToken
			? `${resolve('/invoice/[orderId]/pdf', { orderId: data.order.orderId })}?token=${data.order.accessToken}`
			: null
	);

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title
		>Invoice #{data.order.orderId} — {data.settings.storeName ||
			'cho.lazey - CHIBICONXI CATALOGUE'}</title
	>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div
	class="drafting-grid min-h-screen bg-[#f2efe9] px-4 py-6 pb-20 font-sans text-[#262626] transition-colors selection:bg-[#fea770] selection:text-[#262626] dark:bg-[#1a1825] dark:text-[#f2efe9] print:bg-white print:p-0 print:text-black"
>
	<!-- Top Action Navigation Bar: Warm Monoline Editorial -->
	<div
		class="no-print mx-auto flex max-w-3xl items-center justify-between gap-3 pt-2 pb-6 print:hidden"
	>
		<a
			href={backHref}
			class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
		>
			<ArrowLeft size={14} strokeWidth={2.5} />
			<span>Kembali</span>
		</a>

		<div class="flex items-center gap-2.5">
			<button
				type="button"
				onclick={handlePrint}
				class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#f2efe9] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
			>
				<Printer size={14} strokeWidth={2.5} />
				<span>Cetak Faktur</span>
			</button>

			{#if pdfDownloadHref}
				<a
					href={pdfDownloadHref}
					download={`invoice-${data.order.orderId}.pdf`}
					rel="external"
					class="group relative inline-flex items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#262626] px-3.5 py-1.5 font-mono text-xs font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9]"
				>
					<span
						class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
					>
						<Download size={14} strokeWidth={2.5} />
						<span>Unduh PDF</span>
					</span>
					<span
						class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-1.5 transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						<Download size={14} strokeWidth={2.5} />
						<span>Unduh PDF</span>
					</span>
				</a>
			{/if}
		</div>
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
