<script lang="ts">
	import { cart } from '$lib/stores/cart.svelte';
	import { untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { waLink } from '$lib/utils/contact';
	import { ExternalLink, FileText, ArrowLeft, MessageCircle } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Query ditempel manual (token UUID aman-URL); path tetap via resolve().
	const invoiceHref = $derived(
		data.token
			? (`${resolve('/invoice/[orderId]', { orderId: data.orderId })}?token=${data.token}` as ResolvedPathname)
			: null
	);

	// Order sukses dibuat → kosongkan keranjang (sekali, saat halaman dimuat) & pastikan overflow scroll aktif.
	$effect(() => {
		untrack(() => cart.clear());
		if (browser) {
			document.body.style.overflow = '';
			document.documentElement.style.overflow = '';
		}
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
	<!-- Page Header: Warm Monoline Editorial -->
	<div class="space-y-3">
		<div
			class="inline-flex items-center gap-2 rounded-full border-2 border-[#262626] bg-[#a2e1db] px-4 py-1.5 font-mono text-xs font-bold tracking-widest text-[#262626] uppercase shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#a2e1db] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9]"
		>
			<span class="inline-block h-2 w-2 rounded-full border border-[#262626] bg-[#fea770]"></span>
			<span>{data.isReupload ? 'BUKTI PEMBAYARAN DIPERBARUI' : 'PESANAN BERHASIL DIBUAT'}</span>
		</div>

		<h1
			class="font-serif text-3xl font-black tracking-tight text-[#262626] md:text-4xl dark:text-[#f2efe9]"
		>
			{data.isReupload ? 'Bukti Transfer Berhasil Dikirim Ulang!' : 'Hore, Order Terkirim!'}
		</h1>
		<p class="font-mono text-xs text-[#404040] md:text-sm dark:text-[#b8b5ad]">
			{data.isReupload
				? 'Terima kasih! Bukti transfer terbaru Anda telah kami terima dan masuk kembali ke antrean verifikasi admin.'
				: 'Terima kasih banyak sudah memesan di toko kami.'}
		</p>
	</div>

	<!-- Scrapbook Ticket Card: Warm Monoline Editorial -->
	<div
		class="relative space-y-5 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-6 shadow-[5px_5px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[5px_5px_0px_#b4a6d5]"
	>
		<span
			class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
			aria-hidden="true">+</span
		>
		<!-- Ticket Header -->
		<div>
			<span
				class="font-mono text-xs font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad]"
				>KODE PESANAN ANDA:</span
			>
			<div class="mt-2.5">
				<span
					class="inline-block rounded-lg border-2 border-[#262626] bg-[#fea770] px-6 py-2.5 font-mono text-3xl font-black tracking-widest text-[#262626] shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]"
				>
					{data.orderId}
				</span>
			</div>
		</div>

		<div class="border-t-2 border-dashed border-[#262626]/15 pt-4 dark:border-[#f2efe9]/15">
			{#if data.emailEnabled}
				<div class="space-y-1.5 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
					<p class="leading-relaxed">
						Salinan invoice PDF otomatis dikirimkan ke
						{#if data.customerEmail}
							<strong class="font-bold text-[#262626] dark:text-[#f2efe9]"
								>{data.customerEmail}</strong
							>.
						{:else}
							alamat email Anda.
						{/if}
						Simpan kode pesanan di atas untuk mempermudah pengecekan status.
					</p>
					<p class="text-[11px] text-[#404040]/70 dark:text-[#b8b5ad]/70">
						<em
							>Belum menerima email dalam beberapa menit? Silakan periksa tab <strong
								>Promosi</strong
							>
							atau folder <strong>Spam</strong> Anda.</em
						>
					</p>
				</div>
			{:else}
				<p class="font-mono text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
					Simpan kode pesanan di atas, lalu hubungi admin melalui WhatsApp untuk konfirmasi dan
					mendapatkan link invoice resmi Anda.
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
					class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#262626] bg-[#a2e1db] px-5 py-3 font-mono text-sm font-bold text-[#262626] shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#86d4cc] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#a2e1db] dark:text-[#262626]"
				>
					<MessageCircle size={18} strokeWidth={2.5} />
					<span>Hubungi Admin via WhatsApp</span>
				</a>
			{:else if data.contact}
				<p class="font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
					Kontak Admin: {data.contact}
				</p>
			{/if}

			{#if invoiceHref}
				<a
					href={invoiceHref}
					class="group relative flex w-full items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#fea770] py-3 font-mono text-sm font-bold text-[#262626] shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[3px_3px_0px_#b4a6d5]"
				>
					<span
						class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
					>
						<FileText size={16} strokeWidth={2.5} />
						<span>Buka & Cetak Invoice</span>
						<ExternalLink size={14} strokeWidth={2.5} />
					</span>
					<span
						class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-2 transition-transform duration-300 ease-out group-hover:translate-y-0"
						aria-hidden="true"
					>
						<FileText size={16} strokeWidth={2.5} />
						<span>Buka & Cetak Invoice</span>
						<ExternalLink size={14} strokeWidth={2.5} />
					</span>
				</a>
			{/if}
		</div>

		<!-- Riwayat Link -->
		<p
			class="border-t border-dashed border-[#262626]/15 pt-3 font-mono text-[11px] text-[#404040]/80 dark:border-[#f2efe9]/15 dark:text-[#b8b5ad]/80"
		>
			Invoice ini juga otomatis diarsipkan di
			<a
				href={resolve('/(public)/order/riwayat')}
				class="font-bold underline decoration-2 underline-offset-2 hover:text-[#fea770]"
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
			class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
		>
			<ArrowLeft size={14} strokeWidth={2.5} />
			<span>Kembali ke Katalog</span>
		</a>
	</div>
</div>
