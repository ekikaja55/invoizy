<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { EMERGENCY_CONTACT } from '$lib/constants';
	import { waLink } from '$lib/utils/contact';
	import SketchBackground from '$lib/components/ui/SketchBackground.svelte';
	import InstagramIcon from '$lib/components/icons/InstagramIcon.svelte';
	import { AlertTriangle, RotateCcw, Home, MessageCircle, Mail } from '@lucide/svelte';

	const messages: Record<number, string> = {
		404: 'Halaman tidak ditemukan.',
		403: 'Kamu tidak punya akses ke halaman ini.',
		500: 'Server sedang gangguan.',
		503: 'Layanan sedang tidak tersedia.'
	};

	// Panel kontak tampil di SEMUA error — pesannya disesuaikan:
	// 404/403 = butuh petunjuk/akses, 5xx = darurat server.
	const isServerError = $derived(page.status >= 500);
	const contactTitle = $derived(
		page.status === 404
			? 'Tidak ketemu yang dicari?'
			: page.status === 403
				? 'Perlu akses masuk?'
				: 'Butuh bantuan cepat?'
	);
	const contactMessage = $derived(
		page.status === 404
			? 'Link mungkin salah ketik atau halaman sudah dipindahkan. Kalau yakin link-nya benar, hubungi kami:'
			: page.status === 403
				? 'Halaman ini khusus pengelola toko. Kalau kamu admin dan belum login, silakan masuk dulu:'
				: 'Server kami sedang pemeliharaan sejenak. Order-mu tetap aman tercatat — hubungi kami lewat:'
	);
	const wa = waLink(EMERGENCY_CONTACT.wa, 'Halo, web nya error. Saya butuh bantuan.');
	const igHandle = EMERGENCY_CONTACT.instagram.replace(/^@/, '');
</script>

<svelte:head>
	<title>{page.status} — {messages[page.status] ?? 'Terjadi Kesalahan'}</title>
</svelte:head>

<div class="relative min-h-screen bg-papaya text-ink transition-colors dark:bg-ink dark:text-papaya flex items-center justify-center p-4 py-12 overflow-x-clip">
	<!-- Dynamic SVG Sketch Background Layer -->
	<SketchBackground />

	<!-- Main Error Card (Digital Scrapbook Memo) -->
	<main class="relative z-10 w-full max-w-lg">
		<div
			class="relative rounded-[18px_8px_16px_10px] border-2 border-brandy bg-white/95 p-6 sm:p-8 shadow-[6px_6px_0px_#78290f] backdrop-blur-xs transition-all dark:border-papaya/40 dark:bg-ink/95 dark:text-papaya dark:shadow-[6px_6px_0px_rgba(255,236,209,0.2)]"
		>
			<!-- Decorative Top Washi Tape -->
			<div
				class="pointer-events-none absolute -top-3.5 left-1/2 h-4 w-32 -translate-x-1/2 -rotate-2 border border-brandy/30 bg-yellow-200/90 shadow-[1px_1px_0px_rgba(120,41,15,0.2)] backdrop-blur-xs dark:bg-papaya/30"
				aria-hidden="true"
			></div>

			<!-- Header: Rubber Stamp & Status Badge -->
			<div class="flex flex-col items-center text-center space-y-3 pb-2">
				<div class="flex items-center gap-2">
					<div
						class="inline-flex items-center gap-1.5 -rotate-3 rounded-[6px_3px_5px_2px] border-2 border-double {isServerError ? 'border-crimson bg-crimson/15 text-crimson' : 'border-brandy bg-papaya text-brandy dark:border-papaya/40 dark:bg-ink dark:text-papaya'} px-3.5 py-1 font-mono text-xs font-black tracking-widest uppercase shadow-[2px_2px_0px_#78290f]"
					>
						<AlertTriangle size={14} strokeWidth={2.75} />
						<span>KODE STATUS: {page.status}</span>
					</div>
				</div>

				<h1 class="font-headline text-2xl sm:text-3xl font-black leading-tight text-ink dark:text-papaya">
					{messages[page.status] ?? 'Terjadi kesalahan sistem.'}
				</h1>

				{#if page.error?.message}
					<p class="font-mono text-xs font-bold text-crimson dark:text-amber-400 bg-papaya/50 dark:bg-ink/80 px-3 py-1.5 rounded-[6px_2px_5px_2px] border border-brandy/20 max-w-full break-all">
						{page.error.message}
					</p>
				{/if}
			</div>

			<!-- Divider Perforated / Dashed -->
			<div class="my-5 border-t-2 border-dashed border-brandy/30 dark:border-papaya/30"></div>

			<!-- Contact Help Desk Panel -->
			<div
				class="rounded-[12px_6px_10px_4px] border-2 border-brandy/30 bg-papaya/50 p-4 text-left dark:border-papaya/20 dark:bg-ink/50"
			>
				<p class="font-headline text-sm font-bold text-ink dark:text-papaya">
					{contactTitle}
				</p>
				<p class="mt-1 font-sans text-xs leading-relaxed text-brandy/80 dark:text-papaya/70">
					{contactMessage}
				</p>

				<div class="mt-3.5 flex flex-wrap gap-2.5">
					{#if wa}
						<a
							href={wa}
							target="_blank"
							rel="external noopener noreferrer"
							class="inline-flex items-center gap-1.5 rounded-[8px_3px_7px_2px] border-2 border-brandy bg-forest text-white px-3.5 py-2 font-mono text-xs font-bold shadow-[2px_2px_0px_#78290f] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
						>
							<MessageCircle size={14} strokeWidth={2.5} />
							<span>Chat WhatsApp</span>
						</a>
					{/if}

					<a
						href={`mailto:${EMERGENCY_CONTACT.email}`}
						class="inline-flex items-center gap-1.5 rounded-[6px_8px_4px_7px] border-2 border-brandy bg-white px-3.5 py-2 font-mono text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] transition-all hover:bg-papaya/40 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya"
					>
						<Mail size={14} strokeWidth={2.5} class="text-teal dark:text-tangerine" />
						<span>Email</span>
					</a>

					<a
						href={`https://instagram.com/${igHandle}`}
						target="_blank"
						rel="external noopener noreferrer"
						class="inline-flex items-center gap-1.5 rounded-[8px_4px_7px_3px] border-2 border-brandy bg-white px-3.5 py-2 font-mono text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] transition-all hover:bg-papaya/40 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya"
					>
						<InstagramIcon size={14} class="text-tangerine" />
						<span>@{igHandle}</span>
					</a>
				</div>
			</div>

			<!-- Bottom Actions -->
			<div class="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
				{#if isServerError}
					<button
						onclick={() => window.location.reload()}
						class="flex w-full sm:w-auto items-center justify-center gap-2 -rotate-1 rounded-[10px_4px_8px_4px] border-2 border-brandy bg-white px-5 py-2.5 font-sans text-sm font-bold text-ink shadow-[3px_3px_0px_#78290f] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya"
					>
						<RotateCcw size={15} strokeWidth={2.5} />
						<span>Coba Muat Ulang</span>
					</button>
				{/if}

				<a
					href={resolve('/')}
					class="flex w-full sm:w-auto items-center justify-center gap-2 rotate-1 rounded-[12px_6px_10px_4px] border-2 border-brandy bg-tangerine px-5 py-2.5 font-sans text-sm font-bold text-white shadow-[3px_3px_0px_#78290f] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#78290f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
				>
					<Home size={15} strokeWidth={2.5} />
					<span>Kembali ke Beranda</span>
				</a>
			</div>
		</div>
	</main>
</div>
