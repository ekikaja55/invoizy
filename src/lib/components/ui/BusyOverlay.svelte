<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		active: boolean;
		children: Snippet;
	}

	let { active, children }: Props = $props();
</script>

<div class="relative">
	{@render children()}

	{#if active}
		<div
			class="fixed inset-0 z-[999] flex items-center justify-center
             bg-white/60 backdrop-blur-[2px]
             dark:bg-neutral-950/60"
			role="status"
			aria-live="polite"
		>
			<div
				class="h-9 w-9 animate-spin rounded-full border-3
               border-neutral-300 border-t-neutral-900
               dark:border-neutral-700 dark:border-t-white"
			></div>
		</div>
	{/if}
</div>
