import { LayoutDashboard, ShoppingCart, Package, FolderTree, Settings } from '@lucide/svelte';
import type { Component } from 'svelte';

// union type untuk resolve typing
export type AdminRoute =
  | '/admin'
  | '/admin/orders'
  | '/admin/products'
  | '/admin/categories'
  | '/admin/settings';

export interface NavItem {
  label: string;
  href: AdminRoute;
  icon:  Component;
}

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Settings', href: '/admin/settings', icon: Settings }
];
