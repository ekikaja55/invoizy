<script lang="ts">
	import { resolve } from '$app/paths';
	import ThemeToggle from '$lib/components/nav/ThemeToggle.svelte';
	import { mockInvoice } from './mock-data';
	import PrimitivesLab from './components/PrimitivesLab.svelte';
	import CardsLab from './components/CardsLab.svelte';
	import TemplatesLab from './components/TemplatesLab.svelte';
	import ReorderLab from './components/ReorderLab.svelte';
	import NavigationLab from './components/NavigationLab.svelte';
	import ColorPaletteLab from './components/ColorPaletteLab.svelte';
	import {
		Palette,
		Layers,
		FileText,
		ArrowUpDown,
		Compass,
		ArrowLeft,
		SwatchBook
	} from '@lucide/svelte';

	let activeTab = $state<
		'primitives' | 'cards' | 'templates' | 'reorder-dnd' | 'navigation' | 'palette'
	>('primitives');
</script>

<div
	class="drafting-grid min-h-screen bg-[#f2efe9] font-sans text-[#262626] transition-colors selection:bg-[#fea770] selection:text-[#262626] dark:bg-[#1a1825] dark:text-[#f2efe9]"
>
	<!-- Monoline Top Bar -->
	<header
		class="no-print sticky top-0 z-30 border-b-[1.5px] border-[#262626] bg-[#f2efe9]/95 px-4 py-3 backdrop-blur-xs dark:border-[#f2efe9]/20 dark:bg-[#1a1825]/95"
	>
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
			<div>
				<h1 class="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#262626] dark:text-[#f2efe9]">
					SANDBOX
				</h1>
			</div>

			<div class="flex items-center gap-2.5 sm:gap-3">
				<a
					href={resolve('/')}
					class="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-[#262626] bg-white px-2.5 py-1.5 text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5]/30 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
					title="Kembali ke Beranda"
					aria-label="Kembali ke Beranda"
				>
					<ArrowLeft size={14} strokeWidth={2.5} />
					<span><span class="hidden sm:inline">Kembali ke </span>Beranda</span>
				</a>

				<div class="hidden xs:block h-4 w-px bg-[#262626]/20 dark:bg-[#f2efe9]/20"></div>

				<div class="flex items-center gap-1.5 text-xs font-bold text-[#262626] dark:text-[#f2efe9]">
					<span class="hidden sm:inline">Tema:</span>
					<ThemeToggle />
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 py-8 space-y-8">
		<!-- Navigation Tabs -->
		<nav class="no-print flex flex-wrap items-center gap-2 border-b-[1.5px] border-[#262626] pb-4 dark:border-[#f2efe9]/30" aria-label="Sub-laboratorium Desain">
			<button
				type="button"
				onclick={() => (activeTab = 'primitives')}
				class="inline-flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] px-4 py-2 font-sans text-sm font-bold transition-all {activeTab ===
				'primitives'
					? 'bg-[#b4a6d5] text-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-0.5'
					: 'bg-white text-[#262626] hover:bg-[#b4a6d5]/30 dark:bg-[#252331] dark:text-[#f2efe9]'}"
			>
				<Palette size={16} />
				<span>1. UI Primitives</span>
			</button>

			<button
				type="button"
				onclick={() => (activeTab = 'cards')}
				class="inline-flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] px-4 py-2 font-sans text-sm font-bold transition-all {activeTab ===
				'cards'
					? 'bg-[#b4a6d5] text-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-0.5'
					: 'bg-white text-[#262626] hover:bg-[#b4a6d5]/30 dark:bg-[#252331] dark:text-[#f2efe9]'}"
			>
				<Layers size={16} />
				<span>2. Cards & Modules</span>
			</button>

			<button
				type="button"
				onclick={() => (activeTab = 'templates')}
				class="inline-flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] px-4 py-2 font-sans text-sm font-bold transition-all {activeTab ===
				'templates'
					? 'bg-[#b4a6d5] text-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-0.5'
					: 'bg-white text-[#262626] hover:bg-[#b4a6d5]/30 dark:bg-[#252331] dark:text-[#f2efe9]'}"
			>
				<FileText size={16} />
				<span>3. Templates & Error Page</span>
			</button>

			<button
				type="button"
				onclick={() => (activeTab = 'reorder-dnd')}
				class="inline-flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] px-4 py-2 font-sans text-sm font-bold transition-all {activeTab ===
				'reorder-dnd'
					? 'bg-[#b4a6d5] text-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-0.5'
					: 'bg-white text-[#262626] hover:bg-[#b4a6d5]/30 dark:bg-[#252331] dark:text-[#f2efe9]'}"
			>
				<ArrowUpDown size={16} />
				<span>4. Reorder DnD Lab</span>
			</button>

			<button
				type="button"
				onclick={() => (activeTab = 'navigation')}
				class="inline-flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] px-4 py-2 font-sans text-sm font-bold transition-all {activeTab ===
				'navigation'
					? 'bg-[#b4a6d5] text-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-0.5'
					: 'bg-white text-[#262626] hover:bg-[#b4a6d5]/30 dark:bg-[#252331] dark:text-[#f2efe9]'}"
			>
				<Compass size={16} />
				<span>5. Navigation & FAB</span>
			</button>

			<button
				type="button"
				onclick={() => (activeTab = 'palette')}
				class="inline-flex items-center gap-2 rounded-md border-[1.5px] border-[#262626] px-4 py-2 font-sans text-sm font-bold transition-all {activeTab ===
				'palette'
					? 'bg-[#b4a6d5] text-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-0.5'
					: 'bg-white text-[#262626] hover:bg-[#b4a6d5]/30 dark:bg-[#252331] dark:text-[#f2efe9]'}"
			>
				<SwatchBook size={16} />
				<span>6. Color Palette</span>
			</button>
		</nav>

		<!-- Active Tab Contents -->
		{#if activeTab === 'primitives'}
			<PrimitivesLab />
		{:else if activeTab === 'cards'}
			<CardsLab />
		{:else if activeTab === 'templates'}
			<TemplatesLab invoice={mockInvoice} />
		{:else if activeTab === 'reorder-dnd'}
			<ReorderLab />
		{:else if activeTab === 'navigation'}
			<NavigationLab />
		{:else if activeTab === 'palette'}
			<ColorPaletteLab />
		{/if}
	</main>
</div>
