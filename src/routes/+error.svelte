<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { EMERGENCY_CONTACT } from '$lib/constants';
	import { waLink } from '$lib/utils/contact';

	const messages: Record<number, string> = {
		404: 'Halaman tidak ditemukan.',
		403: 'Kamu tidak punya akses ke halaman ini.',
		500: 'Server sedang gangguan.',
		503: 'Layanan sedang tidak tersedia.'
	};

	// 5xx = kemungkinan DB/server gangguan → tampilkan kontak darurat (statis,
	// tidak bergantung DB). 404/403 tetap ringan tanpa panel.
	const isServerError = $derived(page.status >= 500);
	const wa = waLink(EMERGENCY_CONTACT.wa, 'Halo, web nya error. Saya butuh bantuan.');
	const igHandle = EMERGENCY_CONTACT.instagram.replace(/^@/, '');
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-md text-center">
		<p class="text-6xl font-bold opacity-20">{page.status}</p>
		<h1 class="mt-4 text-xl font-semibold">
			{messages[page.status] ?? 'Terjadi kesalahan.'}
		</h1>
		{#if page.error?.message}
			<p class="mt-2 text-sm opacity-70">{page.error.message}</p>
		{/if}

		{#if isServerError}
			<div
				class="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left text-sm
               dark:border-amber-800 dark:bg-amber-950"
			>
				<p class="font-medium">Butuh bantuan cepat?</p>
				<p class="mt-1 text-neutral-600 dark:text-neutral-400">
					Server kami sedang gangguan. Order-mu aman — hubungi kami lewat salah satu ini:
				</p>
				<div class="mt-3 flex flex-wrap gap-2">
					{#if wa}
						<a
							href={wa}
							target="_blank"
							rel="external"
							class="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white
                     dark:bg-white dark:text-neutral-900"
						>
							Chat WA
						</a>
					{/if}
					<a
						href={`mailto:${EMERGENCY_CONTACT.email}`}
						class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
                   hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
					>
						Email
					</a>
					<a
						href={`https://instagram.com/${igHandle}`}
						target="_blank"
						rel="external"
						class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
                   hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
					>
						IG @{igHandle}
					</a>
				</div>
			</div>
		{/if}

		<div class="mt-6 flex items-center justify-center gap-2">
			{#if isServerError}
				<button
					onclick={() => window.location.reload()}
					class="rounded bg-white px-4 py-2 text-sm text-black"
				>
					Coba Lagi
				</button>
			{/if}
			<a href={resolve('/')} class="rounded bg-white px-4 py-2 text-sm text-black">
				Kembali ke Beranda
			</a>
		</div>
	</div>
</div>
