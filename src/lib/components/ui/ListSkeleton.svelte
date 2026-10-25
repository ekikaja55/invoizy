<script lang="ts">
	interface Props {
		rows?: number;
	}

	let { rows = 3 }: Props = $props();
</script>

<div class="space-y-3" role="status" aria-label="Memuat data...">
	{#each Array.from({ length: rows }, (_, i) => i) as i (i)}
		<div
			class="animate-pulse rounded-md border-[1.5px] border-[#262626]/20 bg-[#f9f7f2]/80 p-4 shadow-[1.5px_1.5px_0px_#262626]/10 dark:border-[#f2efe9]/20 dark:bg-[#201d2d]/80 dark:shadow-none"
		>
			<div class="flex items-center justify-between gap-4">
				<div class="space-y-2.5">
					<div class="h-4 w-36 rounded bg-[#262626]/15 dark:bg-[#f2efe9]/20"></div>
					<div class="h-3 w-24 rounded bg-[#262626]/10 dark:bg-[#f2efe9]/12"></div>
				</div>
				<div class="flex gap-1.5">
					{#each Array.from({ length: 3 }, (_, j) => j) as j (j)}
						<div
							class="h-7 w-7 rounded-md border border-[#262626]/10 bg-[#262626]/10 dark:border-[#f2efe9]/10 dark:bg-[#f2efe9]/12"
						></div>
					{/each}
				</div>
			</div>
		</div>
	{/each}
</div>
