<script lang="ts">
  interface Props {
    rows?: number;
  }

  let { rows = 3 }: Props = $props();
</script>

<div class="space-y-2">
  {#each Array(rows) as _, i (i)}
    <div class="animate-pulse rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <div class="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800"></div>
          <div class="h-3 w-20 rounded bg-neutral-100 dark:bg-neutral-900"></div>
        </div>
        <div class="flex gap-1">
          {#each Array(4) as _, j (j)}
            <div class="h-7 w-7 rounded bg-neutral-100 dark:bg-neutral-900"></div>
          {/each}
        </div>
      </div>
    </div>
  {/each}
</div>