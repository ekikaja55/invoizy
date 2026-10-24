<script lang="ts">
	import { formatRupiah } from '$lib/utils/currency';

	interface Props {
		storeName: string;
		orderId: string;
		handle: string;
		total: number;
		invoiceUrl: string;
		proofContact: string;
		instagram: string;
		paymentStatus?: string;
		reuploadUrl?: string;
	}

	let {
		storeName,
		orderId,
		handle,
		total,
		invoiceUrl,
		proofContact,
		instagram,
		paymentStatus = 'WAITING_VERIFICATION',
		reuploadUrl = ''
	}: Props = $props();

	const isConfirmed = $derived(paymentStatus === 'CONFIRMED');
	const isPending = $derived(paymentStatus === 'PENDING');
</script>

<!-- Template email transaksional: layout tabel + SEMUA style inline
     (klien email mengabaikan <style> dan class). Tanpa JS/interaksi. -->
<div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">
	<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
		<p style="font-size:14px;color:#737373;margin:0;">{storeName}</p>

		{#if isConfirmed}
			<h1 style="font-size:22px;color:#047857;margin:8px 0 0;">Pembayaran Lunas #{orderId}</h1>
			<p style="font-size:14px;color:#404040;line-height:1.5;">
				Halo <strong>{handle}</strong>, kabar baik! Pembayaran kamu sebesar <strong>{formatRupiah(total)}</strong> untuk pesanan #{orderId} telah kami verifikasi dan dinyatakan sah. Terima kasih banyak sudah berbelanja di {storeName}!
			</p>
		{:else if isPending}
			<h1 style="font-size:22px;color:#b45309;margin:8px 0 0;">Unggah Ulang Bukti Transfer #{orderId}</h1>
			<p style="font-size:14px;color:#404040;line-height:1.5;">
				Halo <strong>{handle}</strong>, mohon maaf bukti pembayaran yang kamu kirimkan untuk pesanan #{orderId} belum dapat kami verifikasi karena foto tidak terbaca atau nominal transfer belum sesuai. Batas waktu pembayaran telah kami perpanjang 30 menit.
			</p>
		{:else}
			<h1 style="font-size:22px;margin:8px 0 0;">Faktur Pesanan #{orderId}</h1>
			<p style="font-size:14px;color:#404040;line-height:1.5;">
				Halo <strong>{handle}</strong>, terima kasih! Pesanan dan bukti pembayaran kamu telah kami terima dan masuk ke dalam antrean verifikasi oleh tim toko kami.
			</p>
		{/if}

		<div style="border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:16px 0;background:#fafafa;">
			<p style="font-size:13px;color:#737373;margin:0;">Total tagihan</p>
			<p style="font-size:24px;font-weight:bold;margin:4px 0 0;color:#171717;">{formatRupiah(total)}</p>
			<p style="font-size:12px;color:#737373;margin:6px 0 0;">
				Status saat ini: <strong style="color:{isConfirmed ? '#047857' : isPending ? '#b45309' : '#0284c7'};">{isConfirmed ? 'LUNAS' : isPending ? 'MENUNGGU BUKTI ULANG' : 'MENUNGGU VERIFIKASI'}</strong>
			</p>
		</div>

		{#if isPending && reuploadUrl}
			<p style="font-size:14px;color:#404040;line-height:1.5;">
				Silakan buka tautan berikut untuk mengunggah ulang foto bukti transfer yang valid:
			</p>
			<a
				href={reuploadUrl}
				style="display:inline-block;background:#b45309;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:8px;margin-top:8px;"
			>
				Unggah Ulang Bukti Transfer
			</a>
		{:else if invoiceUrl}
			<p style="font-size:14px;color:#404040;line-height:1.5;">
				Faktur PDF resmi berstempel status juga telah terlampir di email ini. Kamu juga dapat membuka faktur digital kapan saja melalui tautan di bawah:
			</p>
			<a
				href={invoiceUrl}
				style="display:inline-block;background:#171717;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:8px;margin-top:8px;"
			>
				{isConfirmed ? 'Buka Faktur Lunas' : 'Lihat Faktur Digital'}
			</a>
		{/if}

		{#if proofContact || instagram}
			<div style="border-top:1px dashed #e5e5e5;margin-top:24px;padding-top:16px;">
				<p style="font-size:12px;color:#737373;margin:0;line-height:1.5;">
					Butuh bantuan seputar pesanan?
					{#if proofContact}
						Hubungi tim kami di <strong>{proofContact}</strong>
					{/if}
					{#if proofContact && instagram}
						<span> atau </span>
					{/if}
					{#if instagram}
						<span>DM Instagram <strong>@{instagram.replace(/^@/, '')}</strong></span>
					{/if}.
				</p>
			</div>
		{/if}

		<p style="font-size:11px;color:#a3a3a3;margin-top:20px;">
			Dokumen ini dibuat otomatis oleh cho.lazey - CHIBICONXI CATALOGUE.
		</p>
	</div>
</div>
