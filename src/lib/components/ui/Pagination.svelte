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
				class="inline-flex items-center rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
			>
				&larr; Prev
			</a>
		{:else}
			<span
				class="inline-flex items-center rounded-lg border-2 border-[#262626]/20 bg-[#f2efe9]/40 px-3.5 py-1.5 font-mono text-xs font-bold text-[#404040]/40 dark:border-[#f2efe9]/20 dark:bg-[#1a1825]/40 dark:text-[#b8b5ad]/40"
			>
				&larr; Prev
			</span>
		{/if}

		<p class="font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]">
			Halaman {page} dari {totalPages}
		</p>

		{#if page < totalPages}
			<a
				href={buildHref(page + 1)}
				class="inline-flex items-center rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
			>
				Next &rarr;
			</a>
		{:else}
			<span
				class="inline-flex items-center rounded-lg border-2 border-[#262626]/20 bg-[#f2efe9]/40 px-3.5 py-1.5 font-mono text-xs font-bold text-[#404040]/40 dark:border-[#f2efe9]/20 dark:bg-[#1a1825]/40 dark:text-[#b8b5ad]/40"
			>
				Next &rarr;
			</span>
		{/if}
	</nav>
{/if}
