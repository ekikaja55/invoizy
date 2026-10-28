<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Image as ImageIcon } from '@lucide/svelte';

	export type ShowcaseProduct = {
		id: string;
		name: string;
		imageUrls?: string[] | null;
		priceInt?: number;
	};

	type Props = {
		products?: ShowcaseProduct[];
		title?: string;
		badgeLabel?: string;
		class?: string;
	};

	let {
		products = [],
		title = 'Visual Showcase Gallery',
		badgeLabel = '',
		class: className = ''
	}: Props = $props();

	let containerRef: HTMLElement | null = $state(null);
	let isVisible = $state(false);

	// Fallback mockup jika DB belum memiliki produk foto saat inisialisasi
	const fallbackMockups: ShowcaseProduct[] = [
		{ id: 'mock-1', name: 'Artwork Print 1', imageUrls: ['/product_1.jpeg'] },
		{ id: 'mock-2', name: 'Artwork Print 2', imageUrls: ['/product_2.jpeg'] },
		{ id: 'mock-3', name: 'Artwork Print 3', imageUrls: ['/product_3.jpeg'] },
		{ id: 'mock-4', name: 'Artwork Print 4', imageUrls: ['/product_4.jpeg'] },
		{ id: 'mock-5', name: 'Artwork Print 5', imageUrls: ['/product_1.jpeg'] },
		{ id: 'mock-6', name: 'Artwork Print 6', imageUrls: ['/product_2.jpeg'] }
	];

	const displayProducts = $derived(products.length > 0 ? products : fallbackMockups);

	// State per-kartu untuk feedback skeleton shimmer
	let loadedMap = $state<Record<string, boolean>>({});

	// Asimetri Bento Grid Radikal (Spanning 4 Kolom di Desktop, 2 Kolom di Mobile)
	function getBentoSpan(index: number): string {
		const cycle = index % 12;
		switch (cycle) {
			case 0:
				// Hero Masterpiece (2x2 besar)
				return 'col-span-2 row-span-2 md:col-span-2 md:row-span-2';
			case 1:
				// Square Art Print (1x1)
				return 'col-span-1 row-span-1 md:col-span-1 md:row-span-1';
			case 2:
				// Tall Vertical Photocard (1x2 ramping)
				return 'col-span-1 row-span-2 md:col-span-1 md:row-span-2';
			case 3:
				// Square Art Print (1x1 pelengkap di bawah slot 1)
				return 'col-span-1 row-span-1 md:col-span-1 md:row-span-1';
			case 4:
				// Wide Cinematic Landscape Banner (2x1)
				return 'col-span-2 row-span-1 md:col-span-2 md:row-span-1';
			case 5:
				// Wide Cinematic Landscape Banner (2x1)
				return 'col-span-2 row-span-1 md:col-span-2 md:row-span-1';
			case 6:
				// Tall Vertical Photocard (1x2 di kiri)
				return 'col-span-1 row-span-2 md:col-span-1 md:row-span-2';
			case 7:
				// Square Art Print (1x1)
				return 'col-span-1 row-span-1 md:col-span-1 md:row-span-1';
			case 8:
				// Hero Centerpiece Kanan (2x2)
				return 'col-span-2 row-span-2 md:col-span-2 md:row-span-2';
			case 9:
				// Square Art Print (1x1 pelengkap di bawah slot 7)
				return 'col-span-1 row-span-1 md:col-span-1 md:row-span-1';
			case 10:
				// Wide Panoramic Banner (2x1)
				return 'col-span-2 row-span-1 md:col-span-2 md:row-span-1';
			case 11:
				// Wide Panoramic Banner (2x1)
				return 'col-span-2 row-span-1 md:col-span-2 md:row-span-1';
			default:
				return 'col-span-1 row-span-1 md:col-span-1 md:row-span-1';
		}
	}

	onMount(() => {
		if (!containerRef) return;

		// Native IntersectionObserver: Sangat ringan (0% beban CPU JS di main thread)
		const observer = new IntersectionObserver(
			([entry]) => {
				isVisible = entry.isIntersecting;
			},
			{ threshold: 0.1 }
		);

		observer.observe(containerRef);

		return () => {
			observer.disconnect();
		};
	});
</script>

<!-- Section Bento Grid Radikal Showcase Murni Foto: Hardware-Accelerated CSS (Bebas Beban JS GSAP) -->
<section
	bind:this={containerRef}
	class="relative mx-auto w-full max-w-6xl px-4 py-8 select-none sm:py-12 {className}"
	aria-label="Katalog Visual Showcase"
>
	<!-- Section Header: Headline Fraunces Display + Hand-Drawn "click anywhere !" Doodle -->
	<div class="mb-8 flex flex-col items-center justify-center gap-1.5 text-center sm:mb-10">
		{#if badgeLabel}
			<div
				class="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#a2e1db] px-3.5 py-1 font-mono text-xs font-bold tracking-wider text-[#262626] uppercase shadow-[1.5px_1.5px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#1a1825] dark:text-[#a2e1db]"
			>
				<span class="h-2 w-2 rounded-full border border-[#262626] bg-[#fea770]"></span>
				<span>{badgeLabel}</span>
			</div>
		{/if}
		<h2
			class="font-serif text-3xl font-extrabold text-[#262626] sm:text-4xl lg:text-5xl dark:text-[#f2efe9]"
		>
			{title}
		</h2>

		<!-- Hand-Drawn Doodle Note: "click anywhere !" + Sweeping Curved SVG Arrow -->
		<div class="relative mt-2 flex items-center justify-center gap-2.5 select-none">
			<span
				class="-rotate-3 font-handwriting text-2xl font-bold tracking-wide text-[#262626] sm:text-3xl md:text-4xl dark:text-[#a2e1db]"
			>
				click anywhere !
			</span>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="62"
				height="44"
				viewBox="0 0 65 45"
				fill="none"
				class="translate-y-2 rotate-6 text-[#262626] sm:h-[50px] sm:w-[72px] dark:text-[#a2e1db]"
				aria-hidden="true"
			>
				<!-- Graceful sweeping curve pointing downwards to bento -->
				<path
					d="M6 10 C26 4, 48 12, 46 36"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<!-- Arrowhead -->
				<path
					d="M34 30 L46 36 L52 24"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>
	</div>

	<!-- Bento Grid Container: Dense Packing dengan Asimetri Radikal -->
	<div
		class="grid grid-flow-dense auto-rows-[160px] grid-cols-2 gap-3.5 sm:auto-rows-[190px] sm:grid-cols-2 sm:gap-4 md:auto-rows-[220px] md:grid-cols-4 md:gap-5 lg:auto-rows-[250px]"
	>
		{#each displayProducts as product, i (product.id)}
			{@const hasImage = Boolean(product.imageUrls && product.imageUrls.length > 0)}
			{@const imageUrl = hasImage ? product.imageUrls![0] : ''}
			{@const isLoaded = Boolean(loadedMap[product.id])}
			{@const spanClass = getBentoSpan(i)}
			{@const isHero = i % 12 === 0 || i % 12 === 8}

			<!-- Bento Item Wrapper: CSS GPU Staggered Reveal + Taktil Spring Hover -->
			<div
				class="{spanClass} h-full w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] {isVisible
					? 'translate-y-0 scale-100 opacity-100'
					: 'translate-y-12 scale-95 opacity-0'}"
				style="transition-delay: {Math.min(i * 60, 480)}ms;"
			>
				<a
					href={resolve('/order')}
					class="group relative block h-full w-full overflow-hidden rounded-xl border-2 border-[#262626] bg-[#f2efe9] shadow-[3.5px_3.5px_0px_#262626] transition-all duration-300 hover:-translate-y-1.5 hover:rotate-[-0.4deg] hover:shadow-[6px_6px_0px_#262626] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db]/40 dark:bg-[#1a1825] dark:shadow-[3.5px_3.5px_0px_#b4a6d5] dark:hover:shadow-[6px_6px_0px_#f2efe9]"
					title="Buka katalog order untuk {product.name}"
				>
					<div class="relative h-full w-full overflow-hidden">
						{#if hasImage}
							<!-- Skeleton Card Shimmer (Aktif saat gambar sedang di-fetch browser) -->
							{#if !isLoaded}
								<div
									class="nav-drafting-grid absolute inset-0 flex animate-pulse flex-col items-center justify-center bg-[#f2efe9] p-4 text-[#262626]/30 dark:bg-[#252331] dark:text-[#f2efe9]/30"
									aria-hidden="true"
								>
									<div
										class="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-[#262626]/30 dark:border-[#f2efe9]/30"
									>
										<span class="font-mono text-sm font-bold">+</span>
									</div>
									<div
										class="mt-3 h-2 w-16 rounded-full bg-[#262626]/10 dark:bg-[#f2efe9]/10"
									></div>
								</div>
							{/if}

							<!-- Foto Produk Asli dari Database (Fade-in saat loaded) -->
							<img
								src={imageUrl}
								alt={product.name}
								loading="lazy"
								decoding="async"
								onload={() => {
									loadedMap[product.id] = true;
								}}
								class="h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105 {isLoaded
									? 'opacity-100'
									: 'opacity-0'}"
							/>

							<!-- Hero Card Badge: Stempel Eksklusif di Sudut Kiri Atas -->
							{#if isHero}
								<div
									class="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-md border border-[#262626] bg-white/90 px-2 py-0.5 font-mono text-[9px] font-black tracking-wider text-[#262626] uppercase shadow-[1.5px_1.5px_0px_#262626] backdrop-blur-xs sm:top-3 sm:left-3 sm:text-[10px] dark:border-[#a2e1db] dark:bg-[#1a1825]/90 dark:text-[#a2e1db]"
									aria-hidden="true"
								>
									<span class="h-1.5 w-1.5 rounded-full bg-[#fea770]"></span>
									<span>FEATURED</span>
								</div>
							{/if}
						{:else}
							<!-- Fallback Blueprint Monoline untuk Produk Tanpa Foto -->
							<div
								class="nav-drafting-grid flex h-full w-full flex-col items-center justify-center bg-[#f2efe9] p-4 text-center dark:bg-[#252331]"
							>
								<div
									class="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#262626] bg-[#fea770]/20 text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:text-[#f2efe9]"
								>
									<ImageIcon size={24} strokeWidth={2} />
								</div>
								<span
									class="mt-2.5 rounded border border-[#262626] bg-white px-2 py-0.5 font-mono text-[9px] font-bold text-[#262626] uppercase shadow-[1px_1px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#1a1825] dark:text-[#a2e1db]"
								>
									ARCHIVE ITEM
								</span>
								<p
									class="mt-1.5 line-clamp-1 font-serif text-xs font-bold text-[#262626] dark:text-[#f2efe9]"
								>
									{product.name}
								</p>
							</div>
						{/if}
					</div>
				</a>
			</div>
		{/each}
	</div>
</section>
