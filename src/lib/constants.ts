import { LayoutDashboard, ShoppingCart, Package, FolderTree, Settings, Home, ShoppingBag } from '@lucide/svelte';
import type { Component } from 'svelte';

export type AdminRoute =
  | '/admin'
  | '/admin/orders'
  | '/admin/products'
  | '/admin/categories'
  | '/admin/settings';

export type PublicRoute = '/' | '/order';

export interface NavItem {
  label: string;
  href: AdminRoute | PublicRoute;
  icon: Component;
}

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Settings', href: '/admin/settings', icon: Settings }
];

export const publicNavItems: NavItem[] = [
  { label: 'Beranda', href: '/', icon: Home },
  { label: 'Order', href: '/order', icon: ShoppingBag }
];
