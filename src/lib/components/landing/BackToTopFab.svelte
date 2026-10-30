<script lang="ts">
	import { ArrowUp } from '@lucide/svelte';

	type Props = {
		threshold?: number; // Scroll offset dalam px sebelum FAB muncul
		class?: string;
	};

	let { threshold = 400, class: className = '' }: Props = $props();

	let visible = $state(false);

	function handleScroll() {
		if (typeof window !== 'undefined') {
			visible = window.scrollY > threshold;
		}
	}

	function scrollToTop() {
		if (typeof window !== 'undefined') {
			try {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} catch {
				window.scrollTo(0, 0);
			}
		}
	}
</script>

<svelte:window onscroll={handleScroll} />

{#if visible}
	<!-- Back to Top FAB:
	     Mobile & Tablet (<lg): bottom-20 right-4 sm:right-6 (tepat di atas MobileFab bottom-4 agar tidak tabrakan)
	     Desktop (lg+): lg:bottom-6 lg:right-6 (MobileFab tersembunyi di desktop) -->
	<div class="fixed right-4 bottom-20 z-40 sm:right-6 lg:right-6 lg:bottom-6 {className}">
		<button
			type="button"
			onclick={scrollToTop}
			class="group flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#262626] bg-[#fea770] text-[#262626] shadow-[3px_3px_0px_#262626] transition-all duration-200 hover:-translate-y-1 hover:bg-[#f99252] hover:shadow-[4px_4px_0px_#262626] active:translate-y-0.5 active:shadow-none sm:h-12 sm:w-12 dark:border-[#a2e1db] dark:bg-[#1a1825] dark:text-[#f2efe9] dark:shadow-[3px_3px_0px_#b4a6d5] dark:hover:bg-[#252331]"
			title="Kembali ke atas"
			aria-label="Scroll kembali ke atas halaman"
		>
			<ArrowUp
				size={20}
				strokeWidth={2.5}
				class="transition-transform duration-200 group-hover:-translate-y-0.5"
			/>
		</button>
	</div>
{/if}
