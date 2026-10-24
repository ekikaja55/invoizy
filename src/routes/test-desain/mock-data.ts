import type { InvoiceData } from '$lib/components/invoice';

/**
 * File mock data khusus untuk halaman /test-desain.
 * Anda dapat mengubah nilai di bawah ini secara bebas untuk menguji tampilan visual.
 */

export const mockInvoice: InvoiceData = {
	order: {
		orderId: 'INV-TEST-01',
		handle: '@buyer_mantap',
		email: 'buyer@example.com',
		phone: '081234567890',
		address: 'Jl. Merdeka No. 45, Kecamatan Gambir, Jakarta Pusat 10110',
		note: 'Tolong packing bubble wrap tebal ya kak.',
		subtotal: 125000,
		total: 145000,
		shippingLabel: 'JNE - Reguler (Rp 20.000)',
		createdAt: new Date().toISOString(),
		items: [
			{
				id: 'item-1',
				nameSnapshot: 'Gantungan Kunci Akrilik Hologram',
				variantNameSnapshot: 'Karakter A - 6cm',
				priceSnapshot: 35000,
				qty: 2,
				subtotal: 70000,
				categorySnapshot: 'Merchandise'
			},
			{
				id: 'item-2',
				nameSnapshot: 'Sticker Pack Vinyl Doff Waterproof',
				variantNameSnapshot: 'Set Chibi (A6)',
				priceSnapshot: 25000,
				qty: 1,
				subtotal: 25000,
				categorySnapshot: 'Sticker'
			},
			{
				id: 'item-3',
				nameSnapshot: 'Art Print Poster Tebal 260gsm',
				variantNameSnapshot: 'Ukuran A4',
				priceSnapshot: 30000,
				qty: 1,
				subtotal: 30000,
				categorySnapshot: 'Print'
			}
		]
	},
	settings: {
		storeName: 'Cho Lazey Studio',
		instagram: '@cho.lazey',
		twitter: '@cholazey',
		emailFromName: 'Cho Lazey Store',
		paymentNote: 'Mohon cantumkan kode invoice INV-TEST-01 pada berita transfer untuk verifikasi kilat.',
		proofContact: '082112345678'
	},
	paymentMethods: [
		{
			label: 'BCA (Bank Central Asia)',
			accountNumber: '8830123456',
			accountHolder: 'CHO LAZEY',
			note: 'Bisa transfer antar-bank atau via BI-FAST.',
			type: 'bank'
		},
		{
			label: 'Bank Mandiri',
			accountNumber: '1370012345678',
			accountHolder: 'CHO LAZEY',
			note: null,
			type: 'bank'
		}
	],
	qrisCodes: [
		{
			label: 'QRIS All Payment (GoPay, OVO, Dana, ShopeePay, BCA, dll)',
			imageUrl:
				'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Finstagram.com%2Fcho.lazey'
		}
	]
};

export const mockStatuses = [
	{ invoice: 'PENDING', payment: 'PENDING' },
	{ invoice: 'GENERATING', payment: 'PENDING' },
	{ invoice: 'READY', payment: 'UNCONFIRMED' },
	{ invoice: 'SENT', payment: 'PAID' },
	{ invoice: 'FAILED', payment: 'EXPIRED' }
] as const;

export const mockTableOrders = [
	{
		orderId: '5WH2B',
		handle: '@sakura_chan',
		email: 'sakura@example.com',
		total: 209000,
		invoiceStatus: 'SENT',
		paymentStatus: 'PAID',
		createdAt: '2026-10-18T12:30:00.000Z',
		itemQty: 3
	},
	{
		orderId: '9KL4X',
		handle: '@rizky_gaming',
		email: 'rizky@example.com',
		total: 45000,
		invoiceStatus: 'READY',
		paymentStatus: 'UNCONFIRMED',
		createdAt: '2026-10-18T10:15:00.000Z',
		itemQty: 1
	},
	{
		orderId: '3MN8P',
		handle: '@dewi_art',
		email: 'dewi@example.com',
		total: 120000,
		invoiceStatus: 'PENDING',
		paymentStatus: 'PENDING',
		createdAt: '2026-10-18T09:00:00.000Z',
		itemQty: 2
	},
	{
		orderId: '7QZ1Y',
		handle: '@budi_k',
		email: 'budi@example.com',
		total: 85000,
		invoiceStatus: 'FAILED',
		paymentStatus: 'EXPIRED',
		createdAt: '2026-10-17T15:45:00.000Z',
		itemQty: 2
	}
] as const;

export interface MockReorderProduct {
	id: string;
	name: string;
	price: number;
	stock: number;
}

export const mockReorderProducts: MockReorderProduct[] = [
	{ id: 'prod-01', name: '1. Gantungan Kunci Akrilik Hologram Karakter A', price: 35000, stock: 24 },
	{ id: 'prod-02', name: '2. Sticker Pack Vinyl Waterproof Set Chibi A6', price: 25000, stock: 50 },
	{ id: 'prod-03', name: '3. Art Print Poster Tebal 260gsm Ukuran A4', price: 30000, stock: 15 },
	{ id: 'prod-04', name: '4. Standee Akrilik Double Sided 15cm', price: 65000, stock: 8 },
	{ id: 'prod-05', name: '5. Enamel Pin Logam Edisi Terbatas Chibicon', price: 45000, stock: 12 },
	{ id: 'prod-06', name: '6. Tote Bag Canvas Sablon Serat Organik', price: 75000, stock: 10 },
	{ id: 'prod-07', name: '7. Buku Sketsa Hardcover Kertas Khusus Ilustrasi', price: 55000, stock: 18 },
	{ id: 'prod-08', name: '8. Washi Tape Masking Foil Gold 15mm', price: 28000, stock: 30 },
	{ id: 'prod-09', name: '9. Grip Tok / Phone Holder Karakter Kucing', price: 22000, stock: 40 },
	{ id: 'prod-10', name: '10. Bookmark Magnetik Set 3 Pcs Bertema Kopi', price: 18000, stock: 25 }
];
