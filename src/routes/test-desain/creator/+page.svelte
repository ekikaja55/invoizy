<script lang="ts">
	import { resolve } from '$app/paths';
	import ThemeToggle from '$lib/components/nav/ThemeToggle.svelte';
	import InstagramIcon from '$lib/components/icons/InstagramIcon.svelte';
	import {
		ArrowLeft,
		Sparkles,
		Code2,
		ExternalLink,
		Mail,
		Cpu,
		Terminal,
		ShieldCheck,
		Zap,
		Layers,
		CheckCircle2,
		Heart
	} from '@lucide/svelte';
</script>

<svelte:head>
	<title>Creator Web & Architect — Invoizy Sandbox</title>
</svelte:head>

<div
	class="drafting-grid min-h-screen bg-[#f2efe9] font-sans text-[#262626] transition-colors selection:bg-[#fea770] selection:text-[#262626] dark:bg-[#1a1825] dark:text-[#f2efe9]"
>
	<!-- Top Bar -->
	<header
		class="sticky top-0 z-30 border-b-2 border-[#262626] bg-[#f2efe9]/95 px-4 py-3 backdrop-blur-xs dark:border-[#f2efe9]/20 dark:bg-[#1a1825]/95"
	>
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<a
					href={resolve('/test-desain')}
					class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
					title="Kembali ke Laboratorium Desain"
				>
					<ArrowLeft size={15} strokeWidth={2.5} />
					<span>Kembali ke Sandbox</span>
				</a>

				<span
					class="hidden items-center gap-1.5 rounded-full border border-[#262626] bg-[#a2e1db] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626] uppercase shadow-[1px_1px_0px_#262626] sm:inline-flex dark:border-[#f2efe9]"
				>
					<Sparkles size={12} strokeWidth={2.5} />
					Preview Creator Page
				</span>
			</div>

			<div class="flex items-center gap-3">
				<div class="flex items-center gap-1.5 text-xs font-bold text-[#262626] dark:text-[#f2efe9]">
					<span class="hidden sm:inline">Tema:</span>
					<ThemeToggle />
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
		<!-- Hero Section with Scrapbook Accents -->
		<section class="relative space-y-4 text-center sm:text-left">
			<!-- Ticket Stamp Badge -->
			<div
				class="inline-flex items-center gap-2 rounded-md border-2 border-dashed border-[#262626] bg-[#fea770] px-3.5 py-1 text-xs font-black tracking-wider text-[#262626] uppercase shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]"
			>
				<Terminal size={14} strokeWidth={2.5} />
				<span>Developer & System Architect</span>
			</div>

			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<h1
						class="font-serif text-3xl font-black tracking-tight text-[#262626] sm:text-5xl dark:text-[#f2efe9]"
					>
						Siapa Pembuat Web Ini?
					</h1>
					<p
						class="mt-2 max-w-xl font-sans text-sm font-medium text-[#404040] sm:text-base dark:text-[#b8b5ad]"
					>
						Mengenal sosok kreator di balik rancang bangun sistem katalog, kasir mandiri, dan
						invoice otomatis Invoizy.
					</p>
				</div>

				<!-- Playful Sticky Note -->
				<div
					class="relative mx-auto w-full max-w-xs rotate-1 rounded-sm border-2 border-[#262626] bg-[#fef08a] p-3 text-left shadow-[3px_3px_0px_#262626] sm:mx-0 dark:border-[#f2efe9] dark:bg-[#fef08a] dark:text-[#262626]"
				>
					<!-- Washi tape -->
					<div
						class="absolute -top-2.5 left-1/2 h-4 w-20 -translate-x-1/2 -rotate-2 border border-[#262626]/30 bg-[#fea770]/80 shadow-xs"
					></div>
					<p class="font-handwriting text-lg leading-tight font-bold text-[#713f12]">
						"Dirancang khusus agar kreator fokus berkarya, sementara urusan transaksi dan stok
						berjalan otomatis!"
					</p>
				</div>
			</div>
		</section>

		<!-- Main Bio / Polaroid Card -->
		<section
			class="relative rounded-xl border-2 border-[#262626] bg-white p-6 shadow-[4px_4px_0px_#262626] sm:p-8 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#f2efe9]"
		>
			<div class="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
				<!-- Left: Polaroid Portrait Frame -->
				<div class="flex justify-center md:col-span-5">
					<div
						class="relative -rotate-2 rounded-lg border-2 border-[#262626] bg-[#f9f7f2] p-4 shadow-[4px_4px_0px_#262626] transition-transform hover:rotate-0 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-[4px_4px_0px_#f2efe9]"
					>
						<!-- Tape decoration -->
						<div
							class="absolute -top-3 left-1/2 h-5 w-24 -translate-x-1/2 rotate-1 border border-[#262626]/20 bg-[#a2e1db]/80"
						></div>

						<!-- Photo / Monogram Box -->
						<div
							class="flex h-52 w-52 flex-col items-center justify-center rounded border-2 border-[#262626] bg-[#b4a6d5] text-[#262626] dark:border-[#f2efe9]"
						>
							<Code2 size={64} strokeWidth={2} />
							<span class="mt-2 font-mono text-xs font-bold tracking-widest uppercase">
								&lt;Creator /&gt;
							</span>
						</div>

						<div class="mt-3 text-center">
							<p class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
								Web Architect
							</p>
							<p class="font-mono text-xs text-[#595959] dark:text-[#a3a099]">
								Full-stack Engineer
							</p>
						</div>
					</div>
				</div>

				<!-- Right: Bio & Philosophy -->
				<div class="space-y-4 md:col-span-7">
					<div class="space-y-1">
						<span
							class="rounded bg-[#b4a6d5]/40 px-2.5 py-1 font-mono text-xs font-bold text-[#262626] dark:bg-[#b4a6d5]/30 dark:text-[#f2efe9]"
						>
							Visi & Komitmen
						</span>
						<h2
							class="font-serif text-2xl font-black text-[#262626] sm:text-3xl dark:text-[#f2efe9]"
						>
							Solusi Cerdas untuk Toko Online Independen
						</h2>
					</div>

					<p class="text-sm leading-relaxed text-[#404040] sm:text-base dark:text-[#b8b5ad]">
						Aplikasi ini dibangun dari kebutuhan nyata: menggantikan pencatatan manual Google Form &
						Sheets menjadi platform mandiri yang cepat, tangguh, dan indah dipandang.
					</p>

					<p class="text-sm leading-relaxed text-[#404040] sm:text-base dark:text-[#b8b5ad]">
						Dibangun di atas fondasi teknologi web modern tanpa beban skrip pihak ketiga yang
						berlebihan, memastikan performa stabil saat lonjakan pengunjung event berlangsung.
					</p>

					<!-- Action Buttons -->
					<div class="flex flex-wrap items-center gap-3 pt-2">
						<a
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#fea770] px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9]"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
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
							<span>Lihat Profil GitHub</span>
							<ExternalLink size={13} />
						</a>

						<a
							href="https://instagram.com"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						>
							<InstagramIcon size={16} />
							<span>Instagram</span>
							<ExternalLink size={13} />
						</a>
					</div>
				</div>
			</div>
		</section>

		<!-- Architectural Pillars / Bento Highlights -->
		<section class="space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="font-serif text-xl font-black text-[#262626] sm:text-2xl dark:text-[#f2efe9]">
					Pilar Teknologi yang Digunakan
				</h3>
				<span class="font-mono text-xs font-bold text-[#595959] dark:text-[#a3a099]">
					4 Core Highlights
				</span>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<!-- Card 1: SvelteKit 5 -->
				<div
					class="rounded-xl border-2 border-[#262626] bg-[#f9f7f2] p-5 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
				>
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#fea770] text-[#262626]"
						>
							<Zap size={20} strokeWidth={2.5} />
						</div>
						<div>
							<h4 class="font-mono text-sm font-black text-[#262626] uppercase dark:text-[#f2efe9]">
								SvelteKit 5 & Runes
							</h4>
							<p class="font-mono text-xs text-[#595959] dark:text-[#a3a099]">
								Reactivity Tanpa Overkill
							</p>
						</div>
					</div>
					<p class="mt-3 text-xs leading-relaxed text-[#404040] sm:text-sm dark:text-[#b8b5ad]">
						Sistem kompilasi modern yang menghasilkan JavaScript super ringan, loading instan, dan
						alur pemesanan tanpa lag pada koneksi seluler.
					</p>
				</div>

				<!-- Card 2: Tri-Cloud -->
				<div
					class="rounded-xl border-2 border-[#262626] bg-[#f9f7f2] p-5 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
				>
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#a2e1db] text-[#262626]"
						>
							<ShieldCheck size={20} strokeWidth={2.5} />
						</div>
						<div>
							<h4 class="font-mono text-sm font-black text-[#262626] uppercase dark:text-[#f2efe9]">
								Tri-Cloud Resilience
							</h4>
							<p class="font-mono text-xs text-[#595959] dark:text-[#a3a099]">
								Supabase + Upstash + Vercel
							</p>
						</div>
					</div>
					<p class="mt-3 text-xs leading-relaxed text-[#404040] sm:text-sm dark:text-[#b8b5ad]">
						Tiga pilar cloud berkecepatan tinggi: database PostgreSQL tangguh, caching & proteksi
						rate limit Redis, dan serverless deployment di region Singapura (sin1).
					</p>
				</div>

				<!-- Card 3: Scrapbook UI -->
				<div
					class="rounded-xl border-2 border-[#262626] bg-[#f9f7f2] p-5 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
				>
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#b4a6d5] text-[#262626]"
						>
							<Layers size={20} strokeWidth={2.5} />
						</div>
						<div>
							<h4 class="font-mono text-sm font-black text-[#262626] uppercase dark:text-[#f2efe9]">
								Tactile Scrapbook UI
							</h4>
							<p class="font-mono text-xs text-[#595959] dark:text-[#a3a099]">Organic Maximalism</p>
						</div>
					</div>
					<p class="mt-3 text-xs leading-relaxed text-[#404040] sm:text-sm dark:text-[#b8b5ad]">
						Desain berkarakter dengan bayangan monoline tegas, aksen stempel tiket, dan washi tape
						yang memberikan pengalaman belanja unik dan menyenangkan.
					</p>
				</div>

				<!-- Card 4: Transaction Pipeline -->
				<div
					class="rounded-xl border-2 border-[#262626] bg-[#f9f7f2] p-5 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
				>
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#fef08a] text-[#262626]"
						>
							<Cpu size={20} strokeWidth={2.5} />
						</div>
						<div>
							<h4 class="font-mono text-sm font-black text-[#262626] uppercase dark:text-[#f2efe9]">
								Faktur & QRIS Otomatis
							</h4>
							<p class="font-mono text-xs text-[#595959] dark:text-[#a3a099]">
								Zero Friction Checkout
							</p>
						</div>
					</div>
					<p class="mt-3 text-xs leading-relaxed text-[#404040] sm:text-sm dark:text-[#b8b5ad]">
						Kalkulasi subtotal akurat, validasi pembayaran, dan pembuatan invoice PDF otomatis yang
						siap diunduh pembeli dalam hitungan detik.
					</p>
				</div>
			</div>
		</section>

		<!-- Sticker Pack: Tech Stack Badges -->
		<section
			class="rounded-xl border-2 border-[#262626] bg-white p-6 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331]"
		>
			<h4
				class="font-mono text-xs font-black tracking-wider text-[#262626] uppercase sm:text-sm dark:text-[#f2efe9]"
			>
				Tech Stack & Ekosistem Alat
			</h4>
			<div class="mt-3.5 flex flex-wrap gap-2 sm:gap-2.5">
				{#each [{ name: 'Svelte 5 Runes', color: 'bg-[#fea770]' }, { name: 'TypeScript', color: 'bg-[#a2e1db]' }, { name: 'Tailwind CSS v4', color: 'bg-[#b4a6d5]' }, { name: 'Supabase PostgreSQL', color: 'bg-[#fef08a]' }, { name: 'Drizzle ORM', color: 'bg-white dark:bg-[#1a1825]' }, { name: 'Upstash Redis', color: 'bg-[#fea770]' }, { name: 'Vercel Serverless', color: 'bg-[#a2e1db]' }, { name: 'Better Auth', color: 'bg-[#b4a6d5]' }, { name: 'Puppeteer Core', color: 'bg-[#fef08a]' }] as tag (tag.name)}
					<span
						class="inline-flex items-center gap-1.5 rounded-md border-2 border-[#262626] {tag.color} px-3 py-1 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:text-[#262626]"
					>
						<CheckCircle2 size={13} strokeWidth={2.5} />
						{tag.name}
					</span>
				{/each}
			</div>
		</section>

		<!-- Inquiries / Collaboration CTA -->
		<section
			class="relative overflow-hidden rounded-xl border-2 border-[#262626] bg-[#b4a6d5]/20 p-6 text-center sm:p-8 dark:border-[#f2efe9]/40 dark:bg-[#b4a6d5]/10"
		>
			<div class="mx-auto max-w-lg space-y-3">
				<p class="font-handwriting text-2xl font-bold text-[#262626] dark:text-[#f2efe9]">
					"Punya ide aplikasi atau butuh website untuk bisnismu?"
				</p>
				<h3 class="font-serif text-2xl font-black text-[#262626] sm:text-3xl dark:text-[#f2efe9]">
					Mari Terhubung & Kolaborasi!
				</h3>
				<p class="text-xs text-[#595959] sm:text-sm dark:text-[#a3a099]">
					Terbuka untuk konsultasi arsitektur web, pembuatan aplikasi kustom, dan optimasi performa.
				</p>
				<div class="flex justify-center gap-3 pt-2">
					<a
						href="mailto:contact@invoizy.store"
						class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#262626] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
					>
						<Mail size={16} />
						<span>Kirim Email / Diskusi</span>
					</a>
				</div>
			</div>
		</section>

		<!-- Footer Note in Sandbox -->
		<footer class="pt-4 pb-8 text-center font-mono text-xs text-[#595959] dark:text-[#a3a099]">
			<p class="flex items-center justify-center gap-1.5">
				<span>Dibuat dengan</span>
				<Heart size={13} class="inline fill-red-500 text-red-500" />
				<span>untuk ekosistem kreator lokal Indonesia</span>
			</p>
		</footer>
	</main>
</div>
