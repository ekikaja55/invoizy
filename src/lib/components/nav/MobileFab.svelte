<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
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

	// 1. Ambil props utuh agar reaktif
	let props: Props = $props();

	// 2. Gunakan $derived untuk menyinkronkan state dengan Svelte 5 runes
	let items = $derived(props.items);
	let isAdmin = $derived(props.isAdmin ?? false);
	let contact = $derived(props.contact);
	let currentPath = $derived(page.url.pathname);
	let isAdminPage = $derived(currentPath.startsWith('/admin'));

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

<svelte:window onkeydown={handleKeydown} />

<div class="fixed right-4 bottom-4 z-50 md:hidden">
	{#if open}
		<div
			class="mb-2 w-52 rounded-xl border border-neutral-200 bg-white/95 p-2 text-neutral-900
             shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95
             dark:text-neutral-100"
		>
			<nav class="flex flex-col gap-1">
				{#each items as item (item.href)}
					{@const isActive = currentPath === item.href}
					<a href={resolve(item.href)} class={navItemClass(isActive)} onclick={close}>
						<item.icon size={16} />
						<span>{item.label}</span>
					</a>
				{/each}

				{#if hasContact}
					<div class="flex flex-col">
						<button
							type="button"
							onclick={() => (contactAccordionOpen = !contactAccordionOpen)}
							class="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
						>
							<div class="flex items-center gap-2">
								<Headset size={16} />
								<span>Hubungi Kami</span>
							</div>
							<ChevronDown
								size={14}
								class="transition-transform duration-200 {contactAccordionOpen
									? 'rotate-180'
									: ''}"
							/>
						</button>

						{#if contactAccordionOpen}
							<div
								class="mt-1 flex flex-col gap-1 rounded-lg bg-neutral-100/70 p-1.5 dark:bg-white/5"
							>
								{#if waHref}
									<a
										href={waHref}
										target="_blank"
										rel="external noopener noreferrer"
										onclick={close}
										class="flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-neutral-700 transition-colors hover:bg-white dark:text-neutral-200 dark:hover:bg-white/10"
									>
										<div class="flex items-center gap-2">
											<MessageCircle
												size={14}
												class="text-emerald-600 dark:text-emerald-400"
											/>
											<span class="font-medium">WhatsApp</span>
										</div>
										<ExternalLink size={11} class="text-neutral-400" />
									</a>
								{/if}

								{#if igHref}
									<a
										href={igHref}
										target="_blank"
										rel="external noopener noreferrer"
										onclick={close}
										class="flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-neutral-700 transition-colors hover:bg-white dark:text-neutral-200 dark:hover:bg-white/10"
									>
										<div class="flex items-center gap-2">
											<InstagramIcon size={14} class="text-pink-600 dark:text-pink-400" />
											<span class="font-medium">Instagram</span>
										</div>
										<ExternalLink size={11} class="text-neutral-400" />
									</a>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</nav>

			<div class="mt-1 border-t border-neutral-200 pt-1 dark:border-neutral-800">
				<ThemeToggle />

				{#if isAdmin}
					{#if isAdminPage}
						<button
							onclick={() => {
								close();
								navigateTo('/');
							}}
							class={navActionClass()}
						>
							<Home size={16} />
							<span>Home</span>
						</button>
					{:else}
						<button
							onclick={() => {
								close();
								navigateTo('/admin');
							}}
							class={navActionClass()}
						>
							<LayoutDashboard size={16} />
							<span>Dashboard</span>
						</button>
					{/if}

					<button
						onclick={handleLogout}
						class="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-neutral-600
                   hover:bg-neutral-100 hover:text-neutral-900
                   dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
					>
						<LogOut size={16} />
						<span>Logout</span>
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<button
		onclick={() => (open = !open)}
		class="flex h-12 w-12 items-center justify-center rounded-full
           bg-neutral-900 text-white shadow-xl
           dark:bg-white dark:text-neutral-900"
		aria-label={open ? 'Close menu' : 'Open menu'}
	>
		{#if open}
			<X size={20} />
		{:else}
			<Menu size={20} />
		{/if}
	</button>
</div>

{#if open}
	<button
		class="fixed inset-0 z-40 cursor-default bg-black/20 backdrop-blur-[2px]
           md:hidden dark:bg-black/40"
		onclick={close}
		aria-label="Close menu overlay"
	></button>
{/if}
