<script lang="ts">
	import { formatRupiah } from '$lib/utils/currency';
	import type { InvoiceData } from './index';
	import { Copy, Check } from '@lucide/svelte';

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

	let copiedAccount = $state<string | null>(null);

	async function copyText(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedAccount = text;
			setTimeout(() => {
				if (copiedAccount === text) copiedAccount = null;
			}, 2000);
		} catch {
			// Clipboard tidak tersedia pada lingkungan non-secure / browser terbatas
		}
	}
</script>

<!-- Invoice Document Container -->
<div
	class="{isPdf
		? 'bg-white text-[#001524]'
		: 'relative rounded-[16px_6px_14px_8px] border-2 border-brandy bg-papaya/95 p-6 sm:p-10 shadow-[6px_6px_0px_#78290f] transition-all dark:border-papaya/40 dark:bg-ink/95 dark:text-papaya dark:shadow-[6px_6px_0px_rgba(255,236,209,0.2)] print:border-2 print:border-black print:bg-white print:text-black print:shadow-none'}"
	style={isPdf ? 'width:794px;padding:48px;' : undefined}
>
	<!-- Decorative Washi Tape on Top Center (Web Mode Only) -->
	{#if !isPdf}
		<div
			class="pointer-events-none absolute -top-3.5 left-1/2 h-4 w-28 -translate-x-1/2 -rotate-1 border border-brandy/40 bg-yellow-100/90 shadow-[1px_1px_0px_rgba(120,41,15,0.25)] backdrop-blur-xs dark:bg-papaya/30 print:hidden"
		></div>
	{/if}

	<div class="space-y-6">
		<!-- Header: Toko, Judul Faktur & Stempel Karet -->
		<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b-2 border-dashed border-brandy/40 pb-6 dark:border-papaya/30 print:border-black">
			<div class="space-y-1.5">
				<div class="inline-block -rotate-1 rounded-[4px_2px_4px_2px] border border-brandy/40 bg-white/70 px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-brandy uppercase dark:border-papaya/30 dark:bg-ink dark:text-tangerine print:border-black print:bg-transparent">
					BUKTI TRANSAKSI
				</div>
				<h1 class="font-headline text-2xl sm:text-3xl font-extrabold text-ink dark:text-papaya print:text-black">
					{settings.storeName || 'cho.lazey - CHIBICONXI CATALOGUE'}
				</h1>
				<p class="font-mono text-xs text-brandy/80 dark:text-papaya/70 print:text-gray-700">
					Diterbitkan: {createdLabel}
				</p>
			</div>

			<!-- Order ID & Rubber Stamp -->
			<div class="flex flex-col items-start sm:items-end gap-2.5">
				<div class="text-left sm:text-right">
					<span class="font-mono text-[11px] font-bold text-brandy/70 uppercase tracking-wider dark:text-papaya/60 print:text-gray-600">
						NOMOR INVOICE
					</span>
					<p class="font-mono text-xl sm:text-2xl font-black tracking-wider text-tangerine print:text-black">
						#{order.orderId}
					</p>
				</div>

				<!-- Dynamic Rubber Stamp -->
				{#if order.paymentStatus === 'CONFIRMED'}
					<div
						class="inline-block -rotate-6 rounded-[8px_3px_7px_2px] border-[3px] border-double border-forest bg-forest/15 px-4 py-1.5 font-mono text-xs sm:text-sm font-black tracking-widest text-forest uppercase shadow-[2px_2px_0px_#2b9348] print:border-black print:text-black print:shadow-none"
					>
						★ LUNAS / PAID ★
					</div>
				{:else if order.paymentStatus === 'CANCELLED'}
					<div
						class="inline-block rotate-3 rounded-[8px_3px_7px_2px] border-[3px] border-dashed border-crimson bg-crimson/15 px-4 py-1.5 font-mono text-xs sm:text-sm font-black tracking-widest text-crimson uppercase shadow-[2px_2px_0px_#c1121f] print:border-black print:text-black print:shadow-none"
					>
						BATAL / VOID
					</div>
				{:else}
					<div
						class="inline-block rotate-2 rounded-[6px_2px_5px_1px] border-2 border-dashed border-brandy bg-tangerine/15 px-3.5 py-1.5 font-mono text-xs sm:text-sm font-bold tracking-widest text-brandy uppercase shadow-[2px_2px_0px_#78290f] dark:border-papaya/40 dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)] print:border-black print:text-black print:shadow-none"
					>
						MENUNGGU PEMBAYARAN
					</div>
				{/if}
			</div>
		</header>

		<!-- Buyer Info Card (Data Pembeli & Pengiriman) -->
		<div
			class="rounded-[12px_5px_10px_4px] border-2 border-brandy/40 bg-white/70 p-4.5 shadow-[2px_2px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[2px_2px_0px_rgba(255,236,209,0.15)] print:border-black print:bg-transparent print:shadow-none"
		>
			<div class="flex items-center justify-between border-b border-brandy/20 pb-2 dark:border-papaya/20 print:border-black">
				<span class="font-mono text-xs font-bold tracking-wider text-brandy uppercase dark:text-tangerine print:text-black">
					Tujuan Pengiriman
				</span>
				<span class="font-mono text-xs text-brandy/70 dark:text-papaya/70 print:text-gray-600">
					{order.email}
				</span>
			</div>
			<div class="mt-2.5 space-y-1">
				<p class="font-headline text-base font-bold text-ink dark:text-papaya print:text-black">
					{order.handle}
					{#if order.phone}
						<span class="font-mono text-xs font-normal text-brandy/80 dark:text-papaya/70 print:text-gray-600">
							({order.phone})
						</span>
					{/if}
				</p>
				{#if order.address}
					<p class="font-sans text-xs sm:text-sm text-brandy/90 dark:text-papaya/80 print:text-black leading-relaxed">
						{order.address}
					</p>
				{/if}
				{#if order.note}
					<p class="mt-2 rounded-md bg-papaya/50 px-2.5 py-1 font-sans text-xs text-brandy dark:bg-ink/70 dark:text-papaya/90 print:bg-transparent print:border print:border-gray-300">
						<span class="font-bold">Catatan:</span> {order.note}
					</p>
				{/if}
			</div>
		</div>

		<!-- Perforated / Dashed Ticket Section: Daftar Barang -->
		<div class="space-y-2">
			<!-- Table Header -->
			<div
				class="flex items-center justify-between rounded-[8px_3px_6px_2px] border-2 border-brandy bg-brandy px-4 py-2 font-mono text-xs font-bold tracking-widest text-papaya uppercase dark:border-papaya/40 dark:bg-papaya dark:text-ink print:border-black print:bg-black print:text-white"
			>
				<span>Item & Spesifikasi</span>
				<span class="text-right">Subtotal</span>
			</div>

			<!-- Item List -->
			<ul class="divide-y-2 divide-dashed divide-brandy/20 border-2 border-brandy/40 rounded-[10px_4px_8px_3px] bg-white/70 overflow-hidden dark:divide-papaya/20 dark:border-papaya/30 dark:bg-ink/60 print:border-black print:bg-transparent print:divide-black">
				{#each order.items as item, idx (item.id ?? idx)}
					<li class="flex items-start justify-between gap-4 p-3.5 text-sm transition-colors hover:bg-papaya/30 dark:hover:bg-ink/90 print:hover:bg-transparent">
						<div class="space-y-0.5">
							<p class="font-headline font-bold text-ink dark:text-papaya print:text-black">
								{item.nameSnapshot}
								{#if item.variantNameSnapshot}
									<span class="font-mono text-xs font-semibold text-teal dark:text-tangerine print:text-black">
										({item.variantNameSnapshot})
									</span>
								{/if}
							</p>
							<p class="font-mono text-xs text-brandy/70 dark:text-papaya/70 print:text-gray-600">
								{item.categorySnapshot} · {item.qty} × {formatRupiah(item.priceSnapshot)}
							</p>
						</div>
						<p class="shrink-0 font-mono text-sm sm:text-base font-bold text-ink dark:text-papaya print:text-black">
							{formatRupiah(item.subtotal)}
						</p>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Perhitungan Total & Biaya -->
		<div class="space-y-1.5 pt-2">
			<div class="flex items-center justify-between font-mono text-xs sm:text-sm text-brandy/80 dark:text-papaya/70 px-2 print:text-black">
				<span>Subtotal Produk</span>
				<span class="font-bold text-ink dark:text-papaya print:text-black">{formatRupiah(order.subtotal)}</span>
			</div>

			{#if shippingDiff > 0}
				<div class="flex items-center justify-between font-mono text-xs sm:text-sm text-brandy/80 dark:text-papaya/70 px-2 print:text-black">
					<span>
						Biaya Pengiriman{#if order.shippingLabel} · <span class="text-teal dark:text-tangerine font-semibold print:text-black">{order.shippingLabel}</span>{/if}
					</span>
					<span class="font-bold text-ink dark:text-papaya print:text-black">{formatRupiah(shippingDiff)}</span>
				</div>
			{/if}

			<!-- Total Highlight Box -->
			<div
				class="mt-3 flex items-center justify-between rounded-[10px_4px_8px_3px] border-2 border-brandy bg-tangerine px-4 py-3 text-white shadow-[3px_3px_0px_#78290f] print:border-black print:bg-transparent print:text-black print:shadow-none"
			>
				<span class="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase">
					TOTAL PEMBAYARAN
				</span>
				<span class="font-mono text-xl sm:text-2xl font-black tracking-wider">
					{formatRupiah(order.total)}
				</span>
			</div>
		</div>

		<!-- Bagian Instruksi Pembayaran (Hanya tampil jika belum lunas atau untuk verifikasi) -->
		<div class="pt-4 space-y-4 border-t-2 border-dashed border-brandy/40 dark:border-papaya/30 print:border-black">
			<div class="flex items-center gap-2">
				<h2
					class="inline-block -rotate-1 rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya px-3 py-1 font-mono text-xs font-bold tracking-widest text-brandy uppercase shadow-[2px_2px_0px_#78290f] dark:border-papaya/40 dark:bg-ink dark:text-papaya print:border-black print:bg-transparent print:text-black print:shadow-none"
				>
					Instruksi Pembayaran
				</h2>
			</div>

			{#if paymentMethods.length === 0 && qrisCodes.length === 0}
				<p class="rounded-[8px_3px_6px_2px] border-2 border-dashed border-brandy/40 bg-white/60 p-3.5 font-sans text-xs text-brandy/80 dark:border-papaya/30 dark:bg-ink/60 dark:text-papaya/70 print:border-black print:text-black">
					Informasi rekening atau QRIS belum diatur oleh toko. Silakan hubungi admin toko.
				</p>
			{/if}

			<!-- Bank & Rekening Transfer -->
			{#if paymentMethods.length > 0}
				<ul class="space-y-3">
					{#each paymentMethods as m (m.label + m.accountNumber)}
						<li
							class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-[12px_5px_10px_4px] border-2 border-brandy bg-white/80 p-4 shadow-[3px_3px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/80 dark:shadow-[3px_3px_0px_rgba(255,236,209,0.15)] print:border-black print:bg-transparent print:shadow-none"
						>
							<div class="space-y-0.5">
								<p class="font-headline text-sm font-bold text-ink dark:text-papaya print:text-black">
									{m.label}
								</p>
								<p class="font-mono text-lg sm:text-xl font-black tracking-wider text-teal dark:text-tangerine print:text-black">
									{m.accountNumber}
								</p>
								<p class="font-mono text-xs text-brandy/70 dark:text-papaya/70 print:text-gray-600">
									a.n. <strong class="text-ink dark:text-papaya print:text-black">{m.accountHolder}</strong>
									{#if m.note} · {m.note}{/if}
								</p>
							</div>

							{#if !isPdf}
								<button
									type="button"
									onclick={() => copyText(m.accountNumber)}
									class="inline-flex items-center justify-center gap-1.5 self-start sm:self-center rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya px-3 py-1.5 font-mono text-xs font-bold text-brandy shadow-[2px_2px_0px_#78290f] transition-all hover:bg-tangerine hover:text-white active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya print:hidden"
								>
									{#if copiedAccount === m.accountNumber}
										<Check size={14} class="text-forest" />
										<span>Tersalin!</span>
									{:else}
										<Copy size={14} />
										<span>Salin Nomor</span>
									{/if}
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			<!-- QRIS Codes -->
			{#if qrisCodes.length > 0}
				<div class="space-y-3">
					{#each qrisCodes as q (q.label + q.imageUrl)}
						<figure
							class="inline-block rounded-[12px_6px_10px_4px] border-2 border-brandy bg-white p-4 shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink print:border-black print:shadow-none"
						>
							<figcaption class="font-headline text-sm font-bold text-ink dark:text-papaya print:text-black">
								{q.label}
							</figcaption>
							<img
								src={q.imageUrl}
								alt={q.label}
								width="220"
								height="220"
								class="mt-2.5 h-auto w-52 rounded-md border-2 border-brandy dark:border-papaya/40 print:border-black"
							/>
						</figure>
					{/each}
				</div>
			{/if}

			<!-- Catatan Toko & Konfirmasi Pembayaran -->
			{#if settings.paymentNote}
				<p class="font-sans text-xs leading-relaxed text-brandy/90 dark:text-papaya/80 print:text-black">
					{settings.paymentNote}
				</p>
			{/if}

			{#if settings.proofContact}
				<div
					class="rounded-[10px_4px_8px_3px] border-2 border-brandy bg-tangerine/15 p-3.5 text-xs text-brandy dark:border-papaya/30 dark:bg-tangerine/20 dark:text-papaya print:border-black print:bg-transparent print:text-black"
				>
					<p class="font-serif font-bold text-ink dark:text-papaya print:text-black">
						Sudah melakukan pembayaran?
					</p>
					<p class="mt-0.5">
						Kirimkan bukti transfer Anda ke kontak: <strong class="font-mono text-teal dark:text-tangerine print:text-black">{settings.proofContact}</strong>
						{#if settings.instagram}
							<span> atau DM Instagram <strong>{settings.instagram}</strong></span>
						{/if}
					</p>
				</div>
			{/if}
		</div>

		<!-- Footer Ucapan Terima Kasih -->
		<footer class="pt-6 text-center space-y-1.5 border-t border-brandy/20 dark:border-papaya/20 print:border-black">
			<p class="font-handwriting text-2xl sm:text-3xl font-semibold leading-snug text-teal dark:text-papaya/90 print:text-black">
				Terima kasih banyak sudah memesan di {settings.storeName || 'toko kami'}!
			</p>
			<p class="font-mono text-[10px] text-brandy/60 dark:text-papaya/50 tracking-widest uppercase print:text-gray-500">
				Faktur elektronik ini dibuat otomatis oleh cho.lazey - CHIBICONXI CATALOGUE
			</p>
		</footer>
	</div>
</div>
