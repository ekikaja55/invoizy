<script lang="ts">
	import type { Snippet } from 'svelte';
	import MonolineLoader from './MonolineLoader.svelte';

	interface Props {
		active: boolean;
		children?: Snippet;
		message?: string;
		scope?: 'global' | 'local';
		showLabel?: boolean;
	}

	let {
		active,
		children,
		message = 'Please wait...',
		scope = 'global',
		showLabel = true
	}: Props = $props();

	$effect(() => {
		if (active && scope === 'global') {
			const prevBodyOverflow = document.body.style.overflow;
			const prevHtmlOverflow = document.documentElement.style.overflow;
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = prevBodyOverflow;
				document.documentElement.style.overflow = prevHtmlOverflow;
			};
		}
	});

	function preventScroll(e: Event) {
		e.preventDefault();
	}
</script>

<div class="relative">
	{#if children}
		{@render children()}
	{/if}

	{#if active}
		{#if scope === 'global'}
			<div
				class="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#f2efe9]/85 backdrop-blur-xs touch-none select-none overscroll-none dark:bg-[#1a1825]/90"
				role="status"
				aria-live="polite"
				onwheel={preventScroll}
				ontouchmove={preventScroll}
			>
				<MonolineLoader size="lg" label={message} {showLabel} />
			</div>
		{:else}
			<div
				class="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-inherit bg-[#f2efe9]/85 backdrop-blur-[1px] dark:bg-[#1a1825]/85"
				role="status"
				aria-live="polite"
			>
				<MonolineLoader size="sm" label={message} {showLabel} />
			</div>
		{/if}
	{/if}
</div>
