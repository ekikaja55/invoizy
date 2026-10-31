<script lang="ts">
	import { resolve } from '$app/paths';
	import { EMERGENCY_CONTACT } from '$lib/constants';
	import { waLink } from '$lib/utils/contact';
	import InstagramIcon from '$lib/components/icons/InstagramIcon.svelte';
	import { Wrench, RotateCcw, MessageCircle, Clock, ShieldCheck } from '@lucide/svelte';

	const wa = waLink(
		EMERGENCY_CONTACT.wa,
		'Halo cho.lazey, saya ingin menanyakan status pesanan saya saat web sedang dalam pemeliharaan.'
	);
	const igHandle = EMERGENCY_CONTACT.instagram.replace(/^@/, '');

	function handleReload() {
		if (typeof window !== 'undefined') {
			window.location.reload();
		}
	}
</script>

<svelte:head>
	<title>Pemeliharaan Sistem — cho.lazey</title>
</svelte:head>

<div
	class="drafting-grid relative flex min-h-screen flex-col items-center justify-center overflow-x-clip bg-[#f2efe9] p-4 py-12 text-[#262626] transition-colors dark:bg-[#1a1825] dark:text-[#f2efe9]"
>
	<!-- Main Maintenance Container (Warm Monoline Ticket Card) -->
	<main class="relative z-10 w-full max-w-lg">
		<div
			class="relative rounded-[16px_4px_16px_4px] border-2 border-[#262626] bg-white p-6 shadow-[6px_6px_0px_#262626] backdrop-blur-xs transition-all sm:p-8 dark:border-[#a2e1db] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[6px_6px_0px_#b4a6d5]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
			>
				+
			</span>

			<!-- Header: Stempel Status & Headline -->
			<div class="flex flex-col items-center space-y-3 pb-2 text-center">
				<div class="flex items-center gap-2">
					<div
						class="inline-flex items-center gap-1.5 rounded-full border-2 border-[#262626] bg-[#fea770] px-3.5 py-1 font-mono text-xs font-black tracking-widest text-[#262626] uppercase shadow-[1.5px_1.5px_0px_#262626] dark:border-[#a2e1db]"
					>
						<Wrench size={14} strokeWidth={2.5} />
						<span>STATUS: PEMELIHARAAN SISTEM</span>
					</div>
				</div>

				<h1
					class="font-serif text-2xl leading-tight font-black text-[#262626] sm:text-3xl dark:text-[#f2efe9]"
				>
					Toko Sedang Beristirahat Sejenak
				</h1>

				<p class="font-sans text-xs leading-relaxed text-[#404040] sm:text-sm dark:text-[#b8b5ad]">
					Kami sedang melakukan sinkronisasi data katalog dan pemeliharaan server berkala agar
					pengalaman berbelanja Anda semakin cepat dan nyaman.
				</p>
			</div>

			<!-- Divider Monoline Dashed -->
			<div class="my-5 border-t-2 border-dashed border-[#262626]/20 dark:border-[#f2efe9]/20"></div>

			<!-- Info Ticket Receipt Box -->
			<div
				class="space-y-3 rounded-lg border-2 border-[#262626] bg-[#fbf9f5] p-4 text-left font-mono text-xs text-[#262626] dark:border-[#a2e1db]/40 dark:bg-[#1a1825] dark:text-[#f2efe9]"
			>
				<div class="flex items-start gap-2.5">
					<Clock size={16} strokeWidth={2.5} class="mt-0.5 shrink-0 text-[#e87a5d]" />
					<div>
						<p class="font-bold tracking-wider uppercase">Estimasi Kembali</p>
						<p class="mt-0.5 text-[#595959] dark:text-[#a3a099]">
							Sistem diperkirakan kembali beroperasi normal dalam hitungan menit hingga jam hari
							ini.
						</p>
					</div>
				</div>

				<div class="border-t border-[#262626]/10 dark:border-[#f2efe9]/10"></div>

				<div class="flex items-start gap-2.5">
					<ShieldCheck
						size={16}
						strokeWidth={2.5}
						class="mt-0.5 shrink-0 text-[#065f46] dark:text-[#34d399]"
					/>
					<div>
						<p class="font-bold tracking-wider uppercase">Keamanan Pesanan & Data</p>
						<p class="mt-0.5 text-[#595959] dark:text-[#a3a099]">
							Seluruh data order yang telah terbit faktur dan bukti pembayaran yang sudah diunggah
							tersimpan aman di database.
						</p>
					</div>
				</div>
			</div>

			<!-- Primary Actions -->
			<div class="mt-6 flex flex-col gap-2.5 sm:flex-row">
				<button
					type="button"
					onclick={handleReload}
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

			<!-- Secondary Links (Instagram & Admin Gate) -->
			<div
				class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#262626]/15 pt-4 font-mono text-xs dark:border-[#f2efe9]/15"
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

				<a
					href={resolve('/login')}
					class="inline-flex items-center gap-1 font-bold text-[#262626]/70 underline decoration-dashed underline-offset-4 hover:text-[#262626] dark:text-[#f2efe9]/70 dark:hover:text-[#f2efe9]"
				>
					<span>Portal Pengelola Toko</span>
				</a>
			</div>
		</div>
	</main>
</div>
