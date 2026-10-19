<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { type NavItem } from '$lib/constants';
	import { authClient } from '$lib/auth-client';
	// import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import ThemeToggle from './ThemeToggle.svelte';
	import {
		Home,
		LogOut,
		PanelLeftClose,
		PanelLeftOpen,
		LayoutDashboard,
		Headset,
		MessageCircle,
		ExternalLink
	} from '@lucide/svelte';
	import InstagramIcon from '$lib/components/icons/InstagramIcon.svelte';
	import { navActionClass, navItemClass } from '$lib/utils/nav-utils';
	import { navigateTo } from '$lib/utils/navigating';
	import { waLink, igLink } from '$lib/utils/contact';

	interface Props {
		items: NavItem[];
		isAdmin?: boolean;
		contact?: {
			wa?: string;
			instagram?: string;
		};
	}

	// 1. Ambil props utuh agar tetap reaktif
	let props: Props = $props();

	// 2. Gunakan $derived untuk mengakses props dan state URL
	let items = $derived(props.items);
	let isAdmin = $derived(props.isAdmin ?? false);
	let contact = $derived(props.contact);
	let currentPath = $derived(page.url.pathname);
	let isAdminPage = $derived(currentPath.startsWith('/admin'));

	let collapsed = $state(false);
	let contactOpen = $state(false);
	let contactRef = $state<HTMLDivElement | null>(null);

	const waHref = $derived(
		contact?.wa ? waLink(contact.wa, 'Halo, saya ingin bertanya seputar produk/order.') : null
	);
	const igHref = $derived(contact?.instagram ? igLink(contact.instagram) : null);
	const hasContact = $derived(Boolean(waHref || igHref));

	$effect(() => {
		const saved = localStorage.getItem('sidebar-collapsed');
		if (saved !== null) collapsed = saved === 'true';
	});

	function toggle() {
		collapsed = !collapsed;
		contactOpen = false;
		localStorage.setItem('sidebar-collapsed', String(collapsed));
	}

	function toggleContact(e: MouseEvent) {
		e.stopPropagation();
		contactOpen = !contactOpen;
	}

	function handleWindowClick(e: MouseEvent) {
		if (contactOpen && contactRef && !contactRef.contains(e.target as Node)) {
			contactOpen = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && contactOpen) {
			contactOpen = false;
		}
	}

	async function handleLogout() {
		const signOutPromise = authClient.signOut();

		toast.promise(signOutPromise, {
			loading: 'Logout, harap tunggu...',
			success: 'Berhasil logout!',
			error: 'Gagal logout, coba lagi.'
		});

		await signOutPromise;
		navigateTo('/');
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<aside
	class="fixed top-1/2 left-4 z-30 hidden -translate-y-1/2 flex-col rounded-[16px_8px_14px_6px] border-2 border-brandy bg-papaya/95 p-2 text-ink shadow-[4px_4px_0px_#78290f] backdrop-blur-xs transition-all duration-200 md:flex dark:border-papaya/30 dark:bg-ink/95 dark:text-papaya dark:shadow-[4px_4px_0px_rgba(255,236,209,0.2)]"
	class:w-16={collapsed}
	class:w-56={!collapsed}
>
	<button onclick={toggle} class={navActionClass()}>
		{#if collapsed}
			<PanelLeftOpen size={16} strokeWidth={2.75} />
		{:else}
			<PanelLeftClose size={16} strokeWidth={2.75} />
		{/if}
	</button>

	<nav class="flex flex-col gap-1">
		{#each items as item (item.href)}
			{@const isActive = currentPath === item.href}
			<a href={resolve(item.href)} class={navItemClass(isActive)}>
				<item.icon size={16} strokeWidth={2.5} />
				{#if !collapsed}
					<span>{item.label}</span>
				{/if}
			</a>
		{/each}

		{#if hasContact}
			<div class="relative" bind:this={contactRef}>
				<button
					type="button"
					onclick={toggleContact}
					class="{navActionClass()} {contactOpen
						? 'border-2 border-brandy bg-tangerine text-white shadow-[2px_2px_0px_#78290f]'
						: ''}"
					aria-haspopup="true"
					aria-expanded={contactOpen}
					title="Hubungi Kami"
				>
					<Headset size={16} strokeWidth={2.5} class="shrink-0" />
					{#if !collapsed}
						<span class="truncate">Hubungi Kami</span>
					{/if}
				</button>

				{#if contactOpen}
					<div
						class="absolute left-full top-0 ml-3 z-50 w-56 rounded-2xl border-2 border-brandy bg-papaya/95 p-2 shadow-[4px_4px_0px_#78290f] backdrop-blur-xs dark:border-papaya/30 dark:bg-ink/95 dark:text-papaya dark:shadow-[4px_4px_0px_rgba(255,236,209,0.25)]"
					>
						<div class="border-b-2 border-brandy/15 px-2.5 py-1.5 dark:border-papaya/15">
							<p class="font-headline text-xs font-bold text-ink dark:text-papaya">
								Hubungi Kami
							</p>
							<p class="text-[11px] text-brandy/70 dark:text-papaya/60 font-sans">
								Pilih saluran kontak langsung
							</p>
						</div>

						<div class="mt-1 flex flex-col gap-1">
							{#if waHref}
								<a
									href={waHref}
									target="_blank"
									rel="external noopener noreferrer"
									onclick={() => (contactOpen = false)}
									class="flex items-center justify-between gap-2.5 rounded-xl border border-brandy/20 bg-white/70 px-2.5 py-2 text-sm text-ink transition-all hover:bg-papaya hover:border-brandy dark:border-papaya/20 dark:bg-ink/70 dark:text-papaya dark:hover:bg-ink"
								>
									<div class="flex items-center gap-2.5">
										<div
											class="flex h-7 w-7 items-center justify-center rounded-lg border border-forest/40 bg-forest/15 text-forest"
										>
											<MessageCircle size={15} strokeWidth={2.5} />
										</div>
										<div class="flex flex-col text-left">
											<span class="text-xs font-bold text-ink dark:text-papaya"
												>WhatsApp</span
											>
											<span class="text-[10px] text-brandy/70 dark:text-papaya/60"
												>Chat Admin</span
											>
										</div>
									</div>
									<ExternalLink size={12} strokeWidth={2.5} class="text-brandy/60 dark:text-papaya/50" />
								</a>
							{/if}

							{#if igHref}
								<a
									href={igHref}
									target="_blank"
									rel="external noopener noreferrer"
									onclick={() => (contactOpen = false)}
									class="flex items-center justify-between gap-2.5 rounded-xl border border-brandy/20 bg-white/70 px-2.5 py-2 text-sm text-ink transition-all hover:bg-papaya hover:border-brandy dark:border-papaya/20 dark:bg-ink/70 dark:text-papaya dark:hover:bg-ink"
								>
									<div class="flex items-center gap-2.5">
										<div
											class="flex h-7 w-7 items-center justify-center rounded-lg border border-pink-500/40 bg-pink-500/15 text-pink-600"
										>
											<InstagramIcon size={15} />
										</div>
										<div class="flex flex-col text-left">
											<span class="text-xs font-bold text-ink dark:text-papaya"
												>Instagram</span
											>
											<span class="text-[10px] text-brandy/70 dark:text-papaya/60"
												>Profil & DM</span
											>
										</div>
									</div>
									<ExternalLink size={12} strokeWidth={2.5} class="text-brandy/60 dark:text-papaya/50" />
								</a>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</nav>

	<div class="mt-2 space-y-1 border-t-2 border-brandy/20 pt-2 dark:border-papaya/20">
		<ThemeToggle {collapsed} />

		{#if isAdmin}
			{#if isAdminPage}
				<button onclick={() => navigateTo('/')} class={navActionClass()}>
					<Home size={16} strokeWidth={2.5} />
					{#if !collapsed}
						<span>Home</span>
					{/if}
				</button>
			{:else}
				<button onclick={() => navigateTo('/admin')} class={navActionClass()}>
					<LayoutDashboard size={16} strokeWidth={2.5} />
					{#if !collapsed}
						<span>Dashboard</span>
					{/if}
				</button>
			{/if}

			<button onclick={handleLogout} class={navActionClass()}>
				<LogOut size={16} strokeWidth={2.5} />
				{#if !collapsed}
					<span>Logout</span>
				{/if}
			</button>
		{/if}
	</div>
</aside>
