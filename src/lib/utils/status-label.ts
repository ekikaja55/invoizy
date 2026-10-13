// Label manusia untuk status enum — nilai DB tidak berubah,
// yang diterjemahkan hanya tampilannya di UI admin.

const INVOICE_LABELS: Record<string, string> = {
	PENDING: 'Menunggu',
	GENERATING: 'Diproses',
	SENT: 'Terkirim',
	FAILED: 'Gagal — perlu aksi'
};

const PAYMENT_LABELS: Record<string, string> = {
	PENDING: 'Belum bayar',
	CONFIRMED: 'Lunas',
	CANCELLED: 'Dibatalkan'
};

export function invoiceStatusLabel(status: string): string {
	return INVOICE_LABELS[status] ?? status;
}

export function paymentStatusLabel(status: string): string {
	return PAYMENT_LABELS[status] ?? status;
}
