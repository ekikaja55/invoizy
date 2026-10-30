<script lang="ts">
	import { resolve } from '$app/paths';
	import { toggleMode, mode } from 'mode-watcher';
	import InstagramIcon from '$lib/components/icons/InstagramIcon.svelte';
	import { ArrowUp, MessageSquare, Sun, Moon, Home } from '@lucide/svelte';

	let lang = $state<'id' | 'en'>('id');
	let imageFailed = $state(false);
	let imageSrc = $state('/profile_pict_dev.jpeg');

	function toggleLang() {
		lang = lang === 'id' ? 'en' : 'id';
	}

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleImageError() {
		if (imageSrc.endsWith('.jpeg')) {
			imageSrc = '/profile_pict_dev.png';
		} else {
			imageFailed = true;
		}
	}

	const waLink = $derived.by(() => {
		const message =
			lang === 'id'
				? 'Hai Ekik, aku chat kamu dari web cholazey.store ada yang mau aku obrolin...'
				: "Hi Ekik, I'm reaching out from the cholazey.store website, I'd like to discuss...";
		return `https://wa.me/6289637181522?text=${encodeURIComponent(message)}`;
	});
</script>

<svelte:head>
	<title>Behind The Scenes — cholazey.store</title>
	<meta
		name="description"
		content="Cerita di balik layar pembuatan web cholazey.store: arsitektur sistem, teknologi, dan kontak web developer."
	/>
	<link rel="preload" as="image" href="/profile_pict_dev.jpeg" fetchpriority="high" />
</svelte:head>

<div
	class="drafting-grid min-h-screen overflow-x-clip bg-[#f2efe9] font-sans text-[#262626] transition-colors dark:bg-[#1a1825] dark:text-[#f2efe9]"
>
	<!-- Top Bar: Tanpa Sidebar & FAB, Tombol Beranda & Switch Bahasa di Kiri, Toggle Theme di Kanan -->
	<header class="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:px-8 lg:px-8">
		<div class="flex items-center justify-between gap-4">
			<!-- KIRI: Home Button [Icon Only] sejajar dengan Language Toggle Button [ID / EN] -->
			<div class="flex items-center gap-2">
				<a
					href={resolve('/')}
					class="inline-flex h-10 w-10 items-center justify-center rounded-md border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
					aria-label={lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
					title={lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
				>
					<Home size={19} strokeWidth={2.5} class="shrink-0" />
				</a>

				<button
					type="button"
					onclick={toggleLang}
					class="inline-flex h-10 w-12 items-center justify-center rounded-md border-2 border-[#262626] bg-white px-2 py-1.5 font-mono text-xs font-black text-[#262626] uppercase shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
					aria-label="Ganti Bahasa / Switch Language"
					title={lang === 'id' ? 'Ganti ke Bahasa Inggris' : 'Switch to English'}
				>
					<span>{lang.toUpperCase()}</span>
				</button>
			</div>

			<!-- KANAN: Theme Toggle Icon Only -->
			<div class="flex items-center">
				<button
					type="button"
					onclick={toggleMode}
					class="inline-flex h-10 w-10 items-center justify-center rounded-md border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
					aria-label="Ganti Tema / Toggle Theme"
					title={mode.current === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
				>
					{#if mode.current === 'dark'}
						<Moon size={19} strokeWidth={2.5} class="shrink-0" />
					{:else}
						<Sun size={19} strokeWidth={2.5} class="shrink-0" />
					{/if}
				</button>
			</div>
		</div>
	</header>

	<!-- Main Container Lebar (max-w-7xl) dengan Asymmetric Two-Column Editorial Layout -->
	<main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 md:py-8 lg:px-8 lg:py-10">
		<div class="grid grid-cols-1 items-start gap-12 md:grid-cols-12 md:gap-8 lg:gap-16">
			<!-- KOLOM KIRI (Sticky Anchor Tablet & Desktop): Icon Only Button + Headline Raksasa + Foto Full 1 Card -->
			<aside class="space-y-8 md:sticky md:top-8 md:col-span-5 md:self-start">
				<!-- 1. Section Icon di Atas Title Raksasa (Icon Only, Tanpa Teks) -->
				<div class="flex items-center gap-2.5">
					<!-- GitHub -->
					<a
						href="https://github.com/ekikaja55"
						target="_blank"
						rel="external noopener noreferrer"
						class="inline-flex h-10 w-10 items-center justify-center rounded-md border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
						aria-label="GitHub Profile"
						title="GitHub"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="shrink-0"
							aria-hidden="true"
						>
							<path
								d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
							/>
							<path d="M9 18c-4.51 2-5-2-7-2" />
						</svg>
					</a>

					<!-- Instagram -->
					<a
						href="https://www.instagram.com/filenya_ekik.zip/"
						target="_blank"
						rel="external noopener noreferrer"
						class="inline-flex h-10 w-10 items-center justify-center rounded-md border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
						aria-label="Instagram Profile"
						title="Instagram"
					>
						<InstagramIcon size={18} />
					</a>

					<!-- WhatsApp -->
					<a
						href="https://wa.me/6289637181522"
						target="_blank"
						rel="external noopener noreferrer"
						class="inline-flex h-10 w-10 items-center justify-center rounded-md border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
						aria-label="WhatsApp Direct Chat"
						title="WhatsApp"
					>
						<MessageSquare size={18} />
					</a>
				</div>

				<!-- 2. Headline Raksasa Radikal di Semua Viewport (Termasuk Tablet 1020px) -->
				<div>
					<h1
						class="font-serif text-[17vw] leading-[0.9] font-black tracking-normal text-[#262626] sm:text-[13vw] md:text-7xl md:leading-[0.88] lg:text-8xl lg:leading-[0.88] xl:text-9xl dark:text-[#f2efe9]"
					>
						Behind<br />The<br />Scenes
					</h1>
				</div>

				<!-- 3. Bingkai Foto Full 1 Card (Foto Only, Tanpa Teks, Path: /profile_pict_dev.jpeg) -->
				<div
					class="relative w-64 overflow-hidden rounded-xl border-2 border-[#262626] bg-white p-2.5 shadow-[5px_5px_0px_#262626] transition-transform hover:-rotate-1 sm:w-72 md:w-full md:max-w-[280px] lg:w-80 lg:max-w-none dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[5px_5px_0px_#f2efe9]"
				>
					{#if !imageFailed}
						<img
							src={imageSrc}
							alt="Ekik"
							width="320"
							height="320"
							loading="eager"
							fetchpriority="high"
							decoding="sync"
							class="aspect-square w-full rounded-lg border-2 border-[#262626] object-cover dark:border-[#f2efe9]/40"
							onerror={handleImageError}
						/>
					{:else}
						<div
							class="flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 border-[#262626] bg-[#f9f7f2] text-[#262626] dark:border-[#f2efe9]/40 dark:bg-[#1a1825] dark:text-[#f2efe9]"
						>
							<span class="font-mono text-5xl font-black sm:text-6xl">&lt;/&gt;</span>
							<span class="mt-3 font-mono text-xs font-bold tracking-widest uppercase">Ekik</span>
						</div>
					{/if}
				</div>
			</aside>

			<!-- KOLOM KANAN (Alur Editorial Radikal, No-Card Design, Tipografi Raksasa) -->
			<div class="space-y-16 sm:space-y-20 md:col-span-7">
				<!-- STEP 1 : ABOUT DEV -->
				<section class="space-y-4">
					<div
						class="flex items-baseline gap-4 border-b-2 border-[#262626] pb-3 dark:border-[#f2efe9]"
					>
						<span
							class="font-mono text-2xl font-black text-[#262626]/40 sm:text-3xl dark:text-[#f2efe9]/40"
						>
							01
						</span>
						<h2
							class="font-serif text-2xl font-black tracking-tight text-[#262626] sm:text-3xl md:text-4xl dark:text-[#f2efe9]"
						>
							About dev
						</h2>
					</div>

					<div class="space-y-2 pt-2">
						<h3
							class="font-serif text-xl font-black text-[#262626] sm:text-2xl md:text-3xl dark:text-[#f2efe9]"
						>
							{lang === 'id' ? 'Panggil aja Ekik' : 'Just call me Ekik'}
						</h3>
						<p
							class="font-sans text-base leading-relaxed font-medium text-[#404040] sm:text-lg md:text-xl dark:text-[#b8b5ad]"
						>
							{lang === 'id'
								? 'Orang biasa yang kadang lupa tidur'
								: 'Just a regular guy who struggles with sleep.'}
						</p>
					</div>
				</section>

				<!-- STEP 2 : CONTEXT (NO CARD DESIGN) -->
				<section class="space-y-4">
					<div
						class="flex items-baseline gap-4 border-b-2 border-[#262626] pb-3 dark:border-[#f2efe9]"
					>
						<span
							class="font-mono text-2xl font-black text-[#262626]/40 sm:text-3xl dark:text-[#f2efe9]/40"
						>
							02
						</span>
						<h2
							class="font-serif text-2xl font-black tracking-tight text-[#262626] sm:text-3xl md:text-4xl dark:text-[#f2efe9]"
						>
							Context
						</h2>
					</div>

					<div class="space-y-2 pt-2">
						<span
							class="inline-block font-mono text-xs font-black tracking-wider text-[#404040] uppercase sm:text-sm dark:text-[#b8b5ad]"
						>
							{lang === 'id' ? 'Latar Belakang' : 'Background Story'}
						</span>
						<p
							class="font-sans text-base leading-relaxed text-[#262626] sm:text-lg md:text-xl dark:text-[#f2efe9]"
						>
							{lang === 'id'
								? 'Sebelum cholazey.store dibangun, pesanan merchandise dicatat manual lewat Google Form dan diolah di Google Sheets. Proses ini rawan kesalahan hitung stok saat pengunjung booth offline ramai.'
								: 'Before cholazey.store was built, merchandise orders were recorded manually via Google Form and tracked in Google Sheets. This was prone to stock calculation errors during crowded offline booth events.'}
						</p>
					</div>
				</section>

				<!-- STEP 3 : SOLUTION (NO CARD DESIGN) -->
				<section class="space-y-4">
					<div
						class="flex items-baseline gap-4 border-b-2 border-[#262626] pb-3 dark:border-[#f2efe9]"
					>
						<span
							class="font-mono text-2xl font-black text-[#262626]/40 sm:text-3xl dark:text-[#f2efe9]/40"
						>
							03
						</span>
						<h2
							class="font-serif text-2xl font-black tracking-tight text-[#262626] sm:text-3xl md:text-4xl dark:text-[#f2efe9]"
						>
							Solution
						</h2>
					</div>

					<div class="space-y-2 pt-2">
						<span
							class="inline-block font-mono text-xs font-black tracking-wider text-[#404040] uppercase sm:text-sm dark:text-[#b8b5ad]"
						>
							{lang === 'id' ? 'Pendekatan Sistem' : 'System Approach'}
						</span>
						<p
							class="font-sans text-base leading-relaxed text-[#262626] sm:text-lg md:text-xl dark:text-[#f2efe9]"
						>
							{lang === 'id'
								? 'Project ini merupakan "Solo Project" menggantikan alur pembelian manual menjadi aplikasi basis web yang diperuntukkan bagi @cho.lazey community.'
								: 'This project is a "Solo Project" replacing manual purchasing workflows with a dedicated web platform tailored for the @cho.lazey community.'}
						</p>
					</div>
				</section>

				<!-- STEP 4 : TECH STACKS (NO CARD DESIGN, VERTICAL LIST 5 STACKS VALID TANPA PUPPETEER) -->
				<section class="space-y-6">
					<div
						class="flex items-baseline gap-4 border-b-2 border-[#262626] pb-3 dark:border-[#f2efe9]"
					>
						<span
							class="font-mono text-2xl font-black text-[#262626]/40 sm:text-3xl dark:text-[#f2efe9]/40"
						>
							04
						</span>
						<h2
							class="font-serif text-2xl font-black tracking-tight text-[#262626] sm:text-3xl md:text-4xl dark:text-[#f2efe9]"
						>
							Tech Stacks
						</h2>
					</div>

					<p
						class="font-sans text-base leading-relaxed text-[#404040] sm:text-lg dark:text-[#b8b5ad]"
					>
						{lang === 'id'
							? 'Daftar perangkat teknologi & peran nyatanya dalam aplikasi:'
							: 'Core tech stack and their tangible roles in the app:'}
					</p>

					<!-- List Vertikal No-Card dengan Icon SVG Offline (5 Stacks Valid) -->
					<div class="space-y-6 pt-2">
						<!-- 1. SvelteKit 5 (Browser SVG Icon) -->
						<div
							class="flex items-start gap-4 border-b border-[#262626]/15 pb-6 sm:gap-6 dark:border-[#f2efe9]/15"
						>
							<div
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
							>
								<!-- Browser Window SVG Icon -->
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<rect width="20" height="16" x="2" y="4" rx="2" />
									<path d="M6 8h.01M10 8h.01M14 8h.01M2 12h20" />
								</svg>
							</div>
							<div class="space-y-1">
								<div class="flex flex-wrap items-baseline gap-2">
									<h4
										class="font-mono text-xl font-black text-[#262626] uppercase sm:text-2xl dark:text-[#f2efe9]"
									>
										SvelteKit 5
									</h4>
									<span
										class="font-mono text-xs font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad]"
									>
										· Web Framework
									</span>
								</div>
								<p
									class="font-sans text-base leading-relaxed text-[#404040] sm:text-lg dark:text-[#b8b5ad]"
								>
									{lang === 'id'
										? 'Framework web dengan performa yang lebih stabil dari kompetitor.'
										: 'Web framework delivering significantly more stable performance.'}
								</p>
							</div>
						</div>

						<!-- 2. Tailwind CSS -->
						<div
							class="flex items-start gap-4 border-b border-[#262626]/15 pb-6 sm:gap-6 dark:border-[#f2efe9]/15"
						>
							<div
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
							>
								<!-- Tailwind/Styling Engine SVG -->
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z"
									/>
								</svg>
							</div>
							<div class="space-y-1">
								<div class="flex flex-wrap items-baseline gap-2">
									<h4
										class="font-mono text-xl font-black text-[#262626] uppercase sm:text-2xl dark:text-[#f2efe9]"
									>
										Tailwind CSS
									</h4>
									<span
										class="font-mono text-xs font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad]"
									>
										· Styling Engine
									</span>
								</div>
								<p
									class="font-sans text-base leading-relaxed text-[#404040] sm:text-lg dark:text-[#b8b5ad]"
								>
									{lang === 'id'
										? 'Layoting monoline ala scrapbook manual.'
										: 'Manual scrapbook monoline layout styling.'}
								</p>
							</div>
						</div>

						<!-- 3. Supabase / PostgreSQL -->
						<div
							class="flex items-start gap-4 border-b border-[#262626]/15 pb-6 sm:gap-6 dark:border-[#f2efe9]/15"
						>
							<div
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
							>
								<!-- Database SVG -->
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<ellipse cx="12" cy="5" rx="9" ry="3" />
									<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
									<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
								</svg>
							</div>
							<div class="space-y-1">
								<div class="flex flex-wrap items-baseline gap-2">
									<h4
										class="font-mono text-xl font-black text-[#262626] uppercase sm:text-2xl dark:text-[#f2efe9]"
									>
										Supabase
									</h4>
									<span
										class="font-mono text-xs font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad]"
									>
										· PostgreSQL
									</span>
								</div>
								<p
									class="font-sans text-base leading-relaxed text-[#404040] sm:text-lg dark:text-[#b8b5ad]"
								>
									{lang === 'id'
										? 'Gudang data katalog & pesanan yang aman dan rapi.'
										: 'Secure and orderly database for catalogs and orders.'}
								</p>
							</div>
						</div>

						<!-- 4. Upstash / Serverless Redis -->
						<div
							class="flex items-start gap-4 border-b border-[#262626]/15 pb-6 sm:gap-6 dark:border-[#f2efe9]/15"
						>
							<div
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
							>
								<!-- Redis/Layers SVG -->
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<polygon points="12 2 2 7 12 12 22 7 12 2" />
									<polyline points="2 17 12 22 22 17" />
									<polyline points="2 12 12 17 22 12" />
								</svg>
							</div>
							<div class="space-y-1">
								<div class="flex flex-wrap items-baseline gap-2">
									<h4
										class="font-mono text-xl font-black text-[#262626] uppercase sm:text-2xl dark:text-[#f2efe9]"
									>
										Upstash
									</h4>
									<span
										class="font-mono text-xs font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad]"
									>
										· Serverless Redis
									</span>
								</div>
								<p
									class="font-sans text-base leading-relaxed text-[#404040] sm:text-lg dark:text-[#b8b5ad]"
								>
									{lang === 'id'
										? 'Penjaga antrean pesanan biar web ga "overload" pas event rame.'
										: 'Order queue guardian preventing crashes during traffic spikes.'}
								</p>
							</div>
						</div>

						<!-- 5. Vercel -->
						<div class="flex items-start gap-4 pb-2 sm:gap-6">
							<div
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
							>
								<!-- Vercel Triangle -->
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="currentColor"
									aria-hidden="true"
								>
									<path d="M12 1L24 22H0L12 1Z" />
								</svg>
							</div>
							<div class="space-y-1">
								<div class="flex flex-wrap items-baseline gap-2">
									<h4
										class="font-mono text-xl font-black text-[#262626] uppercase sm:text-2xl dark:text-[#f2efe9]"
									>
										Vercel
									</h4>
									<span
										class="font-mono text-xs font-bold tracking-wider text-[#404040] uppercase dark:text-[#b8b5ad]"
									>
										· Edge / sin1
									</span>
								</div>
								<p
									class="font-sans text-base leading-relaxed text-[#404040] sm:text-lg dark:text-[#b8b5ad]"
								>
									{lang === 'id'
										? 'Server dekat dari Indonesia biar aksesnya cepat (tidak lag).'
										: 'Servers close to Indonesia for swift, lag-free access.'}
								</p>
							</div>
						</div>
					</div>
				</section>

				<!-- STEP 5 : SEEMS GOOD? (CALL TO ACTION, NO CARD DESIGN) -->
				<section class="space-y-6 pt-4">
					<div
						class="flex items-baseline gap-4 border-b-2 border-[#262626] pb-3 dark:border-[#f2efe9]"
					>
						<span
							class="font-mono text-2xl font-black text-[#262626]/40 sm:text-3xl dark:text-[#f2efe9]/40"
						>
							05
						</span>
						<h2
							class="font-serif text-2xl font-black tracking-tight text-[#262626] sm:text-3xl md:text-4xl dark:text-[#f2efe9]"
						>
							Seems good?
						</h2>
					</div>

					<p
						class="font-sans text-base leading-relaxed text-[#262626] sm:text-lg md:text-xl dark:text-[#f2efe9]"
					>
						{lang === 'id'
							? 'Jika kamu tertarik membangun aplikasi seperti ini atau kamu punya ide lain atau ada pertanyaan lain mungkin? Kontak aja aku.'
							: 'Interested in building an application like this, or have other ideas/questions? Feel free to contact me.'}
					</p>

					<!-- Action Buttons -->
					<div class="flex flex-wrap items-center gap-3 pt-2">
						<!-- Tombol WA -->
						<a
							href={waLink}
							target="_blank"
							rel="external noopener noreferrer"
							class="inline-flex min-h-[48px] items-center gap-2.5 rounded-lg border-2 border-[#262626] bg-[#262626] px-6 py-3 font-mono text-xs font-bold text-white shadow-[3px_3px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 sm:text-sm dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
						>
							<MessageSquare size={17} />
							<span>{lang === 'id' ? 'Hubungi via WhatsApp' : 'Contact via WhatsApp'}</span>
						</a>

						<!-- Tombol Kembali ke Atas -->
						<button
							type="button"
							onclick={scrollToTop}
							class="inline-flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-[#262626] bg-white px-5 py-2.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
						>
							<ArrowUp size={15} />
							<span>{lang === 'id' ? 'Kembali ke Atas' : 'Back to Top'}</span>
						</button>
					</div>
				</section>
			</div>
		</div>
	</main>
</div>
