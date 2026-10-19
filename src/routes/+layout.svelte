<script lang="ts">
	import '../app.css';
	import '@fontsource/fraunces/700.css';
	import '@fontsource/caveat/600.css';
	import '@fontsource/plus-jakarta-sans/400.css';
	import '@fontsource/plus-jakarta-sans/600.css';
	import '@fontsource/space-mono/400.css';
	import '@fontsource/space-mono/700.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher } from 'mode-watcher';
	import { CheckCircle, XCircle, AlertTriangle, Info } from '@lucide/svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher defaultMode="light" />
<Toaster position="top-center">
	{#snippet successIcon()}
		<CheckCircle size={18} class="text-forest shrink-0" />
	{/snippet}
	{#snippet errorIcon()}
		<XCircle size={18} class="text-crimson shrink-0" />
	{/snippet}
	{#snippet warningIcon()}
		<AlertTriangle size={18} class="text-tangerine shrink-0" />
	{/snippet}
	{#snippet infoIcon()}
		<Info size={18} class="text-teal shrink-0" />
	{/snippet}
</Toaster>
{@render children()}
