export function navItemClass(isActive: boolean) {
  const base = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors';
  const active = 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900';
  const inactive =
    'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10';

  return `${base} ${isActive ? active : inactive}`;
}

export function navActionClass() {
  return 'flex items-center gap-2 rounded-lg px-2 py-2 text-sm w-full text-left text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white transition-colors hover:cursor-pointer';
}
