import { listOrdersForExport } from '$lib/server/db/queries/order';
import { FILE_PREFIX } from '$lib/constants';
import type { RequestHandler } from './$types';

// Layout /admin meng-guard sesi — endpoint ini ikut terlindungi.
export const GET: RequestHandler = async ({ url }) => {
	const rows = await listOrdersForExport({
		invoice: url.searchParams.get('invoice') ?? '',
		payment: url.searchParams.get('payment') ?? '',
		q: url.searchParams.get('q') ?? '',
		from: url.searchParams.get('from') ?? '',
		to: url.searchParams.get('to') ?? ''
	});

	const header = [
		'order_id',
		'handle',
		'email',
		'address',
		'phone',
		'note',
		'subtotal',
		'total',
		'invoice_status',
		'payment_status',
		'invoice_url',
		'created_at'
	];

	const lines = rows.map((o) =>
		[
			o.orderId,
			o.handle,
			o.email,
			o.address,
			o.phone,
			o.note,
			o.subtotal,
			o.total,
			o.invoiceStatus,
			o.paymentStatus,
			o.invoiceUrl ?? '',
			o.createdAt.toISOString()
		]
			.map(csvCell)
			.join(',')
	);

	const stamp = new Date().toISOString().slice(0, 10);
	// BOM agar Excel Windows membuka UTF-8 dengan benar.
	const csv = '\uFEFF' + [header.join(','), ...lines].join('\n');
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${FILE_PREFIX}-orders-${stamp}.csv"`
		}
	});
};

// Escape CSV: quote bila perlu + prefix ' bila diawali = + - @ tab
// (mencegah formula injection dari input buyer via Excel).
function csvCell(value: string | number | null): string {
	let s = String(value ?? '');
	if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
	if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
	return s;
}
