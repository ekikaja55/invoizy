<script lang="ts">
	import { resolve } from '$app/paths';
	import { EMERGENCY_CONTACT } from '$lib/constants';
	import { waLink } from '$lib/utils/contact';
	import { AlertTriangle, RotateCcw, MessageCircle, Sparkles } from '@lucide/svelte';
	import InstagramIcon from '$lib/components/icons/InstagramIcon.svelte';

	let simStatus = $state(500);
	let simMessage = $state('Internal Server Error: Gagal menginisialisasi sesi database runtime');

	const wa = waLink(
		EMERGENCY_CONTACT.wa,
		'Halo cho.lazey, saya mendapati kendala sistem 500 saat membuka web. Mohon bantuannya.'
	);
	const igHandle = EMERGENCY_CONTACT.instagram.replace(/^@/, '');
</script>

<svelte:head>
	<title>Disaster Fallback Prototype — cho.lazey</title>
</svelte:head>

<div
	class="drafting-grid min-h-screen bg-[#f2efe9] p-4 py-8 font-sans text-[#262626] transition-colors dark:bg-[#1a1825] dark:text-[#f2efe9]"
>
	<div class="mx-auto max-w-2xl space-y-6">
		<!-- Sandbox Banner -->
		<aside
			class="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#262626] bg-[#b4a6d5] p-4 text-xs font-bold text-[#262626] shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
		>
			<div class="flex items-center gap-2">
				<Sparkles size={16} strokeWidth={2.5} />
				<span>PROTOTIPE DISASTER FALLBACK (src/error.html)</span>
			</div>
			<a href={resolve('/test-desain')} class="underline hover:opacity-80">
				Kembali ke Lab Desain
			</a>
		</aside>

		<!-- Simulation Controls -->
		<div
			class="rounded-xl border-2 border-[#262626] bg-white p-4 font-mono text-xs shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9]/30 dark:bg-[#1a1825]"
		>
			<p class="font-bold tracking-wider text-[#262626]/80 uppercase dark:text-[#f2efe9]/80">
				Kontrol Simulasi Error SvelteKit
			</p>
			<div class="mt-3 flex flex-wrap gap-2">
				<button
					type="button"
					onclick={() => {
						simStatus = 500;
						simMessage = 'Internal Server Error: Runtime serverless timeout pada worker sin1';
					}}
					class="rounded border border-[#262626] px-3 py-1 font-bold {simStatus === 500
						? 'bg-[#e87a5d] text-white'
						: 'bg-[#f2efe9] text-[#262626] dark:bg-black/30 dark:text-[#f2efe9]'}"
				>
					Simulasi 500
				</button>
				<button
					type="button"
					onclick={() => {
						simStatus = 503;
						simMessage = 'Service Unavailable: Database connection pool exhausted';
					}}
					class="rounded border border-[#262626] px-3 py-1 font-bold {simStatus === 503
						? 'bg-[#e87a5d] text-white'
						: 'bg-[#f2efe9] text-[#262626] dark:bg-black/30 dark:text-[#f2efe9]'}"
				>
					Simulasi 503
				</button>
			</div>
		</div>

		<!-- The Actual Standalone HTML Disaster Fallback Card (Inline Stylings for zero-dependency) -->
		<section
			class="relative rounded-[16px_4px_16px_4px] border-2 border-[#262626] bg-white p-6 shadow-[6px_6px_0px_#262626] sm:p-8 dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[6px_6px_0px_#b4a6d5]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
			>
				+
			</span>

			<div class="text-center">
				<div
					class="inline-flex items-center gap-1.5 rounded-full border-2 border-[#991b1b] bg-[#fee2e2] px-3.5 py-1 font-mono text-xs font-black tracking-widest text-[#991b1b] uppercase shadow-[1.5px_1.5px_0px_#991b1b]"
				>
					<AlertTriangle size={14} strokeWidth={2.5} />
					<span>STATUS DARURAT: {simStatus}</span>
				</div>

				<h1
					class="mt-4 font-serif text-2xl font-black text-[#262626] sm:text-3xl dark:text-[#f2efe9]"
				>
					Terjadi Gangguan Sistem Tak Terduga
				</h1>

				<p
					class="mt-2 font-sans text-xs leading-relaxed text-[#404040] sm:text-sm dark:text-[#b8b5ad]"
				>
					Layanan server sedang mengalami kendala teknis sementara. Jangan khawatir, data pesanan
					dan faktur yang telah diterbitkan tetap tersimpan aman di database.
				</p>

				<!-- Raw Diagnostic Codebox -->
				<div
					class="mt-4 rounded-lg border border-[#991b1b]/30 bg-[#fee2e2]/50 p-3 text-left font-mono text-xs text-[#991b1b] dark:border-[#f87171]/30 dark:bg-[#450a0a]/40 dark:text-[#fca5a5]"
				>
					<p class="text-[10px] font-bold tracking-wider uppercase">Diagnostik Sistem:</p>
					<p class="mt-1 break-all">{simMessage}</p>
				</div>
			</div>

			<!-- Divider -->
			<div class="my-5 border-t-2 border-dashed border-[#262626]/20 dark:border-[#f2efe9]/20"></div>

			<!-- Emergency Contact Block -->
			<div
				class="space-y-3 rounded-lg border-2 border-[#262626] bg-[#fbf9f5] p-4 text-left font-mono text-xs text-[#262626] dark:border-[#a2e1db]/40 dark:bg-[#1a1825] dark:text-[#f2efe9]"
			>
				<p class="font-bold tracking-wider text-[#065f46] uppercase dark:text-[#34d399]">
					Bantuan Cepat & Laporan Kendala:
				</p>
				<p class="text-[#595959] dark:text-[#a3a099]">
					Jika transaksi Anda terpotong atau faktur belum Anda terima di email, silakan hubungi tim
					kami langsung via WhatsApp untuk verifikasi manual instan.
				</p>
			</div>

			<!-- Actions -->
			<div class="mt-6 flex flex-col gap-2.5 sm:flex-row">
				<button
					type="button"
					onclick={() => window.location.reload()}
					class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#262626] bg-[#262626] px-4 py-2.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
				>
					<RotateCcw size={15} strokeWidth={2.5} />
					<span>Muat Ulang Halaman</span>
				</button>

				{#if wa}
					<a
						href={wa}
						target="_blank"
						rel="external noopener noreferrer"
						class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#065f46] bg-[#a2e1db] px-4 py-2.5 font-mono text-xs font-bold text-[#065f46] shadow-[2px_2px_0px_#065f46] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
					>
						<MessageCircle size={15} strokeWidth={2.5} />
						<span>Hubungi WhatsApp</span>
					</a>
				{/if}
			</div>

			<!-- Instagram Link -->
			<div
				class="mt-6 flex items-center justify-between border-t border-[#262626]/15 pt-4 font-mono text-xs dark:border-[#f2efe9]/15"
			>
				<a
					href={`https://instagram.com/${igHandle}`}
					target="_blank"
					rel="external noopener noreferrer"
					class="inline-flex items-center gap-1.5 text-[#262626]/70 transition-colors hover:text-[#262626] dark:text-[#f2efe9]/70 dark:hover:text-[#f2efe9]"
				>
					<InstagramIcon size={14} class="stroke-2" />
					<span>@{igHandle}</span>
				</a>
				<span class="text-[10px] text-[#262626]/40 dark:text-[#f2efe9]/40">
					cho.lazey disaster recovery system
				</span>
			</div>
		</section>
	</div>
</div>
