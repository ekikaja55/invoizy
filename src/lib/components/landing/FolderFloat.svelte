<script module lang="ts">
	export type FolderCard = {
		image: string;
		alt?: string;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		color?: string;
		accentColor?: string;
		size?: number;
		items?: FolderCard[];
		class?: string;
	};

	let {
		color = '#fea770',
		accentColor = '#a2e1db',
		size = 1,
		items = [],
		class: className = ''
	}: Props = $props();

	// 4 Gambar Produk Statis murni koleksi seni (Photocard / Polaroid Print Koleksi)
	const defaultCards: FolderCard[] = [
		{ image: '/product_1.jpeg', alt: 'Product 1' },
		{ image: '/product_2.jpeg', alt: 'Product 2' },
		{ image: '/product_3.jpeg', alt: 'Product 3' },
		{ image: '/product_4.jpeg', alt: 'Product 4' }
	];

	const cards = $derived(items.length >= 4 ? items.slice(0, 4) : defaultCards);

	let open = $state(false);
	let hovered = $state(false);
	let paperOffsets = $state<{ x: number; y: number }[]>([
		{ x: 0, y: 0 },
		{ x: 0, y: 0 },
		{ x: 0, y: 0 },
		{ x: 0, y: 0 }
	]);

	// Preload gambar ke in-memory cache browser agar saat folder diklik tidak ada delay/flicker render
	onMount(() => {
		cards.forEach((card) => {
			if (card.image) {
				const img = new Image();
				img.src = card.image;
			}
		});
	});

	function handleClick() {
		const wasOpen = open;
		open = !open;
		if (wasOpen) {
			paperOffsets = [
				{ x: 0, y: 0 },
				{ x: 0, y: 0 },
				{ x: 0, y: 0 },
				{ x: 0, y: 0 }
			];
		}
	}

	function onPaperMove(e: MouseEvent, i: number) {
		if (!open) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		paperOffsets = paperOffsets.map((p, idx) =>
			idx === i
				? {
						x: Math.max(-15, Math.min(15, (e.clientX - cx) * 0.15)),
						y: Math.max(-15, Math.min(15, (e.clientY - cy) * 0.15))
					}
				: p
		);
	}

	function onPaperLeave(_e: MouseEvent, i: number) {
		paperOffsets = paperOffsets.map((p, idx) => (idx === i ? { x: 0, y: 0 } : p));
	}

	// 4 Kartu mekar penuh (-28° s/d +28°) keluar dari bukaan atas folder saat open
	function getOpenTransform(i: number): string {
		switch (i) {
			case 0:
				return 'translate(-160%, -105%) rotate(-28deg)';
			case 1:
				return 'translate(-85%, -140%) rotate(-10deg)';
			case 2:
				return 'translate(20%, -140%) rotate(10deg)';
			case 3:
				return 'translate(95%, -105%) rotate(28deg)';
			default:
				return '';
		}
	}

	// Efek "Mengintip" (Hover Peek): kartu sedikit meluncur naik & memisah tipis sebelum diklik
	function getPeekTransform(i: number): string {
		switch (i) {
			case 0:
				return 'translate(-62%, -34px) rotate(-8deg)';
			case 1:
				return 'translate(-54%, -46px) rotate(-3deg)';
			case 2:
				return 'translate(-46%, -46px) rotate(3deg)';
			case 3:
				return 'translate(-38%, -34px) rotate(8deg)';
			default:
				return '';
		}
	}
</script>

<svelte:head>
	{#each cards as item (item.image)}
		{#if item.image}
			<link rel="preload" as="image" href={item.image} />
		{/if}
	{/each}
</svelte:head>

<!-- Container Folder Terselip di Pojok Kanan -->
<div class="relative flex items-center justify-end select-none {className}">
	<!-- Doodle Curved Arrow & Handwritten Anotasi: "check this out !" (Fades out saat folder mekar) -->
	<div
		class="pointer-events-none absolute -top-16 -left-48 z-30 flex items-center gap-2 transition-all duration-300 ease-out sm:-top-20 sm:-left-60 md:-top-24 md:-left-72 {open
			? 'translate-y-2 opacity-0'
			: 'translate-y-0 opacity-100'}"
		aria-hidden="true"
	>
		<span
			class="-rotate-6 font-handwriting text-2xl font-bold tracking-wide text-[#262626] drop-shadow-xs sm:text-3xl md:text-4xl dark:text-[#fea770]"
		>
			check this out !
		</span>

		<!-- Hand-drawn curved arrow SVG (Ukuran diperpanjang menyapu anggun ke arah folder) -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="96"
			height="48"
			viewBox="0 0 100 50"
			fill="none"
			class="translate-y-3 rotate-12 text-[#262626] sm:h-[56px] sm:w-[115px] dark:text-[#fea770]"
		>
			<!-- Long graceful swooping curve -->
			<path
				d="M4 28 C28 4, 70 4, 95 38"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<!-- Hand-drawn arrowhead -->
			<path
				d="M81 37 L95 38 L93 24"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</div>

	<!-- Folder Body Rotated -45 Degrees (Menghadap Diagonal Kiri-Atas) -->
	<div
		class="group relative cursor-pointer transition-transform duration-300 ease-out"
		style="transform: rotate(-45deg) scale({size}); transform-origin: bottom right;"
		onclick={handleClick}
		onmouseenter={() => (hovered = true)}
		onmouseleave={() => (hovered = false)}
		role="button"
		tabindex="0"
		aria-expanded={open}
		aria-label="Buka folder photocard merchandise ChibiconXI"
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleClick();
			}
		}}
	>
		<!-- Folder Wrapper (Responsif: Mobile 195px, Tablet 220px, Desktop 235px) -->
		<div
			class="relative h-[145px] w-[195px] rounded-tr-[14px] rounded-br-[10px] rounded-bl-[14px] border-2 border-[#262626] shadow-[4px_4px_0px_#262626] transition-all sm:h-[165px] sm:w-[220px] lg:h-[175px] lg:w-[235px] dark:border-[#a2e1db] dark:shadow-[4px_4px_0px_#b4a6d5]"
			style="background-color: {accentColor};"
		>
			<!-- Folder Tab Flap (Top Left Tab) -->
			<span
				class="absolute -top-[17px] left-[-2px] h-[17px] w-[65px] rounded-tl-[8px] rounded-tr-[8px] border-t-2 border-r-2 border-l-2 border-[#262626] sm:-top-[19px] sm:h-[19px] sm:w-[75px] sm:rounded-tl-[10px] sm:rounded-tr-[10px] lg:-top-[20px] lg:h-[20px] lg:w-[82px] dark:border-[#a2e1db]"
				style="background-color: {accentColor};"
			></span>

			<!-- 4 Floating Merchandise Cards: Murni Foto Penuh 1 Card (Hover Peek & Full Spring Burst) -->
			{#each cards as item, i (i)}
				<div
					onmousemove={(e) => onPaperMove(e, i)}
					onmouseleave={(e) => onPaperLeave(e, i)}
					role="presentation"
					class="absolute bottom-[10%] left-1/2 overflow-hidden rounded-lg border-2 border-[#262626] bg-[#262626] shadow-[3px_3px_0px_#262626] transition-all duration-500 ease-out dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-[3px_3px_0px_#f2efe9] {open
						? 'pointer-events-auto z-30 h-[160px] w-[120px] hover:!z-50 hover:scale-120 hover:!rotate-0 hover:shadow-[6px_6px_0px_#262626] sm:h-[180px] sm:w-[135px] lg:h-[195px] lg:w-[145px] dark:hover:shadow-[6px_6px_0px_#f2efe9]'
						: hovered
							? 'pointer-events-none z-10 h-[115px] w-[98px] sm:h-[125px] sm:w-[108px] lg:h-[135px] lg:w-[115px]'
							: 'pointer-events-none z-10 h-[100px] w-[90px] -translate-x-1/2 translate-y-[6%] sm:h-[110px] sm:w-[95px] lg:h-[118px] lg:w-[102px]'}"
					style="{open
						? `transform: ${getOpenTransform(i)} translate(${paperOffsets[i].x}px, ${paperOffsets[i].y}px);`
						: hovered
							? `transform: ${getPeekTransform(i)};`
							: `transform: translate(-50%, ${i * -3}px) rotate(${i * 2 - 3}deg);`} transition-timing-function: cubic-bezier(0.34, 1.45, 0.64, 1); transition-delay: {open
						? i * 65
						: (3 - i) * 35}ms;"
				>
					<!-- Isi Kartu: 100% Foto Penuh Satu Kartu Tanpa Padding/Margin/Teks -->
					<img
						src={item.image}
						alt={item.alt || 'Merchandise ChibiconXI'}
						class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
						loading="eager"
						decoding="async"
					/>
				</div>
			{/each}

			<!-- Sampul Tiket Perforasi Minimalis (Clean Ticket Stub Envelope) -->
			<div
				class="absolute bottom-0 z-20 flex h-full w-full origin-bottom flex-col justify-between overflow-hidden rounded-tr-[14px] rounded-br-[10px] rounded-bl-[14px] border-2 border-[#262626] transition-all duration-300 ease-out {!open &&
				hovered
					? 'translate-y-2.5 shadow-[5px_5px_0px_#262626]'
					: open
						? 'scale(0.97, 0.88) translate-y-3'
						: 'shadow-none'}"
				style="background-color: {color};"
			>
				<!-- Sobekan Tiket (Ticket Notches Semicircle di Sisi Kiri & Kanan) -->
				<span
					class="pointer-events-none absolute top-1/2 -left-2.5 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-[#262626] bg-[#fcfaf7] shadow-inner dark:bg-[#120f17]"
					aria-hidden="true"
				></span>
				<span
					class="pointer-events-none absolute top-1/2 -right-2.5 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-[#262626] bg-[#fcfaf7] shadow-inner dark:bg-[#120f17]"
					aria-hidden="true"
				></span>

				<!-- Aksen Washi Tape Diagonal di Sudut Kanan Atas -->
				<div
					class="pointer-events-none absolute -top-3.5 right-6 z-10 h-5 w-14 rotate-6 border border-[#262626]/30 bg-[#a2e1db] opacity-90 shadow-xs transition-transform duration-300 {hovered
						? 'scale-105 rotate-3'
						: ''}"
					aria-hidden="true"
				></div>

				<!-- Bagian Atas Tiket: Garis Perforasi & Nomor Seri Rapi -->
				<div
					class="flex items-center justify-between border-b-2 border-dashed border-[#262626]/30 px-3.5 pt-2.5 pb-2 dark:border-[#262626]/25"
				>
					<span class="font-mono text-[9px] font-black tracking-wider text-[#262626] uppercase">
						PASS #2026
					</span>
					<span class="font-mono text-[9px] font-bold text-[#262626]/60"> 4 ART CARDS </span>
				</div>

				<!-- Bagian Tengah: Stempel Tunggal Berfokus Gestur (Interaktif Saat Hover) -->
				<div class="flex flex-1 flex-col items-center justify-center p-3 text-center">
					<div
						class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] px-3 py-1.5 font-mono text-xs font-black tracking-wider uppercase transition-all duration-200 {hovered
							? 'scale-105 bg-[#262626] text-[#fea770] shadow-[2px_2px_0px_#262626]'
							: 'bg-white text-[#262626] shadow-[1.5px_1.5px_0px_#262626]'}"
					>
						<span>{hovered ? 'TAP TO UNBOX ✦' : 'CHIBICON PASS'}</span>
					</div>
				</div>

				<!-- Bagian Bawah: Aksen Drafting Monoline Bersih -->
				<div
					class="flex items-center justify-between border-t border-dashed border-[#262626]/20 px-3.5 py-1.5 dark:border-[#262626]/20"
				>
					<span class="font-mono text-[8px] font-bold text-[#262626]/50"> EDITION // 01 </span>
					<span class="font-mono text-[8px] font-bold text-[#262626]/50">
						{hovered ? 'READY' : 'SEALED'}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
