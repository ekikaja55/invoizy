<script lang="ts">
	import type { PlaceholderProps } from "$lib/components/constants";

  let{title,description,phase}:PlaceholderProps = $props();
</script>

<div class="flex min-h-[50vh] items-center justify-center">
  <div class="rounded-lg border border-dashed p-8 text-center opacity-60">
    <p class="text-sm font-medium">{title}</p>
    {#if phase}
      <p class="mt-1 text-xs">Belum diimplementasi — {phase}</p>
    {/if}
    {#if description}
      <p class="mt-2 text-xs opacity-70">{description}</p>
    {/if}
  </div>
</div>
