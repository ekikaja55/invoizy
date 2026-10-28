<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { formatRupiah } from '$lib/utils/currency';
	import type { InvoiceData } from './index';
	import { UploadCloud } from '@lucide/svelte';

	interface Props extends InvoiceData {
		mode: 'web' | 'pdf';
		variant?: 'original' | 'client-experiment';
	}

	let { order, settings, mode, variant = 'original' }: Props = $props();

	const isPdf = $derived(mode === 'pdf');
	const isExperiment = $derived(mode === 'web' && variant === 'client-experiment');
	const shippingDiff = $derived(order.total - order.subtotal);

	const createdLabel = $derived(
		new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(order.createdAt)
		)
	);

	const payHref = $derived(
		order.accessToken
			? (`${resolve('/(public)/order/bayar/[orderId]', { orderId: order.orderId })}?token=${order.accessToken}&reupload=true` as ResolvedPathname)
			: null
	);
</script>

<!-- Invoice Document Container -->
<div
	class={isPdf
		? 'bg-white text-[#262626]'
		: isExperiment
			? 'relative rounded-xl border-2 border-[#262626] bg-white p-6 shadow-[5px_5px_0px_#262626] transition-all sm:p-10 dark:border-[#a2e1db] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[5px_5px_0px_#b4a6d5] print:border-[1.5px] print:border-[#262626] print:bg-white print:text-[#262626] print:shadow-none'
			: 'relative rounded-md border-[1.5px] border-[#262626] bg-white p-6 shadow-[3px_3px_0px_#262626] transition-all sm:p-10 dark:border-[#f2efe9]/30 dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[3px_3px_0px_#f2efe9] print:border-[1.5px] print:border-[#262626] print:bg-white print:text-[#262626] print:shadow-none'}
	style={isPdf ? 'width:794px;padding:48px;' : undefined}
>
	<div class="space-y-6">
		<!-- Header: Toko, Judul Faktur & Status Akuntansi -->
		<header
			class="flex flex-col gap-4 border-b-[1.5px] border-[#262626]/20 pb-6 sm:flex-row sm:items-start sm:justify-between dark:border-[#f2efe9]/20 print:border-[#262626]/20"
		>
			<div class="space-y-1.5">
				<div
					class={isExperiment
						? 'inline-block rounded-md border-2 border-[#262626] bg-[#a2e1db] px-3 py-1 font-mono text-xs font-black tracking-wider text-[#262626] uppercase shadow-[2px_2px_0px_#262626] dark:border-[#262626] dark:bg-[#a2e1db] dark:text-[#262626] print:border-[#262626] print:bg-[#f2efe9] print:text-[#262626]'
						: 'inline-block rounded-md border border-[#262626] bg-[#f2efe9] px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-[#262626] uppercase dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9] print:border-[#262626] print:bg-[#f2efe9] print:text-[#262626]'}
				>
					BUKTI TRANSAKSI
				</div>
				<h1
					class="font-serif text-2xl font-bold tracking-tight text-[#262626] sm:text-3xl dark:text-[#f2efe9] print:text-[#262626]"
				>
					{settings.storeName || 'cho.lazey - CHIBICONXI CATALOGUE'}
				</h1>
				<p class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad] print:text-[#404040]">
					Diterbitkan: {createdLabel}
				</p>
			</div>

			<!-- Order ID & Horizontal Status Pill -->
			<div class="flex flex-col items-start gap-2.5 sm:items-end">
				<div class="text-left sm:text-right">
					<span
						class="font-mono text-[11px] font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad] print:text-[#404040]"
					>
						NOMOR INVOICE
					</span>
					<p
						class="font-mono text-xl font-bold tracking-wider text-[#262626] sm:text-2xl dark:text-[#f2efe9] print:text-[#262626]"
					>
						#{order.orderId}
					</p>
				</div>

				<!-- Accounting Status Badge (Horizontal Monoline - Preserved Color Print) -->
				{#if order.paymentStatus === 'CONFIRMED'}
					<div
						class="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#065f46] bg-[#d1fae5] px-3.5 py-1 font-mono text-xs font-bold tracking-wider text-[#065f46] uppercase shadow-[1px_1px_0px_#065f46] print:shadow-none"
					>
						<span class="inline-block h-2 w-2 rounded-full bg-[#065f46]"></span>
						<span>LUNAS / PAID</span>
					</div>
				{:else if order.paymentStatus === 'WAITING_VERIFICATION'}
					<div
						class="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#3730a3] bg-[#e0e7ff] px-3.5 py-1 font-mono text-xs font-bold tracking-wider text-[#3730a3] uppercase shadow-[1px_1px_0px_#3730a3] print:shadow-none"
					>
						<span class="inline-block h-2 w-2 rounded-full bg-[#3730a3]"></span>
						<span>MENUNGGU VERIFIKASI</span>
					</div>
				{:else if order.paymentStatus === 'EXPIRED'}
					<div
						class="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#262626] bg-[#1a1825] px-3.5 py-1 font-mono text-xs font-bold tracking-wider text-white uppercase shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#1a1825] print:shadow-none"
					>
						<span class="inline-block h-2 w-2 rounded-full bg-white dark:bg-[#1a1825]"></span>
						<span>KEDALUARSA / EXPIRED</span>
					</div>
				{:else if order.paymentStatus === 'CANCELLED'}
					<div
						class="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#991b1b] bg-[#fee2e2] px-3.5 py-1 font-mono text-xs font-bold tracking-wider text-[#991b1b] uppercase shadow-[1px_1px_0px_#991b1b] print:shadow-none"
					>
						<span class="inline-block h-2 w-2 rounded-full bg-[#991b1b]"></span>
						<span>BATAL / VOID</span>
					</div>
				{:else}
					<div
						class="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#262626] bg-[#fea770] px-3.5 py-1 font-mono text-xs font-bold tracking-wider text-[#262626] uppercase shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] print:shadow-none"
					>
						<span class="inline-block h-2 w-2 rounded-full bg-[#262626]"></span>
						<span>MENUNGGU PEMBAYARAN</span>
					</div>
				{/if}
			</div>
		</header>

		<!-- Buyer Info Card (Data Pembeli & Pengiriman) -->
		<div
			class={isExperiment
				? 'rounded-lg border-2 border-[#262626] bg-[#fbf9f5] p-4 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-none print:border-[#262626] print:bg-[#fbf9f5] print:shadow-none'
				: 'rounded-md border-[1.5px] border-[#262626] bg-[#fbf9f5] p-4 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:shadow-none print:border-[#262626] print:bg-[#fbf9f5] print:shadow-none'}
		>
			<div
				class="flex items-center justify-between border-b border-[#262626]/15 pb-2 dark:border-[#f2efe9]/15 print:border-[#262626]/15"
			>
				<span
					class="font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:text-[#f2efe9] print:text-[#262626]"
				>
					Informasi Pemesan
				</span>
				<span class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad] print:text-[#404040]">
					{order.email}
				</span>
			</div>
			<div class="mt-2.5 space-y-1">
				<p
					class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9] print:text-[#262626]"
				>
					{order.handle}
					{#if order.phone}
						<span
							class="font-mono text-xs font-normal text-[#404040] dark:text-[#b8b5ad] print:text-[#404040]"
						>
							({order.phone})
						</span>
					{/if}
				</p>
				{#if order.shippingLabel}
					<p
						class="font-sans text-xs font-bold text-[#262626] dark:text-[#a2e1db] print:text-[#262626]"
					>
						Metode: {order.shippingLabel}
					</p>
				{/if}
				{#if order.address && order.address.trim() !== ''}
					<p
						class="font-sans text-xs leading-relaxed text-[#404040] sm:text-sm dark:text-[#b8b5ad] print:text-[#404040]"
					>
						{order.address}
					</p>
				{/if}
				{#if order.note}
					<p
						class={isExperiment
							? 'mt-2 rounded-md border-2 border-[#262626] bg-[#fea770]/25 px-3 py-1.5 font-sans text-xs font-semibold text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-none print:border print:border-[#262626]/20 print:bg-[#f2efe9] print:text-[#262626] print:shadow-none'
							: 'mt-2 rounded-md border border-[#262626]/20 bg-[#f2efe9] px-2.5 py-1 font-sans text-xs text-[#262626] dark:border-[#f2efe9]/20 dark:bg-[#252331] dark:text-[#f2efe9] print:border print:border-[#262626]/20 print:bg-[#f2efe9] print:text-[#262626]'}
					>
						<span class="font-bold">Catatan:</span>
						{order.note}
					</p>
				{/if}
			</div>
		</div>

		<!-- Perforated / Dashed Ticket Section: Daftar Barang -->
		<div class="space-y-0">
			<!-- Table Header -->
			<div
				class={isExperiment
					? 'flex items-center justify-between rounded-t-lg border-2 border-[#262626] bg-[#b4a6d5] px-4 py-2.5 font-mono text-xs font-black tracking-wider text-[#262626] uppercase dark:border-[#f2efe9] dark:bg-[#b4a6d5] dark:text-[#1a1825] print:border-[#262626] print:bg-[#f2efe9] print:text-[#262626]'
					: 'flex items-center justify-between rounded-t-md border-x-[1.5px] border-t-[1.5px] border-b-[1.5px] border-[#262626] bg-[#f2efe9] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9] print:border-[#262626] print:bg-[#f2efe9] print:text-[#262626]'}
			>
				<span>Item & Spesifikasi</span>
				<span class="text-right">Subtotal</span>
			</div>

			<!-- Item List -->
			<ul
				class={isExperiment
					? 'divide-y-2 divide-[#262626]/20 overflow-hidden rounded-b-lg border-x-2 border-b-2 border-[#262626] bg-white dark:divide-[#f2efe9]/20 dark:border-[#f2efe9] dark:bg-[#252331] print:divide-[#262626]/15 print:border-[#262626] print:bg-white'
					: 'divide-y divide-[#262626]/15 overflow-hidden rounded-b-md border-x-[1.5px] border-b-[1.5px] border-[#262626] bg-white dark:divide-[#f2efe9]/15 dark:border-[#f2efe9]/30 dark:bg-[#252331] print:divide-[#262626]/15 print:border-[#262626] print:bg-white'}
			>
				{#each order.items as item, idx (item.id ?? idx)}
					<li
						class="flex items-start justify-between gap-4 p-3.5 text-sm transition-colors print:bg-white print:hover:bg-transparent {isExperiment
							? idx % 2 === 1
								? 'bg-[#a2e1db]/15 hover:bg-[#a2e1db]/35 dark:bg-[#1a2e2b]/30 dark:hover:bg-[#283835]'
								: 'bg-white hover:bg-[#b4a6d5]/25 dark:bg-[#252331] dark:hover:bg-[#b4a6d5]/25'
							: 'hover:bg-[#f2efe9]/40 dark:hover:bg-[#1a1825]/40'}"
					>
						<div class="space-y-0.5">
							<p
								class="font-serif font-bold text-[#262626] dark:text-[#f2efe9] print:text-[#262626]"
							>
								{item.nameSnapshot}
								{#if item.variantNameSnapshot}
									<span
										class="font-mono text-xs font-semibold text-[#404040] dark:text-[#b4a6d5] print:text-[#404040]"
									>
										({item.variantNameSnapshot})
									</span>
								{/if}
							</p>
							<p class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad] print:text-[#404040]">
								{item.categorySnapshot} · {item.qty} × {formatRupiah(item.priceSnapshot)}
							</p>
						</div>
						<p
							class="shrink-0 font-mono text-sm font-bold text-[#262626] sm:text-base dark:text-[#f2efe9] print:text-[#262626]"
						>
							{formatRupiah(item.subtotal)}
						</p>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Perhitungan Total & Biaya -->
		<div
			class="space-y-1.5 border-t-[1.5px] border-dashed border-[#262626]/30 pt-3 dark:border-[#f2efe9]/30 print:border-[#262626]/30"
		>
			<div
				class="flex items-center justify-between px-2 font-mono text-xs text-[#404040] sm:text-sm dark:text-[#b8b5ad] print:text-[#404040]"
			>
				<span>Subtotal Produk</span>
				<span class="font-bold text-[#262626] dark:text-[#f2efe9] print:text-[#262626]"
					>{formatRupiah(order.subtotal)}</span
				>
			</div>

			{#if (order.discountTotal ?? 0) > 0}
				<div
					class="flex items-center justify-between px-2 font-mono text-xs text-[#991b1b] sm:text-sm dark:text-red-400 print:text-[#991b1b]"
				>
					<span class="font-bold">Potongan Diskon Promo</span>
					<span class="font-bold">-{formatRupiah(order.discountTotal ?? 0)}</span>
				</div>
			{/if}

			{#if order.shippingLabel}
				<div
					class="flex items-center justify-between px-2 font-mono text-xs text-[#404040] sm:text-sm dark:text-[#b8b5ad] print:text-[#404040]"
				>
					<span>
						Metode Pengiriman · <span
							class="font-semibold text-[#262626] dark:text-[#f2efe9] print:text-[#262626]"
							>{order.shippingLabel}</span
						>
					</span>
					<span class="font-bold text-[#065f46] dark:text-[#34d399] print:text-[#065f46]"
						>{shippingDiff > 0 ? formatRupiah(shippingDiff) : 'Rp 0'}</span
					>
				</div>
			{:else if shippingDiff > 0}
				<div
					class="flex items-center justify-between px-2 font-mono text-xs text-[#404040] sm:text-sm dark:text-[#b8b5ad] print:text-[#404040]"
				>
					<span>Biaya Pengiriman</span>
					<span class="font-bold text-[#262626] dark:text-[#f2efe9] print:text-[#262626]"
						>{formatRupiah(shippingDiff)}</span
					>
				</div>
			{/if}

			<!-- Total Highlight Box (Accounting Double Monoline Rule) -->
			<div
				class={isExperiment
					? 'mt-4 flex items-center justify-between rounded-lg border-t-4 border-b-4 border-double border-[#262626] bg-[#fea770]/20 px-3 py-3.5 text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#fea770]/15 dark:text-[#f2efe9] print:border-[#262626] print:bg-transparent print:text-[#262626] print:shadow-none'
					: 'mt-3 flex items-center justify-between border-t-2 border-b-2 border-double border-[#262626] px-2 py-3 text-[#262626] dark:border-[#f2efe9] dark:text-[#f2efe9] print:border-[#262626] print:text-[#262626]'}
			>
				<span class="font-serif text-sm font-bold tracking-wider uppercase sm:text-base">
					TOTAL PEMBAYARAN
				</span>
				<span class="font-mono text-xl font-black tracking-wider sm:text-2xl">
					{formatRupiah(order.total)}
				</span>
			</div>
		</div>

		<!-- Shortcut Menuju Halaman Pembayaran (Hanya tampil di web saat status belum lunas) -->
		{#if mode === 'web' && order.paymentStatus === 'PENDING' && payHref}
			<div class="no-print pt-2">
				<a
					href={payHref}
					class="inline-flex w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-[#262626] bg-[#262626] px-5 py-3 font-sans text-sm font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#e0ded8]"
				>
					<UploadCloud size={18} strokeWidth={2.5} />
					<span>Buka Halaman Pembayaran & Unggah Bukti &rarr;</span>
				</a>
			</div>
		{/if}

		<!-- Footer Ucapan Terima Kasih -->
		<footer
			class="space-y-1.5 border-t border-[#262626]/20 pt-6 text-center dark:border-[#f2efe9]/20 print:border-[#262626]/20"
		>
			<p
				class="font-serif text-xl leading-snug font-bold text-[#262626] sm:text-2xl dark:text-[#f2efe9] print:text-[#262626]"
			>
				Thankyou for your order!
			</p>
			{#if settings.proofContact || settings.instagram}
				<p class="font-sans text-xs text-[#404040] dark:text-[#b8b5ad] print:text-[#404040]">
					Butuh bantuan seputar pesanan? Hubungi
					{#if settings.proofContact}
						<strong class="font-mono text-[#262626] dark:text-[#f2efe9] print:text-[#262626]"
							>{settings.proofContact}</strong
						>
					{/if}
					{#if settings.proofContact && settings.instagram}
						<span> / </span>
					{/if}
					{#if settings.instagram}
						<span
							>DM Instagram <strong
								class="font-mono text-[#262626] dark:text-[#f2efe9] print:text-[#262626]"
								>@{settings.instagram.replace(/^@/, '')}</strong
							></span
						>
					{/if}
				</p>
			{/if}
			<p
				class="font-mono text-[10px] tracking-widest text-[#404040] uppercase dark:text-[#b8b5ad] print:text-[#404040]"
			>
				Faktur elektronik ini dibuat otomatis oleh cho.lazey - CHIBICONXI CATALOGUE
			</p>
		</footer>
	</div>
</div>
