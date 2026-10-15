<script lang="ts">
	import { resolve } from '$app/paths';
	import { ShoppingBag, ReceiptText, CheckCircle2 } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const storeName = $derived(data.settings?.storeName || 'Invoizy');
	const isLogin = $derived(Boolean(data.user));

	const steps = [
		{ title: 'Pilih yang kamu suka', desc: 'Pilih barangnya, atur jumlahnya.' },
		{
			title: 'Isi data + alamat',
			desc: 'Handle sosmed, email aktif, alamat lengkap, dan nomor HP.'
		},
		{
			title: 'Pilih ongkir',
			desc: 'Cari kecamatamu, bandingkan kurir — total langsung kehitung.'
		},
		{
			title: 'Bayar, kirim bukti',
			desc: 'Transfer terus kirim buktinya ke kontak yang tertulis. Makasih banyak!'
		}
	];
</script>

<svelte:head>
	<title>{storeName} — Order Online</title>
	<meta
		name="description"
		content="Pesan online di {storeName}: pilih produk, checkout, invoice otomatis terkirim ke email."
	/>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-10 px-4 py-12 text-center">
	<div class="space-y-3">
		<p class="text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase">
			another chaotic things
		</p>
		<h1 class="text-4xl leading-tight font-bold">Another web commis <br />from @Cholazey</h1>
		<p class="mx-auto max-w-md text-sm leading-relaxed text-neutral-500">
			Order langsung di bawah ya XD
		</p>
	</div>

	<div class="flex flex-col items-center justify-center gap-2 sm:flex-row">
		<a
			href={resolve('/order')}
			class="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white
             hover:bg-neutral-700 sm:w-auto dark:bg-white dark:text-neutral-900"
		>
			<ShoppingBag size={16} />
			Mulai Order
		</a>
		<a
			href={resolve('/order/riwayat')}
			class="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 px-6 py-3 text-sm font-medium
             hover:bg-neutral-100 sm:w-auto dark:border-neutral-700 dark:hover:bg-white/10"
		>
			<ReceiptText size={16} />
			Riwayat Pesanan
		</a>
	</div>

	{#if isLogin}
		<div>
			<a href={resolve('/admin')} class="text-sm underline">Masuk Dashboard →</a>
		</div>
	{/if}

	<div class="space-y-3 text-left">
		<h2 class="text-center text-sm font-semibold tracking-wide text-neutral-500 uppercase">
			Cara order
		</h2>
		<ol class="space-y-2">
			{#each steps as step, i (step.title)}
				<li
					class="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
				>
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs
                   font-bold text-white dark:bg-white dark:text-neutral-900"
					>
						{i + 1}
					</span>
					<div>
						<p class="flex items-center gap-1.5 text-sm font-semibold">
							<CheckCircle2 size={14} class="text-green-600 dark:text-green-400" />
							{step.title}
						</p>
						<p class="mt-0.5 text-sm text-neutral-500">{step.desc}</p>
					</div>
				</li>
			{/each}
		</ol>
	</div>

	{#if data.settings?.instagram || data.settings?.twitter}
		<p class="text-sm text-neutral-500">
			{#if data.settings?.instagram}
				<span>IG: {data.settings.instagram}</span>
			{/if}
			{#if data.settings?.instagram && data.settings?.twitter}
				<span> · </span>
			{/if}
			{#if data.settings?.twitter}
				<span>X: {data.settings.twitter}</span>
			{/if}
		</p>
	{/if}
</div>
