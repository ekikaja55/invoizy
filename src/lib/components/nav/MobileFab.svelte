<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import { manualOverlay } from '$lib/stores/overlay.svelte';
	import { type NavItem } from '$lib/constants';
	import { toast } from 'svelte-sonner';
	import ThemeToggle from './ThemeToggle.svelte';
	import {
		Home,
		LogOut,
		Menu,
		X,
		LayoutDashboard,
		Headset,
		MessageCircle,
		ChevronDown,
		ExternalLink,
		Code
	} from '@lucide/svelte';
	import InstagramIcon from '$lib/components/icons/InstagramIcon.svelte';
	import { navActionClass, navItemClass } from '$lib/utils/nav-utils';
	import { navigateWithDelay } from '$lib/utils/navigating';
	import { waLink, igLink } from '$lib/utils/contact';

	interface Props {
		items: NavItem[];
		isAdmin?: boolean;
		contact?: {
			wa?: string;
			instagram?: string;
		};
		class?: string;
		staticPosition?: boolean;
		preventNavigation?: boolean;
	}

	// 1. Ambil props utuh agar reaktif
	let props: Props = $props();

	// 2. Gunakan $derived untuk menyinkronkan state dengan Svelte 5 runes
	let items = $derived(props.items);
	let isAdmin = $derived(props.isAdmin ?? false);
	let contact = $derived(props.contact);
	let className = $derived(props.class ?? '');
	let staticPosition = $derived(props.staticPosition ?? false);
	let preventNavigation = $derived(props.preventNavigation ?? false);
	let currentPath = $derived(page.url.pathname);
	let isAdminPage = $derived(currentPath.startsWith('/admin'));
	let isAboutDevActive = $derived(currentPath === '/about-dev');

	let open = $state(false);
	let contactAccordionOpen = $state(false);

	const waHref = $derived(
		contact?.wa ? waLink(contact.wa, 'Halo, saya ingin bertanya seputar produk/order.') : null
	);
	const igHref = $derived(contact?.instagram ? igLink(contact.instagram) : null);
	const hasContact = $derived(Boolean(waHref || igHref));

	function close() {
		open = false;
		contactAccordionOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	async function handleLogout() {
		close();
		manualOverlay.show('Process to logout...');
		try {
			const res = await authClient.signOut();
			if (res && 'error' in res && res.error) {
				manualOverlay.hide();
				toast.error(res.error.message || 'Gagal logout, silakan coba lagi.');
				return;
			}
			await goto(resolve('/'), { invalidateAll: true });
		} catch {
			manualOverlay.hide();
			toast.error('Gagal logout, silakan coba lagi.');
		} finally {
			manualOverlay.hide();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && !staticPosition}
	<!-- Backdrop penutup layar saat menu FAB terbuka (menutupi bar keranjang dan konten belakang) -->
	<button
		type="button"
		aria-label="Tutup menu navigasi"
		onclick={close}
		class="fixed inset-0 z-[45] bg-[#262626]/50 backdrop-blur-xs transition-opacity lg:hidden dark:bg-black/70"
	></button>
{/if}

<div
	class="{staticPosition
		? 'absolute right-4 bottom-4 z-50'
		: 'fixed right-4 bottom-4 z-50 lg:hidden'} {className}"
>
	{#if open}
		<div
			class="nav-drafting-grid relative mb-3 w-60 rounded-xl border-2 border-[#262626] bg-[#fea770]/95 p-3 text-[#262626] shadow-[4px_4px_0px_#262626] backdrop-blur-xs dark:border-[#a2e1db] dark:bg-[#1a1825]/95 dark:text-[#f2efe9] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<nav class="flex flex-col gap-1">
				{#each items as item (item.href)}
					{@const isActive = currentPath === item.href}
					<a
						href={resolve(item.href)}
						class="{navItemClass(isActive)} flex items-center justify-between"
						onclick={(e) => {
							if (preventNavigation) {
								e.preventDefault();
								close();
								toast.info(`[Sandbox] Navigasi: Menuju "${item.label}" (${item.href})`);
							} else {
								close();
							}
						}}
					>
						<div class="flex items-center gap-2.5">
							<item.icon size={16} strokeWidth={2.5} />
							<span>{item.label}</span>
						</div>
						{#if isActive}
							<!-- Active Diamond Badge (Opsi 1) -->
							<span
								class="h-2 w-2 shrink-0 rotate-45 rounded-[1px] border border-[#262626] bg-[#fea770] shadow-[1px_1px_0px_#262626] dark:border-[#1a1825] dark:bg-[#1a1825] dark:shadow-[1px_1px_0px_#a2e1db]"
								title="Halaman aktif"
							></span>
						{/if}
					</a>
				{/each}

				{#if hasContact}
					<div class="flex flex-col">
						<button
							type="button"
							onclick={() => (contactAccordionOpen = !contactAccordionOpen)}
							class="flex items-center justify-between rounded-md px-2.5 py-2 text-left text-sm font-bold text-[#404040] transition-colors hover:bg-[#b4a6d5]/20 hover:text-[#262626] dark:text-[#b8b5ad] dark:hover:bg-[#b4a6d5]/20 dark:hover:text-[#f2efe9]"
						>
							<div class="flex items-center gap-2">
								<Headset size={16} strokeWidth={2.5} />
								<span>Hubungi Kami</span>
							</div>
							<ChevronDown
								size={14}
								strokeWidth={2.5}
								class="transition-transform duration-200 {contactAccordionOpen ? 'rotate-180' : ''}"
							/>
						</button>

						{#if contactAccordionOpen}
							<div
								class="mt-1 flex flex-col gap-1.5 rounded-md border border-[#262626]/20 bg-white/70 p-2 dark:border-[#f2efe9]/20 dark:bg-[#1a1825]/70"
							>
								{#if waHref}
									<a
										href={waHref}
										target="_blank"
										rel="external noopener noreferrer"
										onclick={(e) => {
											if (preventNavigation) {
												e.preventDefault();
												close();
												toast.info('[Sandbox] Simulasi: Membuka WhatsApp chat admin');
											} else {
												close();
											}
										}}
										class="flex items-center justify-between rounded-md border border-[#065f46]/40 bg-[#d1fae5] px-2 py-1.5 text-xs font-bold text-[#065f46] transition-colors hover:bg-[#a7f3d0]"
									>
										<div class="flex items-center gap-2">
											<MessageCircle size={14} strokeWidth={2.5} />
											<span>WhatsApp</span>
										</div>
										<ExternalLink size={11} strokeWidth={2.5} />
									</a>
								{/if}

								{#if igHref}
									<a
										href={igHref}
										target="_blank"
										rel="external noopener noreferrer"
										onclick={(e) => {
											if (preventNavigation) {
												e.preventDefault();
												close();
												toast.info('[Sandbox] Simulasi: Membuka profil Instagram');
											} else {
												close();
											}
										}}
										class="flex items-center justify-between rounded-md border border-[#c1121f]/40 bg-[#fee2e2] px-2 py-1.5 text-xs font-bold text-[#991b1b] transition-colors hover:bg-red-200"
									>
										<div class="flex items-center gap-2">
											<InstagramIcon size={14} />
											<span>Instagram</span>
										</div>
										<ExternalLink size={11} strokeWidth={2.5} />
									</a>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</nav>

			<div class="mt-2 border-t border-[#262626]/20 pt-2 dark:border-[#f2efe9]/20">
				<ThemeToggle />

				<!-- Link About Dev di Bawah ThemeToggle di MobileFab (Khusus Storefront Publik) -->
				{#if !isAdminPage}
					<a
						href={resolve('/about-dev')}
						class="{navItemClass(isAboutDevActive)} mt-1 flex items-center justify-between"
						onclick={async (e) => {
							e.preventDefault();
							close();
							if (preventNavigation) {
								toast.info('[Sandbox] Navigasi: Menuju "About Dev" (/about-dev)');
								return;
							}
							await navigateWithDelay('/about-dev', 1500, 'Preparing...');
						}}
					>
						<div class="flex items-center gap-2.5">
							<Code size={16} strokeWidth={2.5} />
							<span>About Dev</span>
						</div>
						{#if isAboutDevActive}
							<span
								class="h-2 w-2 shrink-0 rotate-45 rounded-[1px] border border-[#262626] bg-[#fea770] shadow-[1px_1px_0px_#262626] dark:border-[#1a1825] dark:bg-[#1a1825] dark:shadow-[1px_1px_0px_#a2e1db]"
								title="Halaman aktif"
							></span>
						{/if}
					</a>
				{/if}

				{#if isAdmin}
					{#if isAdminPage}
						<a
							href={resolve('/')}
							onclick={(e) => {
								close();
								if (preventNavigation) {
									e.preventDefault();
									toast.info('[Sandbox] Navigasi: Menuju Beranda ("/")');
								}
							}}
							class={navActionClass()}
						>
							<Home size={16} strokeWidth={2.5} />
							<span>Home</span>
						</a>
					{:else}
						<a
							href={resolve('/admin')}
							onclick={(e) => {
								close();
								if (preventNavigation) {
									e.preventDefault();
									toast.info('[Sandbox] Navigasi: Menuju Dashboard ("/admin")');
								}
							}}
							class={navActionClass()}
						>
							<LayoutDashboard size={16} strokeWidth={2.5} />
							<span>Dashboard</span>
						</a>
					{/if}

					<button
						onclick={() => {
							if (preventNavigation) {
								close();
								toast.info('[Sandbox] Simulasi: Logout berhasil!');
							} else {
								handleLogout();
							}
						}}
						class={navActionClass()}
					>
						<LogOut size={16} strokeWidth={2.5} />
						<span>Logout</span>
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<button
		onclick={() => (open = !open)}
		class="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#262626] bg-[#fea770] text-[#262626] shadow-[3px_3px_0px_#262626] transition-transform duration-200 hover:scale-105 active:scale-95 active:shadow-none dark:border-[#a2e1db] dark:bg-[#1a1825] dark:text-[#f2efe9] dark:shadow-[3px_3px_0px_#b4a6d5]"
		aria-label={open ? 'Close menu' : 'Open menu'}
	>
		{#if open}
			<X size={20} strokeWidth={2.75} />
		{:else}
			<Menu size={20} strokeWidth={2.75} />
		{/if}
	</button>
</div>

{#if open}
	<button
		class="{staticPosition
			? 'absolute inset-0 z-40 rounded-[30px]'
			: 'fixed inset-0 z-40 lg:hidden'} cursor-default bg-[#262626]/60 backdrop-blur-xs dark:bg-black/75"
		onclick={close}
		aria-label="Close menu overlay"
	></button>
{/if}
