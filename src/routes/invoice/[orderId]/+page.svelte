<script lang="ts">
	import InvoiceDocument from '$lib/components/invoice/InvoiceDocument.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Invoice {data.order.orderId}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
	<InvoiceDocument
		order={data.order}
		settings={data.settings}
		paymentMethods={data.paymentMethods}
		qrisCodes={data.qrisCodes}
		mode="web"
	/>
</div>
