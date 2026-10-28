<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import { Moon, Sun } from '@lucide/svelte';
	import { navActionClass } from '$lib/utils/nav-utils';

	interface Props {
		collapsed?: boolean;
	}

	let { collapsed = false }: Props = $props();
</script>

<button
	onclick={toggleMode}
	class="{navActionClass()} group overflow-hidden"
	aria-label="Toggle theme"
>
	{#if mode.current === 'dark'}
		<Moon size={16} strokeWidth={2.5} class="shrink-0" />
	{:else}
		<Sun size={16} strokeWidth={2.5} class="shrink-0" />
	{/if}
	{#if !collapsed}
		<span class="relative block h-5 flex-1 overflow-hidden">
			<span
				class="block whitespace-nowrap transition-transform duration-300 ease-out group-hover:-translate-y-full"
			>
				{mode.current === 'dark' ? 'Dark' : 'Light'}
			</span>
			<span
				class="absolute top-0 left-0 block translate-y-full font-bold whitespace-nowrap text-[#f2efe9] transition-transform duration-300 ease-out group-hover:translate-y-0 dark:text-[#1a1825]"
				aria-hidden="true"
			>
				{mode.current === 'dark' ? 'Light ?' : 'Dark ?'}
			</span>
		</span>
	{/if}
</button>
