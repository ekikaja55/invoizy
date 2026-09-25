<script lang="ts">
  import { toggleMode, mode } from 'mode-watcher';
  import { Moon, Sun } from '@lucide/svelte';
  import { navActionClass } from '$lib/utils/nav-utils';

  interface Props {
    collapsed?: boolean;
  }

  let { collapsed = false }: Props = $props();
</script>

<button onclick={toggleMode} class={navActionClass()}>
  {#if mode.current === 'dark'}
    <Moon size={16} />
  {:else}
    <Sun size={16} />
  {/if}
  {#if !collapsed}
    <span>{mode.current === 'dark' ? 'Dark' : 'Light'}</span>
  {/if}
</button>
