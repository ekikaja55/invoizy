<script lang="ts">
	import { formatRupiah } from '$lib/utils/currency';

	interface Props {
		storeName: string;
		orderId: string;
		handle: string;
		total: number;
		invoiceUrl: string;
	}

	let { storeName, orderId, handle, total, invoiceUrl }: Props = $props();
</script>

<!-- Template email transaksional: layout tabel + SEMUA style inline
     (klien email mengabaikan <style> dan class). Tanpa JS/interaksi. -->
<div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">
	<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
		<p style="font-size:14px;color:#737373;margin:0;">{storeName}</p>
		<h1 style="font-size:22px;margin:8px 0 0;">Invoice {orderId}</h1>
		<p style="font-size:14px;color:#404040;">Halo {handle}, pesanan kamu sudah tercatat.</p>

		<div style="border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:16px 0;">
			<p style="font-size:13px;color:#737373;margin:0;">Total tagihan</p>
			<p style="font-size:24px;font-weight:bold;margin:4px 0 0;">{formatRupiah(total)}</p>
		</div>

		<p style="font-size:14px;color:#404040;">
			Detail item &amp; cara bayar ada di halaman invoice. PDF invoice juga terlampir di email ini.
		</p>

		{#if invoiceUrl}
			<a
				href={invoiceUrl}
				style="display:inline-block;background:#171717;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:8px;margin-top:8px;"
			>
				Lihat Invoice
			</a>
		{/if}

		<p style="font-size:12px;color:#a3a3a3;margin-top:24px;">
			Simpan email ini sebagai bukti pemesanan. Balas email ini untuk konfirmasi pembayaran.
		</p>
	</div>
</div>
