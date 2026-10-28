<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';

	type Props = {
		speed?: number; // Durasi dalam detik untuk 1 siklus penuh
		class?: string;
	};

	let { speed = 32, class: className = '' }: Props = $props();

	let rootRef: HTMLElement | null = $state(null);
	let ticker1Ref: HTMLElement | null = $state(null);
	let ticker2Ref: HTMLElement | null = $state(null);
	let tween1: gsap.core.Tween | null = null;
	let tween2: gsap.core.Tween | null = null;
	let ctx: gsap.Context | null = null;

	let offsetLeft = $state(0);
	let fullWidth = $state<number | null>(null);

	function updateLayout() {
		if (typeof window === 'undefined' || !rootRef) return;
		// Hitung posisi absolut parent terhadap viewport sehingga pita membentang murni dari x:0 ke x:100vw
		const parentRect = rootRef.parentElement?.getBoundingClientRect();
		if (parentRect) {
			offsetLeft = -parentRect.left;
			fullWidth = document.documentElement.clientWidth || window.innerWidth;
		}
	}

	// Data Tiket Pita 1 (Tangerine - Miring -4.2°, Gerak ke KIRI)
	const tickets1 = [
		{
			code: 'CHIBICON-XI // TICKET-01',
			title: 'EXCLUSIVE MERCHANDISE ARCHIVE',
			badge: 'ADMISSION',
			barcode: '||| | |||| | ||'
		},
		{
			code: 'GATE-A // VERIFIED ART',
			title: 'ORIGINAL FANART & PHOTOCARDS',
			badge: 'OFFICIAL',
			barcode: '|||| || | ||| |'
		},
		{
			code: 'CHECKOUT // DIRECT RUN',
			title: 'AUTOMATED INVOICE GENERATOR',
			badge: 'INSTANT',
			barcode: '| |||| || | |||'
		},
		{
			code: 'DISPATCH // MAIL & BOOTH',
			title: 'CONVENTION PICKUP & MAIL ORDER',
			badge: 'BATCH-01',
			barcode: '|| | |||| || ||'
		}
	];

	// Data Tiket Pita 2 (Charcoal - Miring +3.2°, Gerak ke KANAN)
	const tickets2 = [
		{
			code: 'LIMITED-RUN // REPLICA-X',
			title: 'SPECIAL COLLECTOR ART PRINTS',
			badge: 'CONVENTION',
			barcode: '|| ||| | |||| |'
		},
		{
			code: 'RIGID-SAFE // PACKING',
			title: 'DOORSTEP COURIER & EVENT HANDOVER',
			badge: 'SECURITY',
			barcode: '|||| | ||| || |'
		},
		{
			code: 'VERIFIED // CHOLAZEY ART',
			title: 'PRE-ORDER MERCHANDISE VAULT',
			badge: 'PRE-ORDER',
			barcode: '| ||| |||| | ||'
		},
		{
			code: 'PAYMENT // INSTANT QRIS',
			title: 'BANK TRANSFER & DIGITAL RECEIPT',
			badge: 'CONFIRMED',
			barcode: '|||| || ||| | |'
		}
	];

	onMount(() => {
		if (!rootRef) return;

		updateLayout();
		window.addEventListener('resize', updateLayout, { passive: true });

		// Isolasi seluruh GSAP tween via gsap.context untuk garansi 100% zero memory leak
		ctx = gsap.context(() => {
			// Pita 1: Bergerak linear ke KIRI
			if (ticker1Ref) {
				tween1 = gsap.fromTo(
					ticker1Ref,
					{ xPercent: 0 },
					{
						xPercent: -50,
						repeat: -1,
						duration: speed,
						ease: 'none'
					}
				);
			}

			// Pita 2: Bergerak linear ke KANAN
			if (ticker2Ref) {
				tween2 = gsap.fromTo(
					ticker2Ref,
					{ xPercent: -50 },
					{
						xPercent: 0,
						repeat: -1,
						duration: speed * 1.05,
						ease: 'none'
					}
				);
			}
		}, rootRef);

		// 4-Stage Absolute Teardown: Bersihkan 100% ticker listener & DOM nodes agar bebas memory leak
		return () => {
			window.removeEventListener('resize', updateLayout);

			tween1?.kill();
			tween2?.kill();
			tween1 = null;
			tween2 = null;

			if (ticker1Ref) gsap.killTweensOf(ticker1Ref);
			if (ticker2Ref) gsap.killTweensOf(ticker2Ref);

			if (ctx) {
				ctx.revert();
				ctx.kill();
				ctx = null;
			}
		};
	});

	// Hover-to-pause taktil mikro
	function handleMouseEnter1() {
		if (tween1 && !tween1.paused()) tween1.pause();
	}
	function handleMouseLeave1() {
		if (tween1 && tween1.paused()) tween1.play();
	}

	function handleMouseEnter2() {
		if (tween2 && !tween2.paused()) tween2.pause();
	}
	function handleMouseLeave2() {
		if (tween2 && tween2.paused()) tween2.play();
	}
</script>

<!-- Container Combo Police Line Ticket: Full-Bleed Breakout melintas mulus di bawah SidebarNav -->
<section
	bind:this={rootRef}
	class="relative overflow-hidden py-14 select-none sm:py-20 lg:py-28 {className}"
	style={fullWidth ? `width: ${fullWidth}px; margin-left: ${offsetLeft}px;` : 'width: 100%;'}
	aria-label="Tiket Rol Polisi Garis Ganda Animasi"
>
	<!-- ========================================================================= -->
	<!-- PITA 1: TANGERINE TICKET ROLL (Miring -4.2°, Gerak ke KIRI, Skala Radikal) -->
	<!-- ========================================================================= -->
	<div
		class="relative -left-[7%] z-10 w-[114%] -rotate-[4.2deg] overflow-hidden border-y-3 border-[#262626] bg-[#fea770] shadow-[0_6px_0px_#262626] transition-colors sm:border-y-4 lg:border-y-[5px] lg:shadow-[0_12px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#fea770] dark:shadow-[0_6px_0px_#b4a6d5]"
		onmouseenter={handleMouseEnter1}
		onmouseleave={handleMouseLeave1}
		role="region"
		aria-live="off"
	>
		<!-- Perforasi Tiket Atas & Bawah Pita 1 -->
		<div
			class="pointer-events-none absolute inset-x-0 top-1.5 border-t-2 border-dashed border-[#262626]/35 lg:top-2 lg:border-t-3"
			aria-hidden="true"
		></div>
		<div
			class="pointer-events-none absolute inset-x-0 bottom-1.5 border-b-2 border-dashed border-[#262626]/35 lg:bottom-2 lg:border-b-3"
			aria-hidden="true"
		></div>

		<div
			bind:this={ticker1Ref}
			class="flex w-max items-center py-4 will-change-transform sm:py-5.5 lg:py-7"
		>
			{#each [0, 1] as copyIndex (copyIndex)}
				<div class="flex items-center" aria-hidden={copyIndex === 1}>
					{#each [0, 1] as subIndex (subIndex)}
						{#each tickets1 as item (item.code + '-' + copyIndex + '-' + subIndex)}
							<div
								class="mr-8 flex items-center gap-6 border-r-2 border-dashed border-[#262626]/35 pr-8 sm:mr-12 sm:gap-8 sm:pr-12 lg:mr-16 lg:gap-10 lg:border-r-3 lg:pr-16"
							>
								<!-- Konten Tiket -->
								<div class="flex flex-col gap-1">
									<div class="flex items-center gap-2.5">
										<span
											class="rounded border border-[#262626] bg-white px-2 py-0.5 font-mono text-[9px] font-black tracking-widest text-[#262626] uppercase shadow-[1px_1px_0px_#262626] sm:text-xs"
										>
											{item.badge}
										</span>
										<span
											class="font-mono text-[10px] font-black tracking-wider text-[#262626] uppercase sm:text-xs lg:text-sm"
										>
											{item.code}
										</span>
									</div>
									<span
										class="font-serif text-sm font-extrabold tracking-tight whitespace-nowrap text-[#262626] uppercase sm:text-xl md:text-2xl lg:text-3xl"
									>
										{item.title}
									</span>
								</div>

								<!-- Barcode Otentikasi Taktil -->
								<div
									class="hidden flex-col items-center justify-center rounded-sm border-2 border-[#262626] bg-white/80 px-2.5 py-1.5 shadow-[2px_2px_0px_#262626] sm:flex"
									aria-hidden="true"
								>
									<span
										class="font-mono text-xs font-black tracking-widest text-[#262626] lg:text-sm"
									>
										{item.barcode}
									</span>
									<span class="font-mono text-[8px] font-extrabold text-[#262626]/70">VERIFIED</span
									>
								</div>
							</div>
						{/each}
					{/each}
				</div>
			{/each}
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- PITA 2: CHARCOAL TICKET ROLL (Miring +3.2°, Gerak ke KANAN, Tumpang Tindih) -->
	<!-- ========================================================================= -->
	<div
		class="relative -left-[7%] z-20 -mt-6 w-[114%] rotate-[3.2deg] overflow-hidden border-y-3 border-[#262626]/80 bg-[#332f3c] text-[#f2efe9] shadow-[0_8px_0px_rgba(38,38,38,0.4)] transition-colors sm:-mt-8 sm:border-y-4 lg:-mt-12 lg:border-y-[5px] lg:shadow-[0_14px_0px_rgba(38,38,38,0.4)] dark:border-[#a2e1db]/40 dark:bg-[#201d2a]"
		onmouseenter={handleMouseEnter2}
		onmouseleave={handleMouseLeave2}
		role="region"
		aria-live="off"
	>
		<!-- Perforasi Tiket Atas & Bawah Pita 2 -->
		<div
			class="pointer-events-none absolute inset-x-0 top-1.5 border-t-2 border-dashed border-[#f2efe9]/30 lg:top-2 lg:border-t-3"
			aria-hidden="true"
		></div>
		<div
			class="pointer-events-none absolute inset-x-0 bottom-1.5 border-b-2 border-dashed border-[#f2efe9]/30 lg:bottom-2 lg:border-b-3"
			aria-hidden="true"
		></div>

		<div
			bind:this={ticker2Ref}
			class="flex w-max items-center py-4 will-change-transform sm:py-5.5 lg:py-7"
		>
			{#each [0, 1] as copyIndex (copyIndex)}
				<div class="flex items-center" aria-hidden={copyIndex === 1}>
					{#each [0, 1] as subIndex (subIndex)}
						{#each tickets2 as item (item.code + '-' + copyIndex + '-' + subIndex)}
							<div
								class="mr-8 flex items-center gap-6 border-r-2 border-dashed border-[#f2efe9]/30 pr-8 sm:mr-12 sm:gap-8 sm:pr-12 lg:mr-16 lg:gap-10 lg:border-r-3 lg:pr-16"
							>
								<!-- Konten Tiket -->
								<div class="flex flex-col gap-1">
									<div class="flex items-center gap-2.5">
										<span
											class="rounded border border-[#fea770] bg-[#fea770] px-2 py-0.5 font-mono text-[9px] font-black tracking-widest text-[#262626] uppercase sm:text-xs"
										>
											{item.badge}
										</span>
										<span
											class="font-mono text-[10px] font-black tracking-wider text-[#a2e1db] uppercase sm:text-xs lg:text-sm"
										>
											{item.code}
										</span>
									</div>
									<span
										class="font-serif text-sm font-extrabold tracking-tight whitespace-nowrap text-[#f2efe9] uppercase sm:text-xl md:text-2xl lg:text-3xl dark:text-[#f2efe9]"
									>
										{item.title}
									</span>
								</div>

								<!-- Barcode Inverted Stamp -->
								<div
									class="hidden flex-col items-center justify-center rounded-sm border-2 border-[#a2e1db] bg-[#1a1825]/90 px-2.5 py-1.5 shadow-[2px_2px_0px_#a2e1db] sm:flex"
									aria-hidden="true"
								>
									<span
										class="font-mono text-xs font-black tracking-widest text-[#a2e1db] lg:text-sm"
									>
										{item.barcode}
									</span>
									<span class="font-mono text-[8px] font-extrabold text-[#f2efe9]/70"
										>AUTHENTIC</span
									>
								</div>
							</div>
						{/each}
					{/each}
				</div>
			{/each}
		</div>
	</div>
</section>
