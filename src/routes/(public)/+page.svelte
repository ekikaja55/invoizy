<script lang="ts">
	import { resolve } from '$app/paths';
	import FolderFloat from '$lib/components/landing/FolderFloat.svelte';
	import FlowingRibbon from '$lib/components/landing/FlowingRibbon.svelte';
	import ProductMasonry from '$lib/components/landing/ProductMasonry.svelte';
	import HowToOrderSection from '$lib/components/landing/HowToOrderSection.svelte';
	import BackToTopFab from '$lib/components/landing/BackToTopFab.svelte';
	import { ShoppingBag, ReceiptText, ArrowDown, ExternalLink } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const storeName = $derived(data.settings?.storeName || 'cho.lazey - CHIBICONXI CATALOGUE');
</script>

<svelte:head>
	<title>{storeName} — Order Online</title>
	<meta
		name="description"
		content="Katalog merchandise resmi cho.lazey di ChibiconXI: pesan standee, photocard, keychain, dan art print original. Bayar via QRIS instan dan terima faktur invoice otomatis."
	/>
	<style>
		html {
			scroll-behavior: smooth;
		}
	</style>
</svelte:head>

<div
	class="relative w-full space-y-16 selection:bg-[#fea770] selection:text-[#262626] sm:space-y-20"
>
	<!-- Hero Section -->
	<section
		class="relative mx-auto max-w-5xl px-4 pt-6 pb-10 text-center sm:pt-10 sm:pb-16"
		aria-label="Hero Section"
	>
		<!-- Komposisi Stiker Taktil Melayang di Sekitar Headline (Layer z-20, Tersebar Vertikal & Aman dari Overflow) -->
		<div class="pointer-events-none absolute inset-0 select-none" aria-hidden="true">
			<!-- 1. KIRI ATAS: Stiker Sparkle ✦ Monoline (#a2e1db) - Inline SVG -->
			<div class="animate-hero-float-1 absolute top-2 left-2 sm:top-4 sm:left-4 md:left-6">
				<div
					class="flex h-11 w-11 -rotate-12 items-center justify-center rounded-xl border-2 border-[#262626] bg-[#a2e1db] shadow-[3px_3px_0px_#262626] sm:h-13 sm:w-13 dark:border-[#a2e1db] dark:bg-[#1a1825] dark:shadow-[3px_3px_0px_#fea770]"
				>
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="text-[#262626] dark:text-[#a2e1db]"
					>
						<path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
					</svg>
				</div>
			</div>

			<!-- 2. KANAN ATAS: Stiker Retro Camera (#fea770) - Inline SVG -->
			<div class="animate-hero-float-2 absolute top-1 right-2 sm:top-3 sm:right-4 md:right-6">
				<div
					class="flex h-11 w-11 rotate-12 items-center justify-center rounded-xl border-2 border-[#262626] bg-[#fea770] shadow-[3px_3px_0px_#262626] sm:h-13 sm:w-13 dark:border-[#fea770] dark:bg-[#1a1825] dark:shadow-[3px_3px_0px_#b4a6d5]"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-[#262626] dark:text-[#fea770]"
					>
						<path
							d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
						/>
						<circle cx="12" cy="13" r="3" />
					</svg>
				</div>
			</div>

			<!-- 3. KIRI TENGAH: CMYK Target + Twin Sparkle Doodle SVG (#fea770 & #a2e1db) -->
			<div
				class="animate-hero-float-2 absolute top-1/2 left-1 -translate-y-1/2 sm:left-4 md:left-8"
			>
				<svg
					width="76"
					height="76"
					viewBox="0 0 84 84"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class="h-14 w-14 text-[#262626] sm:h-18 sm:w-18 dark:text-[#f2efe9]"
				>
					<circle cx="28" cy="28" r="18" stroke="currentColor" stroke-width="1.75" />
					<line x1="28" y1="6" x2="28" y2="50" stroke="currentColor" stroke-width="1.75" />
					<line x1="6" y1="28" x2="50" y2="28" stroke="currentColor" stroke-width="1.75" />
					<circle cx="28" cy="28" r="3" fill="currentColor" />
					<path
						d="M56 12 C56.5 22 66 22.5 66 23 C56.5 23.5 56 33.5 55.5 34 C55 24 45 23.5 45 23 C55 22.5 55.5 12.5 56 12Z"
						fill="#fea770"
						fill-opacity="0.85"
						stroke="currentColor"
						stroke-width="1.75"
						stroke-linejoin="round"
					/>
					<path
						d="M12 56 C24 68 44 64 54 58"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-dasharray="3 3"
						class="opacity-60"
					/>
					<circle cx="58" cy="62" r="2.5" fill="#d9532f" class="dark:fill-[#fea770]" />
				</svg>
			</div>

			<!-- 4. KANAN TENGAH: Starburst & Scribble Spiral Doodle SVG (#b4a6d5) -->
			<div
				class="animate-hero-float-1 absolute top-1/2 right-1 -translate-y-1/2 sm:right-4 md:right-8"
			>
				<svg
					width="76"
					height="76"
					viewBox="0 0 84 84"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class="h-14 w-14 text-[#262626] sm:h-18 sm:w-18 dark:text-[#f2efe9]"
				>
					<path
						d="M42 10 L44 26 L58 18 L48 30 L64 36 L48 40 L56 54 L44 44 L40 60 L36 44 L24 52 L32 38 L16 34 L32 28 L22 16 L36 24 Z"
						fill="#b4a6d5"
						fill-opacity="0.75"
						stroke="currentColor"
						stroke-width="2"
						stroke-linejoin="round"
					/>
					<circle cx="40" cy="35" r="3" fill="#262626" class="dark:fill-[#f2efe9]" />
					<path
						d="M58 54 C66 52 72 58 68 66 C64 74 52 72 54 62 C55 56 62 58 64 62"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-[#d9532f] opacity-70 dark:text-[#fea770]"
					/>
					<path
						d="M20 62 L20 70 M16 66 L24 66"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						class="opacity-60"
					/>
				</svg>
			</div>

			<!-- 5. KIRI BAWAH: Hologram Star Stamp (#b4a6d5) - Inline SVG -->
			<div class="animate-hero-float-3 absolute bottom-3 left-3 sm:bottom-6 sm:left-6 md:left-10">
				<div
					class="flex h-10 w-10 rotate-6 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#b4a6d5] shadow-[2.5px_2.5px_0px_#262626] sm:h-12 sm:w-12 dark:border-[#b4a6d5] dark:bg-[#1a1825] dark:shadow-[2.5px_2.5px_0px_#a2e1db]"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="text-[#262626] dark:text-[#b4a6d5]"
					>
						<polygon
							points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
						/>
					</svg>
				</div>
			</div>

			<!-- 6. KANAN BAWAH: Mini Monoline Heart (#fbf9f5 / #d9532f) - Inline SVG -->
			<div
				class="animate-hero-float-3 absolute right-3 bottom-4 sm:right-6 sm:bottom-7 md:right-10"
			>
				<div
					class="flex h-9 w-9 -rotate-6 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#fbf9f5] shadow-[2.5px_2.5px_0px_#262626] sm:h-11 sm:w-11 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[2.5px_2.5px_0px_#f2efe9]"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="currentColor"
						stroke="currentColor"
						stroke-width="1.5"
						class="text-[#d9532f]"
					>
						<path
							d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
						/>
					</svg>
				</div>
			</div>
		</div>

		<!-- 1. Event Edition Banner: Warm Monoline Stamp -->
		<div class="relative z-10 mb-6 flex flex-wrap items-center justify-center gap-2.5 sm:mb-8">
			<div
				class="inline-flex -rotate-1 items-center gap-2 rounded-full border-2 border-[#262626] bg-[#a2e1db] px-4 py-1.5 font-mono text-xs font-black tracking-wider text-[#262626] uppercase shadow-[2.5px_2.5px_0px_#262626] transition-transform duration-200 hover:rotate-0 sm:px-5 sm:py-2 sm:text-sm dark:border-[#a2e1db] dark:bg-[#1a1825] dark:text-[#a2e1db]"
			>
				<span>from sketch to life</span>
			</div>
		</div>

		<!-- 2. Main Headline: Editorial Inverted Pyramid Typography (Ukuran Gagah di Mobile & Desktop) -->
		<h1
			class="relative z-10 mb-6 flex flex-col items-center justify-center font-serif font-black tracking-tight text-[#262626] select-none sm:mb-8 dark:text-[#f2efe9]"
		>
			<span class="hero-title-tier1 block">ChibiconXI</span>
			<span class="hero-title-tier2 block opacity-95">Catalogue</span>
			<span
				class="hero-title-tier3 inline-block -rotate-1 text-[#d9532f] transition-transform duration-200 hover:rotate-0 dark:text-[#fea770]"
			>
				@cho.lazey
			</span>
		</h1>

		<!-- 3. Subtitle: Edisi Khusus Pameran (Batch 1 Tiket Stamp Miring) -->
		<div class="relative z-10 mb-8 flex items-center justify-center sm:mb-10">
			<div
				class="group relative inline-flex -rotate-3 items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#fea770] px-4 py-1.5 font-mono text-xs font-black tracking-widest text-[#262626] shadow-[3px_3px_0px_#262626] transition-all duration-200 hover:scale-105 hover:rotate-0 sm:text-sm dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[3px_3px_0px_#b4a6d5]"
			>
				<span
					class="pointer-events-none absolute -top-2.5 -left-2.5 h-4 w-7 -rotate-12 border border-[#262626]/30 bg-[#a2e1db] opacity-90 shadow-xs"
					aria-hidden="true"
				></span>
				<span class="h-2 w-2 rounded-full border border-[#262626] bg-white"></span>
				<span>BATCH 1 // 2026</span>
			</div>
		</div>

		<!-- 4. Action Buttons: Rolling Ticker Asimetris Bergaya Tiket Berpasangan -->
		<div
			class="relative z-10 mb-8 flex flex-col items-center justify-center gap-4 sm:mb-10 sm:flex-row"
		>
			<!-- Primary CTA Arang (Rolling Ticker - Miring -1°) -->
			<a
				href={resolve('/order')}
				class="group relative inline-flex -rotate-1 items-center justify-center overflow-hidden rounded-md border-2 border-[#262626] bg-[#262626] px-6 py-3 text-sm font-bold text-[#f2efe9] shadow-[3px_3px_0px_#262626] transition-all duration-150 hover:-translate-y-0.5 hover:rotate-0 hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none sm:w-auto dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[3px_3px_0px_#f2efe9] dark:hover:bg-[#e0ded8]"
			>
				<span
					class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
				>
					<ShoppingBag size={17} strokeWidth={2.5} />
					<span>Go Shipping !</span>
				</span>
				<span
					class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-2 transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					<ShoppingBag size={17} strokeWidth={2.5} />
					<span>Go Shipping !</span>
				</span>
			</a>

			<!-- Secondary Action Lavender Hover (Rolling Ticker - Miring +1°) -->
			<a
				href={resolve('/order/riwayat')}
				class="group relative inline-flex rotate-1 items-center justify-center overflow-hidden rounded-md border-2 border-[#262626] bg-white px-5 py-3 text-sm font-bold text-[#262626] shadow-[3px_3px_0px_#262626] transition-all duration-150 hover:-translate-y-0.5 hover:rotate-0 hover:bg-[#b4a6d5]/40 active:translate-y-0.5 active:shadow-none sm:w-auto dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[3px_3px_0px_#f2efe9] dark:hover:bg-[#b4a6d5] dark:hover:text-[#1a1825]"
			>
				<span
					class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
				>
					<ReceiptText size={17} strokeWidth={2.5} class="text-[#262626] dark:text-[#f2efe9]" />
					<span>Order Archive</span>
				</span>
				<span
					class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-2 transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					<ReceiptText size={17} strokeWidth={2.5} class="text-[#262626] dark:text-[#1a1825]" />
					<span>Order Archive</span>
				</span>
			</a>
		</div>

		<!-- 5. Washi Tape Anchor Button: Langsung Meluncur ke Panduan How to Order -->
		<div class="relative z-10 flex items-center justify-center">
			<div class="relative inline-flex flex-col items-center justify-center sm:flex-row">
				<!-- Doodle Panah Melengkung Panjang SVG + Handwritten Note -->
				<div
					class="pointer-events-none hidden items-center gap-2 transition-transform duration-200 select-none sm:absolute sm:top-1/2 sm:right-full sm:mr-3 sm:flex sm:origin-right sm:-translate-y-1/2 sm:scale-90 sm:whitespace-nowrap md:mr-5 md:scale-100"
				>
					<span
						class="-rotate-6 font-handwriting text-xl font-bold tracking-wide text-[#d9532f] drop-shadow-xs sm:text-2xl md:text-3xl dark:text-[#fea770]"
					>
						please read this !
					</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="84"
						height="36"
						viewBox="0 0 84 36"
						fill="none"
						class="translate-y-1 text-[#d9532f] sm:translate-y-0.5 dark:text-[#fea770]"
						aria-hidden="true"
					>
						<path
							d="M4 14 C28 8, 54 10, 76 24"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M62 25 L76 24 L72 13"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>

				<a
					href="#how-to-order"
					onclick={(e) => {
						e.preventDefault();
						document.getElementById('how-to-order')?.scrollIntoView({ behavior: 'smooth' });
					}}
					class="group inline-flex items-center gap-2.5 rounded-full border-2 border-[#262626] bg-[#a2e1db] px-6 py-2.5 font-mono text-sm font-black tracking-wider text-[#262626] uppercase shadow-[3px_3px_0px_#262626] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#8ee0d8] hover:shadow-[4px_4px_0px_#262626] active:translate-y-0.5 active:shadow-none sm:px-7 sm:py-3 sm:text-base dark:border-[#a2e1db] dark:bg-[#1a1825] dark:text-[#a2e1db] dark:shadow-[3px_3px_0px_#fea770] dark:hover:bg-[#a2e1db] dark:hover:text-[#120f17] dark:hover:shadow-[4px_4px_0px_#fea770]"
					title="Scroll langsung ke panduan cara pemesanan"
				>
					<span>how to order</span>
					<ArrowDown
						size={16}
						strokeWidth={2.5}
						class="transition-transform duration-200 group-hover:translate-y-1"
					/>
				</a>
			</div>
		</div>
	</section>

	<!-- Section Khusus: Photocard Unboxing Stage (Folder Terselip di Kanan Layar) -->
	<section
		class="relative flex min-h-[380px] w-full items-center justify-end overflow-x-clip px-4 py-10 sm:min-h-[460px] sm:px-6 sm:py-14"
		aria-label="Photocard Vault Showcase"
	>
		<!-- Komposisi Geometri Asimetris Menonjol di Sisi Kiri -->
		<div
			class="pointer-events-none absolute top-1/2 left-2 flex -translate-y-1/2 items-center select-none sm:left-8 lg:left-14"
			aria-hidden="true"
		>
			<div class="relative flex items-center">
				<!-- Geometri 1: Lingkaran Besar Monoline (#a2e1db) -->
				<div
					class="h-44 w-44 rounded-full border-2 border-[#262626] bg-[#a2e1db]/25 shadow-[4px_4px_0px_#262626] sm:h-64 sm:w-64 lg:h-76 lg:w-76 dark:border-[#a2e1db] dark:bg-[#a2e1db]/10 dark:shadow-[4px_4px_0px_#b4a6d5]"
				>
					<div
						class="m-4 h-[calc(100%-32px)] w-[calc(100%-32px)] rounded-full border border-dashed border-[#262626]/30 dark:border-[#f2efe9]/30"
					></div>
				</div>

				<!-- Geometri 2: Bujur Sangkar Taktil (#fea770) Miring Interlocking -->
				<div
					class="absolute -bottom-4 left-24 h-28 w-28 -rotate-12 rounded-xl border-2 border-[#262626] bg-[#fea770]/40 shadow-[3.5px_3.5px_0px_#262626] sm:-bottom-8 sm:left-36 sm:h-40 sm:w-40 lg:left-44 lg:h-48 lg:w-48 dark:border-[#fea770] dark:bg-[#fea770]/20"
				>
					<div
						class="m-auto mt-6 h-6 w-6 rotate-45 border border-[#262626] bg-white sm:mt-10 sm:h-8 sm:w-8 dark:bg-[#1a1825]"
					></div>
				</div>

				<!-- Geometri 3: Patch Drafting Grid Monoline (#ffffff) -->
				<div
					class="nav-drafting-grid absolute -top-4 left-16 h-20 w-28 rotate-6 rounded-md border border-[#262626] bg-white/75 p-2 shadow-[2px_2px_0px_#262626] sm:-top-8 sm:left-24 sm:h-28 sm:w-36 lg:left-32 dark:border-[#f2efe9]/40 dark:bg-[#252331]/80"
				>
					<span class="font-mono text-[9px] font-bold text-[#262626]/50 dark:text-[#f2efe9]/50"
						>+</span
					>
				</div>
			</div>
		</div>

		<!-- Folder Float Terselip di Tepi Kanan Layar (Layer Interaktif z-20) -->
		<div class="relative z-20 origin-bottom-right scale-75 pr-2 sm:scale-100 sm:pr-6 md:pr-10">
			<FolderFloat size={1} />
		</div>
	</section>

	<!-- Transisi Editorial: Police Line Dual Ticket Roll Full-Bleed Breakout (-4.2° & +3.2°) -->
	<FlowingRibbon />

	<!-- Section: Real DB Masonry Showcase (Hardware-Accelerated CSS Transitions) -->
	<div id="masonry-section" class="scroll-mt-6">
		<ProductMasonry products={data.showcaseProducts} title="Visual Showcase Gallery" />
	</div>

	<!-- Section: Cara Order (Sobekan Tiket Panduan dengan Animasi Elastic Pop CSS GPU) -->
	<HowToOrderSection />

	<!-- Grand Scrapbook Colophon / Footer Receipt Card -->
	<footer class="mx-auto max-w-4xl px-4 pt-8 pb-12 sm:pt-12">
		<div
			class="relative overflow-hidden rounded-2xl border-2 border-[#262626] bg-white p-6 shadow-[5px_5px_0px_#262626] sm:p-8 md:p-10 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[5px_5px_0px_#f2efe9]"
		>
			<!-- Washi Tape Aksesoris Sudut Atas Kiri & Kanan -->
			<div
				class="pointer-events-none absolute -top-3.5 left-8 h-5 w-16 -rotate-3 border border-[#262626]/30 bg-[#fea770] opacity-90 shadow-xs"
				aria-hidden="true"
			></div>
			<div
				class="pointer-events-none absolute -top-3.5 right-8 h-5 w-16 rotate-3 border border-[#262626]/30 bg-[#a2e1db] opacity-90 shadow-xs"
				aria-hidden="true"
			></div>

			<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
				<!-- Kolom Kiri: Branding & Deskripsi Toko -->
				<div class="space-y-2 text-left">
					<div class="flex flex-wrap items-center gap-2.5">
						<h2
							class="font-serif text-2xl font-black text-[#262626] sm:text-3xl dark:text-[#f2efe9]"
						>
							cho.lazey
						</h2>
						<span
							class="inline-flex -rotate-2 items-center rounded-md border border-[#262626] bg-[#fea770] px-2 py-0.5 font-mono text-[10px] font-black text-[#262626] uppercase shadow-[1.5px_1.5px_0px_#262626]"
						>
							BATCH 1 // 2026
						</span>
					</div>
					<p
						class="max-w-md font-sans text-xs font-medium text-[#595959] sm:text-sm dark:text-[#b8b5ad]"
					>
						Katalog merchandise resmi pameran & event seni. Beli standee, photocard, keychain, dan
						art prints dengan invoice PDF instan.
					</p>
				</div>

				<!-- Kolom Kanan: Social Media Taktil -->
				<div
					class="flex flex-col items-start gap-3 sm:flex-row sm:items-center md:flex-col md:items-end"
				>
					<div class="flex flex-wrap items-center gap-2">
						{#if data.settings?.instagram}
							<a
								href={`https://instagram.com/${data.settings.instagram.replace('@', '')}`}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#f2efe9] px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-y-0.5 dark:border-[#f2efe9]/40 dark:bg-[#1a1825] dark:text-[#f2efe9]"
							>
								<span>IG: @{data.settings.instagram.replace('@', '')}</span>
								<ExternalLink size={12} />
							</a>
						{/if}
						{#if data.settings?.twitter}
							<a
								href={`https://x.com/${data.settings.twitter.replace('@', '')}`}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#f2efe9] px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-y-0.5 dark:border-[#f2efe9]/40 dark:bg-[#1a1825] dark:text-[#f2efe9]"
							>
								<span>X: @{data.settings.twitter.replace('@', '')}</span>
								<ExternalLink size={12} />
							</a>
						{/if}
					</div>
				</div>
			</div>

			<!-- Garis Perforasi Sobekan Kuitansi / Receipt -->
			<div
				class="my-6 border-b-2 border-dashed border-[#262626]/20 dark:border-[#f2efe9]/20"
				aria-hidden="true"
			></div>

			<!-- Hak Cipta & Colophon Bersih -->
			<div
				class="flex items-center justify-center text-center font-mono text-[11px] text-[#737373] dark:text-[#a3a099]"
			>
				<span>© 2026 cho.lazey. All rights reserved.</span>
			</div>
		</div>
	</footer>

	<!-- FAB Scroll Kembali ke Atas (Posisi Aman Anti-Tabrakan Mobile FAB) -->
	<BackToTopFab />
</div>

<style>
	@keyframes hero-float-1 {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-18px) rotate(-4deg);
		}
	}

	@keyframes hero-float-2 {
		0%,
		100% {
			transform: translateY(0px) scale(1) rotate(0deg);
		}
		50% {
			transform: translateY(-22px) scale(1.06) rotate(5deg);
		}
	}

	@keyframes hero-float-3 {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-16px) rotate(3deg);
		}
	}

	.animate-hero-float-1 {
		animation: hero-float-1 5s ease-in-out infinite;
		will-change: transform;
	}

	.animate-hero-float-2 {
		animation: hero-float-2 6.5s ease-in-out infinite;
		will-change: transform;
	}

	.animate-hero-float-3 {
		animation: hero-float-3 5.8s ease-in-out infinite;
		will-change: transform;
	}

	/* Tipografi Piramida Terbalik: Skala Raksasa Monumental di Mobile & Desktop */
	.hero-title-tier1 {
		font-size: clamp(3.75rem, 16.5vw, 8.5rem);
		line-height: 0.85;
		letter-spacing: -0.035em;
		white-space: nowrap;
	}

	.hero-title-tier2 {
		font-size: clamp(2.75rem, 12vw, 5.75rem);
		line-height: 0.9;
		letter-spacing: -0.025em;
		margin-top: 0.12em;
		white-space: nowrap;
	}

	.hero-title-tier3 {
		font-size: clamp(2.25rem, 9.5vw, 4.5rem);
		line-height: 0.95;
		letter-spacing: -0.015em;
		margin-top: 0.12em;
		white-space: nowrap;
	}
</style>
