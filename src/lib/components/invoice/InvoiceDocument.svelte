<script lang="ts">
	import { formatRupiah } from '$lib/utils/currency';
	import type { InvoiceData } from './index';

	interface Props extends InvoiceData {
		mode: 'web' | 'pdf';
	}

	let { order, settings, paymentMethods, qrisCodes, mode }: Props = $props();

	const isPdf = $derived(mode === 'pdf');

	const shippingDiff = $derived(order.total - order.subtotal);

	const createdLabel = $derived(
		new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(order.createdAt)
		)
	);

	async function copyText(text: string) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// clipboard tidak tersedia (http/non-secure) — abaikan diam-diam
		}
	}
</script>

<div class="bg-white text-neutral-900" style={isPdf ? 'width:794px;padding:48px;' : undefined}>
	<div class={isPdf ? '' : 'mx-auto max-w-3xl px-4 py-8'}>
		<!-- Kop -->
		<div class="border-b border-neutral-200 pb-4">
			<p class="text-sm text-neutral-500">{settings.storeName || 'Invoizy Store'}</p>
			<h1 class="mt-1 text-2xl font-bold">Invoice {order.orderId}</h1>
			<p class="mt-1 text-sm text-neutral-500">{createdLabel}</p>
			<p class="mt-2 text-sm">
				<span class="font-medium">{order.handle}</span>
				<span class="text-neutral-500"> · {order.email}</span>
			</p>
			{#if order.note}
				<p class="mt-1 text-sm text-neutral-500">Catatan: {order.note}</p>
			{/if}
		</div>

		<!-- Item (dari snapshot — tidak berubah walau produk diedit) -->
		<ul class="mt-4 space-y-2">
			{#each order.items as item (item.nameSnapshot + item.qty + item.priceSnapshot)}
				<li class="flex items-start justify-between gap-4 text-sm">
					<div>
						<p class="font-medium">{item.nameSnapshot}</p>
						<p class="text-xs text-neutral-500">
							{item.categorySnapshot} · {item.qty} × {formatRupiah(item.priceSnapshot)}
						</p>
					</div>
					<p class="shrink-0 font-medium">{formatRupiah(item.subtotal)}</p>
				</li>
			{/each}
		</ul>

		<!-- Total -->
		<div class="mt-4 space-y-1 border-t border-neutral-200 pt-3 text-sm">
			<div class="flex justify-between">
				<span class="text-neutral-500">Subtotal</span>
				<span>{formatRupiah(order.subtotal)}</span>
			</div>
			{#if shippingDiff > 0}
				<div class="flex justify-between gap-4">
					<span class="text-neutral-500">
						Ongkir{#if order.shippingLabel}
							· {order.shippingLabel}{/if}
					</span>
					<span class="shrink-0">{formatRupiah(shippingDiff)}</span>
				</div>
			{/if}
			<div class="flex justify-between text-base font-bold">
				<span>Total</span>
				<span>{formatRupiah(order.total)}</span>
			</div>
		</div>

		<!-- Pembayaran -->
		<div class="mt-6 border-t border-neutral-200 pt-4">
			<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Pembayaran</h2>

			{#if paymentMethods.length === 0 && qrisCodes.length === 0}
				<p class="mt-2 text-sm text-neutral-500">
					Info pembayaran belum diatur toko. Tunggu konfirmasi admin.
				</p>
			{/if}

			{#if paymentMethods.length > 0}
				<ul class="mt-3 space-y-3">
					{#each paymentMethods as m (m.label + m.accountNumber)}
						<li class="rounded-xl border border-neutral-200 p-3 text-sm">
							<p class="font-medium">{m.label}</p>
							<p class="mt-0.5 font-mono text-base font-semibold">{m.accountNumber}</p>
							<p class="text-xs text-neutral-500">a.n. {m.accountHolder}</p>
							{#if m.note}
								<p class="mt-1 text-xs text-neutral-500">{m.note}</p>
							{/if}
							{#if !isPdf}
								<button
									onclick={() => copyText(m.accountNumber)}
									class="mt-2 rounded-lg border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100"
								>
									Salin nomor
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			{#if qrisCodes.length > 0}
				<div class="mt-4 space-y-3">
					{#each qrisCodes as q (q.label + q.imageUrl)}
						<figure class="rounded-xl border border-neutral-200 p-3">
							<figcaption class="text-sm font-medium">{q.label}</figcaption>
							<img
								src={q.imageUrl}
								alt={q.label}
								width="240"
								height="240"
								class="mt-2 h-auto w-60 rounded-lg border border-neutral-100"
							/>
						</figure>
					{/each}
				</div>
			{/if}

			{#if settings.paymentNote}
				<p class="mt-3 text-sm text-neutral-500">{settings.paymentNote}</p>
			{/if}

			{#if settings.proofContact}
				<div
					class="mt-3 rounded-xl bg-neutral-900 p-3 text-sm text-white dark:bg-white dark:text-neutral-900"
				>
					<p class="font-medium">Sudah transfer? Kirim bukti ke {settings.proofContact}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
