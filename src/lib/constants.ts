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
}

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  {label:'Orders',href:'/admin/orders'},
  {label:'Products',href:'/admin/products'},
  { label: 'Categories', href: '/admin/categories' },
  {label:'Settings',href:'/admin/settings'}
]
