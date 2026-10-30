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
		Terminal,
		CheckCircle2,
		Zap,
		ShieldCheck,
		FileCode2,
		Server
	} from '@lucide/svelte';
</script>

<svelte:head>
	<title>Pengembang Sistem & Arsitek — Invoizy</title>
</svelte:head>

<div
	class="drafting-grid min-h-screen overflow-x-clip bg-[#f2efe9] font-sans text-[#262626] transition-colors selection:bg-[#fea770] selection:text-[#262626] dark:bg-[#1a1825] dark:text-[#f2efe9]"
>
	<!-- Sticky Top Bar (Touch-safe, compact on mobile) -->
	<header
		class="sticky top-0 z-30 border-b-2 border-[#262626] bg-[#f2efe9]/95 px-3 py-2.5 backdrop-blur-xs sm:px-6 sm:py-3 dark:border-[#f2efe9]/20 dark:bg-[#1a1825]/95"
	>
		<div class="mx-auto flex max-w-4xl items-center justify-between gap-3">
			<div class="flex items-center gap-2 sm:gap-3">
				<a
					href={resolve('/test-desain')}
					class="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
					title="Kembali ke Laboratorium Desain"
				>
					<ArrowLeft size={15} strokeWidth={2.5} class="shrink-0" />
					<span>Kembali ke Sandbox</span>
				</a>

				<span
					class="hidden items-center gap-1.5 rounded-full border border-[#262626] bg-[#a2e1db] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626] uppercase shadow-[1px_1px_0px_#262626] md:inline-flex dark:border-[#f2efe9]"
				>
					<Sparkles size={12} strokeWidth={2.5} />
					Creator Profile
				</span>
			</div>

			<div class="flex items-center gap-2 sm:gap-3">
				<div class="flex items-center gap-1.5 text-xs font-bold text-[#262626] dark:text-[#f2efe9]">
					<span class="hidden sm:inline">Tema:</span>
					<ThemeToggle />
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-10">
		<!-- Hero Section: Clean, Grounded, Mobile-Reflowed -->
		<section class="space-y-4">
			<!-- Ticket Stamp Badge -->
			<div
				class="inline-flex items-center gap-2 rounded-md border-2 border-dashed border-[#262626] bg-[#fea770] px-3 py-1 font-mono text-xs font-black tracking-wider text-[#262626] uppercase shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]"
			>
				<Terminal size={14} strokeWidth={2.5} class="shrink-0" />
				<span>Web Developer & Architect</span>
			</div>

			<div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
				<div class="max-w-xl">
					<h1
						class="font-serif text-2xl font-black tracking-tight text-[#262626] sm:text-4xl dark:text-[#f2efe9]"
					>
						Pengembang Sistem Invoizy
					</h1>
					<p
						class="mt-1.5 font-sans text-sm font-medium text-[#404040] sm:text-base dark:text-[#b8b5ad]"
					>
						Perancang katalog, sistem kasir mandiri, dan otomasi faktur untuk toko merchandise
						cho.lazey.
					</p>
				</div>

				<!-- Tactile Sticky Note Memo (Safe on small viewports) -->
				<aside
					class="relative w-full max-w-xs self-start rounded-sm border-2 border-[#262626] bg-[#fef08a] p-3 shadow-[3px_3px_0px_#262626] sm:rotate-1 sm:self-auto dark:border-[#f2efe9] dark:bg-[#fef08a] dark:text-[#262626]"
				>
					<div
						class="absolute -top-2.5 left-6 h-4 w-16 -rotate-2 border border-[#262626]/30 bg-[#fea770]/90 shadow-xs"
					></div>
					<p class="font-mono text-[11px] font-bold tracking-wider text-[#854d0e] uppercase">
						Catatan Rilis
					</p>
					<p class="mt-1 font-handwriting text-base leading-snug font-bold text-[#713f12]">
						"Dibuat untuk event Chibicon XI: hitung total akurat, bayar via QRIS, dan unduh invoice
						instan tanpa Google Form."
					</p>
				</aside>
			</div>
		</section>

		<!-- Main Profile: Polaroid Card + Concrete Background -->
		<section
			class="rounded-xl border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] sm:p-7 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#f2efe9]"
		>
			<div class="grid grid-cols-1 items-start gap-6 md:grid-cols-12 md:gap-8">
				<!-- Left: Polaroid Frame (Reflowed to natural scale on mobile) -->
				<div class="flex justify-center md:col-span-5">
					<div
						class="relative w-full max-w-[240px] rounded-lg border-2 border-[#262626] bg-[#f9f7f2] p-3.5 shadow-[3px_3px_0px_#262626] transition-transform sm:-rotate-2 sm:hover:rotate-0 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-[3px_3px_0px_#f2efe9]"
					>
						<!-- Washi Tape -->
						<div
							class="absolute -top-2.5 left-1/2 h-4 w-20 -translate-x-1/2 rotate-1 border border-[#262626]/20 bg-[#a2e1db]/90"
						></div>

						<!-- Monogram Frame -->
						<div
							class="flex aspect-square w-full flex-col items-center justify-center rounded border-2 border-[#262626] bg-[#b4a6d5] text-[#262626] dark:border-[#f2efe9]"
						>
							<Code2 size={52} strokeWidth={2} />
							<span class="mt-2 font-mono text-[11px] font-black tracking-widest uppercase">
								&lt;Developer /&gt;
							</span>
						</div>

						<div class="mt-3 text-center">
							<p class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
								Full-stack Developer
							</p>
							<p class="font-mono text-xs text-[#595959] dark:text-[#a3a099]">
								Sistem Web & Otomasi
							</p>
						</div>
					</div>
				</div>

				<!-- Right: Plain, Evidence-Based Context (Antislop Copywriting) -->
				<div class="space-y-4 md:col-span-7">
					<div>
						<span
							class="rounded bg-[#b4a6d5]/40 px-2.5 py-0.5 font-mono text-xs font-bold text-[#262626] dark:bg-[#b4a6d5]/30 dark:text-[#f2efe9]"
						>
							Latar Belakang Proyek
						</span>
						<h2
							class="mt-1 font-serif text-xl font-black text-[#262626] sm:text-2xl dark:text-[#f2efe9]"
						>
							Dari Rekap Spreadsheet ke Aplikasi Standalone
						</h2>
					</div>

					<p class="text-xs leading-relaxed text-[#404040] sm:text-sm dark:text-[#b8b5ad]">
						Sebelum Invoizy dibangun, pesanan merchandise dicatat manual lewat Google Form dan
						diolah manual di Google Sheets. Proses ini rawan kesalahan hitung stok saat pengunjung
						booth offline ramai.
					</p>

					<p class="text-xs leading-relaxed text-[#404040] sm:text-sm dark:text-[#b8b5ad]">
						Invoizy menggantikan alur manual tersebut menjadi aplikasi web mandiri: pembeli memilih
						varian barang, sistem mengunci pesanan, menghitung ongkir atau opsi self-pickup, dan
						menerbitkan invoice PDF resmi secara instan.
					</p>

					<!-- Action Buttons (Strict min-h-[44px] tap target for touch screens) -->
					<div class="flex flex-wrap items-center gap-2.5 pt-1">
						<a
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#fea770] px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9]"
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
							<span>Profil GitHub</span>
							<ExternalLink size={13} class="shrink-0" />
						</a>

						<a
							href="https://instagram.com"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						>
							<InstagramIcon size={16} />
							<span>Instagram</span>
							<ExternalLink size={13} class="shrink-0" />
						</a>
					</div>
				</div>
			</div>
		</section>

		<!-- Architectural Focus & System Specifications (Antislop UI: varied rhythm, not identical cards) -->
		<section class="space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="font-serif text-lg font-black text-[#262626] sm:text-xl dark:text-[#f2efe9]">
					Rancang Bangun Sistem
				</h3>
				<span class="font-mono text-xs font-bold text-[#595959] dark:text-[#a3a099]">
					Spesifikasi Arsitektur
				</span>
			</div>

			<!-- Varied Structural Layout: 1 Lead Engine Card + 3 Supporting Pillars -->
			<div class="space-y-4">
				<!-- Lead Architecture Card: Flow Transaksi -->
				<div
					class="rounded-xl border-2 border-[#262626] bg-[#f9f7f2] p-5 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
				>
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#fea770] text-[#262626]"
							>
								<Zap size={20} strokeWidth={2.5} />
							</div>
							<div>
								<h4
									class="font-mono text-sm font-black text-[#262626] uppercase dark:text-[#f2efe9]"
								>
									Pipa Transaksi & Faktur Otomatis
								</h4>
								<p class="font-mono text-xs text-[#595959] dark:text-[#a3a099]">
									Tanpa Redirect Gateway Pihak Ketiga
								</p>
							</div>
						</div>
						<span
							class="w-fit rounded border border-[#262626] bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-[#065f46] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#34d399]"
						>
							Serverless Node.js
						</span>
					</div>
					<p class="mt-3 text-xs leading-relaxed text-[#404040] sm:text-sm dark:text-[#b8b5ad]">
						Pembeli memesan di katalog, total dihitung presisi dalam integer Rupiah, dan pembayaran
						diverifikasi via QRIS statis atau transfer bank. Invoice resmi diterbitkan dalam format
						PDF menggunakan Puppeteer Core tanpa membebani browser pengunjung.
					</p>
				</div>

				<!-- Supporting 3-Pillar Specs (Fluid Grid that drops to single column on mobile) -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
					<!-- Spec 1: Frontend -->
					<div
						class="rounded-lg border-2 border-[#262626] bg-white p-4 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
					>
						<div class="flex items-center gap-2">
							<FileCode2 size={16} class="text-[#262626] dark:text-[#fea770]" />
							<h5 class="font-mono text-xs font-black text-[#262626] uppercase dark:text-[#f2efe9]">
								Frontend & Kompilasi
							</h5>
						</div>
						<p class="mt-2 text-xs leading-relaxed text-[#595959] dark:text-[#a3a099]">
							SvelteKit 5 Runes menghasilkan JavaScript ringkas tanpa virtual DOM, menjaga katalog
							tetap responsif saat sinyal seluler padat di lokasi event.
						</p>
					</div>

					<!-- Spec 2: Cloud Infra -->
					<div
						class="rounded-lg border-2 border-[#262626] bg-white p-4 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
					>
						<div class="flex items-center gap-2">
							<Server size={16} class="text-[#262626] dark:text-[#a2e1db]" />
							<h5 class="font-mono text-xs font-black text-[#262626] uppercase dark:text-[#f2efe9]">
								Infrastruktur Cloud
							</h5>
						</div>
						<p class="mt-2 text-xs leading-relaxed text-[#595959] dark:text-[#a3a099]">
							Database PostgreSQL Supabase, serverless compute di Vercel region Singapura (sin1),
							dan proteksi rate limiter via Upstash Redis.
						</p>
					</div>

					<!-- Spec 3: Keamanan & Integritas -->
					<div
						class="rounded-lg border-2 border-[#262626] bg-white p-4 shadow-[2px_2px_0px_#262626] sm:col-span-2 md:col-span-1 dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
					>
						<div class="flex items-center gap-2">
							<ShieldCheck size={16} class="text-[#262626] dark:text-[#b4a6d5]" />
							<h5 class="font-mono text-xs font-black text-[#262626] uppercase dark:text-[#f2efe9]">
								Integritas Data
							</h5>
						</div>
						<p class="mt-2 text-xs leading-relaxed text-[#595959] dark:text-[#a3a099]">
							Pencatatan rincian order berupa snapshot permanen, isolasi session Better Auth, dan
							autentikasi aman untuk panel pengelolaan toko.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Tech Stack Badges (Single touch-friendly flex wrap) -->
		<section
			class="rounded-xl border-2 border-[#262626] bg-white p-5 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331]"
		>
			<h4
				class="font-mono text-xs font-black tracking-wider text-[#262626] uppercase sm:text-sm dark:text-[#f2efe9]"
			>
				Alat & Dependensi Utama
			</h4>
			<div class="mt-3 flex flex-wrap gap-2">
				{#each [{ name: 'SvelteKit 5', color: 'bg-[#fea770]' }, { name: 'TypeScript', color: 'bg-[#a2e1db]' }, { name: 'Tailwind CSS v4', color: 'bg-[#b4a6d5]' }, { name: 'Supabase Postgres', color: 'bg-[#fef08a]' }, { name: 'Drizzle ORM', color: 'bg-white dark:bg-[#1a1825]' }, { name: 'Upstash Redis', color: 'bg-[#fea770]' }, { name: 'Vercel (sin1)', color: 'bg-[#a2e1db]' }, { name: 'Better Auth', color: 'bg-[#b4a6d5]' }, { name: 'Puppeteer Core', color: 'bg-[#fef08a]' }] as tag (tag.name)}
					<span
						class="inline-flex items-center gap-1.5 rounded-md border-2 border-[#262626] {tag.color} px-2.5 py-1 font-mono text-xs font-bold text-[#262626] shadow-[1.5px_1.5px_0px_#262626] dark:border-[#f2efe9] dark:text-[#262626]"
					>
						<CheckCircle2 size={12} strokeWidth={2.5} class="shrink-0" />
						{tag.name}
					</span>
				{/each}
			</div>
		</section>

		<!-- Direct Contact Box (Zero generic slop, real purpose) -->
		<section
			class="rounded-xl border-2 border-[#262626] bg-[#b4a6d5]/20 p-5 text-center sm:p-7 dark:border-[#f2efe9]/40 dark:bg-[#b4a6d5]/10"
		>
			<div class="mx-auto max-w-md space-y-2.5">
				<h3 class="font-serif text-xl font-black text-[#262626] sm:text-2xl dark:text-[#f2efe9]">
					Kontak & Diskusi Proyek
				</h3>
				<p class="text-xs leading-relaxed text-[#595959] sm:text-sm dark:text-[#a3a099]">
					Tertarik membuat sistem katalog mandiri serupa untuk toko atau event Anda? Kirim
					pertanyaan atau detail kebutuhan melalui email.
				</p>
				<div class="pt-2">
					<a
						href="mailto:contact@invoizy.store"
						class="inline-flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#262626] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
					>
						<Mail size={15} class="shrink-0" />
						<span>Hubungi via Email</span>
					</a>
				</div>
			</div>
		</section>
	</main>
</div>
