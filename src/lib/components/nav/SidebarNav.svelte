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
	class="fixed top-1/2 left-4 hidden -translate-y-1/2 flex-col rounded-2xl border
         border-neutral-200 bg-white/95 p-2 text-neutral-900 shadow-xl shadow-neutral-900/5
         backdrop-blur transition-all duration-200 md:flex dark:border-neutral-800
         dark:bg-neutral-900/95 dark:text-neutral-100 dark:shadow-black/40"
	class:w-16={collapsed}
	class:w-56={!collapsed}
>
	<button onclick={toggle} class={navActionClass()}>
		{#if collapsed}
			<PanelLeftOpen size={16} />
		{:else}
			<PanelLeftClose size={16} />
		{/if}
	</button>

	<nav class="flex flex-col gap-1">
		<!-- Menggunakan index atau kombinasi path untuk murni merefresh render ikon -->
		{#each items as item (item.href)}
			{@const isActive = currentPath === item.href}
			<a href={resolve(item.href)} class={navItemClass(isActive)}>
				<!-- Render komponen ikon dari Lucide -->
				<item.icon size={16} />
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
						? 'bg-neutral-100 text-neutral-900 dark:bg-white/10 dark:text-white'
						: ''}"
					aria-haspopup="true"
					aria-expanded={contactOpen}
					title="Hubungi Kami"
				>
					<Headset size={16} class="shrink-0" />
					{#if !collapsed}
						<span class="truncate">Hubungi Kami</span>
					{/if}
				</button>

				{#if contactOpen}
					<div
						class="absolute left-full top-0 ml-3 z-50 w-56 rounded-2xl border border-neutral-200 bg-white/95 p-2 shadow-xl shadow-neutral-900/10 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95 dark:text-neutral-100 dark:shadow-black/50"
					>
						<div class="border-b border-neutral-100 px-2.5 py-1.5 dark:border-neutral-800">
							<p class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
								Hubungi Kami
							</p>
							<p class="text-[11px] text-neutral-500 dark:text-neutral-400">
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
									class="flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
								>
									<div class="flex items-center gap-2.5">
										<div
											class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
										>
											<MessageCircle size={15} />
										</div>
										<div class="flex flex-col text-left">
											<span class="text-xs font-medium text-neutral-900 dark:text-neutral-100"
												>WhatsApp</span
											>
											<span class="text-[10px] text-neutral-500 dark:text-neutral-400"
												>Chat Admin</span
											>
										</div>
									</div>
									<ExternalLink size={12} class="text-neutral-400" />
								</a>
							{/if}

							{#if igHref}
								<a
									href={igHref}
									target="_blank"
									rel="external noopener noreferrer"
									onclick={() => (contactOpen = false)}
									class="flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
								>
									<div class="flex items-center gap-2.5">
										<div
											class="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400"
										>
											<InstagramIcon size={15} />
										</div>
										<div class="flex flex-col text-left">
											<span class="text-xs font-medium text-neutral-900 dark:text-neutral-100"
												>Instagram</span
											>
											<span class="text-[10px] text-neutral-500 dark:text-neutral-400"
												>Profil & DM</span
											>
										</div>
									</div>
									<ExternalLink size={12} class="text-neutral-400" />
								</a>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</nav>

	<div class="mt-2 space-y-1 border-t border-neutral-200 pt-2 dark:border-neutral-800">
		<ThemeToggle {collapsed} />

		{#if isAdmin}
			{#if isAdminPage}
				<button onclick={() => navigateTo('/')} class={navActionClass()}>
					<Home size={16} />
					{#if !collapsed}
						<span>Home</span>
					{/if}
				</button>
			{:else}
				<button onclick={() => navigateTo('/admin')} class={navActionClass()}>
					<LayoutDashboard size={16} />
					{#if !collapsed}
						<span>Dashboard</span>
					{/if}
				</button>
			{/if}

			<button onclick={handleLogout} class={navActionClass()}>
				<LogOut size={16} />
				{#if !collapsed}
					<span>Logout</span>
				{/if}
			</button>
		{/if}
	</div>
</aside>
