<script lang="ts">
	import { Camera, Check, Copy } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let scale = $state<'1' | '0.75' | '0.5'>('0.75');
	let copiedMeta = $state(false);

	const metaSnippet = `<meta property="og:title" content="cho.lazey — Katalog & Invoice Merchandise Resmi" />
<meta property="og:description" content="Pesan standee, keychain, sticker, dan art print original. Bayar via QRIS instan dan terima faktur invoice PDF otomatis." />
<meta property="og:image" content="https://cholazey.store/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://cholazey.store/og.png" />`;

	async function copySnippet() {
		try {
			await navigator.clipboard.writeText(metaSnippet);
			copiedMeta = true;
			toast.success('Snippet meta tags berhasil disalin!');
			setTimeout(() => {
				copiedMeta = false;
			}, 2500);
		} catch {
			toast.error('Gagal mengakses clipboard.');
		}
	}
</script>

<div class="space-y-6">
	<!-- Header Bar & Panduan Ekspor -->
	<div
		class="flex flex-col gap-4 rounded-xl border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-[4px_4px_0px_#f2efe9]"
	>
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<span
					class="rounded-md border-2 border-[#262626] bg-[#fea770] px-2.5 py-0.5 font-mono text-xs font-bold text-[#262626]"
				>
					1200 × 630 PX (1.91:1)
				</span>
				<h2 class="font-serif text-xl font-black text-[#262626] dark:text-[#f2efe9]">
					Open Graph Banner Studio
				</h2>
			</div>
			<p class="font-mono text-xs text-[#595959] dark:text-[#a3a099]">
				Kanvas banner monoline standar Open Graph & Twitter Cards. Siap di-export langsung ke
				<code
					class="rounded bg-[#f2efe9] px-1 py-0.5 text-[#262626] dark:bg-black/30 dark:text-[#f2efe9]"
					>static/og.png</code
				>.
			</p>
		</div>

		<!-- Zoom & Action Controls -->
		<div class="flex flex-wrap items-center gap-2.5">
			<div
				class="flex items-center rounded-lg border-2 border-[#262626] bg-[#f2efe9] p-0.5 font-mono text-xs font-bold dark:border-[#f2efe9] dark:bg-[#252331]"
			>
				<button
					type="button"
					onclick={() => (scale = '0.5')}
					class="rounded-md px-2.5 py-1 transition-colors {scale === '0.5'
						? 'bg-[#262626] text-white dark:bg-[#f2efe9] dark:text-[#262626]'
						: 'text-[#262626] hover:bg-black/5 dark:text-[#f2efe9]'}"
				>
					50%
				</button>
				<button
					type="button"
					onclick={() => (scale = '0.75')}
					class="rounded-md px-2.5 py-1 transition-colors {scale === '0.75'
						? 'bg-[#262626] text-white dark:bg-[#f2efe9] dark:text-[#262626]'
						: 'text-[#262626] hover:bg-black/5 dark:text-[#f2efe9]'}"
				>
					75%
				</button>
				<button
					type="button"
					onclick={() => (scale = '1')}
					class="rounded-md px-2.5 py-1 transition-colors {scale === '1'
						? 'bg-[#262626] text-white dark:bg-[#f2efe9] dark:text-[#262626]'
						: 'text-[#262626] hover:bg-black/5 dark:text-[#f2efe9]'}"
				>
					100%
				</button>
			</div>

			<button
				type="button"
				onclick={copySnippet}
				class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
			>
				{#if copiedMeta}
					<Check size={14} class="text-emerald-600 dark:text-emerald-400" />
					<span>Snippet Tersalin!</span>
				{:else}
					<Copy size={14} />
					<span>Salin Meta Tag</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Panduan Cepat Ekspor Chrome DevTools -->
	<div
		class="relative rounded-lg border-2 border-[#262626] bg-[#fea770]/15 p-4 font-mono text-xs text-[#262626] shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/40 dark:bg-[#fea770]/10 dark:text-[#f2efe9]"
	>
		<div class="flex items-start gap-2.5">
			<Camera size={18} class="mt-0.5 shrink-0 text-[#262626] dark:text-[#fea770]" />
			<div class="space-y-1">
				<p class="text-sm font-black">Cara Mengambil Screenshot 1200×630 Murni Tanpa Distorsi:</p>
				<ol class="list-decimal space-y-0.5 pl-4 opacity-90">
					<li>
						Setel zoom di atas ke <strong>100%</strong> atau buka DevTools (<code class="font-bold"
							>F12</code
						>).
					</li>
					<li>
						Klik kanan tepat di dalam kotak kanvas banner bergaris monoline di bawah → pilih <strong
							>Inspect</strong
						>.
					</li>
					<li>
						Tekan kombinasi <code class="rounded bg-black/10 px-1 font-bold dark:bg-white/10"
							>Ctrl + Shift + P</code
						>
						di DevTools, lalu ketik <code class="font-bold">Capture node screenshot</code> dan tekan Enter.
					</li>
					<li>
						File PNG berukuran murni <strong>1200 × 630 px</strong> akan otomatis terunduh. Ganti
						nama filenya menjadi <code class="font-bold">og.png</code> dan letakkan di folder
						<code class="font-bold">static/og.png</code>.
					</li>
				</ol>
			</div>
		</div>
	</div>

	<!-- Kontainer Kanvas Banner yang di-scale sesuai layar -->
	<div
		class="overflow-x-auto rounded-2xl border-2 border-dashed border-[#262626]/30 bg-[#262626]/5 p-6 dark:border-[#f2efe9]/30 dark:bg-black/30"
	>
		<div
			style="transform: scale({scale}); transform-origin: top left; width: 1200px; height: 630px;"
			class="transition-transform duration-200"
		>
			<!-- NODE TARGET SCREENSHOT (1200px x 630px Monoline Artboard) -->
			<div
				id="og-banner-export-node"
				class="og-drafting-grid-bold relative flex h-[630px] w-[1200px] flex-col items-center justify-between overflow-hidden border-4 border-[#262626] bg-[#f2efe9] px-12 py-10 text-[#262626] shadow-[12px_12px_0px_#262626] select-none"
			>
				<!-- Pojok Hiasan Monoline (+) -->
				<span
					class="absolute top-5 left-5 font-mono text-2xl font-black text-[#262626]/40 select-none"
					>+</span
				>
				<span
					class="absolute top-5 right-5 font-mono text-2xl font-black text-[#262626]/40 select-none"
					>+</span
				>
				<span
					class="absolute bottom-5 left-5 font-mono text-2xl font-black text-[#262626]/40 select-none"
					>+</span
				>
				<span
					class="absolute right-5 bottom-5 font-mono text-2xl font-black text-[#262626]/40 select-none"
					>+</span
				>

				<!-- Section Atas: Pure Inverted Pyramid Typography (Hanya 3 Teks Utama) -->
				<div class="z-10 flex flex-col items-center space-y-4 pt-6 text-center select-none">
					<!-- Tier 1: Brand Raksasa (cho.lazey) -->
					<h1
						class="font-serif text-[118px] leading-[0.82] font-black tracking-tight text-[#262626]"
					>
						cho.lazey
					</h1>

					<!-- Tier 2: The Official Store -->
					<span class="font-mono text-[30px] font-black tracking-[0.24em] text-[#262626] uppercase">
						The Official Store
					</span>

					<!-- Tier 3: from sketch to life -->
					<span
						class="inline-block -rotate-1 font-mono text-[22px] font-bold tracking-widest text-[#d9532f] uppercase"
					>
						from sketch to life
					</span>
				</div>

				<!-- Ornamen Sisi Kiri Kanvas (Offline Inline SVG: Registration Marks & Twin Sparkle) -->
				<div
					class="pointer-events-none absolute top-1/2 left-8 z-10 flex -translate-y-1/2 flex-col items-center gap-6 select-none"
					aria-hidden="true"
				>
					<!-- CMYK Offset Print Registration Target Mark -->
					<svg
						width="68"
						height="68"
						viewBox="0 0 68 68"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						class="text-[#262626]"
					>
						<circle cx="34" cy="34" r="28" stroke="currentColor" stroke-width="2.5" />
						<circle cx="34" cy="34" r="14" stroke="currentColor" stroke-width="2" />
						<line x1="34" y1="2" x2="34" y2="66" stroke="currentColor" stroke-width="2" />
						<line x1="2" y1="34" x2="66" y2="34" stroke="currentColor" stroke-width="2" />
						<circle cx="34" cy="34" r="3.5" fill="currentColor" />
					</svg>

					<!-- Twin 4-Point Sparkle Doodle -->
					<svg
						width="74"
						height="74"
						viewBox="0 0 84 84"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						class="text-[#262626]"
					>
						<path
							d="M32 4 C33 20 48 21 48 22 C33 23 32 39 31 40 C30 24 15 23 15 22 C30 21 31 5 32 4Z"
							fill="#fea770"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linejoin="round"
						/>
						<path
							d="M62 36 C62.6 44 71 44.5 71 45 C62.6 45.5 62 53.5 61.5 54 C61 46 52.5 45.5 52.5 45 C61 44.5 61.4 36.5 62 36Z"
							fill="#a2e1db"
							stroke="currentColor"
							stroke-width="2"
							stroke-linejoin="round"
						/>
						<circle cx="58" cy="62" r="3.5" fill="#d9532f" />
					</svg>
				</div>

				<!-- Ornamen Sisi Kanan Kanvas (Offline Inline SVG: Starburst & Scribble Spiral) -->
				<div
					class="pointer-events-none absolute top-1/2 right-8 z-10 flex -translate-y-1/2 flex-col items-center gap-6 select-none"
					aria-hidden="true"
				>
					<!-- 8-Ray Starburst & Scribble Spiral -->
					<svg
						width="74"
						height="74"
						viewBox="0 0 84 84"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						class="text-[#262626]"
					>
						<path
							d="M42 10 L44 26 L58 18 L48 30 L64 36 L48 40 L56 54 L44 44 L40 60 L36 44 L24 52 L32 38 L16 34 L32 28 L22 16 L36 24 Z"
							fill="#b4a6d5"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linejoin="round"
						/>
						<circle cx="40" cy="35" r="3.5" fill="#262626" />
						<path
							d="M58 54 C66 52 72 58 68 66 C64 74 52 72 54 62 C55 56 62 58 64 62"
							stroke="#d9532f"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>

				<!-- Section Bawah: Symmetrical Fanned Collector Cards Arc (Mekar Megah Tanpa Folder) -->
				<div class="relative z-20 flex w-full items-end justify-center pb-2">
					<div class="relative flex h-[310px] w-[960px] items-end justify-center">
						<!-- Mini Card 1 (Far-Left, -20°, z-10): Photocard 1 -->
						<div
							class="absolute bottom-1 left-[calc(50%-340px)] z-10 flex w-52 -translate-x-1/2 -rotate-20 flex-col items-center rounded-2xl border-[3.5px] border-[#262626] bg-white p-2.5 shadow-[10px_10px_0px_#262626]"
						>
							<div
								class="h-44 w-full overflow-hidden rounded-xl border-2 border-[#262626] bg-[#fea770]"
							>
								<img
									src="/product_1.jpeg"
									alt="Merchandise Art 1"
									class="h-full w-full object-cover"
								/>
							</div>
						</div>

						<!-- Mini Card 2 (Mid-Left, -10°, z-20): Photocard 2 -->
						<div
							class="absolute bottom-5 left-[calc(50%-170px)] z-20 flex w-52 -translate-x-1/2 -rotate-10 flex-col items-center rounded-2xl border-[3.5px] border-[#262626] bg-white p-2.5 shadow-[10px_10px_0px_#262626]"
						>
							<div
								class="h-44 w-full overflow-hidden rounded-xl border-2 border-[#262626] bg-[#a2e1db]"
							>
								<img
									src="/product_2.jpeg"
									alt="Merchandise Art 2"
									class="h-full w-full object-cover"
								/>
							</div>
						</div>

						<!-- Central Mascot Collector Card (Menjulang Megah di Tengah, -1°, z-30) -->
						<div
							class="absolute bottom-9 left-1/2 z-30 flex w-60 -translate-x-1/2 -rotate-1 flex-col items-center rounded-2xl border-[4px] border-[#262626] bg-white p-3 shadow-[12px_12px_0px_#262626]"
						>
							<div
								class="flex h-50 w-full items-center justify-center rounded-xl border-2 border-[#262626] bg-[#fbf9f5] p-3"
							>
								<img
									src="/cholazey_icon.png"
									alt="Maskot Resmi cho.lazey"
									class="h-full w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)] filter"
								/>
							</div>
						</div>

						<!-- Mini Card 3 (Mid-Right, +10°, z-20): Photocard 3 -->
						<div
							class="absolute bottom-5 left-[calc(50%+170px)] z-20 flex w-52 -translate-x-1/2 rotate-10 flex-col items-center rounded-2xl border-[3.5px] border-[#262626] bg-white p-2.5 shadow-[10px_10px_0px_#262626]"
						>
							<div
								class="h-44 w-full overflow-hidden rounded-xl border-2 border-[#262626] bg-[#b4a6d5]"
							>
								<img
									src="/product_3.jpeg"
									alt="Merchandise Art 3"
									class="h-full w-full object-cover"
								/>
							</div>
						</div>

						<!-- Mini Card 4 (Far-Right, +20°, z-10): Photocard 4 -->
						<div
							class="absolute bottom-1 left-[calc(50%+340px)] z-10 flex w-52 -translate-x-1/2 rotate-20 flex-col items-center rounded-2xl border-[3.5px] border-[#262626] bg-white p-2.5 shadow-[10px_10px_0px_#262626]"
						>
							<div
								class="h-44 w-full overflow-hidden rounded-xl border-2 border-[#262626] bg-[#d9cfbe]"
							>
								<img
									src="/product_4.jpeg"
									alt="Merchandise Art 4"
									class="h-full w-full object-cover"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Pratinjau Tampilan Saat di-Share di Media Sosial -->
	<div
		class="space-y-3 rounded-xl border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-[4px_4px_0px_#f2efe9]"
	>
		<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
			Simulasi Tampilan Link Preview (WhatsApp / X / Telegram)
		</h3>
		<div
			class="max-w-md overflow-hidden rounded-xl border-2 border-[#262626] bg-[#f9f7f2] shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
		>
			<div
				class="aspect-[1.91/1] w-full overflow-hidden border-b-2 border-[#262626] bg-[#f2efe9] dark:border-[#f2efe9]/20"
			>
				<!-- Mini preview representation (1:1 miniatur kanvas 1200x630) -->
				<div
					class="og-drafting-grid-bold flex h-full w-full flex-col items-center justify-between p-3 select-none"
				>
					<!-- Mini Piramida Terbalik -->
					<div class="flex flex-col items-center space-y-0.5 pt-2 text-center">
						<p class="font-serif text-2xl leading-none font-black text-[#262626]">cho.lazey</p>
						<span class="font-mono text-[9px] font-black tracking-[0.2em] text-[#262626] uppercase">
							The Official Store
						</span>
						<span
							class="inline-block -rotate-1 font-mono text-[7.5px] font-bold tracking-widest text-[#d9532f] uppercase"
						>
							from sketch to life
						</span>
					</div>

					<!-- Mini Fanned Collector Cards -->
					<div class="relative flex h-16 w-48 items-end justify-center pb-1">
						<!-- Mini Card Kiri (-15°) -->
						<div
							class="absolute bottom-0 left-[calc(50%-42px)] z-10 flex h-11 w-9 -translate-x-1/2 -rotate-15 items-center justify-center rounded-md border border-[#262626] bg-white p-0.5 shadow-[2px_2px_0px_#262626]"
						>
							<div class="h-full w-full overflow-hidden rounded-xs bg-[#fea770]">
								<img src="/product_1.jpeg" alt="" class="h-full w-full object-cover" />
							</div>
						</div>
						<!-- Mini Card Kiri Tengah (-8°) -->
						<div
							class="absolute bottom-1 left-[calc(50%-21px)] z-15 flex h-11 w-9 -translate-x-1/2 -rotate-8 items-center justify-center rounded-md border border-[#262626] bg-white p-0.5 shadow-[2px_2px_0px_#262626]"
						>
							<div class="h-full w-full overflow-hidden rounded-xs bg-[#a2e1db]">
								<img src="/product_2.jpeg" alt="" class="h-full w-full object-cover" />
							</div>
						</div>
						<!-- Mini Card Maskot Tengah (-1°) -->
						<div
							class="absolute bottom-2 left-1/2 z-30 flex h-13 w-10 -translate-x-1/2 -rotate-1 items-center justify-center rounded-md border-[1.5px] border-[#262626] bg-white p-0.5 shadow-[3px_3px_0px_#262626]"
						>
							<div class="flex h-full w-full items-center justify-center rounded-xs bg-[#fbf9f5]">
								<img src="/cholazey_icon.png" alt="" class="h-full w-full object-contain" />
							</div>
						</div>
						<!-- Mini Card Kanan Tengah (+8°) -->
						<div
							class="absolute bottom-1 left-[calc(50%+21px)] z-15 flex h-11 w-9 -translate-x-1/2 rotate-8 items-center justify-center rounded-md border border-[#262626] bg-white p-0.5 shadow-[2px_2px_0px_#262626]"
						>
							<div class="h-full w-full overflow-hidden rounded-xs bg-[#b4a6d5]">
								<img src="/product_3.jpeg" alt="" class="h-full w-full object-cover" />
							</div>
						</div>
						<!-- Mini Card Kanan (+15°) -->
						<div
							class="absolute bottom-0 left-[calc(50%+42px)] z-10 flex h-11 w-9 -translate-x-1/2 rotate-15 items-center justify-center rounded-md border border-[#262626] bg-white p-0.5 shadow-[2px_2px_0px_#262626]"
						>
							<div class="h-full w-full overflow-hidden rounded-xs bg-[#d9cfbe]">
								<img src="/product_4.jpeg" alt="" class="h-full w-full object-cover" />
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="space-y-1 p-3.5">
				<p class="font-mono text-[11px] font-bold text-[#595959] uppercase dark:text-[#a3a099]">
					cholazey.store
				</p>
				<p class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
					cho.lazey — Katalog & Invoice Merchandise Resmi
				</p>
				<p class="line-clamp-2 font-sans text-xs text-[#595959] dark:text-[#a3a099]">
					Pesan merchandise original cho.lazey. Bayar via QRIS instan dan terima faktur invoice PDF
					otomatis.
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	/* Drafting Grid Khusus Kanvas OG Banner: Kotak Lebih Lapang (44px) & Garis Lebih Tipis (1px) */
	.og-drafting-grid-bold {
		background-color: #f2efe9;
		background-image:
			linear-gradient(to right, rgba(38, 38, 38, 0.12) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(38, 38, 38, 0.12) 1px, transparent 1px);
		background-size: 44px 44px;
	}
</style>
