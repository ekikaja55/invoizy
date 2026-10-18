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

<!-- NEO-BRUTALIST sample searah versi PDF: kertas putih paksa (fidelitas cetak),
     border hitam tebal, hard shadow. Tanpa dark: — dokumen = artefak cetak. -->
<div class="bg-white text-neutral-900" style={isPdf ? 'width:794px;padding:48px;' : undefined}>
	<div class={isPdf ? '' : 'mx-auto max-w-3xl px-4 py-8'}>
		<!-- Header band full-bleed -->
		<div class="-mx-4 border-y-4 border-black bg-yellow-400 px-4 py-6">
			<p class="text-xs font-bold tracking-widest uppercase">{settings.storeName || 'Invoizy Store'}</p>
			<h1 class="mt-1 text-3xl font-black tracking-tight">INVOICE {order.orderId}</h1>
			<p class="mt-1 text-sm font-medium">{createdLabel}</p>
		</div>

		<!-- Buyer card -->
		<div class="mt-6 border-2 border-black bg-white p-4 shadow-[4px_4px_0_#000]">
			<p class="text-sm">
				<span class="font-bold">{order.handle}</span>
				<span class="text-neutral-500"> · {order.email}</span>
			</p>
			{#if order.phone}
				<p class="mt-1 text-sm text-neutral-500">{order.phone}</p>
			{/if}
			{#if order.address}
				<p class="mt-1 text-sm text-neutral-500">{order.address}</p>
			{/if}
			{#if order.note}
				<p class="mt-1 text-sm text-neutral-500">Catatan: {order.note}</p>
			{/if}
		</div>

		<!-- Items -->
		<div class="mt-6 border-2 border-black bg-black px-4 py-2 text-sm font-bold tracking-wide text-white uppercase">
			<div class="flex items-center justify-between">
				<span>Item</span>
				<span>Total</span>
			</div>
		</div>
		<ul class="divide-y-2 divide-black border-2 border-t-0 border-black">
			{#each order.items as item, idx (item.id ?? idx)}
				<li class="flex items-start justify-between gap-4 bg-white p-3 text-sm">
					<div>
						<p class="font-bold">
							{item.nameSnapshot}
							{#if item.variantNameSnapshot}
								<span class="font-normal text-neutral-600">({item.variantNameSnapshot})</span>
							{/if}
						</p>
						<p class="text-xs text-neutral-500">
							{item.categorySnapshot} · {item.qty} × {formatRupiah(item.priceSnapshot)}
						</p>
					</div>
					<p class="shrink-0 font-bold">{formatRupiah(item.subtotal)}</p>
				</li>
			{/each}
		</ul>

		<!-- Total -->
		<div class="mt-4 space-y-1 text-sm">
			<div class="flex justify-between">
				<span class="text-neutral-500">Subtotal</span>
				<span class="font-bold">{formatRupiah(order.subtotal)}</span>
			</div>
			{#if shippingDiff > 0}
				<div class="flex justify-between gap-4">
					<span class="text-neutral-500">
						Ongkir{#if order.shippingLabel}
							· {order.shippingLabel}{/if}
					</span>
					<span class="shrink-0 font-bold">{formatRupiah(shippingDiff)}</span>
				</div>
			{/if}
			<div
				class="mt-2 flex items-center justify-between border-2 border-black bg-black px-3 py-2 text-base font-black text-white"
			>
				<span>TOTAL</span>
				<span>{formatRupiah(order.total)}</span>
			</div>
		</div>

		<!-- Pembayaran -->
		<div class="mt-6">
			<h2 class="text-sm font-black tracking-widest uppercase">Pembayaran</h2>

			{#if paymentMethods.length === 0 && qrisCodes.length === 0}
				<p class="mt-2 border-2 border-black bg-white p-3 text-sm">
					Info pembayaran belum diatur toko. Tunggu konfirmasi admin.
				</p>
			{/if}

			{#if paymentMethods.length > 0}
				<ul class="mt-3 space-y-3">
					{#each paymentMethods as m (m.label + m.accountNumber)}
						<li class="border-2 border-black bg-white p-3 text-sm shadow-[4px_4px_0_#000]">
							<p class="font-bold">{m.label}</p>
							<p class="mt-0.5 font-mono text-lg font-black">{m.accountNumber}</p>
							<p class="text-xs text-neutral-500">a.n. {m.accountHolder}</p>
							{#if m.note}
								<p class="mt-1 text-xs text-neutral-500">{m.note}</p>
							{/if}
							{#if !isPdf}
								<button
									onclick={() => copyText(m.accountNumber)}
									class="mt-2 border-2 border-black bg-yellow-400 px-3 py-1 text-xs font-bold hover:bg-yellow-300"
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
						<figure class="border-2 border-black bg-white p-3 shadow-[4px_4px_0_#000]">
							<figcaption class="text-sm font-bold">{q.label}</figcaption>
							<img
								src={q.imageUrl}
								alt={q.label}
								width="240"
								height="240"
								class="mt-2 h-auto w-60 border-2 border-black"
							/>
						</figure>
					{/each}
				</div>
			{/if}

			{#if settings.paymentNote}
				<p class="mt-3 text-sm text-neutral-500">{settings.paymentNote}</p>
			{/if}

			{#if settings.proofContact}
				<div class="mt-3 border-2 border-black bg-black p-3 text-sm text-white">
					<p class="font-bold">Sudah transfer? Kirim bukti ke {settings.proofContact}</p>
					{#if settings.instagram}
						<p class="mt-1 text-xs text-yellow-400">atau DM {settings.instagram}</p>
					{/if}
				</div>
			{/if}
		</div>

		<p class="mt-6 text-center text-xs text-neutral-500">
			Dibuat otomatis oleh {settings.storeName || 'Invoizy Store'}
		</p>
	</div>
</div>
