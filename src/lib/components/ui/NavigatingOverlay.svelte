<script lang="ts">
	import { navigating } from '$app/state';
	import { manualOverlay } from '$lib/stores/overlay.svelte';
	import MonolineLoader from './MonolineLoader.svelte';

	interface Props {
		message?: string;
		forcedActive?: boolean;
		showLabel?: boolean;
	}

	let { message = 'Preparing', forcedActive = false, showLabel = true }: Props = $props();

	// Hanya aktif jika navigasi menuju halaman/pathname berbeda,
	// atau jika dipicu secara manual (manualOverlay.active),
	// mengabaikan perubahan query parameter in-page (seperti filter & paginasi).
	let isVisible = $derived(
		forcedActive ||
			manualOverlay.active ||
			(navigating.to !== null && navigating.from?.url.pathname !== navigating.to.url.pathname)
	);

	let activeMessage = $derived(manualOverlay.active ? manualOverlay.message : message);

	$effect(() => {
		if (isVisible) {
			const prevBodyOverflow = document.body.style.overflow;
			const prevHtmlOverflow = document.documentElement.style.overflow;
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = prevBodyOverflow === 'hidden' ? '' : prevBodyOverflow;
				document.documentElement.style.overflow =
					prevHtmlOverflow === 'hidden' ? '' : prevHtmlOverflow;
			};
		}
	});

	function preventScroll(e: Event) {
		e.preventDefault();
	}
</script>

{#if isVisible}
	<div
		class="fixed inset-0 z-[999] flex touch-none flex-col items-center justify-center overscroll-none bg-[#f2efe9]/85 backdrop-blur-xs select-none dark:bg-[#1a1825]/90"
		role="status"
		aria-live="polite"
		onwheel={preventScroll}
		ontouchmove={preventScroll}
	>
		<MonolineLoader size="lg" label={activeMessage} {showLabel} />
	</div>
{/if}
