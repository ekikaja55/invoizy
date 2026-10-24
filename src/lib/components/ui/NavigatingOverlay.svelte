<script lang="ts">
	import { navigating } from '$app/state';

	interface Props {
		message?: string;
	}

	let { message }: Props = $props();

	$effect(() => {
		if (navigating.to !== null) {
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

{#if navigating.to !== null}
	<div
		class="fixed inset-0 z-[999] flex items-center justify-center
           bg-white/50 backdrop-blur-sm touch-none select-none overscroll-none
           dark:bg-black/50"
		role="status"
		aria-live="polite"
		onwheel={preventScroll}
		ontouchmove={preventScroll}
	>
		<div class="flex flex-col items-center gap-3">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2
               border-neutral-300 border-t-neutral-900
               dark:border-neutral-700 dark:border-t-white"
			></div>
			{#if message}
				<p class="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
			{/if}
		</div>
	</div>
{/if}
