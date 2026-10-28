export function navItemClass(isActive: boolean) {
	const base =
		'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-bold whitespace-nowrap transition-all';
	const active =
		'bg-[#262626] text-[#f2efe9] border-2 border-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#a2e1db] dark:text-[#1a1825] dark:shadow-[2px_2px_0px_#f2efe9]';
	const inactive =
		'text-[#262626] hover:bg-[#262626] hover:text-[#f2efe9] dark:text-[#f2efe9] dark:hover:bg-[#a2e1db] dark:hover:text-[#1a1825] border-2 border-transparent hover:border-[#262626] dark:hover:border-[#f2efe9] hover:shadow-[2px_2px_0px_#262626] dark:hover:shadow-[2px_2px_0px_#f2efe9]';

	return `${base} ${isActive ? active : inactive}`;
}

export function navActionClass() {
	return 'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-left font-bold whitespace-nowrap text-[#262626] hover:bg-[#262626] hover:text-[#f2efe9] dark:text-[#f2efe9] dark:hover:bg-[#a2e1db] dark:hover:text-[#1a1825] border-2 border-transparent hover:border-[#262626] dark:hover:border-[#f2efe9] hover:shadow-[2px_2px_0px_#262626] dark:hover:shadow-[2px_2px_0px_#f2efe9] transition-all hover:cursor-pointer';
}
