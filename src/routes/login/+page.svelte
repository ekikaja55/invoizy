<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import SketchBackground from '$lib/components/ui/SketchBackground.svelte';
	import { Lock, Mail, Eye, EyeOff, LogIn, Loader2, ArrowLeft } from '@lucide/svelte';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;

		const { error: signInError } = await authClient.signIn.email({
			email,
			password
		});

		loading = false;

		if (signInError) {
			toast.error('Login gagal. Cek email dan password Anda.');
			return;
		}

		toast.success('Berhasil login! Membuka dashboard...');
		goto(resolve('/admin'));
	}
</script>

<svelte:head>
	<title>Login Admin — cho.lazey - CHIBICONXI CATALOGUE</title>
</svelte:head>

<div class="relative min-h-screen bg-papaya text-ink transition-colors dark:bg-ink dark:text-papaya flex items-center justify-center p-4 py-12 overflow-x-clip">
	<!-- Dynamic SVG Sketch Background Layer -->
	<SketchBackground />

	<!-- Main Login Container (Digital Scrapbook Ticket Card) -->
	<main class="relative z-10 w-full max-w-md">
		<!-- Back to Public Site link -->
		<div class="mb-4">
			<a
				href={resolve('/')}
				class="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-brandy hover:text-tangerine dark:text-papaya/80 dark:hover:text-tangerine transition-colors"
			>
				<ArrowLeft size={14} strokeWidth={2.5} />
				<span>Kembali ke Beranda</span>
			</a>
		</div>

		<div
			class="relative rounded-[18px_8px_16px_10px] border-2 border-brandy bg-white/95 p-6 sm:p-8 shadow-[6px_6px_0px_#78290f] backdrop-blur-xs transition-all dark:border-papaya/40 dark:bg-ink/95 dark:text-papaya dark:shadow-[6px_6px_0px_rgba(255,236,209,0.2)]"
		>
			<!-- Decorative Top Washi Tape -->
			<div
				class="pointer-events-none absolute -top-3.5 left-1/2 h-4 w-32 -translate-x-1/2 -rotate-1 border border-brandy/30 bg-yellow-200/90 shadow-[1px_1px_0px_rgba(120,41,15,0.2)] backdrop-blur-xs dark:bg-papaya/30"
				aria-hidden="true"
			></div>

			<!-- Header: Stempel & Headline -->
			<div class="space-y-2 pb-6 text-center border-b-2 border-dashed border-brandy/30 dark:border-papaya/30">
				<div class="inline-block -rotate-1 rounded-[6px_2px_5px_1px] border-2 border-dashed border-teal bg-teal/10 px-3 py-1 font-mono text-[11px] font-black tracking-widest text-teal uppercase dark:border-tangerine dark:bg-tangerine/10 dark:text-tangerine">
					PORTAL KHUSUS PENGELOLA
				</div>
				<h1 class="font-headline text-2xl sm:text-3xl font-extrabold text-ink dark:text-papaya">
					Masuk Akun Admin
				</h1>
				<p class="font-sans text-xs text-brandy/80 dark:text-papaya/70">
					Gunakan email terdaftar untuk mengelola katalog, order, dan status pembayaran.
				</p>
			</div>

			<!-- Login Form (Transactional Precision: Straight & High Accuracy) -->
			<form onsubmit={handleSubmit} class="mt-6 space-y-4 text-left">
				<!-- Email Field -->
				<div class="space-y-1.5">
					<label for="email" class="flex items-center gap-1.5 font-mono text-xs font-bold text-brandy dark:text-papaya">
						<Mail size={13} strokeWidth={2.5} class="text-teal dark:text-tangerine" />
						<span>ALAMAT EMAIL</span>
					</label>
					<div class="relative">
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							autocomplete="email"
							placeholder="admin@cholazey.com"
							class="w-full rounded-[8px_4px_7px_3px] border-2 border-brandy bg-white px-3.5 py-2.5 font-sans text-sm text-ink placeholder:text-brandy/40 focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:placeholder:text-papaya/40 transition-shadow"
						/>
					</div>
				</div>

				<!-- Password Field -->
				<div class="space-y-1.5">
					<label for="password" class="flex items-center gap-1.5 font-mono text-xs font-bold text-brandy dark:text-papaya">
						<Lock size={13} strokeWidth={2.5} class="text-teal dark:text-tangerine" />
						<span>PASSWORD</span>
					</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							required
							autocomplete="current-password"
							placeholder="••••••••"
							class="w-full rounded-[8px_4px_7px_3px] border-2 border-brandy bg-white px-3.5 py-2.5 pr-10 font-sans text-sm text-ink placeholder:text-brandy/40 focus:border-brandy focus:ring-2 focus:ring-tangerine focus:outline-none dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:placeholder:text-papaya/40 transition-shadow"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-brandy/60 hover:text-ink dark:text-papaya/60 dark:hover:text-papaya transition-colors"
							aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
						>
							{#if showPassword}
								<EyeOff size={16} strokeWidth={2.2} />
							{:else}
								<Eye size={16} strokeWidth={2.2} />
							{/if}
						</button>
					</div>
				</div>

				<!-- Submit Button -->
				<div class="pt-2">
					<button
						type="submit"
						disabled={loading}
						class="flex w-full items-center justify-center gap-2 rounded-[12px_6px_10px_4px] border-2 border-brandy bg-tangerine py-3 text-sm font-bold text-white shadow-[4px_4px_0px_#78290f] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#78290f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:pointer-events-none"
					>
						{#if loading}
							<Loader2 size={16} class="animate-spin" />
							<span>Memverifikasi Sandi...</span>
						{:else}
							<LogIn size={16} strokeWidth={2.5} />
							<span>Masuk Dashboard</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</main>
</div>

