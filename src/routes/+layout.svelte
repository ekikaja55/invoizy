<script lang="ts">
	import '../app.css';
	import '@fontsource/fraunces/700.css';
	import '@fontsource/caveat/600.css';
	import '@fontsource/plus-jakarta-sans/400.css';
	import '@fontsource/plus-jakarta-sans/600.css';
	import '@fontsource/space-mono/400.css';
	import '@fontsource/space-mono/700.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher } from 'mode-watcher';
	import { CheckCircle, XCircle, AlertTriangle, Info } from '@lucide/svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/cholazey_icon.png" />
</svelte:head>
<ModeWatcher defaultMode="light" />
<Toaster position="top-center">
	{#snippet successIcon()}
		<CheckCircle size={18} class="shrink-0 text-forest dark:text-emerald-400" />
	{/snippet}
	{#snippet errorIcon()}
		<XCircle size={18} class="shrink-0 text-crimson dark:text-rose-400" />
	{/snippet}
	{#snippet warningIcon()}
		<AlertTriangle size={18} class="shrink-0 text-tangerine dark:text-amber-400" />
	{/snippet}
	{#snippet infoIcon()}
		<Info size={18} class="shrink-0 text-teal dark:text-teal-400" />
	{/snippet}
</Toaster>
{@render children()}
