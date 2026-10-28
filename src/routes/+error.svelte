<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { EMERGENCY_CONTACT } from '$lib/constants';
	import { waLink } from '$lib/utils/contact';
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

<div
	class="drafting-grid relative flex min-h-screen items-center justify-center overflow-x-clip bg-[#f2efe9] p-4 py-12 text-[#262626] transition-colors dark:bg-[#1a1825] dark:text-[#f2efe9]"
>
	<!-- Main Error Card (Monoline Container) -->
	<main class="relative z-10 w-full max-w-lg">
		<div
			class="relative rounded-xl border-2 border-[#262626] bg-white p-6 shadow-[4px_4px_0px_#262626] backdrop-blur-xs transition-all sm:p-8 dark:border-[#a2e1db] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[4px_4px_0px_#b4a6d5]"
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
						<span>KODE STATUS: {page.status}</span>
					</div>
				</div>

				<h1
					class="font-serif text-2xl leading-tight font-bold text-[#262626] sm:text-3xl dark:text-[#f2efe9]"
				>
					{messages[page.status] ?? 'Terjadi kesalahan sistem.'}
				</h1>

				{#if page.error?.message}
					<p
						class="max-w-full rounded-md border border-[#991b1b]/30 bg-[#fee2e2] px-3 py-1.5 font-mono text-xs font-bold break-all text-[#991b1b]"
					>
						{page.error.message}
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
					{#if wa}
						<a
							href={wa}
							target="_blank"
							rel="external noopener noreferrer"
							class="inline-flex items-center gap-1.5 rounded-md border-2 border-[#065f46] bg-[#a2e1db] px-3.5 py-2 font-mono text-xs font-bold text-[#065f46] shadow-[2px_2px_0px_#065f46] transition-all hover:bg-[#86d4cc] active:translate-y-0.5 active:shadow-none"
						>
							<MessageCircle size={14} strokeWidth={2.5} />
							<span>Chat WhatsApp</span>
						</a>
					{/if}

					<a
						href={`mailto:${EMERGENCY_CONTACT.email}`}
						class="inline-flex items-center gap-1.5 rounded-md border border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] transition-all hover:bg-[#f2efe9] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9]/30 dark:bg-[#252331] dark:text-[#f2efe9]"
					>
						<Mail size={14} strokeWidth={2.5} />
						<span>Email</span>
					</a>

					<a
						href={`https://instagram.com/${igHandle}`}
						target="_blank"
						rel="external noopener noreferrer"
						class="inline-flex items-center gap-1.5 rounded-md border border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] transition-all hover:bg-[#f2efe9] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9]/30 dark:bg-[#252331] dark:text-[#f2efe9]"
					>
						<InstagramIcon size={14} />
						<span>@{igHandle}</span>
					</a>
				</div>
			</div>

			<!-- Bottom Actions -->
			<div class="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
				{#if isServerError}
					<button
						onclick={() => window.location.reload()}
						class="inline-flex w-full items-center justify-center gap-2 rounded-md border-2 border-[#262626] bg-[#fea770] px-5 py-2.5 font-sans text-sm font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none sm:w-auto dark:border-[#a2e1db] dark:bg-[#fea770] dark:text-[#262626] dark:shadow-[2px_2px_0px_#b4a6d5]"
					>
						<RotateCcw size={15} strokeWidth={2.5} />
						<span>Coba Muat Ulang</span>
					</button>
				{/if}

				<a
					href={resolve('/')}
					class="inline-flex w-full items-center justify-center gap-2 rounded-md border-2 border-[#262626] bg-white px-5 py-2.5 font-sans text-sm font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none sm:w-auto dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
				>
					<Home size={15} strokeWidth={2.5} />
					<span>Kembali ke Beranda</span>
				</a>
			</div>
		</div>
	</main>
</div>
