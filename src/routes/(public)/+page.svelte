<script lang="ts">
	import { resolve } from '$app/paths';
	import { ShoppingBag, ReceiptText, CheckCircle2, ArrowRight } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const storeName = $derived(data.settings?.storeName || 'cho.lazey - CHIBICONXI CATALOGUE');
	const ownerName = $derived(data.settings?.instagram || 'cho.lazey - CHIBICONXI CATALOGUE');

	const isLogin = $derived(Boolean(data.user));

	const steps = [
		{
			title: '1. Pilih merch fav kamu!',
			desc: 'Pilih merch, atur jumlahnya, dan masukkan ke keranjang.'
		},
		{
			title: '2. Isi Data',
			desc: 'Masukkan handle sosmed, email aktif untuk invoice, dan nomor yang bisa dihubungi.'
		},
		{
			title: '3. Pilih pickup/mail order',
			desc: 'Pilih mail order (kirim langsung ke rumah) atau pick up sendiri di event Chibicon 12-13 Desember.'
		},
		{
			title: '4. Bayar & konfirmasi',
			desc: 'Selesaikan pembayaran dengan transfer atau scan QRIS, lalu kirim buktinya.'
		}
	];
</script>

<svelte:head>
	<title>{storeName} — Order Online</title>
	<meta
		name="description"
		content="Pesan online di {storeName}: pilih produk, checkout, invoice otomatis terkirim ke email."
	/>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-12 overflow-x-clip px-4 py-12 text-center">
	<!-- Hero Section -->
	<div class="space-y-4">
		<!-- Event Edition Banner: Pembeda Visual Branch Event Offline -->
		<div class="flex flex-wrap items-center justify-center gap-2.5">
			<div
				class="inline-block rotate-1 rounded-xs border-2 border-brandy bg-yellow-200 px-3 py-1 shadow-[2px_2px_0px_#78290f]"
			>
				<span class="font-handwriting text-lg font-bold tracking-wide text-brandy">
					from sketch to life
				</span>
			</div>
		</div>

		<!-- Main Headline: Fraunces Serif Lega -->
		<h1
			class="font-headline text-3xl leading-tight font-extrabold text-ink sm:text-5xl dark:text-papaya"
		>
			ChibiconXI Catalogue<br />
			<span class="text-teal dark:text-tangerine">@{storeName}</span>
		</h1>

		<!-- Subtitle: Edisi Khusus Pameran -->
		<p
			class="mx-auto max-w-lg font-sans text-sm leading-relaxed text-brandy/80 sm:text-base dark:text-papaya/70"
		>
			<strong class="font-bold text-ink dark:text-papaya">BATCH I</strong>
		</p>
	</div>

	<!-- Action Buttons: Tactile Buttons with Stroke-Spidol Icons & Dynamic Tilt -->
	<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
		<a
			href={resolve('/order')}
			class="flex w-full -rotate-1 transform-gpu items-center justify-center gap-2.5 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-tangerine px-7 py-3.5 text-base font-bold text-white shadow-[4px_4px_0px_#78290f] transition-all duration-150 backface-hidden hover:-translate-x-0.5 hover:-translate-y-0.5 hover:rotate-0 hover:shadow-[5px_5px_0px_#78290f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:w-auto"
		>
			<ShoppingBag size={18} strokeWidth={2.75} />
			<span>Mulai Order</span>
			<ArrowRight size={16} strokeWidth={2.75} class="ml-1" />
		</a>

		<a
			href={resolve('/order/riwayat')}
			class="flex w-full rotate-1 transform-gpu items-center justify-center gap-2.5 rounded-[8px_14px_6px_12px] border-2 border-brandy bg-white px-6 py-3.5 text-base font-bold text-ink shadow-[4px_4px_0px_#78290f] transition-all duration-150 backface-hidden hover:-translate-x-0.5 hover:-translate-y-0.5 hover:rotate-0 hover:bg-papaya/40 active:shadow-none sm:w-auto dark:bg-ink dark:text-papaya"
		>
			<ReceiptText size={18} strokeWidth={2.75} class="text-teal dark:text-tangerine" />
			<span>Riwayat Pesanan</span>
		</a>
	</div>

	{#if isLogin}
		<div class="pt-1">
			<a
				href={resolve('/admin')}
				class="inline-flex items-center gap-1 font-mono text-xs font-bold text-teal underline underline-offset-4 hover:opacity-80 dark:text-tangerine"
			>
				Masuk Dashboard Admin Toko →
			</a>
		</div>
	{/if}

	<!-- Bento Section: Cara Order -->
	<div class="space-y-6 text-left">
		<div class="flex items-center justify-center gap-3">
			<span class="h-0.5 w-8 bg-brandy/30 dark:bg-papaya/30"></span>
			<h2
				class="inline-block -rotate-1 rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya px-3.5 py-1 font-mono text-xs font-bold tracking-widest text-brandy uppercase shadow-[2px_2px_0px_#78290f] dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
			>
				How to Order
			</h2>
			<span class="h-0.5 w-8 bg-brandy/30 dark:bg-papaya/30"></span>
		</div>

		<ol class="space-y-5">
			{#each steps as step, i (step.title)}
				{@const stepTilt = i % 2 === 0 ? '-rotate-[1.2deg]' : 'rotate-[1.2deg]'}
				{@const badgeTilt = i % 2 === 0 ? '-rotate-3' : 'rotate-3'}
				<li
					class="group relative flex transform-gpu items-start gap-4 rounded-[16px_8px_14px_10px] border-2 border-brandy bg-white p-5 shadow-[4px_4px_0px_#78290f] transition-all duration-200 backface-hidden hover:-translate-y-1 hover:rotate-0 hover:shadow-[6px_6px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/80 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)] dark:hover:shadow-[6px_6px_0px_rgba(255,236,209,0.25)] {stepTilt}"
				>
					<!-- Washi tape corner accent on first step card -->
					{#if i === 0}
						<div
							class="pointer-events-none absolute -top-2.5 right-6 h-3.5 w-14 -rotate-3 border border-brandy/30 bg-yellow-100/90 shadow-[1px_1px_0px_rgba(120,41,15,0.2)] backdrop-blur-xs dark:bg-papaya/30"
						></div>
					{/if}

					<span
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px_3px_5px_2px] border-2 border-brandy bg-tangerine font-mono text-sm font-black text-white shadow-[2px_2px_0px_#78290f] transition-transform duration-150 group-hover:rotate-0 {badgeTilt}"
					>
						{i + 1}
					</span>
					<div class="space-y-1">
						<p
							class="flex items-center gap-1.5 font-headline text-base font-bold text-ink dark:text-papaya"
						>
							<CheckCircle2 size={16} strokeWidth={2.75} class="text-forest" />
							{step.title}
						</p>
						<p class="font-sans text-sm leading-relaxed text-brandy/80 dark:text-papaya/70">
							{step.desc}
						</p>
					</div>
				</li>
			{/each}
		</ol>
	</div>

	<!-- Social Footer Note -->
	{#if data.settings?.instagram || data.settings?.twitter}
		<div
			class="border-t-2 border-brandy/20 pt-6 font-mono text-xs font-bold text-brandy/80 dark:border-papaya/20 dark:text-papaya/70"
		>
			{#if data.settings?.instagram}
				<span>Instagram: {data.settings.instagram}</span>
			{/if}
			{#if data.settings?.instagram && data.settings?.twitter}
				<span> · </span>
			{/if}
			{#if data.settings?.twitter}
				<span>X: {data.settings.twitter}</span>
			{/if}
		</div>
	{/if}
</div>
