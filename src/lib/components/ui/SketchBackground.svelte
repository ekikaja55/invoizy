<script lang="ts">
	// Komponen dekorasi latar belakang digital scrapbook dengan Dual-Layer Parallax CSS
	// - Layer 1 (Fixed): Tekstur serat kertas & aksen sudut mengapung di viewport
	// - Layer 2 (Document Flow): Aksen coretan sketsa bergulir di sepanjang tinggi halaman (Parallax Depth)
	// Zero-dependency, zero JS scroll listener, 100% GPU-accelerated
</script>

<!-- LAYER 1: FIXED VIEWPORT CANVAS (Melayang Tetap) -->
<div
	class="pointer-events-none fixed inset-0 z-0 h-full w-full select-none overflow-hidden"
	aria-hidden="true"
>
	<!-- Tekstur Serat Kertas Scrapbook Organik -->
	<svg
		class="absolute inset-0 h-full w-full opacity-40 dark:opacity-25"
		xmlns="http://www.w3.org/2000/svg"
	>
		<defs>
			<pattern id="paper-flecks" width="80" height="80" patternUnits="userSpaceOnUse">
				<circle cx="16" cy="24" r="1" class="fill-brandy/50 dark:fill-papaya/40" />
				<circle cx="64" cy="16" r="0.8" class="fill-brandy/40 dark:fill-papaya/30" />
				<circle cx="44" cy="56" r="1.1" class="fill-brandy/45 dark:fill-papaya/35" />
				<circle cx="10" cy="68" r="0.75" class="fill-brandy/35 dark:fill-papaya/25" />
				<circle cx="72" cy="50" r="0.9" class="fill-brandy/40 dark:fill-papaya/30" />
				<path
					d="M28 36l4 2M52 64l3 -3"
					class="stroke-brandy/30 dark:stroke-papaya/25"
					stroke-width="0.75"
					stroke-linecap="round"
				/>
			</pattern>
		</defs>
		<rect width="100%" height="100%" fill="url(#paper-flecks)" />
	</svg>

	<!-- Fixed Doodle 1: Bintang Sketsa Ganda (Kiri Atas) -->
	<div class="absolute left-3 top-12 sm:left-10 sm:top-16 text-tangerine/75 dark:text-tangerine/60 -rotate-6 transform-gpu">
		<svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M34 4L42 24L64 27L48 42L52 64L34 53L16 64L20 42L4 27L26 24L34 4Z"
				class="animate-sketch stroke-current"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				style="animation-delay: 80ms;"
			/>
			<path
				d="M33 9L40 26L59 29L45 42L49 60L33 50L18 60L21 42L7 29L26 26L33 9Z"
				class="animate-sketch stroke-current opacity-70"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				style="animation-delay: 200ms;"
			/>
		</svg>
	</div>

	<!-- Fixed Doodle 2: Spiral Sketsa Spidol (Kanan Atas) -->
	<div class="absolute right-4 top-14 sm:right-14 sm:top-20 text-brandy/65 dark:text-papaya/50 rotate-12 transform-gpu">
		<svg width="72" height="72" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M36 36C36 26 26 16 16 21C6 26 8 46 24 54C42 62 62 49 60 28C58 8 30 2 12 12C-6 22 -1 58 22 76C45 94 86 84 96 56C106 28 86 -5 50 -5"
				class="animate-sketch stroke-current"
				stroke-width="2.2"
				stroke-linecap="round"
				style="animation-delay: 180ms;"
			/>
		</svg>
	</div>

	<!-- Fixed Doodle 3: Sparkle Bintang Sudut (Kiri Bawah) -->
	<div class="absolute left-4 sm:left-10 bottom-16 sm:bottom-20 text-teal/60 dark:text-teal/45 rotate-45 transform-gpu">
		<svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M24 4V44M4 24H44M10 10L38 38M38 10L10 38"
				class="animate-sketch stroke-current"
				stroke-width="2.2"
				stroke-linecap="round"
				style="animation-delay: 260ms;"
			/>
		</svg>
	</div>
</div>

<!-- LAYER 2: DOCUMENT-FLOW CANVAS (Bergulir Mengikuti Konten — Parallax Depth Effect) -->
<div
	class="pointer-events-none absolute inset-0 z-0 h-full w-full select-none overflow-hidden"
	aria-hidden="true"
>
	<!-- Scroll Doodle 1: Garis Squiggle Bergelombang Panjang (Kiri Dokumen, ~360px) -->
	<div class="hidden lg:block absolute left-4 xl:left-8 top-[360px] text-teal/65 dark:text-teal/50 -rotate-12 transform-gpu">
		<svg width="150" height="36" viewBox="0 0 156 36" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M4 18C16 6 28 30 40 18C52 6 64 30 76 18C88 6 100 30 112 18C124 6 136 30 148 18"
				class="animate-sketch stroke-current"
				stroke-width="3"
				stroke-linecap="round"
				style="animation-delay: 320ms;"
			/>
		</svg>
	</div>

	<!-- Scroll Doodle 2: Coretan Selotip / Pita Washi Margin (Kanan Dokumen, ~520px) -->
	<div class="hidden md:block absolute right-4 lg:right-12 top-[520px] text-tangerine/65 dark:text-tangerine/50 rotate-6 transform-gpu">
		<svg width="90" height="42" viewBox="0 0 90 42" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M6 8H84L80 34H2L6 8Z"
				class="animate-sketch stroke-current"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				style="animation-delay: 400ms;"
			/>
			<path
				d="M16 12L12 30M32 12L28 30M48 12L44 30M64 12L60 30"
				class="animate-sketch stroke-current opacity-60"
				stroke-width="1.5"
				stroke-linecap="round"
				style="animation-delay: 480ms;"
			/>
		</svg>
	</div>

	<!-- Scroll Doodle 3: Panah Sketsa Melengkung Mengarah ke Konten (Kanan Dokumen, ~880px) -->
	<div class="hidden md:block absolute right-4 lg:right-10 top-[880px] text-brandy/60 dark:text-papaya/50 rotate-12 transform-gpu">
		<svg width="60" height="106" viewBox="0 0 60 106" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M16 8C42 20 58 48 50 78C48 90 38 102 20 106M20 106L36 102M20 106L30 88"
				class="animate-sketch stroke-current"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				style="animation-delay: 520ms;"
			/>
		</svg>
	</div>

	<!-- Scroll Doodle 4: Arsiran Silang / Crosshatch Patch (Kiri Dokumen, ~1200px) -->
	<div class="hidden lg:block absolute left-4 xl:left-10 top-[1200px] text-brandy/50 dark:text-papaya/40 -rotate-6 transform-gpu">
		<svg width="78" height="68" viewBox="0 0 78 68" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M10 38L60 12M18 50L68 24M26 62L76 36M18 14L42 60M30 12L54 58M42 10L66 56"
				class="animate-sketch stroke-current"
				stroke-width="2"
				stroke-linecap="round"
				style="animation-delay: 580ms;"
			/>
		</svg>
	</div>

	<!-- Scroll Doodle 5: Bintang Doodle Bunga Tambahan (Kanan Dokumen, ~1550px) -->
	<div class="hidden md:block absolute right-6 lg:right-14 top-[1550px] text-teal/65 dark:text-teal/50 rotate-12 transform-gpu">
		<svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M27 4L33 20L49 22L37 34L40 50L27 42L14 50L17 34L5 22L21 20L27 4Z"
				class="animate-sketch stroke-current"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				style="animation-delay: 640ms;"
			/>
		</svg>
	</div>

	<!-- Scroll Doodle 6: Coretan Zig-Zag Catatan Margin (Kiri Dokumen, ~1850px) -->
	<div class="hidden lg:block absolute left-4 xl:left-8 top-[1850px] text-tangerine/65 dark:text-tangerine/50 rotate-3 transform-gpu">
		<svg width="110" height="28" viewBox="0 0 110 28" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M4 14L16 4L28 24L40 4L52 24L64 4L76 24L88 4L100 24L106 14"
				class="animate-sketch stroke-current"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				style="animation-delay: 700ms;"
			/>
		</svg>
	</div>
</div>

<style>
	@keyframes sketchDraw {
		from {
			stroke-dashoffset: 400;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	.animate-sketch {
		stroke-dasharray: 400;
		stroke-dashoffset: 400;
		animation: sketchDraw 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-sketch {
			animation: none !important;
			stroke-dashoffset: 0 !important;
		}
	}
</style>
