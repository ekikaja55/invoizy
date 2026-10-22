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
	href: AdminRoute | PublicRoute;
	icon: Component;
}

// Prefix nama file unduhan (CSV + PDF + lampiran email) — ganti di satu tempat.
export const FILE_PREFIX = 'invoizy';

// Kontak darurat untuk halaman error (server gangguan / DB mati).
// Sengaja konstanta kode (bukan env/DB): halaman error tidak boleh bergantung
// pada hal yang bisa gagal, dan ganti env Vercel pun butuh redeploy juga.
// GANTI nilainya dengan kontak asli.
export const EMERGENCY_CONTACT = {
	wa: '6280000000000',
	email: 'onboarding@resend.dev', //nanti bakal diganti email client
	instagram: '@cho.lazey'
};

export const adminNavItems: NavItem[] = [
	{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
	{ label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
	{ label: 'Products', href: '/admin/products', icon: Package },
	{ label: 'Categories', href: '/admin/categories', icon: FolderTree },
	{ label: 'Promo', href: '/admin/promo', icon: Tag },
	{ label: 'Settings', href: '/admin/settings', icon: Settings }
];

export const publicNavItems: NavItem[] = [
	{ label: 'Beranda', href: '/', icon: Home },
	{ label: 'Order', href: '/order', icon: ShoppingBag },
	{ label: 'Riwayat', href: '/order/riwayat', icon: History }
];
