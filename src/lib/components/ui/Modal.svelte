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

	function onKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') onCancel();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<button
			aria-label="Tutup dialog"
			onclick={onCancel}
			class="absolute inset-0 cursor-default bg-ink/70 backdrop-blur-xs dark:bg-ink/85"
		></button>
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			class="relative w-full max-w-sm rounded-[18px_6px_16px_8px] border-2 border-brandy bg-papaya p-6 shadow-[6px_6px_0px_#78290f] dark:border-papaya/40 dark:bg-ink dark:shadow-[6px_6px_0px_rgba(255,236,209,0.25)]"
		>
			<h2 class="font-serif text-lg font-bold text-ink dark:text-papaya">{title}</h2>
			{#if children}
				{@render children()}
			{:else if message}
				<p class="mt-2.5 text-sm leading-relaxed text-ink/80 dark:text-papaya/80">{message}</p>
			{/if}
			{#if !hideActions}
				<div class="mt-5 flex justify-end gap-2.5">
					<button
						type="button"
						onclick={onCancel}
						class="rounded-[8px_3px_7px_2px] border-2 border-brandy bg-papaya px-4 py-2 font-mono text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] transition-all hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						onclick={() => onConfirm?.()}
						class="rounded-[8px_3px_7px_2px] border-2 border-brandy px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#78290f] transition-all active:translate-y-0.5 active:shadow-none {danger
							? 'bg-crimson hover:bg-[#a50f1b]'
							: 'bg-tangerine hover:bg-[#e06d00]'}"
					>
						{confirmLabel}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
