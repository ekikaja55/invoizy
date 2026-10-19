export function navItemClass(isActive: boolean) {
	const base = 'flex items-center gap-2.5 rounded-[8px_5px_7px_4px] px-3 py-2 text-sm font-bold transition-all';
	const active =
		'bg-tangerine text-white border-2 border-brandy shadow-[2px_2px_0px_#78290f]';
	const inactive =
		'text-ink/80 hover:bg-brandy/10 hover:text-ink dark:text-papaya/80 dark:hover:bg-papaya/10 dark:hover:text-papaya border-2 border-transparent';

	return `${base} ${isActive ? active : inactive}`;
}

export function navActionClass() {
	return 'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm w-full text-left font-bold text-ink/80 hover:bg-brandy/10 hover:text-ink dark:text-papaya/80 dark:hover:bg-papaya/10 dark:hover:text-papaya transition-colors hover:cursor-pointer';
}
