import {
	LayoutDashboard,
	ShoppingCart,
	Package,
	FolderTree,
	Tag,
	Settings,
	Home,
	ShoppingBag,
	History
} from '@lucide/svelte';
import type { Component } from 'svelte';

export type AdminRoute =
	| '/admin'
	| '/admin/orders'
	| '/admin/products'
	| '/admin/categories'
	| '/admin/promo'
	| '/admin/settings'
	| '/admin/settings/payment-methods'
	| '/admin/settings/qris';

export type PublicRoute = '/' | '/order' | '/order/riwayat';

export interface NavItem {
	label: string;
	hoverLabel?: string;
	href: AdminRoute | PublicRoute;
	icon: Component;
}

// Prefix nama file unduhan (CSV + PDF + lampiran email) — ganti di satu tempat.
export const FILE_PREFIX = 'invoizy';

/**
 * Batas waktu pembayaran (Hold Timeout).
 * Saat ini disetel 1 menit untuk keperluan testing lokal user.
 * Ganti ke 30 untuk produksi/event sesungguhnya.
 */
export const ORDER_HOLD_TIMEOUT_MINUTES = 30;

// Kontak darurat untuk halaman error (server gangguan / DB mati).
// Sengaja konstanta kode (bukan env/DB): halaman error tidak boleh bergantung
// pada hal yang bisa gagal, dan ganti env Vercel pun butuh redeploy juga.
// GANTI nilainya dengan kontak asli.
export const EMERGENCY_CONTACT = {
	wa: '6282275890763',
	email: 'brendaviolint@gmail.com', //nanti bakal diganti email client
	instagram: '@cho.lazey'
};

export const adminNavItems: NavItem[] = [
	{ label: 'Dashboard', hoverLabel: 'Cek Rekap', href: '/admin', icon: LayoutDashboard },
	{ label: 'Orders', hoverLabel: 'Cek Pesanan', href: '/admin/orders', icon: ShoppingCart },
	{ label: 'Products', hoverLabel: 'Kelola Katalog', href: '/admin/products', icon: Package },
	{ label: 'Categories', hoverLabel: 'Atur Kategori', href: '/admin/categories', icon: FolderTree },
	{ label: 'Promo', hoverLabel: 'Kupon Diskon', href: '/admin/promo', icon: Tag },
	{ label: 'Settings', hoverLabel: 'Atur Toko', href: '/admin/settings', icon: Settings }
];

export const publicNavItems: NavItem[] = [
	{ label: 'Beranda', hoverLabel: 'Ke Beranda', href: '/', icon: Home },
	{ label: 'Order', hoverLabel: 'Katalog Belanja', href: '/order', icon: ShoppingBag },
	{ label: 'Riwayat', hoverLabel: 'Cek Status', href: '/order/riwayat', icon: History }
];
