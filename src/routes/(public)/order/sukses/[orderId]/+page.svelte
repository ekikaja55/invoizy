<script lang="ts">
	import { cart } from '$lib/stores/cart.svelte';
	import { untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { waLink } from '$lib/utils/contact';
	import {
		ExternalLink,
		FileText,
		ArrowLeft,
		MessageCircle
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Query ditempel manual (token UUID aman-URL); path tetap via resolve().
	const invoiceHref = $derived(
		data.token
			? (`${resolve('/invoice/[orderId]', { orderId: data.orderId })}?token=${data.token}` as ResolvedPathname)
			: null
	);

	// Order sukses dibuat → kosongkan keranjang (sekali, saat halaman dimuat).
	$effect(() => {
		untrack(() => cart.clear());
	});

	// Pesan WA menyertakan link invoice absolut (di-encode di dalam waLink).
	// URL absolut hanya ada di browser — SSR pakai teks tanpa link.
	const waHref = $derived.by(() => {
		if (!data.contact) return null;
		let text = data.isReupload
			? `Halo Kak! Saya sudah mengunggah ulang bukti pembayaran untuk pesanan #${data.orderId}. Mohon bantuannya untuk diverifikasi ya kak. Terima kasih!`
			: `Halo Kak! Saya sudah menyelesaikan pesanan #${data.orderId} dan mengunggah bukti pembayaran. Mohon bantuannya untuk diverifikasi ya. Terima kasih!`;
		if (browser && invoiceHref) {
			const absolute = new URL(invoiceHref, window.location.origin).href;
			text = data.isReupload
				? `Halo Kak! Saya sudah mengunggah ulang bukti pembayaran untuk pesanan #${data.orderId}. Mohon bantuannya untuk diverifikasi ya kak. Tautan faktur: ${absolute}`
				: `Halo Kak! Saya sudah menyelesaikan pesanan #${data.orderId} dan mengunggah bukti pembayaran. Mohon bantuannya untuk diverifikasi ya kak. Tautan faktur: ${absolute}`;
		}
		return waLink(data.contact, text);
	});
</script>

<div class="mx-auto max-w-lg space-y-8 py-10 text-center">
	<!-- Rubber Stamp / Status Tag -->
	<div class="space-y-3">
		<div
			class="inline-block -rotate-2 rounded-[6px_2px_5px_1px] border-2 px-4 py-1.5 font-mono text-xs font-bold tracking-widest uppercase {data.isReupload
				? 'border-teal bg-teal/15 text-teal shadow-[2px_2px_0px_#14b8a6]'
				: 'border-forest bg-forest/15 text-forest shadow-[2px_2px_0px_#2b9348]'}"
		>
			{data.isReupload ? 'BUKTI PEMBAYARAN DIPERBARUI' : 'PESANAN BERHASIL DIBUAT'}
		</div>

		<h1
			class="font-serif text-3xl font-bold tracking-normal text-ink md:text-4xl dark:text-papaya"
		>
			{data.isReupload ? 'Bukti Transfer Berhasil Dikirim Ulang!' : 'Hore, Order Terkirim!'}
		</h1>
		<p class="font-handwriting text-2xl font-semibold leading-snug text-teal md:text-3xl dark:text-papaya/90">
			{data.isReupload
				? 'Terima kasih! Bukti transfer terbaru Anda telah kami terima dan masuk kembali ke antrean verifikasi admin.'
				: 'Terima kasih banyak sudah memesan di toko kami.'}
		</p>
	</div>

	<!-- Scrapbook Ticket Card -->
	<div
		class="relative space-y-5 rounded-[16px_8px_14px_6px] border-2 border-brandy bg-papaya/60 p-6 shadow-[6px_6px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[6px_6px_0px_rgba(255,236,209,0.2)]"
	>
		<!-- Ticket Header -->
		<div>
			<span class="font-mono text-xs font-bold text-brandy/70 dark:text-papaya/70">KODE PESANAN ANDA:</span>
			<div class="mt-2">
				<span
					class="inline-block rounded-[8px_3px_7px_2px] border-2 border-brandy bg-white px-5 py-2 font-mono text-3xl font-extrabold tracking-widest text-tangerine shadow-[3px_3px_0px_#78290f] dark:border-papaya/40 dark:bg-ink"
				>
					{data.orderId}
				</span>
			</div>
		</div>

		<div class="border-t-2 border-dashed border-brandy/20 pt-4 dark:border-papaya/20">
			{#if data.emailEnabled}
				<div class="space-y-1.5 text-xs text-ink/80 dark:text-papaya/80">
					<p class="leading-relaxed">
						Salinan invoice PDF otomatis dikirimkan ke
						{#if data.customerEmail}
							<strong class="font-semibold text-ink dark:text-papaya">{data.customerEmail}</strong>.
						{:else}
							alamat email Anda.
						{/if}
						Simpan kode pesanan di atas untuk mempermudah pengecekan status.
					</p>
					<p class="text-[11px] text-brandy/70 dark:text-papaya/60">
						<em>Belum menerima email dalam beberapa menit? Silakan periksa tab <strong>Promosi</strong> atau folder <strong>Spam</strong> Anda.</em>
					</p>
				</div>
			{:else}
				<p class="text-xs leading-relaxed text-ink/80 dark:text-papaya/80">
					Simpan kode pesanan di atas, lalu hubungi admin melalui WhatsApp untuk konfirmasi dan mendapatkan link invoice resmi Anda.
				</p>
			{/if}
		</div>

		<!-- Action Buttons -->
		<div class="space-y-2.5 pt-2">
			{#if waHref}
				<a
					href={waHref}
					target="_blank"
					rel="external"
					class="flex w-full items-center justify-center gap-2 rounded-[8px_3px_7px_2px] border-2 border-brandy bg-[#25D366] px-5 py-3 font-mono text-sm font-bold text-ink shadow-[3px_3px_0px_#78290f] transition-all hover:bg-[#20ba59] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
				>
					<MessageCircle size={18} strokeWidth={2.5} />
					<span>Hubungi Admin via WhatsApp</span>
				</a>
			{:else if data.contact}
				<p class="font-mono text-xs text-brandy/80 dark:text-papaya/80">
					Kontak Admin: {data.contact}
				</p>
			{/if}

			{#if invoiceHref}
				<a
					href={invoiceHref}
					class="flex w-full items-center justify-center gap-2 rounded-[8px_3px_7px_2px] border-2 border-brandy bg-tangerine px-5 py-3 font-mono text-sm font-bold text-white shadow-[3px_3px_0px_#78290f] transition-all hover:bg-[#e06d00] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
				>
					<FileText size={16} strokeWidth={2.5} />
					<span>Buka & Cetak Invoice</span>
					<ExternalLink size={14} strokeWidth={2.5} />
				</a>
			{/if}
		</div>

		<!-- Riwayat Link -->
		<p class="border-t border-dashed border-brandy/20 pt-3 font-mono text-[11px] text-brandy/70 dark:border-papaya/20 dark:text-papaya/60">
			Invoice ini juga otomatis diarsipkan di
			<a
				href={resolve('/(public)/order/riwayat')}
				class="font-bold underline hover:text-tangerine"
			>
				Riwayat Perangkat
			</a>
			ini.
		</p>
	</div>

	<!-- Back to catalog -->
	<div>
		<a
			href={resolve('/(public)/order')}
			class="inline-flex items-center gap-1.5 rounded-[8px_3px_7px_2px] border-2 border-brandy/40 bg-papaya px-4 py-2 font-mono text-xs font-bold text-brandy transition-all hover:border-brandy hover:bg-brandy/10 active:translate-y-0.5 dark:border-papaya/30 dark:bg-ink dark:text-papaya"
		>
			<ArrowLeft size={14} strokeWidth={2.5} />
			<span>Kembali ke Katalog</span>
		</a>
	</div>
</div>
