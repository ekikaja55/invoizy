<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		message?: string;
		// Body kustom (mis. preview gambar) — bila diisi, menggantikan <p>message</p>.
		children?: Snippet;
		// Sembunyikan tombol aksi (untuk dialog non-konfirmasi seperti preview).
		hideActions?: boolean;
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
		onConfirm?: () => void;
		onCancel: () => void;
	}

	let {
		open,
		title,
		message = '',
		children,
		hideActions = false,
		confirmLabel = 'Ya, lanjutkan',
		cancelLabel = 'Batal',
		danger = false,
		onConfirm,
		onCancel
	}: Props = $props();

	$effect(() => {
		if (open) {
			const prevBodyOverflow = document.body.style.overflow;
			const prevHtmlOverflow = document.documentElement.style.overflow;
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = prevBodyOverflow;
				document.documentElement.style.overflow = prevHtmlOverflow;
			};
		}
	});

	function onKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') onCancel();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="fixed inset-0 z-[999] flex items-center justify-center p-4">
		<button
			aria-label="Tutup dialog"
			onclick={onCancel}
			class="absolute inset-0 cursor-default bg-[#262626]/60 backdrop-blur-xs dark:bg-black/75"
		></button>
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			class="relative w-full max-w-sm rounded-[18px_6px_16px_8px] border-2 border-[#262626] bg-white p-6 shadow-[5px_5px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[5px_5px_0px_#f2efe9]"
		>
			<h2 class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">{title}</h2>
			{#if children}
				{@render children()}
			{:else if message}
				<p class="mt-2.5 text-sm leading-relaxed text-[#595959] dark:text-[#a3a099]">{message}</p>
			{/if}
			{#if !hideActions}
				<div class="mt-5 flex justify-end gap-2.5">
					<button
						type="button"
						onclick={onCancel}
						class="rounded-[8px_3px_7px_2px] border-[1.5px] border-[#262626] bg-white px-4 py-2 font-sans text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5]/20 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#b4a6d5] dark:hover:text-[#1a1825]"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						onclick={() => onConfirm?.()}
						class="rounded-[8px_3px_7px_2px] border-[1.5px] px-4 py-2 font-sans text-xs font-bold transition-all active:translate-y-0.5 active:shadow-none {danger
							? 'border-[#c1121f] bg-[#c1121f] text-white shadow-[2px_2px_0px_#c1121f] hover:bg-[#991b1b]'
							: 'border-[#262626] bg-[#262626] text-[#f2efe9] shadow-[2px_2px_0px_#262626] hover:bg-[#3d3a37] dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#e0ded8]'}"
					>
						{confirmLabel}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
