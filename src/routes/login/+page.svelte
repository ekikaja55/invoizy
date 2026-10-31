<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { authClient } from '$lib/auth-client';
	import { manualOverlay } from '$lib/stores/overlay.svelte';
	import { toast } from 'svelte-sonner';
	import {
		Lock,
		Mail,
		Eye,
		EyeOff,
		LogIn,
		Loader2,
		ArrowLeft,
		ShieldAlert,
		Clock
	} from '@lucide/svelte';
	import { onDestroy, onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);

	let lockoutSeconds = $state(0);
	let lockoutTimer: ReturnType<typeof setInterval> | null = null;
	const isLocked = $derived(lockoutSeconds > 0);

	function formatCountdown(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function startLockout(durationSeconds: number) {
		lockoutSeconds = Math.max(1, durationSeconds);
		if (lockoutTimer) clearInterval(lockoutTimer);

		if (browser) {
			const lockoutUntil = Date.now() + lockoutSeconds * 1000;
			sessionStorage.setItem('invoizy_login_lockout_until', String(lockoutUntil));
		}

		lockoutTimer = setInterval(() => {
			if (lockoutSeconds > 1) {
				lockoutSeconds -= 1;
			} else {
				lockoutSeconds = 0;
				if (lockoutTimer) clearInterval(lockoutTimer);
				if (browser) {
					sessionStorage.removeItem('invoizy_login_lockout_until');
				}
			}
		}, 1000);
	}

	onMount(() => {
		if (browser) {
			const saved = sessionStorage.getItem('invoizy_login_lockout_until');
			if (saved) {
				const remaining = Math.ceil((Number(saved) - Date.now()) / 1000);
				if (remaining > 0) {
					startLockout(remaining);
				} else {
					sessionStorage.removeItem('invoizy_login_lockout_until');
				}
			}
		}
	});

	onDestroy(() => {
		if (lockoutTimer) clearInterval(lockoutTimer);
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (isLocked) return;

		loading = true;
		manualOverlay.show('Authenticating...');
		let serverRetryAfter: number | null = null;

		try {
			const { error: signInError } = await authClient.signIn.email(
				{
					email,
					password
				},
				{
					onError(ctx) {
						if (ctx.response && ctx.response.status === 429) {
							const headerVal = ctx.response.headers.get('retry-after');
							serverRetryAfter = headerVal ? Number(headerVal) : 900;
						}
					}
				}
			);

			if (signInError) {
				manualOverlay.hide();
				loading = false;
				if (signInError.status === 429 || serverRetryAfter !== null) {
					const duration = serverRetryAfter || 900;
					startLockout(duration);
					toast.error('Akses login dibatasi sementara demi keamanan akun toko.');
					return;
				}
				toast.error(signInError.message || 'Login gagal. Cek email dan password Anda.');
				return;
			}

			// Sukses login: buka dashboard dengan invalidasi cache sesi
			manualOverlay.show('Preparing Dashboard...');
			await goto(resolve('/admin'), { invalidateAll: true });
		} catch (err) {
			console.error('[Login Error]', err);
			toast.error('Terjadi kesalahan saat memproses login.');
		} finally {
			manualOverlay.hide();
			loading = false;
		}
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

			<!-- Lockout Banner (Active when rate limit guard triggers) -->
			{#if isLocked}
				<div
					class="mt-6 rounded-lg border-2 border-[#991b1b] bg-[#fee2e2] p-4 text-[#991b1b] shadow-[3px_3px_0px_#991b1b] dark:border-[#f87171] dark:bg-[#450a0a]/60 dark:text-[#fca5a5] dark:shadow-[3px_3px_0px_#f87171]"
					role="alert"
				>
					<div class="flex items-start gap-3">
						<ShieldAlert size={20} class="mt-0.5 shrink-0 text-[#991b1b] dark:text-[#f87171]" />
						<div class="space-y-1">
							<p class="font-mono text-xs font-black tracking-wider uppercase">
								Akses Masuk Terkunci Sementara
							</p>
							<p class="font-mono text-xs leading-relaxed opacity-90">
								Terlalu banyak percobaan login gagal dari jaringan Anda. Demi keamanan akun
								pengelola, formulir ditangguhkan sementara.
							</p>
							<div
								class="mt-2 inline-flex items-center gap-1.5 rounded border border-[#991b1b]/40 bg-white/80 px-2.5 py-1 font-mono text-xs font-bold text-[#991b1b] shadow-xs dark:border-[#f87171]/40 dark:bg-black/40 dark:text-[#fca5a5]"
							>
								<Clock size={13} strokeWidth={2.5} />
								<span>Sisa Waktu: {formatCountdown(lockoutSeconds)}</span>
							</div>
						</div>
					</div>
				</div>
			{/if}

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
							disabled={loading || isLocked}
							autocomplete="email"
							placeholder="admin@cholazey.com"
							class="w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] transition-shadow placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
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
							disabled={loading || isLocked}
							autocomplete="current-password"
							placeholder="••••••••"
							class="w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 pr-10 font-mono text-xs text-[#262626] transition-shadow placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							disabled={loading || isLocked}
							class="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-[#262626]/60 transition-colors hover:text-[#262626] disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#f2efe9]/60 dark:hover:text-[#f2efe9]"
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
						disabled={loading || isLocked}
						class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#262626] bg-[#262626] py-3 font-mono text-xs font-bold text-white shadow-[3px_3px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
					>
						{#if loading}
							<Loader2 size={16} class="animate-spin" />
							<span>Memverifikasi Sandi...</span>
						{:else if isLocked}
							<Lock size={16} strokeWidth={2.5} />
							<span>Terkunci Sementara ({formatCountdown(lockoutSeconds)})</span>
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
