<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { formatRupiah } from '$lib/utils/currency';
	import { ArrowLeft } from '@lucide/svelte';
	import { invoiceStatusLabel, paymentStatusLabel } from '$lib/utils/status-label';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let isBusy = $state(false);

	// Query ditempel manual (token UUID aman-URL); path tetap via resolve().
	const invoiceHref = $derived(
		`${resolve('/invoice/[orderId]', { orderId: data.order.orderId })}?token=${data.order.accessToken}&from=admin` as ResolvedPathname
	);

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
			{#each data.order.items as item (item.nameSnapshot + item.qty + item.priceSnapshot)}
				<li class="flex items-center justify-between">
					<span>{item.nameSnapshot} <span class="text-neutral-500">× {item.qty}</span></span>
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
		</div>

		<form
			method="POST"
			action="?/setPayment"
			use:enhance={() => {
				isBusy = true;
				return async ({ result, update }) => {
					handleFormResult(result, {
						success: 'Status pembayaran diperbarui.',
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
				disabled={isBusy}
				class="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm
               disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
			>
				{#each ['PENDING', 'CONFIRMED', 'CANCELLED'] as s (s)}
					<option value={s} selected={data.order.paymentStatus === s}
						>{paymentStatusLabel(s)}</option
					>
				{/each}
			</select>
			<button
				type="submit"
				disabled={isBusy}
				class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
               hover:bg-neutral-100 disabled:opacity-50
               dark:border-neutral-700 dark:hover:bg-white/10"
			>
				Simpan
			</button>
		</form>
	</div>
</div>
