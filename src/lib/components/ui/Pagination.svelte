<script lang="ts">
	import type { ResolvedPathname } from '$app/types';

	interface Props {
		page: number;
		totalPages: number;
		// Parent bangun href via resolve() — kembalian ResolvedPathname lolos rule navigasi.
		buildHref: (page: number) => ResolvedPathname;
	}

	let { page, totalPages, buildHref }: Props = $props();
</script>

{#if totalPages > 1}
	<nav class="flex items-center justify-between gap-2" aria-label="Paginasi">
		{#if page > 1}
			<a
				href={buildHref(page - 1)}
				class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
				       hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
			>
				← Prev
			</a>
		{:else}
			<span
				class="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-400
				       dark:border-neutral-800"
			>
				← Prev
			</span>
		{/if}

		<p class="text-sm text-neutral-500">
			Halaman {page} dari {totalPages}
		</p>

		{#if page < totalPages}
			<a
				href={buildHref(page + 1)}
				class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
				       hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
			>
				Next →
			</a>
		{:else}
			<span
				class="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-400
				       dark:border-neutral-800"
			>
				Next →
			</span>
		{/if}
	</nav>
{/if}
