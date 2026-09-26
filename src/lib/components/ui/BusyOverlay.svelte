<script lang="ts">
  interface Props {
    active: boolean;
    children: () => any;
  }

  let { active, children }: Props = $props();
</script>

<div class="relative">
  {@render children()}

  {#if active}
    <div
      class="absolute inset-0 z-10 flex items-center justify-center rounded-xl
             bg-white/60 backdrop-blur-[1px]
             dark:bg-neutral-950/60"
    >
      <div
        class="h-6 w-6 animate-spin rounded-full border-2
               border-neutral-300 border-t-neutral-900
               dark:border-neutral-700 dark:border-t-white"
      ></div>
    </div>
  {/if}
</div>