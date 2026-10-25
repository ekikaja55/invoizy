<script lang="ts">
	import { navigating } from '$app/state';
	import MonolineLoader from './MonolineLoader.svelte';

	interface Props {
		message?: string;
		forcedActive?: boolean;
		showLabel?: boolean;
	}

	let { message = 'Please wait...', forcedActive = false, showLabel = true }: Props = $props();

	let isVisible = $derived(forcedActive || navigating.to !== null);

	$effect(() => {
		if (isVisible) {
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

{#if isVisible}
	<div
		class="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#f2efe9]/85 backdrop-blur-xs touch-none select-none overscroll-none dark:bg-[#1a1825]/90"
		role="status"
		aria-live="polite"
		onwheel={preventScroll}
		ontouchmove={preventScroll}
	>
		<MonolineLoader size="lg" label={message} {showLabel} />
	</div>
{/if}
