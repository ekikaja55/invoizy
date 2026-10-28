<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
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
			toast.error(signInError.message || 'Login gagal. Cek email dan password Anda.');
			return;
		}

		toast.success('Berhasil login! Membuka dashboard...');
		goto(resolve('/admin'));
	}
</script>

<svelte:head>
	<title>Login Admin — cho.lazey - CHIBICONXI CATALOGUE</title>
</svelte:head>

<div
	class="drafting-grid relative flex min-h-screen items-center justify-center overflow-x-clip bg-[#f2efe9] p-4 py-12 text-[#262626] transition-colors dark:bg-[#1a1825] dark:text-[#f2efe9]"
>
	<!-- Main Login Container (Warm Monoline Ticket Card) -->
	<main class="relative z-10 w-full max-w-md">
		<!-- Back to Public Site link -->
		<div class="mb-4">
			<a
				href={resolve('/')}
				class="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#262626]/80 transition-colors hover:text-[#262626] dark:text-[#f2efe9]/80 dark:hover:text-[#f2efe9]"
			>
				<ArrowLeft size={14} strokeWidth={2.5} />
				<span>Kembali ke Beranda</span>
			</a>
		</div>

		<div
			class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-6 shadow-[6px_6px_0px_#262626] sm:p-8 dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
				>+</span
			>

			<!-- Header: Stempel & Headline -->
			<div
				class="space-y-2 border-b-2 border-dashed border-[#262626]/20 pb-6 text-center dark:border-[#f2efe9]/20"
			>
				<div
					class="inline-block rounded-md border-2 border-[#262626] bg-[#e87a5d] px-3 py-1 font-mono text-[11px] font-black tracking-widest text-white uppercase shadow-[2px_2px_0px_#262626]"
				>
					PORTAL KHUSUS PENGELOLA
				</div>
				<h1
					class="text-2xl font-black tracking-tight text-[#262626] sm:text-3xl dark:text-[#f2efe9]"
				>
					Masuk Akun Admin
				</h1>
				<p class="font-mono text-xs text-[#262626]/70 dark:text-[#f2efe9]/70">
					Gunakan email terdaftar untuk mengelola katalog, order, dan status pembayaran.
				</p>
			</div>

			<!-- Login Form (Transactional Precision: Straight & High Accuracy) -->
			<form onsubmit={handleSubmit} class="mt-6 space-y-4 text-left">
				<!-- Email Field -->
				<div class="space-y-1.5">
					<label
						for="email"
						class="flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-[#262626]/80 uppercase dark:text-[#f2efe9]/80"
					>
						<Mail size={13} strokeWidth={2.5} class="text-[#262626] dark:text-[#f2efe9]" />
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
							class="w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] transition-shadow placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
						/>
					</div>
				</div>

				<!-- Password Field -->
				<div class="space-y-1.5">
					<label
						for="password"
						class="flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-[#262626]/80 uppercase dark:text-[#f2efe9]/80"
					>
						<Lock size={13} strokeWidth={2.5} class="text-[#262626] dark:text-[#f2efe9]" />
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
							class="w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 pr-10 font-mono text-xs text-[#262626] transition-shadow placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-[#262626]/60 transition-colors hover:text-[#262626] dark:text-[#f2efe9]/60 dark:hover:text-[#f2efe9]"
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
						class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#262626] bg-[#262626] py-3 font-mono text-xs font-bold text-white shadow-[3px_3px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
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
