<script lang="ts">
	import { onMount } from 'svelte';

	export type Step = {
		title: string;
		desc: string;
		tag?: string;
		serial?: string;
	};

	type Props = {
		steps?: Step[];
		class?: string;
	};

	const defaultSteps: Step[] = [
		{
			title: 'Pilih merch fav kamu!',
			desc: 'Buka katalog, tentukan kuantitas yang diinginkan, dan kumpulkan merch impianmu ke keranjang.',
			tag: 'PHASE 01 // DISCOVERY',
			serial: 'ORD-PASS // 001'
		},
		{
			title: 'Isi Data Pembeli',
			desc: 'Lengkapi identitas: username sosmed, alamat email aktif untuk kirim invoice instan, dan nomor kontak.',
			tag: 'PHASE 02 // IDENTITY',
			serial: 'ORD-PASS // 002'
		},
		{
			title: 'Pilih Pickup / Mail Order',
			desc: 'Pilih Mail Order (kirim langsung ke rumah) atau opsi Pick Up langsung di venue event Chibicon.',
			tag: 'PHASE 03 // FULFILLMENT',
			serial: 'ORD-PASS // 003'
		},
		{
			title: 'Bayar & Konfirmasi',
			desc: 'Selesaikan transaksi via transfer bank atau QRIS instan, lalu unggah bukti pembayaran.',
			tag: 'PHASE 04 // SETTLEMENT',
			serial: 'ORD-PASS // 004'
		}
	];

	let { steps = defaultSteps, class: className = '' }: Props = $props();

	let activeStep = $state(0);
	let sectionRef: HTMLElement | null = $state(null);
	let isSectionVisible = $state(false);

	// Smooth scroll ke langkah yang diklik
	function scrollToStep(index: number) {
		activeStep = index;
		const el = document.getElementById(`step-ticket-${index}`);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	onMount(() => {
		if (!sectionRef) return;

		// 1. Observer hanya untuk status visibility section (menghemat CPU)
		const sectionObserver = new IntersectionObserver(
			([entry]) => {
				isSectionVisible = entry.isIntersecting;
			},
			{ threshold: 0.05 }
		);
		sectionObserver.observe(sectionRef);

		// 2. Kalkulasi Scroll Deterministic Anti-Jump
		// Mengukur posisi setiap step secara deterministik terhadap focus line viewport (~45% tinggi layar)
		let ticking = false;

		function updateActiveStep() {
			if (!sectionRef) return;
			const focusLine = window.innerHeight * 0.45;
			const stepElements = sectionRef.querySelectorAll<HTMLElement>('.how-to-order-step');

			let current = 0;
			stepElements.forEach((el, index) => {
				const rect = el.getBoundingClientRect();
				// Langkah dianggap aktif bila bagian atas kartu sudah mencapai garis fokus baca
				if (rect.top <= focusLine) {
					current = index;
				}
			});

			activeStep = current;
			ticking = false;
		}

		function onScroll() {
			if (!ticking) {
				window.requestAnimationFrame(updateActiveStep);
				ticking = true;
			}
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });

		// Hitung posisi awal saat pertama kali mount
		updateActiveStep();

		return () => {
			sectionObserver.disconnect();
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});
</script>

<!-- Section How To Order: Alternating Timeline Stepper & Radical Perforated Marquee Tickets -->
<div
	id="how-to-order"
	bind:this={sectionRef}
	class="relative mx-auto w-full max-w-5xl px-4 py-8 select-none sm:py-16 {className}"
	aria-label="Panduan Cara Pemesanan"
>
	<!-- Section Header: Judul Fraunces Bersih -->
	<div class="mb-12 text-center sm:mb-16">
		<h2
			class="font-serif text-3xl font-extrabold tracking-tight text-[#262626] sm:text-4xl lg:text-5xl dark:text-[#f2efe9]"
		>
			How to order ?
		</h2>
	</div>

	<!-- Timeline Container: Rel di Tengah (Desktop) / Rel di Kiri (Mobile) -->
	<div class="relative w-full">
		<!-- Rel Vertikal Garis Putus-Putus (Dasar) -->
		<div
			class="absolute top-6 bottom-8 left-6 w-0.5 -translate-x-1/2 border-l-2 border-dashed border-[#262626]/30 md:left-1/2 md:-translate-x-1/2 dark:border-[#f2efe9]/30"
			aria-hidden="true"
		></div>

		<!-- Rel Vertikal Track Pengisi Aktif (Tangerine Glow Fill) -->
		<div
			class="absolute top-6 left-6 w-1 -translate-x-1/2 rounded-full bg-[#fea770] shadow-[0_0_8px_rgba(254,167,112,0.6)] transition-all duration-300 ease-out md:left-1/2 md:-translate-x-1/2"
			style="height: {(activeStep / Math.max(steps.length - 1, 1)) * 92}%;"
			aria-hidden="true"
		></div>

		<!-- Daftar Kartu Tiket Marquee Selang-Seling -->
		<ol class="space-y-10 sm:space-y-14 md:space-y-16">
			{#each steps as step, i (step.title)}
				{@const isCurrent = activeStep === i}
				{@const isPassed = activeStep > i}
				{@const isEven = i % 2 === 0}

				<!-- Container Tiap Langkah -->
				<li
					id="step-ticket-{i}"
					data-step-index={i}
					class="how-to-order-step relative flex w-full flex-col transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] md:flex-row md:items-center {isSectionVisible
						? 'translate-y-0 opacity-100'
						: 'translate-y-10 opacity-0'}"
					style="transition-delay: {i * 80}ms;"
				>
					<!-- Stempel Nomor Langkah di atas Rel -->
					<!-- Posisi: Mobile di left-6; Desktop di tengah left-1/2 -->
					<button
						type="button"
						onclick={() => scrollToStep(i)}
						class="absolute top-4 left-6 z-20 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-2xl border-2 font-mono text-sm font-black transition-all duration-300 focus:outline-hidden sm:h-12 sm:w-12 sm:text-base md:top-1/2 md:left-1/2 md:-translate-y-1/2 {isCurrent
							? 'scale-115 rotate-[-2deg] border-[#262626] bg-[#fea770] text-[#262626] shadow-[3px_3px_0px_#262626] ring-4 ring-[#fea770]/30'
							: isPassed
								? 'border-[#262626] bg-[#a2e1db] text-[#262626] shadow-[2px_2px_0px_#262626]'
								: 'border-[#262626]/40 bg-white text-[#262626]/50 shadow-[1.5px_1.5px_0px_#262626] hover:scale-105 dark:border-[#f2efe9]/40 dark:bg-[#252331] dark:text-[#f2efe9]/50'}"
						title="Lompat ke langkah {i + 1}"
					>
						{#if isPassed}
							<span>✓</span>
						{:else}
							<span>0{i + 1}</span>
						{/if}
					</button>

					<!-- Kartu Tiket Marquee Perforasi -->
					<!-- Mobile: Margin kiri ml-14 (penuh ke kanan) -->
					<!-- Desktop: Selang-seling (Genap di Kiri md:w-[calc(50%-2.5rem)] md:mr-auto, Ganjil di Kanan md:ml-auto) -->
					<div
						class="relative ml-14 w-[calc(100%-3.8rem)] md:ml-0 md:w-[calc(50%-2.5rem)] {isEven
							? 'md:mr-auto md:pr-0'
							: 'md:ml-auto md:pl-0'}"
					>
						<div
							class="group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 {isCurrent
								? '-translate-y-1 border-[#262626] bg-white shadow-[5px_5px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#1a1825] dark:shadow-[5px_5px_0px_#b4a6d5]'
								: 'border-[#262626]/35 bg-white/80 shadow-[2.5px_2.5px_0px_#262626]/35 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#252331]/70'}"
						>
							<!-- Aksen Sobekan Tiket (Ticket Notches di Sisi Kiri & Kanan) -->
							<span
								class="pointer-events-none absolute top-1/2 -left-2.5 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-[#262626] bg-[#fcfaf7] shadow-inner dark:bg-[#120f17]"
								aria-hidden="true"
							></span>
							<span
								class="pointer-events-none absolute top-1/2 -right-2.5 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-[#262626] bg-[#fcfaf7] shadow-inner dark:bg-[#120f17]"
								aria-hidden="true"
							></span>

							<!-- Aksen Washi Tape Diagonal di Sudut Luar Kartu -->
							<div
								class="pointer-events-none absolute -top-3.5 h-5 w-16 border border-[#262626]/30 opacity-90 shadow-xs {isEven
									? 'left-8 -rotate-3 bg-[#a2e1db]'
									: 'right-8 rotate-3 bg-[#fea770]'}"
								aria-hidden="true"
							></div>

							<!-- Running Ticket Marquee Strip Header (Hardware-Accelerated CSS) -->
							<div
								class="overflow-hidden border-b-2 border-[#262626] py-1 transition-colors duration-300 {isCurrent
									? 'bg-[#fea770] text-[#262626]'
									: 'bg-[#34303d] text-[#e8e4dc] dark:bg-[#252230] dark:text-[#d5d1c8]'}"
							>
								<div class="ticket-marquee-strip flex items-center gap-4 select-none">
									<span class="font-mono text-[10px] font-black tracking-widest uppercase">
										★ CHIBICON ORDER PROTOCOL ★ STEP 0{i + 1} PASS ★ OFFICIAL ADMISSION TICKET ★
									</span>
									<span class="font-mono text-[10px] font-black tracking-widest uppercase">
										★ CHIBICON ORDER PROTOCOL ★ STEP 0{i + 1} PASS ★ OFFICIAL ADMISSION TICKET ★
									</span>
								</div>
							</div>

							<!-- Body Tiket -->
							<div class="space-y-3 p-5 sm:p-6">
								<!-- Baris Serial & Status Tiket -->
								<div
									class="flex items-center justify-between border-b border-dashed border-[#262626]/20 pb-2.5 dark:border-[#f2efe9]/20"
								>
									<span
										class="rounded border border-[#262626] px-2 py-0.5 font-mono text-[9px] font-black tracking-wider uppercase {isCurrent
											? 'bg-[#fea770] text-[#262626]'
											: 'bg-neutral-100 text-[#262626]/60 dark:bg-[#252331] dark:text-[#f2efe9]/60'}"
									>
										{step.tag || `STEP 0${i + 1}`}
									</span>

									<span
										class="font-mono text-[10px] font-bold text-[#262626]/60 dark:text-[#f2efe9]/60"
									>
										{step.serial || `TKT-0${i + 1} // AUTH: OK`}
									</span>
								</div>

								<!-- Judul & Deskripsi Langkah -->
								<div>
									<h3
										class="font-serif text-lg font-extrabold text-[#262626] sm:text-xl dark:text-[#f2efe9]"
									>
										{step.title}
									</h3>
									<p
										class="mt-1.5 font-sans text-xs leading-relaxed text-[#404040] sm:text-sm dark:text-[#b8b5ad]"
									>
										{step.desc}
									</p>
								</div>

								<!-- Barcode Simulasi Taktil di Kaki Tiket -->
								<div
									class="flex items-center justify-between border-t border-dashed border-[#262626]/20 pt-3 dark:border-[#f2efe9]/20"
								>
									<!-- Monoline Barcode Bars -->
									<div class="flex items-center gap-[2px] opacity-70" aria-hidden="true">
										<span class="h-4 w-[2px] bg-[#262626] dark:bg-[#f2efe9]"></span>
										<span class="h-4 w-[1px] bg-[#262626] dark:bg-[#f2efe9]"></span>
										<span class="h-4 w-[3px] bg-[#262626] dark:bg-[#f2efe9]"></span>
										<span class="h-4 w-[1px] bg-[#262626] dark:bg-[#f2efe9]"></span>
										<span class="h-4 w-[2px] bg-[#262626] dark:bg-[#f2efe9]"></span>
										<span class="h-4 w-[4px] bg-[#262626] dark:bg-[#f2efe9]"></span>
										<span class="h-4 w-[1px] bg-[#262626] dark:bg-[#f2efe9]"></span>
										<span class="h-4 w-[3px] bg-[#262626] dark:bg-[#f2efe9]"></span>
										<span class="h-4 w-[2px] bg-[#262626] dark:bg-[#f2efe9]"></span>
									</div>

									<span
										class="font-mono text-[9px] font-bold text-[#262626]/50 dark:text-[#f2efe9]/50"
									>
										VERIFIED // 2026
									</span>
								</div>
							</div>
						</div>
					</div>
				</li>
			{/each}
		</ol>
	</div>
</div>

<style>
	@keyframes marquee-scroll {
		0% {
			transform: translate3d(0, 0, 0);
		}
		100% {
			transform: translate3d(-50%, 0, 0);
		}
	}

	.ticket-marquee-strip {
		display: inline-flex;
		width: max-content;
		animation: marquee-scroll 14s linear infinite;
		will-change: transform;
	}
</style>
