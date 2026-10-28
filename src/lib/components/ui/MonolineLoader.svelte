<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg' | 'xl';
		label?: string;
		showLabel?: boolean;
		showTimer?: boolean;
	}

	let { size = 'md', label = 'Preparing', showLabel = true, showTimer = true }: Props = $props();

	let elapsedSeconds = $state(0.0);

	$effect(() => {
		// Stopwatch elapsed time format 0.00 presisi tinggi (update setiap 30ms)
		// Cleanup function mencegah kebocoran timer (memory leak) saat unmount/sembunyi
		const startTime = performance.now();
		const intervalId = window.setInterval(() => {
			elapsedSeconds = (performance.now() - startTime) / 1000;
		}, 30);

		return () => {
			window.clearInterval(intervalId);
		};
	});
</script>

<div
	class="flex flex-col items-center justify-center gap-4 text-center"
	role="status"
	aria-live="polite"
>
	<!-- 4 Chasing Monoline Brand Squares -->
	<div
		class="relative {size === 'sm'
			? 'h-[30px] w-[30px]'
			: size === 'md'
				? 'h-[44px] w-[44px]'
				: size === 'lg'
					? 'h-[58px] w-[58px] sm:h-[72px] sm:w-[72px]'
					: 'h-[72px] w-[72px]'}"
	>
		<!-- Box 1: Lavender (Top-Left) -->
		<div
			class="absolute top-0 left-0 rounded-[3.5px] border-2 border-[#262626] bg-[#b4a6d5] shadow-[1.5px_1.5px_0px_#262626] dark:border-[#f2efe9] dark:shadow-[1.5px_1.5px_0px_#f2efe9] {size ===
			'sm'
				? 'box-sm-1 h-[13px] w-[13px]'
				: size === 'md'
					? 'box-md-1 h-[19px] w-[19px]'
					: size === 'lg'
						? 'box-lg-1 sm:box-xl-1 h-[25px] w-[25px] sm:h-[31px] sm:w-[31px]'
						: 'box-xl-1 h-[31px] w-[31px]'}"
		></div>

		<!-- Box 2: Mint (Top-Right) -->
		<div
			class="absolute top-0 {size === 'sm'
				? 'box-sm-2 left-[17px] h-[13px] w-[13px]'
				: size === 'md'
					? 'box-md-2 left-[25px] h-[19px] w-[19px]'
					: size === 'lg'
						? 'box-lg-2 sm:box-xl-2 left-[33px] h-[25px] w-[25px] sm:left-[41px] sm:h-[31px] sm:w-[31px]'
						: 'box-xl-2 left-[41px] h-[31px] w-[31px]'} rounded-[3.5px] border-2 border-[#262626] bg-[#a2e1db] shadow-[1.5px_1.5px_0px_#262626] dark:border-[#f2efe9] dark:shadow-[1.5px_1.5px_0px_#f2efe9]"
		></div>

		<!-- Box 3: Peach (Bottom-Right) -->
		<div
			class="absolute {size === 'sm'
				? 'box-sm-3 top-[17px] left-[17px] h-[13px] w-[13px]'
				: size === 'md'
					? 'box-md-3 top-[25px] left-[25px] h-[19px] w-[19px]'
					: size === 'lg'
						? 'box-lg-3 sm:box-xl-3 top-[33px] left-[33px] h-[25px] w-[25px] sm:top-[41px] sm:left-[41px] sm:h-[31px] sm:w-[31px]'
						: 'box-xl-3 top-[41px] left-[41px] h-[31px] w-[31px]'} rounded-[3.5px] border-2 border-[#262626] bg-[#fea770] shadow-[1.5px_1.5px_0px_#262626] dark:border-[#f2efe9] dark:shadow-[1.5px_1.5px_0px_#f2efe9]"
		></div>

		<!-- Box 4: Charcoal / Cream (Bottom-Left) -->
		<div
			class="absolute {size === 'sm'
				? 'box-sm-4 top-[17px] left-0 h-[13px] w-[13px]'
				: size === 'md'
					? 'box-md-4 top-[25px] left-0 h-[19px] w-[19px]'
					: size === 'lg'
						? 'box-lg-4 sm:box-xl-4 top-[33px] left-0 h-[25px] w-[25px] sm:top-[41px] sm:h-[31px] sm:w-[31px]'
						: 'box-xl-4 top-[41px] left-0 h-[31px] w-[31px]'} rounded-[3.5px] border-2 border-[#262626] bg-[#262626] shadow-[1.5px_1.5px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:shadow-[1.5px_1.5px_0px_#f2efe9]"
		></div>
	</div>

	{#if showLabel}
		<div
			class="flex items-center justify-center gap-3 font-mono text-base font-black tracking-[0.2em] text-[#262626] uppercase sm:text-lg md:text-xl dark:text-[#f2efe9]"
		>
			<span>{label}</span>
			{#if showTimer}
				<span
					class="font-mono text-base font-black tracking-normal text-[#d9532f] tabular-nums sm:text-lg md:text-xl dark:text-[#fea770]"
				>
					{elapsedSeconds.toFixed(2)}s
				</span>
			{/if}
		</div>
	{:else}
		<span class="sr-only">{label} {elapsedSeconds.toFixed(2)}s</span>
	{/if}
</div>

<style>
	/* Small Scale Keyframes (17px shift) */
	.box-sm-1 {
		animation: box-sm-1-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-sm-2 {
		animation: box-sm-2-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-sm-3 {
		animation: box-sm-3-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-sm-4 {
		animation: box-sm-4-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}

	@keyframes box-sm-1-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(17px, 0);
		}
		50% {
			transform: translate(17px, 17px);
		}
		75% {
			transform: translate(0, 17px);
		}
	}

	@keyframes box-sm-2-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(0, 17px);
		}
		50% {
			transform: translate(-17px, 17px);
		}
		75% {
			transform: translate(-17px, 0);
		}
	}

	@keyframes box-sm-3-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(-17px, 0);
		}
		50% {
			transform: translate(-17px, -17px);
		}
		75% {
			transform: translate(0, -17px);
		}
	}

	@keyframes box-sm-4-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(0, -17px);
		}
		50% {
			transform: translate(17px, -17px);
		}
		75% {
			transform: translate(17px, 0);
		}
	}

	/* Medium Scale Keyframes (25px shift) */
	.box-md-1 {
		animation: box-md-1-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-md-2 {
		animation: box-md-2-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-md-3 {
		animation: box-md-3-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-md-4 {
		animation: box-md-4-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}

	@keyframes box-md-1-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(25px, 0);
		}
		50% {
			transform: translate(25px, 25px);
		}
		75% {
			transform: translate(0, 25px);
		}
	}

	@keyframes box-md-2-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(0, 25px);
		}
		50% {
			transform: translate(-25px, 25px);
		}
		75% {
			transform: translate(-25px, 0);
		}
	}

	@keyframes box-md-3-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(-25px, 0);
		}
		50% {
			transform: translate(-25px, -25px);
		}
		75% {
			transform: translate(0, -25px);
		}
	}

	@keyframes box-md-4-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(0, -25px);
		}
		50% {
			transform: translate(25px, -25px);
		}
		75% {
			transform: translate(25px, 0);
		}
	}

	/* Large Scale Keyframes (33px shift) */
	.box-lg-1 {
		animation: box-lg-1-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-lg-2 {
		animation: box-lg-2-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-lg-3 {
		animation: box-lg-3-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-lg-4 {
		animation: box-lg-4-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}

	@keyframes box-lg-1-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(33px, 0);
		}
		50% {
			transform: translate(33px, 33px);
		}
		75% {
			transform: translate(0, 33px);
		}
	}

	@keyframes box-lg-2-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(0, 33px);
		}
		50% {
			transform: translate(-33px, 33px);
		}
		75% {
			transform: translate(-33px, 0);
		}
	}

	@keyframes box-lg-3-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(-33px, 0);
		}
		50% {
			transform: translate(-33px, -33px);
		}
		75% {
			transform: translate(0, -33px);
		}
	}

	@keyframes box-lg-4-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(0, -33px);
		}
		50% {
			transform: translate(33px, -33px);
		}
		75% {
			transform: translate(33px, 0);
		}
	}

	/* Extra Large Desktop Keyframes (41px shift) */
	@media (min-width: 640px) {
		.sm\:box-xl-1 {
			animation: box-xl-1-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite !important;
		}
		.sm\:box-xl-2 {
			animation: box-xl-2-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite !important;
		}
		.sm\:box-xl-3 {
			animation: box-xl-3-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite !important;
		}
		.sm\:box-xl-4 {
			animation: box-xl-4-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite !important;
		}
	}

	.box-xl-1 {
		animation: box-xl-1-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-xl-2 {
		animation: box-xl-2-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-xl-3 {
		animation: box-xl-3-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.box-xl-4 {
		animation: box-xl-4-anim 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}

	@keyframes box-xl-1-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(41px, 0);
		}
		50% {
			transform: translate(41px, 41px);
		}
		75% {
			transform: translate(0, 41px);
		}
	}

	@keyframes box-xl-2-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(0, 41px);
		}
		50% {
			transform: translate(-41px, 41px);
		}
		75% {
			transform: translate(-41px, 0);
		}
	}

	@keyframes box-xl-3-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(-41px, 0);
		}
		50% {
			transform: translate(-41px, -41px);
		}
		75% {
			transform: translate(0, -41px);
		}
	}

	@keyframes box-xl-4-anim {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(0, -41px);
		}
		50% {
			transform: translate(41px, -41px);
		}
		75% {
			transform: translate(41px, 0);
		}
	}
</style>
