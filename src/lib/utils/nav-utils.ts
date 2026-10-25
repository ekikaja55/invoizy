export function navItemClass(isActive: boolean) {
	const base = 'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-bold transition-all';
	const active =
		'bg-[#b4a6d5] text-[#262626] border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#b4a6d5] dark:text-[#1a1825] dark:shadow-[2px_2px_0px_#f2efe9]';
	const inactive =
		'text-[#404040] hover:bg-[#b4a6d5]/20 hover:text-[#262626] dark:text-[#b8b5ad] dark:hover:bg-[#b4a6d5]/20 dark:hover:text-[#f2efe9] border-[1.5px] border-transparent hover:border-[#262626]/20 dark:hover:border-[#f2efe9]/20';

	return `${base} ${isActive ? active : inactive}`;
}

export function navActionClass() {
	return 'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm w-full text-left font-bold text-[#404040] hover:bg-[#b4a6d5]/20 hover:text-[#262626] dark:text-[#b8b5ad] dark:hover:bg-[#b4a6d5]/20 dark:hover:text-[#f2efe9] transition-all hover:cursor-pointer';
}
