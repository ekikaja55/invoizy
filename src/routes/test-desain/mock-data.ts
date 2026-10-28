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
		paymentNote: '',
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

export const mockPaymentStatuses = ['PENDING', 'UNCONFIRMED', 'PAID', 'EXPIRED'] as const;

export const mockInvoiceStatuses = ['PENDING', 'GENERATING', 'READY', 'SENT', 'FAILED'] as const;

export const mockStatuses = [
	{ invoice: 'PENDING', payment: 'PENDING' },
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
	priceInt: number;
	stock: number;
	trackStock: boolean;
	active: boolean;
	description: string | null;
	imageUrls: string[];
	variants: { name: string; stock: number }[];
}

export const mockReorderProducts: MockReorderProduct[] = [
	{
		id: 'prod-01',
		name: 'Gantungan Kunci Akrilik Hologram Karakter A',
		priceInt: 35000,
		stock: 24,
		trackStock: true,
		active: true,
		description: 'Bahan akrilik 4mm dengan gantungan putar warna emas dan efek hologram pelangi.',
		imageUrls: [
			'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'
		],
		variants: [
			{ name: 'Chibi Cat', stock: 14 },
			{ name: 'Chibi Fox', stock: 10 }
		]
	},
	{
		id: 'prod-02',
		name: 'Sticker Pack Vinyl Waterproof Set Chibi A6',
		priceInt: 25000,
		stock: 50,
		trackStock: true,
		active: true,
		description: 'Kertas stiker vinyl anti air dengan laminasi doff, isi 8 karakter lucu.',
		imageUrls: [
			'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80'
		],
		variants: []
	},
	{
		id: 'prod-03',
		name: 'Art Print Poster Tebal 260gsm Ukuran A4',
		priceInt: 30000,
		stock: 15,
		trackStock: true,
		active: true,
		description: 'Cetak digital offset art carton 260gsm warna tajam dan tidak mudah pudar.',
		imageUrls: [
			'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80'
		],
		variants: []
	},
	{
		id: 'prod-04',
		name: 'Standee Akrilik Double Sided 15cm',
		priceInt: 65000,
		stock: 0,
		trackStock: true,
		active: true,
		description: 'Standee meja akrilik tebal 5mm dengan base oval bertanda tangan ilustrator.',
		imageUrls: [],
		variants: []
	},
	{
		id: 'prod-05',
		name: 'Enamel Pin Logam Edisi Terbatas Chibicon',
		priceInt: 45000,
		stock: 12,
		trackStock: true,
		active: true,
		description: 'Hard enamel pin dengan pelapisan emas 18k dan peniti ganda karet hitam.',
		imageUrls: [
			'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=200&auto=format&fit=crop&q=80'
		],
		variants: []
	},
	{
		id: 'prod-06',
		name: 'Tote Bag Canvas Sablon Serat Organik',
		priceInt: 75000,
		stock: 10,
		trackStock: true,
		active: false,
		description: 'Bahan kanvas twill tebal berserat organik alami dilengkapi resleting utama.',
		imageUrls: [],
		variants: []
	},
	{
		id: 'prod-07',
		name: 'Buku Sketsa Hardcover Kertas Khusus Ilustrasi',
		priceInt: 55000,
		stock: 18,
		trackStock: true,
		active: true,
		description:
			'Hardcover spiral binding 100 lembar kertas bookpaper 90gsm ramah pensil & drawing pen.',
		imageUrls: [
			'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80'
		],
		variants: []
	},
	{
		id: 'prod-08',
		name: 'Washi Tape Masking Foil Gold 15mm',
		priceInt: 28000,
		stock: 30,
		trackStock: true,
		active: true,
		description: 'Pita washi jepang motif bunga sakura dengan aksen foil emas panjang 10 meter.',
		imageUrls: [],
		variants: []
	},
	{
		id: 'prod-09',
		name: 'Grip Tok / Phone Holder Karakter Kucing',
		priceInt: 22000,
		stock: 40,
		trackStock: true,
		active: true,
		description: 'Pegangan smartphone bahan resin bening dengan perekat 3M kuat dan bisa diputar.',
		imageUrls: [],
		variants: []
	},
	{
		id: 'prod-10',
		name: 'Bookmark Magnetik Set 3 Pcs Bertema Kopi',
		priceInt: 18000,
		stock: 25,
		trackStock: false,
		active: true,
		description:
			'Pembatas buku lipat magnetik tahan air isi 3 karakter dengan ilustrasi kedai kopi retro.',
		imageUrls: [],
		variants: []
	}
];
