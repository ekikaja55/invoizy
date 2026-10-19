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
			class="mb-3 w-56 rounded-[14px_6px_12px_8px] border-2 border-brandy bg-papaya/95 p-2.5 text-ink shadow-[6px_6px_0px_#78290f] backdrop-blur-xs dark:border-papaya/30 dark:bg-ink/95 dark:text-papaya dark:shadow-[6px_6px_0px_rgba(255,236,209,0.25)]"
		>
			<nav class="flex flex-col gap-1">
				{#each items as item (item.href)}
					{@const isActive = currentPath === item.href}
					<a href={resolve(item.href)} class={navItemClass(isActive)} onclick={close}>
						<item.icon size={16} strokeWidth={2.5} />
						<span>{item.label}</span>
					</a>
				{/each}

				{#if hasContact}
					<div class="flex flex-col">
						<button
							type="button"
							onclick={() => (contactAccordionOpen = !contactAccordionOpen)}
							class="flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-bold text-ink/80 transition-colors hover:bg-brandy/10 dark:text-papaya/80 dark:hover:bg-papaya/10"
						>
							<div class="flex items-center gap-2">
								<Headset size={16} strokeWidth={2.5} />
								<span>Hubungi Kami</span>
							</div>
							<ChevronDown
								size={14}
								strokeWidth={2.5}
								class="transition-transform duration-200 {contactAccordionOpen
									? 'rotate-180'
									: ''}"
							/>
						</button>

						{#if contactAccordionOpen}
							<div
								class="mt-1 flex flex-col gap-1 rounded-xl border border-brandy/20 bg-white/60 p-2 dark:border-papaya/20 dark:bg-ink/60"
							>
								{#if waHref}
									<a
										href={waHref}
										target="_blank"
										rel="external noopener noreferrer"
										onclick={close}
										class="flex items-center justify-between rounded-lg border border-forest/30 bg-forest/10 px-2 py-1.5 text-xs font-bold text-forest hover:bg-forest/20 transition-colors"
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
										onclick={close}
										class="flex items-center justify-between rounded-lg border border-pink-500/30 bg-pink-500/10 px-2 py-1.5 text-xs font-bold text-pink-600 hover:bg-pink-500/20 transition-colors"
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

			<div class="mt-2 border-t-2 border-brandy/20 pt-2 dark:border-papaya/20">
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
							<Home size={16} strokeWidth={2.5} />
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
							<LayoutDashboard size={16} strokeWidth={2.5} />
							<span>Dashboard</span>
						</button>
					{/if}

					<button
						onclick={handleLogout}
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
		class="flex h-13 w-13 items-center justify-center rounded-full border-2 border-brandy bg-tangerine text-white shadow-[4px_4px_0px_#78290f] transition-all hover:scale-105 active:scale-95 active:shadow-none"
		aria-label={open ? 'Close menu' : 'Open menu'}
	>
		{#if open}
			<X size={22} strokeWidth={2.75} />
		{:else}
			<Menu size={22} strokeWidth={2.75} />
		{/if}
	</button>
</div>

{#if open}
	<button
		class="fixed inset-0 z-40 cursor-default bg-ink/70 backdrop-blur-xs md:hidden dark:bg-ink/85"
		onclick={close}
		aria-label="Close menu overlay"
	></button>
{/if}
