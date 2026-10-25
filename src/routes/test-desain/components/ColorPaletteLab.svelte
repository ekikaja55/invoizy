<script lang="ts">
	import { mode, toggleMode } from 'mode-watcher';
	import { toast } from 'svelte-sonner';
	import { Palette, Copy, Check, Sun, Moon, Sparkles, Eye, Layers } from '@lucide/svelte';

	let isDark = $derived(mode.current === 'dark');
	let copiedHex = $state<string | null>(null);

	function copyToClipboard(hex: string, label: string) {
		navigator.clipboard.writeText(hex);
		copiedHex = hex;
		toast.success(`Kode warna ${hex} (${label}) disalin ke clipboard!`);
		setTimeout(() => {
			if (copiedHex === hex) {
				copiedHex = null;
			}
		}, 2000);
	}

	interface ColorToken {
		name: string;
		token: string;
		lightHex: string;
		darkHex: string;
		usage: string;
		contrastLight: string;
		contrastDark: string;
	}

	// 1. Permukaan Dasar & Tipografi
	const baseTokens: ColorToken[] = [
		{
			name: 'Canvas Background',
			token: '--color-canvas',
			lightHex: '#f2efe9',
			darkHex: '#1a1825',
			usage:
				'Latar belakang utama seluruh dokumen & halaman web (tekstur kertas cream hangat vs charcoal malam pekat).',
			contrastLight: 'Latar Dasar',
			contrastDark: 'Latar Dasar'
		},
		{
			name: 'Surface Card',
			token: '--color-surface',
			lightHex: '#ffffff',
			darkHex: '#252331',
			usage:
				'Kartu produk, baris tabel data, modal dialog, popover kontak, dan kontainer form utama.',
			contrastLight: 'Teks Primer 13.5:1 (AAA)',
			contrastDark: 'Teks Primer 11.2:1 (AAA)'
		},
		{
			name: 'Sunken / Draft Box',
			token: '--color-surface-sunken',
			lightHex: '#f9f7f2',
			darkHex: '#1f1d2c',
			usage:
				'Area kanvas simulator, kotak preview mockup, kolom total pada invoice, input form inactive.',
			contrastLight: 'Sub-latar Lembut',
			contrastDark: 'Sub-latar Lembut'
		},
		{
			name: 'Primary Ink & Monoline',
			token: '--color-ink-primary',
			lightHex: '#262626',
			darkHex: '#f2efe9',
			usage:
				'Garis tepi tunggal (border monoline 1.5px), teks judul headline, tombol CTA transaksi pekat.',
			contrastLight: 'Rasio Kontras 12.8:1 (AAA)',
			contrastDark: 'Rasio Kontras 13.1:1 (AAA)'
		},
		{
			name: 'Secondary Ink / Muted',
			token: '--color-ink-secondary',
			lightHex: '#404040',
			darkHex: '#b8b5ad',
			usage:
				'Deskripsi produk, teks bantuan input, label metadata sekunder (garansi kontras minimum > 7:1).',
			contrastLight: 'Rasio Kontras 7.2:1 (AAA)',
			contrastDark: 'Rasio Kontras 7.5:1 (AAA)'
		}
	];

	// 2. Warna Brand Klien (Aksen Fungsional)
	const brandTokens: ColorToken[] = [
		{
			name: 'Brand Lavender (Lilac)',
			token: '--color-brand-lavender',
			lightHex: '#b4a6d5',
			darkHex: '#8e7db9',
			usage:
				'Latar tab aktif bernavigasi, header kategori produk, efek hover tombol monoline sekunder.',
			contrastLight: 'Aksen Data Primer',
			contrastDark: 'Aksen Data Terang'
		},
		{
			name: 'Brand Mint (Pastel)',
			token: '--color-brand-mint',
			lightHex: '#a2e1db',
			darkHex: '#5fb3ab',
			usage:
				'Badge stok aman, penanda varian produk akrilik/print, chip filter kategori belanja aktif.',
			contrastLight: 'Penanda Varian',
			contrastDark: 'Penanda Varian'
		},
		{
			name: 'Brand Peach (Warm)',
			token: '--color-brand-peach',
			lightHex: '#fea770',
			darkHex: '#e88d55',
			usage:
				'Badge diskon gantung (price tag promo), penanda bundle event Chibicon, tombol FAB mobile.',
			contrastLight: 'Highlight Promo',
			contrastDark: 'Highlight Promo'
		}
	];

	// 3. Warna Semantik Status (WCAG AA Compliant)
	interface SemanticToken {
		status: string;
		label: string;
		lightBg: string;
		lightText: string;
		darkBg: string;
		darkText: string;
		usage: string;
	}

	const semanticTokens: SemanticToken[] = [
		{
			status: 'Sukses / Lunas',
			label: 'PAID / CONFIRMED',
			lightBg: '#d1fae5',
			lightText: '#065f46',
			darkBg: '#064e3b',
			darkText: '#34d399',
			usage:
				'Pembayaran terverifikasi lunas, pesanan siap diambil di venue atau siap dikirim kurir.'
		},
		{
			status: 'Peringatan / Menunggu',
			label: 'PENDING / WAITING',
			lightBg: '#fef3c7',
			lightText: '#92400e',
			darkBg: '#78350f',
			darkText: '#fbbf24',
			usage: 'Menunggu konfirmasi admin atas bukti transfer, stok produk kritis menipis (≤ 3 pcs).'
		},
		{
			status: 'Bahaya / Batal',
			label: 'FAILED / EXPIRED',
			lightBg: '#fee2e2',
			lightText: '#991b1b',
			darkBg: '#7f1d1d',
			darkText: '#f87171',
			usage: 'Pesanan kedaluwarsa, stok produk habis total, tombol hapus produk/batal transaksi.'
		},
		{
			status: 'Informasi / Dokumen',
			label: 'INFO / GENERATING',
			lightBg: '#e0e7ff',
			lightText: '#3730a3',
			darkBg: '#1e1b4b',
			darkText: '#818cf8',
			usage: 'Pembuatan berkas invoice PDF server-side, simulasi navigasi toast di sandbox.'
		}
	];
</script>

<div class="space-y-12">
	<!-- HEADER LAB PALETTE -->
	<div
		class="rounded-md border-[1.5px] border-[#262626] bg-white p-5 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
	>
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<div class="flex items-center gap-2">
					<Palette size={20} class="text-[#262626] dark:text-[#f2efe9]" />
					<h2 class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
						Invoizy Warm Monoline Color System
					</h2>
				</div>
				<p class="mt-1 max-w-2xl text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
					Daftar token palet warna. Nilai Hex, kontras, dan contoh blok swatch di bawah ini <strong
						>bereaksi seketika (*reactive*)</strong
					> saat Anda menukar tema terang dan gelap.
				</p>
			</div>

			<!-- Dynamic Active Theme Indicator & Quick Switcher -->
			<div class="flex shrink-0 items-center gap-2.5">
				<span
					class="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-[#262626] px-3 py-1.5 font-mono text-xs font-bold shadow-[1.5px_1.5px_0px_#262626] {isDark
						? 'bg-[#b4a6d5] text-[#262626] dark:border-[#f2efe9] dark:text-[#1a1825]'
						: 'bg-[#fea770] text-[#262626]'}"
				>
					{#if isDark}
						<Moon size={14} strokeWidth={2.5} />
						<span>TEMA GELAP (DARK)</span>
					{:else}
						<Sun size={14} strokeWidth={2.5} />
						<span>TEMA TERANG (LIGHT)</span>
					{/if}
				</span>

				<button
					type="button"
					onclick={toggleMode}
					class="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-[#262626] bg-white px-3 py-1.5 text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
					title="Beralih tema terang/gelap sekarang"
				>
					<span>Tukar Mode</span>
				</button>
			</div>
		</div>
	</div>

	<!-- SECTION 1: BASE SURFACES & INK -->
	<section class="space-y-4">
		<div
			class="flex items-center justify-between border-b-[1.5px] border-[#262626]/20 pb-2 dark:border-[#f2efe9]/20"
		>
			<div class="flex items-center gap-2">
				<Layers size={18} class="text-[#262626] dark:text-[#f2efe9]" />
				<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					1. Permukaan Dasar & Tinta Tipografi (Base Surfaces & Ink)
				</h3>
			</div>
			<span
				class="rounded-full border border-[#262626] bg-[#f2efe9] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
			>
				{isDark ? 'Mode Gelap Aktif' : 'Mode Terang Aktif'}
			</span>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each baseTokens as token (token.name)}
				{@const currentHex = isDark ? token.darkHex : token.lightHex}
				{@const currentContrast = isDark ? token.contrastDark : token.contrastLight}
				{@const isCopied = copiedHex === currentHex}

				<div
					class="group flex flex-col justify-between rounded-md border-[1.5px] border-[#262626] bg-white p-4 shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
				>
					<!-- Top Color Preview Swatch -->
					<div>
						<div
							class="relative flex h-20 w-full items-end rounded-md border-[1.5px] border-[#262626] p-2.5 shadow-inner transition-colors duration-200 dark:border-[#f2efe9]/30"
							style="background-color: {currentHex};"
						>
							<span
								class="rounded border border-[#262626]/40 bg-black/60 px-2 py-0.5 font-mono text-[11px] font-bold text-white backdrop-blur-xs"
							>
								{currentHex.toUpperCase()}
							</span>
						</div>

						<div class="mt-3">
							<div class="flex items-center justify-between">
								<h4 class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
									{token.name}
								</h4>
								<span
									class="font-mono text-[11px] font-semibold text-[#404040] dark:text-[#b8b5ad]"
								>
									{token.token}
								</span>
							</div>
							<p class="mt-1 text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
								{token.usage}
							</p>
						</div>
					</div>

					<!-- Bottom Copy Action & Metadata -->
					<div
						class="mt-4 flex items-center justify-between border-t border-[#262626]/10 pt-3 dark:border-[#f2efe9]/10"
					>
						<span class="font-mono text-[10px] text-[#404040] dark:text-[#b8b5ad]">
							{currentContrast}
						</span>

						<button
							type="button"
							onclick={() => copyToClipboard(currentHex, token.name)}
							class="inline-flex items-center gap-1 rounded border border-[#262626] bg-[#f2efe9] px-2 py-1 font-mono text-[11px] font-bold text-[#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
							title="Salin kode hexa"
						>
							{#if isCopied}
								<Check size={12} strokeWidth={2.5} class="text-[#065f46] dark:text-[#34d399]" />
								<span>Tersalin!</span>
							{:else}
								<Copy size={12} />
								<span>Salin Hex</span>
							{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- SECTION 2: CLIENT BRAND COLORS -->
	<section class="space-y-4">
		<div
			class="flex items-center justify-between border-b-[1.5px] border-[#262626]/20 pb-2 dark:border-[#f2efe9]/20"
		>
			<div class="flex items-center gap-2">
				<Sparkles size={18} class="text-[#262626] dark:text-[#f2efe9]" />
				<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					2. Warna Brand Klien — Pastel Aksen Fungsional
				</h3>
			</div>
			<span
				class="rounded-full border border-[#262626] bg-[#fea770] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626]"
			>
				Aksen Data & Promo
			</span>
		</div>

		<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
			Warna brand khas klien digunakan khusus sebagai aksen penanda visual yang fungsional, bukan
			latar belakang keseluruhan dokumen.
		</p>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each brandTokens as token (token.name)}
				{@const currentHex = isDark ? token.darkHex : token.lightHex}
				{@const isCopied = copiedHex === currentHex}

				<div
					class="group flex flex-col justify-between rounded-md border-[1.5px] border-[#262626] bg-white p-4 shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
				>
					<div>
						<!-- Swatch Box with Physical Monoline border -->
						<div
							class="relative flex h-24 w-full items-end justify-between rounded-md border-[1.5px] border-[#262626] p-2.5 shadow-[2px_2px_0px_#262626] transition-colors duration-200"
							style="background-color: {currentHex};"
						>
							<span
								class="rounded border border-[#262626] bg-white/90 px-2 py-0.5 font-mono text-xs font-black text-[#262626]"
							>
								{currentHex.toUpperCase()}
							</span>
							<span class="font-mono text-[10px] font-bold text-[#262626]/80 uppercase">
								{isDark ? 'Dark Mode' : 'Light Mode'}
							</span>
						</div>

						<div class="mt-3">
							<div class="flex items-center justify-between">
								<h4 class="font-serif text-sm font-bold text-[#262626] dark:text-[#f2efe9]">
									{token.name}
								</h4>
								<span
									class="font-mono text-[11px] font-semibold text-[#404040] dark:text-[#b8b5ad]"
								>
									{token.token}
								</span>
							</div>
							<p class="mt-1 text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
								{token.usage}
							</p>
						</div>
					</div>

					<!-- Bottom Copy Action -->
					<div
						class="mt-4 flex items-center justify-between border-t border-[#262626]/10 pt-3 dark:border-[#f2efe9]/10"
					>
						<span class="font-mono text-[10px] text-[#404040] dark:text-[#b8b5ad]">
							{token.contrastLight}
						</span>

						<button
							type="button"
							onclick={() => copyToClipboard(currentHex, token.name)}
							class="inline-flex items-center gap-1 rounded border border-[#262626] bg-[#f2efe9] px-2 py-1 font-mono text-[11px] font-bold text-[#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
							title="Salin kode hexa"
						>
							{#if isCopied}
								<Check size={12} strokeWidth={2.5} class="text-[#065f46] dark:text-[#34d399]" />
								<span>Tersalin!</span>
							{:else}
								<Copy size={12} />
								<span>Salin Hex</span>
							{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- SECTION 3: SEMANTIC STATUS COLORS (WCAG AA COMPLIANT) -->
	<section class="space-y-4">
		<div
			class="flex items-center justify-between border-b-[1.5px] border-[#262626]/20 pb-2 dark:border-[#f2efe9]/20"
		>
			<div class="flex items-center gap-2">
				<Eye size={18} class="text-[#262626] dark:text-[#f2efe9]" />
				<h3 class="font-serif text-base font-bold text-[#262626] dark:text-[#f2efe9]">
					3. Warna Semantik Status Transaksi (WCAG AA Compliant)
				</h3>
			</div>
			<span
				class="rounded-full border border-[#262626] bg-[#a2e1db] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#262626]"
			>
				Kontras Rasio &ge; 4.5:1
			</span>
		</div>

		<p class="text-xs text-[#404040] dark:text-[#b8b5ad]">
			Warna status transaksi memadukan latar kontras tinggi dengan teks arang gelap di mode terang,
			dan teks pastel terang menyala di mode gelap untuk keterbacaan mutlak.
		</p>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each semanticTokens as item (item.status)}
				{@const currentBg = isDark ? item.darkBg : item.lightBg}
				{@const currentText = isDark ? item.darkText : item.lightText}
				{@const isBgCopied = copiedHex === currentBg}
				{@const isTextCopied = copiedHex === currentText}

				<div
					class="flex flex-col justify-between rounded-md border-[1.5px] border-[#262626] bg-white p-4 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#252331]"
				>
					<div>
						<!-- Live Status Pill Mockup with Current Dynamic Colors -->
						<div
							class="flex items-center justify-between rounded-md border-[1.5px] p-3 transition-colors duration-200"
							style="background-color: {currentBg}; border-color: {currentText}; color: {currentText};"
						>
							<div class="flex items-center gap-2">
								<span
									class="inline-block h-2.5 w-2.5 rounded-full border"
									style="background-color: {currentText}; border-color: {currentText};"
								></span>
								<span class="font-serif text-sm font-bold">
									{item.status}
								</span>
							</div>
							<span
								class="rounded px-2 py-0.5 font-mono text-xs font-black tracking-wider uppercase"
								style="border: 1px solid {currentText};"
							>
								{item.label}
							</span>
						</div>

						<p class="mt-3 text-xs leading-relaxed text-[#404040] dark:text-[#b8b5ad]">
							{item.usage}
						</p>
					</div>

					<!-- Hex Values and Quick Copy Bars -->
					<div
						class="mt-4 grid grid-cols-2 gap-2 border-t border-[#262626]/10 pt-3 font-mono text-[11px] dark:border-[#f2efe9]/10"
					>
						<!-- Background Hex Box -->
						<button
							type="button"
							onclick={() => copyToClipboard(currentBg, `${item.status} Background`)}
							class="flex flex-col items-start rounded border border-[#262626]/30 bg-[#f9f7f2] p-2 text-left transition-colors hover:bg-[#b4a6d5]/20 dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
						>
							<span class="text-[10px] text-[#404040] dark:text-[#b8b5ad]">Latar (Bg):</span>
							<div class="mt-0.5 flex w-full items-center justify-between">
								<span class="font-bold text-[#262626] dark:text-[#f2efe9]"
									>{currentBg.toUpperCase()}</span
								>
								{#if isBgCopied}
									<Check size={12} class="text-[#065f46] dark:text-[#34d399]" />
								{:else}
									<Copy size={11} class="text-[#404040] dark:text-[#b8b5ad]" />
								{/if}
							</div>
						</button>

						<!-- Text/Border Hex Box -->
						<button
							type="button"
							onclick={() => copyToClipboard(currentText, `${item.status} Teks & Border`)}
							class="flex flex-col items-start rounded border border-[#262626]/30 bg-[#f9f7f2] p-2 text-left transition-colors hover:bg-[#b4a6d5]/20 dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
						>
							<span class="text-[10px] text-[#404040] dark:text-[#b8b5ad]">Teks/Garis:</span>
							<div class="mt-0.5 flex w-full items-center justify-between">
								<span class="font-bold text-[#262626] dark:text-[#f2efe9]"
									>{currentText.toUpperCase()}</span
								>
								{#if isTextCopied}
									<Check size={12} class="text-[#065f46] dark:text-[#34d399]" />
								{:else}
									<Copy size={11} class="text-[#404040] dark:text-[#b8b5ad]" />
								{/if}
							</div>
						</button>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
