<script lang="ts">
	import './app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from 'svelte-sonner';
	import {ModeWatcher} from 'mode-watcher'

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<Toaster richColors position="top-center"/>
{@render children()}
