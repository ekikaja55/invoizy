<script lang="ts">
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import InvoiceDocument from '$lib/components/invoice/InvoiceDocument.svelte';
	import { EMERGENCY_CONTACT } from '$lib/constants';
	import { waLink } from '$lib/utils/contact';
	import InstagramIcon from '$lib/components/icons/InstagramIcon.svelte';
	import {
		AlertTriangle,
		Download,
		Printer,
		Home,
		RotateCcw,
		MessageCircle,
		Mail,
		FileText
	} from '@lucide/svelte';
	import type { InvoiceData } from '$lib/components/invoice';

	interface Props {
		invoice: InvoiceData;
	}

	let { invoice }: Props = $props();

	// State Simulator Error
	let simStatus = $state<404 | 403 | 500 | 503>(404);
	let simCustomMsg = $state<string>('');

	// State Switcher Eksperimen Invoice Web
	let invoiceVariant = $state<'original' | 'client-experiment'>('original');

	const errorMessages: Record<number, string> = {
		404: 'Halaman tidak ditemukan.',
		403: 'Kamu tidak punya akses ke halaman ini.',
		500: 'Server sedang gangguan.',
		503: 'Layanan sedang tidak tersedia.'
	};

	let isServerError = $derived(simStatus >= 500);

	let contactTitle = $derived(
		simStatus === 404
			? 'Tidak ketemu yang dicari?'
			: simStatus === 403
				? 'Perlu akses masuk?'
				: 'Butuh bantuan cepat?'
	);

	let contactMessage = $derived(
		simStatus === 404
			? 'Link mungkin salah ketik atau halaman sudah dipindahkan. Kalau yakin link-nya benar, hubungi kami:'
			: simStatus === 403
				? 'Halaman ini khusus pengelola toko. Kalau kamu admin dan belum login, silakan masuk dulu:'
				: 'Server kami sedang pemeliharaan sejenak. Order-mu tetap aman tercatat — hubungi kami lewat:'
	);

	let waUrl = $derived(
		waLink(
			EMERGENCY_CONTACT.wa,
			`Halo Admin Invoizy, saya mengalami kendala error ${simStatus} di web.`
		)
	);

	let igHandle = EMERGENCY_CONTACT.instagram.replace(/^@/, '');
</script>

<div class="space-y-16">
	<!-- ============================================================ -->
	<!-- SECTION 1: ERROR PAGE SIMULATOR                              -->
	<!-- ============================================================ -->
	<section class="no-print space-y-6">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<div class="flex items-center gap-2">
					<span
						class="inline-block rounded-full border border-[#262626] bg-[#fee2e2] px-2.5 py-0.5 font-mono text-xs font-bold text-[#991b1b]"
					>
						FULL TEMPLATE
					</span>
					<h2
						class="font-serif text-lg font-bold tracking-tight text-[#262626] sm:text-xl dark:text-[#f2efe9]"
					>
						Error Page Simulator (+error.svelte)
					</h2>
				</div>
				<p class="mt-1 text-xs text-[#404040] dark:text-[#b8b5ad]">
					Simulasi antarmuka monoline saat user mengalami error HTTP 404, 403, 500, atau 503.
				</p>
			</div>

			<!-- Status Selector Buttons -->
			<div
				class="flex flex-wrap items-center gap-1.5 rounded-md border-[1.5px] border-[#262626] bg-white p-1.5 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
			>
				{#each [404, 403, 500, 503] as const as code (code)}
					<button
						type="button"
						onclick={() => (simStatus = code)}
						class="rounded-md border-[1.5px] px-2.5 py-1 font-mono text-xs font-bold transition-all {simStatus ===
						code
							? code >= 500
								? 'border-[#991b1b] bg-[#fee2e2] text-[#991b1b] shadow-[1px_1px_0px_#991b1b]'
								: 'border-[#262626] bg-[#fea770] text-[#262626] shadow-[1px_1px_0px_#262626]'
							: 'border-transparent text-[#262626] hover:bg-[#f2efe9] dark:text-[#f2efe9] dark:hover:bg-[#1a1825]'}"
					>
						HTTP {code}
					</button>
				{/each}
			</div>
		</div>

		<!-- Error Frame Preview Sandbox -->
		<div
			class="drafting-grid relative flex min-h-[460px] items-center justify-center overflow-hidden rounded-md border-[1.5px] border-[#262626] bg-[#f2efe9] p-6 shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#1a1825]"
		>
			<!-- Error Card (Monoline Container) -->
			<div class="relative z-10 w-full max-w-lg">
				<div
					class="relative rounded-xl border-2 border-[#262626] bg-white p-6 shadow-[4px_4px_0px_#262626] sm:p-8 dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
				>
					<!-- Header: Status Badge -->
					<div class="flex flex-col items-center space-y-3 pb-2 text-center">
						<div class="flex items-center gap-2">
							<div
								class="inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1 font-mono text-xs font-bold tracking-widest uppercase {isServerError
									? 'border-[#991b1b] bg-[#fee2e2] text-[#991b1b] shadow-[1.5px_1.5px_0px_#991b1b]'
									: 'border-[#262626] bg-[#fea770] text-[#262626] shadow-[1.5px_1.5px_0px_#262626] dark:border-[#a2e1db]'}"
							>
								<AlertTriangle size={14} strokeWidth={2.5} />
								<span>KODE STATUS: {simStatus}</span>
							</div>
						</div>

						<h3
							class="font-serif text-2xl leading-tight font-bold text-[#262626] sm:text-3xl dark:text-[#f2efe9]"
						>
							{errorMessages[simStatus]}
						</h3>

						{#if simCustomMsg || simStatus >= 500}
							<p
								class="max-w-full rounded-md border border-[#991b1b]/30 bg-[#fee2e2] px-3 py-1.5 font-mono text-xs font-bold break-all text-[#991b1b]"
							>
								{simCustomMsg ||
									(simStatus === 500
										? 'Database query timeout on table `orders`.'
										: 'Service temporarily overloaded.')}
							</p>
						{/if}
					</div>

					<!-- Divider Monoline -->
					<div class="my-5 border-t border-[#262626]/15 dark:border-[#f2efe9]/15"></div>

					<!-- Contact Help Desk Panel -->
					<div
						class="rounded-lg border-2 border-[#262626] bg-[#f2efe9] p-4 text-left dark:border-[#a2e1db]/40 dark:bg-[#1a1825]"
					>
						<p class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
							{contactTitle}
						</p>
						<p class="mt-1 font-sans text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
							{contactMessage}
						</p>

						<div class="mt-3.5 flex flex-wrap gap-2.5">
							{#if waUrl}
								<a
									href={waUrl}
									target="_blank"
									rel="external noopener noreferrer"
									onclick={(e) => {
										e.preventDefault();
										toast.info('[Sandbox] Simulasi: Menghubungi admin via WhatsApp');
									}}
									class="inline-flex items-center gap-1.5 rounded-md border-2 border-[#065f46] bg-[#a2e1db] px-3.5 py-2 font-mono text-xs font-bold text-[#065f46] shadow-[2px_2px_0px_#065f46] transition-all hover:bg-[#86d4cc] active:translate-y-0.5 active:shadow-none"
								>
									<MessageCircle size={15} />
									<span>Chat WhatsApp</span>
								</a>
							{/if}

							{#if igHandle}
								<a
									href="https://instagram.com/{igHandle}"
									target="_blank"
									rel="external noopener noreferrer"
									onclick={(e) => {
										e.preventDefault();
										toast.info('[Sandbox] Simulasi: Membuka profil Instagram');
									}}
									class="inline-flex items-center gap-1.5 rounded-md border border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] transition-all hover:bg-[#f2efe9] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9]/30 dark:bg-[#252331] dark:text-[#f2efe9]"
								>
									<InstagramIcon class="h-4 w-4" />
									<span>@{igHandle}</span>
								</a>
							{/if}

							{#if EMERGENCY_CONTACT.email}
								<a
									href="mailto:{EMERGENCY_CONTACT.email}?subject=Kendala%20Aplikasi%20(Status%20{simStatus})"
									onclick={(e) => {
										e.preventDefault();
										toast.info('[Sandbox] Simulasi: Mengirim email laporan kendala');
									}}
									class="inline-flex items-center gap-1.5 rounded-md border border-[#262626] bg-white px-3 py-2 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] transition-all hover:bg-[#f2efe9] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9]/30 dark:bg-[#252331] dark:text-[#f2efe9]"
								>
									<Mail size={15} />
									<span>Email</span>
								</a>
							{/if}
						</div>
					</div>

					<!-- Navigation Action Buttons -->
					<div class="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
						<button
							type="button"
							onclick={() => toast.info('[Sandbox] Simulasi: Memuat ulang halaman error')}
							class="inline-flex items-center justify-center gap-2 rounded-md border-2 border-[#262626] bg-[#fea770] px-5 py-2.5 font-sans text-sm font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[2px_2px_0px_#b4a6d5]"
						>
							<RotateCcw size={16} />
							<span>Coba Muat Ulang</span>
						</button>

						<a
							href={resolve('/')}
							onclick={(e) => {
								e.preventDefault();
								toast.info('[Sandbox] Navigasi: Menuju Beranda ("/")');
							}}
							class="inline-flex items-center justify-center gap-2 rounded-md border-2 border-[#262626] bg-white px-5 py-2.5 font-sans text-sm font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
						>
							<Home size={16} />
							<span>Kembali ke Beranda</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ============================================================ -->
	<!-- SECTION 2: INVOICE WEB & PDF DOWNLOAD TEMPLATE               -->
	<!-- ============================================================ -->
	<section class="space-y-6">
		<div class="no-print flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<div class="flex items-center gap-2">
					<span
						class="inline-block rounded-full border border-[#262626] bg-[#a2e1db] px-2.5 py-0.5 font-mono text-xs font-bold text-[#262626]"
					>
						DOCUMENT & EXPORT
					</span>
					<h2
						class="font-serif text-lg font-bold tracking-tight text-[#262626] sm:text-xl dark:text-[#f2efe9]"
					>
						Invoice Template & Direct PDF Export
					</h2>
				</div>
				<p class="mt-1 text-xs text-[#404040] dark:text-[#b8b5ad]">
					Pratinjau render web dari InvoiceDocument beserta tombol direct unduh berkas PDF
					server-side dan print media cetak faktur.
				</p>
			</div>

			<!-- Action Buttons: Print Media & Direct Download PDF -->
			<div class="flex flex-wrap items-center gap-2.5">
				<!-- Window / Media Print Button -->
				<button
					type="button"
					onclick={() => window.print()}
					class="inline-flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] bg-white px-4 py-2 font-sans text-sm font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#f2efe9] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#433e56]"
				>
					<Printer size={16} />
					<span>Cetak Faktur (Print Media)</span>
				</button>

				<!-- Direct Download PDF Button -->
				<a
					href={resolve('/test-desain/pdf')}
					download="INVOICE-EKSPERIMEN-CHOLAZEY.pdf"
					class="inline-flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] bg-[#262626] px-4 py-2 font-sans text-sm font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#e0ded8]"
				>
					<Download size={16} />
					<span>Unduh PDF (.pdf)</span>
				</a>
			</div>
		</div>

		<!-- PDF Design Specs Pill info -->
		<div
			class="no-print rounded-md border-[1.5px] border-[#262626] bg-white p-4 text-xs shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
		>
			<div class="flex items-center gap-2 font-bold text-[#262626] dark:text-[#f2efe9]">
				<FileText size={16} class="text-[#262626] dark:text-[#f2efe9]" />
				<span>Spesifikasi Desain Warm Monoline Editorial (DESIGN.md):</span>
			</div>
			<ul class="mt-2 list-inside list-disc space-y-1 text-[#404040] dark:text-[#b8b5ad]">
				<li>
					Background dokumen bernuansa Warm Cream (#f2efe9) dengan kisi berpetak (thin grid lines
					16pt).
				</li>
				<li>
					Kartu konten invoice warna putih solid (#ffffff) dengan garis tepi tunggal arang #262626.
				</li>
				<li>
					Tipografi: Helvetica Bold untuk judul, Courier monospaced retro untuk angka harga & kode
					invoice.
				</li>
				<li>Bagian total akhir diapit garis ganda akuntansi (*double underline*).</li>
			</ul>
		</div>

		<!-- Switcher Eksperimen Varian Invoice Web -->
		<div
			class="no-print flex flex-col gap-3 rounded-md border-[1.5px] border-[#262626] bg-[#fbf9f5] p-3.5 shadow-[2px_2px_0px_#262626] sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9]/30 dark:bg-[#252331]"
		>
			<div class="space-y-0.5">
				<p class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
					Eksperimen Gaya Invoice Web
				</p>
				<p class="font-sans text-xs text-[#404040] dark:text-[#b8b5ad]">
					Bandingkan tampilan invoice web standar dengan usulan estetika klien (4 warna
					MonolineLoader: badge mint, header lavender, & cluster ornamen).
				</p>
			</div>

			<div
				class="inline-flex rounded-md border-[1.5px] border-[#262626] bg-white p-1 shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#1a1825]"
			>
				<button
					type="button"
					onclick={() => (invoiceVariant = 'original')}
					class="rounded px-3 py-1 font-mono text-xs font-bold transition-all {invoiceVariant ===
					'original'
						? 'border border-[#262626] bg-[#f2efe9] text-[#262626] shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9]'
						: 'text-[#404040] hover:text-[#262626] dark:text-[#b8b5ad] dark:hover:text-[#f2efe9]'}"
				>
					Original Monoline
				</button>
				<button
					type="button"
					onclick={() => (invoiceVariant = 'client-experiment')}
					class="rounded px-3 py-1 font-mono text-xs font-bold transition-all {invoiceVariant ===
					'client-experiment'
						? 'border border-[#262626] bg-[#a2e1db] text-[#262626] shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#a2e1db] dark:text-[#1a1825]'
						: 'text-[#404040] hover:text-[#262626] dark:text-[#b8b5ad] dark:hover:text-[#f2efe9]'}"
				>
					Eksperimen Klien (4 Warna Loader)
				</button>
			</div>
		</div>

		<!-- Live Web Preview of InvoiceDocument (Drafting Grid Canvas) -->
		<div
			class="drafting-grid rounded-md border-[1.5px] border-[#262626] bg-[#f2efe9] p-4 shadow-[2px_2px_0px_#262626] sm:p-8 dark:border-[#f2efe9]/30 dark:bg-[#1a1825] print:border-none print:bg-transparent print:p-0 print:shadow-none"
		>
			<InvoiceDocument {...invoice} mode="web" variant={invoiceVariant} />
		</div>
	</section>
</div>
