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
		ExternalLink,
		Pin,
		Code
	} from '@lucide/svelte';
	import InstagramIcon from '$lib/components/icons/InstagramIcon.svelte';
	import { navActionClass, navItemClass } from '$lib/utils/nav-utils';
	import { navigateTo, navigateWithDelay } from '$lib/utils/navigating';
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

	// 1. Ambil props utuh agar tetap reaktif
	let props: Props = $props();

	// 2. Gunakan $derived untuk mengakses props dan state URL
	let items = $derived(props.items);
	let isAdmin = $derived(props.isAdmin ?? false);
	let contact = $derived(props.contact);
	let className = $derived(props.class ?? '');
	let staticPosition = $derived(props.staticPosition ?? false);
	let preventNavigation = $derived(props.preventNavigation ?? false);
	let currentPath = $derived(page.url.pathname);
	let isAdminPage = $derived(currentPath.startsWith('/admin'));
	let isAboutDevActive = $derived(currentPath === '/about-dev');

	let collapsed = $state(false);
	let isHovered = $state(false);
	let contactOpen = $state(false);
	let contactRef = $state<HTMLDivElement | null>(null);

	const isExpanded = $derived(!collapsed || isHovered);
	const isPeeking = $derived(collapsed && isHovered);

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

	function pinSidebar() {
		collapsed = false;
		localStorage.setItem('sidebar-collapsed', 'false');
	}

	function unpinSidebar() {
		collapsed = true;
		isHovered = false;
		contactOpen = false;
		localStorage.setItem('sidebar-collapsed', 'true');
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
		try {
			const res = await authClient.signOut();
			if (res && 'error' in res && res.error) {
				toast.error(res.error.message || 'Gagal logout, silakan coba lagi.');
				return;
			}
			toast.success('Berhasil logout!');
			window.location.href = '/';
		} catch {
			toast.error('Gagal logout, silakan coba lagi.');
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<aside
	class="{staticPosition
		? 'relative flex'
		: 'fixed top-1/2 left-4 z-30 hidden -translate-y-1/2 lg:flex'} nav-drafting-grid flex-col rounded-xl border-2 border-[#262626] bg-[#fea770]/95 p-2 text-[#262626] shadow-[4px_4px_0px_#262626] backdrop-blur-xs transition-all duration-200 dark:border-[#a2e1db] dark:bg-[#1a1825]/95 dark:text-[#f2efe9] dark:shadow-[4px_4px_0px_#b4a6d5] {className}"
	class:w-16={!isExpanded}
	class:w-60={isExpanded}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	{#if !isExpanded}
		<button
			onclick={toggle}
			class="{navActionClass()} mb-2 justify-center"
			aria-label="Perluas sidebar"
			title="Perluas sidebar"
		>
			<PanelLeftOpen size={16} strokeWidth={2.75} />
		</button>
	{:else if isPeeking}
		<div class="mb-2 flex items-center justify-between gap-1.5 px-1 py-1">
			<span
				class="inline-flex items-center gap-1.5 rounded-md border-2 border-[#262626] bg-[#a2e1db] px-2 py-0.5 font-mono text-[11px] font-black tracking-wider text-[#262626] uppercase shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#a2e1db] dark:text-[#262626]"
				title="Sidebar terbuka sementara (mode hover)"
			>
				<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-[#fea770]"></span>
				Peek
			</span>

			<button
				type="button"
				onclick={pinSidebar}
				class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-2 py-1 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-y-0.5 hover:bg-[#a2e1db] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:hover:bg-[#a2e1db] dark:hover:text-[#262626]"
				aria-label="Pin Menu"
				title="Sematkan menu agar tetap terbuka permanen"
			>
				<Pin size={13} strokeWidth={2.5} class="rotate-45" />
				<span>Pin Menu</span>
			</button>
		</div>
	{:else}
		<div class="mb-2 flex items-center justify-between gap-2 px-1 py-1">
			<span class="font-serif text-sm font-bold tracking-tight text-[#262626] dark:text-[#f2efe9]">
				Cho.lazey
			</span>

			<button
				type="button"
				onclick={unpinSidebar}
				class="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-2 py-1 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-y-0.5 hover:bg-[#fee2e2] hover:text-[#991b1b] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:hover:bg-red-950 dark:hover:text-red-300"
				aria-label="Unpin Menu"
				title="Ciutkan menu ke mode ikon"
			>
				<PanelLeftClose size={13} strokeWidth={2.5} />
				<span>Unpin Menu</span>
			</button>
		</div>
	{/if}

	<nav class="flex flex-col gap-1">
		{#each items as item (item.href)}
			{@const isActive = currentPath === item.href}
			<a
				href={resolve(item.href)}
				class="{navItemClass(isActive)} group overflow-hidden"
				onmouseenter={() => {
					if (item.href === '/about-dev') {
						const img = new Image();
						img.src = '/profile_pict_dev.jpeg';
					}
				}}
				onclick={(e) => {
					if (preventNavigation) {
						e.preventDefault();
						toast.info(`[Sandbox] Navigasi: Menuju "${item.label}" (${item.href})`);
					}
				}}
			>
				<div class="relative flex shrink-0 items-center justify-center">
					<item.icon size={16} strokeWidth={2.5} class="shrink-0" />
					{#if isActive && !isExpanded}
						<!-- Active Diamond Badge saat Collapsed -->
						<span
							class="absolute -top-1 -right-1 h-2 w-2 rotate-45 rounded-[1px] border border-[#262626] bg-[#fea770] dark:border-[#1a1825] dark:bg-[#1a1825]"
							title="Halaman aktif"
						></span>
					{/if}
				</div>
				{#if isExpanded}
					<span class="relative block h-5 flex-1 overflow-hidden">
						<span
							class="block whitespace-nowrap transition-transform duration-300 ease-out group-hover:-translate-y-full"
						>
							{item.label}
						</span>
						<span
							class="absolute top-0 left-0 block translate-y-full font-bold whitespace-nowrap text-[#f2efe9] transition-transform duration-300 ease-out group-hover:translate-y-0 dark:text-[#1a1825]"
							aria-hidden="true"
						>
							{item.hoverLabel ?? item.label}
						</span>
					</span>
					{#if isActive}
						<!-- Active Diamond Badge saat Expanded -->
						<span
							class="h-2 w-2 shrink-0 rotate-45 rounded-[1px] border border-[#262626] bg-[#fea770] shadow-[1px_1px_0px_#262626] dark:border-[#1a1825] dark:bg-[#1a1825] dark:shadow-[1px_1px_0px_#a2e1db]"
							title="Halaman aktif"
						></span>
					{/if}
				{/if}
			</a>
		{/each}

		{#if hasContact}
			<div class="relative" bind:this={contactRef}>
				<button
					type="button"
					onclick={toggleContact}
					class="{navActionClass()} group overflow-hidden {contactOpen
						? 'border-2 border-[#262626] bg-[#b4a6d5] text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#b4a6d5] dark:text-[#1a1825]'
						: ''}"
					aria-haspopup="true"
					aria-expanded={contactOpen}
					title="Hubungi Kami"
				>
					<Headset size={16} strokeWidth={2.5} class="shrink-0" />
					{#if isExpanded}
						<span class="relative block h-5 flex-1 overflow-hidden">
							<span
								class="block whitespace-nowrap transition-transform duration-300 ease-out group-hover:-translate-y-full"
							>
								Hubungi Kami
							</span>
							<span
								class="absolute top-0 left-0 block translate-y-full font-bold whitespace-nowrap text-[#f2efe9] transition-transform duration-300 ease-out group-hover:translate-y-0 dark:text-[#1a1825]"
								aria-hidden="true"
							>
								Chat Admin
							</span>
						</span>
					{/if}
				</button>

				{#if contactOpen}
					<div
						class="absolute top-0 left-full z-50 ml-3 w-56 rounded-xl border-2 border-[#262626] bg-[#f2efe9] p-3 shadow-[4px_4px_0px_#262626] backdrop-blur-xs dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[4px_4px_0px_#f2efe9]"
					>
						<div class="border-b border-[#262626]/15 pb-2 dark:border-[#f2efe9]/15">
							<p class="font-serif text-xs font-bold text-[#262626] dark:text-[#f2efe9]">
								Hubungi Kami
							</p>
							<p class="font-sans text-[11px] text-[#404040] dark:text-[#b8b5ad]">
								Pilih saluran kontak langsung
							</p>
						</div>

						<div class="mt-2 flex flex-col gap-1.5">
							{#if waHref}
								<a
									href={waHref}
									target="_blank"
									rel="external noopener noreferrer"
									onclick={(e) => {
										if (preventNavigation) {
											e.preventDefault();
											contactOpen = false;
											toast.info('[Sandbox] Simulasi: Membuka WhatsApp chat admin');
										} else {
											contactOpen = false;
										}
									}}
									class="flex items-center justify-between gap-2.5 rounded-lg border-2 border-[#262626] bg-white px-2.5 py-2 text-sm text-[#262626] transition-all hover:bg-[#d1fae5] dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9] dark:hover:bg-[#065f46]/30"
								>
									<div class="flex items-center gap-2.5">
										<div
											class="flex h-7 w-7 items-center justify-center rounded-md border border-[#065f46] bg-[#d1fae5] text-[#065f46]"
										>
											<MessageCircle size={15} strokeWidth={2.5} />
										</div>
										<div class="flex flex-col text-left">
											<span class="text-xs font-bold text-[#262626] dark:text-[#f2efe9]"
												>WhatsApp</span
											>
											<span class="text-[10px] text-[#404040] dark:text-[#b8b5ad]">Chat Admin</span>
										</div>
									</div>
									<ExternalLink
										size={12}
										strokeWidth={2.5}
										class="text-[#404040] dark:text-[#b8b5ad]"
									/>
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
											contactOpen = false;
											toast.info('[Sandbox] Simulasi: Membuka profil Instagram');
										} else {
											contactOpen = false;
										}
									}}
									class="flex items-center justify-between gap-2.5 rounded-lg border-2 border-[#262626] bg-white px-2.5 py-2 text-sm text-[#262626] transition-all hover:bg-[#fee2e2] dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9] dark:hover:bg-[#991b1b]/30"
								>
									<div class="flex items-center gap-2.5">
										<div
											class="flex h-7 w-7 items-center justify-center rounded-md border border-[#c1121f] bg-[#fee2e2] text-[#c1121f]"
										>
											<InstagramIcon size={15} />
										</div>
										<div class="flex flex-col text-left">
											<span class="text-xs font-bold text-[#262626] dark:text-[#f2efe9]"
												>Instagram</span
											>
											<span class="text-[10px] text-[#404040] dark:text-[#b8b5ad]">Profil & DM</span
											>
										</div>
									</div>
									<ExternalLink
										size={12}
										strokeWidth={2.5}
										class="text-[#404040] dark:text-[#b8b5ad]"
									/>
								</a>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</nav>

	<div class="mt-2 space-y-1 border-t border-[#262626]/20 pt-2 dark:border-[#f2efe9]/20">
		<ThemeToggle collapsed={!isExpanded} />

		<!-- About Dev Link di Bawah ThemeToggle dengan Rolling Hover Text "?????" -->
		<a
			href={resolve('/about-dev')}
			class="{navItemClass(isAboutDevActive)} group overflow-hidden"
			onmouseenter={() => {
				const img = new Image();
				img.src = '/profile_pict_dev.jpeg';
			}}
			onclick={async (e) => {
				e.preventDefault();
				if (preventNavigation) {
					toast.info('[Sandbox] Navigasi: Menuju "About Dev" (/about-dev)');
					return;
				}
				await navigateWithDelay('/about-dev', 1500, 'Preparing...');
			}}
		>
			<div class="relative flex shrink-0 items-center justify-center">
				<Code size={16} strokeWidth={2.5} class="shrink-0" />
				{#if isAboutDevActive && !isExpanded}
					<span
						class="absolute -top-1 -right-1 h-2 w-2 rotate-45 rounded-[1px] border border-[#262626] bg-[#fea770] dark:border-[#1a1825] dark:bg-[#1a1825]"
						title="Halaman aktif"
					></span>
				{/if}
			</div>
			{#if isExpanded}
				<span class="relative block h-5 flex-1 overflow-hidden">
					<span
						class="block whitespace-nowrap transition-transform duration-300 ease-out group-hover:-translate-y-full"
					>
						About Dev
					</span>
					<span
						class="absolute top-0 left-0 block translate-y-full font-bold whitespace-nowrap text-[#f2efe9] transition-transform duration-300 ease-out group-hover:translate-y-0 dark:text-[#1a1825]"
						aria-hidden="true"
					>
						?????
					</span>
				</span>
				{#if isAboutDevActive}
					<span
						class="h-2 w-2 shrink-0 rotate-45 rounded-[1px] border border-[#262626] bg-[#fea770] shadow-[1px_1px_0px_#262626] dark:border-[#1a1825] dark:bg-[#1a1825] dark:shadow-[1px_1px_0px_#a2e1db]"
						title="Halaman aktif"
					></span>
				{/if}
			{/if}
		</a>

		{#if isAdmin}
			{#if isAdminPage}
				<button
					onclick={() => {
						if (preventNavigation) {
							toast.info('[Sandbox] Navigasi: Menuju Beranda ("/")');
						} else {
							navigateTo('/');
						}
					}}
					class="{navActionClass()} group overflow-hidden"
				>
					<Home size={16} strokeWidth={2.5} class="shrink-0" />
					{#if isExpanded}
						<span class="relative block h-5 flex-1 overflow-hidden">
							<span
								class="block whitespace-nowrap transition-transform duration-300 ease-out group-hover:-translate-y-full"
							>
								Home
							</span>
							<span
								class="absolute top-0 left-0 block translate-y-full font-bold whitespace-nowrap text-[#f2efe9] transition-transform duration-300 ease-out group-hover:translate-y-0 dark:text-[#1a1825]"
								aria-hidden="true"
							>
								Ke Beranda
							</span>
						</span>
					{/if}
				</button>
			{:else}
				<button
					onclick={() => {
						if (preventNavigation) {
							toast.info('[Sandbox] Navigasi: Menuju Dashboard ("/admin")');
						} else {
							navigateTo('/admin');
						}
					}}
					class="{navActionClass()} group overflow-hidden"
				>
					<LayoutDashboard size={16} strokeWidth={2.5} class="shrink-0" />
					{#if isExpanded}
						<span class="relative block h-5 flex-1 overflow-hidden">
							<span
								class="block whitespace-nowrap transition-transform duration-300 ease-out group-hover:-translate-y-full"
							>
								Dashboard
							</span>
							<span
								class="absolute top-0 left-0 block translate-y-full font-bold whitespace-nowrap text-[#f2efe9] transition-transform duration-300 ease-out group-hover:translate-y-0 dark:text-[#1a1825]"
								aria-hidden="true"
							>
								Admin Panel
							</span>
						</span>
					{/if}
				</button>
			{/if}

			<button
				onclick={() => {
					if (preventNavigation) {
						toast.info('[Sandbox] Simulasi: Logout berhasil!');
					} else {
						handleLogout();
					}
				}}
				class="{navActionClass()} group overflow-hidden"
			>
				<LogOut size={16} strokeWidth={2.5} class="shrink-0" />
				{#if isExpanded}
					<span class="relative block h-5 flex-1 overflow-hidden">
						<span
							class="block whitespace-nowrap transition-transform duration-300 ease-out group-hover:-translate-y-full"
						>
							Logout
						</span>
						<span
							class="absolute top-0 left-0 block translate-y-full font-bold whitespace-nowrap text-[#fca5a5] transition-transform duration-300 ease-out group-hover:translate-y-0 dark:text-[#f87171]"
							aria-hidden="true"
						>
							Keluar Akun
						</span>
					</span>
				{/if}
			</button>
		{/if}
	</div>
</aside>
