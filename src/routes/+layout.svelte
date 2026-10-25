<script lang="ts">
	import '../app.css';
	import '@fontsource/fraunces/600.css';
	import '@fontsource/fraunces/700.css';
	import '@fontsource/caveat/600.css';
	import '@fontsource/plus-jakarta-sans/400.css';
	import '@fontsource/plus-jakarta-sans/500.css';
	import '@fontsource/plus-jakarta-sans/600.css';
	import '@fontsource/plus-jakarta-sans/700.css';
	import '@fontsource/space-mono/400.css';
	import '@fontsource/space-mono/700.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher } from 'mode-watcher';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { CheckCircle, XCircle, AlertTriangle, Info } from '@lucide/svelte';

	let { children } = $props();

	if (!dev) {
		injectAnalytics();
	}
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/cholazey_icon.png" />
</svelte:head>
<ModeWatcher defaultMode="light" />
<Toaster
	position="top-center"
	toastOptions={{
		classes: {
			toast: 'border-[1.5px] border-[#262626] bg-[#fbf9f5] text-[#262626] shadow-[3px_3px_0px_#262626] rounded-md font-sans text-xs font-semibold dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[3px_3px_0px_#f2efe9]',
			title: 'font-bold text-[#262626] dark:text-[#f2efe9]',
			description: 'text-[#595959] dark:text-[#a3a099]'
		}
	}}
>
	{#snippet successIcon()}
		<CheckCircle size={18} class="shrink-0 text-[#065f46] dark:text-[#34d399]" />
	{/snippet}
	{#snippet errorIcon()}
		<XCircle size={18} class="shrink-0 text-[#991b1b] dark:text-[#f87171]" />
	{/snippet}
	{#snippet warningIcon()}
		<AlertTriangle size={18} class="shrink-0 text-[#92400e] dark:text-[#fbbf24]" />
	{/snippet}
	{#snippet infoIcon()}
		<Info size={18} class="shrink-0 text-[#1e40af] dark:text-[#60a5fa]" />
	{/snippet}
</Toaster>
{@render children()}
