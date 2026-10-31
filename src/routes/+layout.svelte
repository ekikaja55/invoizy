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
	import { ModeWatcher, mode } from 'mode-watcher';
	import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { CheckCircle, XCircle, AlertTriangle, Info, X } from '@lucide/svelte';

	let { children } = $props();

	if (!dev) {
		injectAnalytics();
		injectSpeedInsights();
	}
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/cholazey_icon.png" />
	<link rel="apple-touch-icon" href="/cholazey_icon.png" />
	<meta property="og:title" content="cho.lazey — Katalog & Invoice Merchandise Resmi" />
	<meta
		property="og:description"
		content="Pesan standee, keychain, sticker, dan art print original. Bayar via QRIS instan dan terima faktur invoice PDF otomatis."
	/>
	<meta property="og:image" content="https://cholazey.store/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="https://cholazey.store/og.png" />
</svelte:head>
<ModeWatcher defaultMode="light" />
<Toaster
	position="top-right"
	theme={mode.current === 'dark' ? 'dark' : 'light'}
	expand={true}
	visibleToasts={3}
	gap={12}
	duration={3500}
	closeButton={true}
	closeButtonAriaLabel="Tutup notifikasi"
	toastOptions={{
		classes: {
			toast:
				'!w-[calc(100vw-32px)] sm:!w-[380px] md:!w-[410px] min-h-[58px] border-2 border-[#262626] bg-white text-[#262626] shadow-[4px_4px_0px_#262626] rounded-lg font-sans p-3.5 sm:p-4 !pr-12 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9] dark:shadow-[4px_4px_0px_#f2efe9]',
			title: 'font-bold leading-snug text-[#262626] dark:text-[#f2efe9]',
			description: 'font-mono text-[#595959] dark:text-[#a3a099] mt-0.5 leading-relaxed',
			success: '!border-l-[8px] !border-l-[#065f46] dark:!border-l-[#34d399]',
			error: '!border-l-[8px] !border-l-[#991b1b] dark:!border-l-[#f87171]',
			warning: '!border-l-[8px] !border-l-[#d97706] dark:!border-l-[#fbbf24]',
			info: '!border-l-[8px] !border-l-[#1e40af] dark:!border-l-[#60a5fa]'
		}
	}}
>
	{#snippet closeIcon()}
		<X size={13} strokeWidth={2.75} class="shrink-0" />
	{/snippet}
	{#snippet successIcon()}
		<CheckCircle size={20} class="shrink-0 text-[#065f46] dark:text-[#34d399]" />
	{/snippet}
	{#snippet errorIcon()}
		<XCircle size={20} class="shrink-0 text-[#991b1b] dark:text-[#f87171]" />
	{/snippet}
	{#snippet warningIcon()}
		<AlertTriangle size={20} class="shrink-0 text-[#d97706] dark:text-[#fbbf24]" />
	{/snippet}
	{#snippet infoIcon()}
		<Info size={20} class="shrink-0 text-[#1e40af] dark:text-[#60a5fa]" />
	{/snippet}
</Toaster>
<NavigatingOverlay />
{@render children()}
