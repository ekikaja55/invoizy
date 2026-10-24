// Label manusia untuk status enum — nilai DB tidak berubah,
// yang diterjemahkan hanya tampilannya di UI admin.

const INVOICE_LABELS: Record<string, string> = {
	PENDING: 'Menunggu',
	GENERATING: 'Diproses',
	SENT: 'Terkirim',
	FAILED: 'Gagal — perlu aksi'
};

const PAYMENT_LABELS: Record<string, string> = {
	PENDING: 'Menunggu Bukti Bayar',
	WAITING_VERIFICATION: 'Menunggu Verifikasi',
	CONFIRMED: 'Lunas & Sah',
	CANCELLED: 'Dibatalkan',
	EXPIRED: 'Kedaluwarsa'
};

export function invoiceStatusLabel(status: string): string {
	return INVOICE_LABELS[status] ?? status;
}

export function paymentStatusLabel(status: string): string {
	return PAYMENT_LABELS[status] ?? status;
}
