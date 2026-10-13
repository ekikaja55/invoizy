<script lang="ts">
	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		open,
		title,
		message,
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
			class="absolute inset-0 cursor-default bg-black/50"
		></button>
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			class="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5
			       dark:border-neutral-800 dark:bg-neutral-950"
		>
			<h2 class="text-base font-semibold">{title}</h2>
			<p class="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{message}</p>
			<div class="mt-4 flex justify-end gap-2">
				<button
					onclick={onCancel}
					class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
					       hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
				>
					{cancelLabel}
				</button>
				<button
					onclick={onConfirm}
					class={danger
						? 'rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500'
						: 'rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900'}
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}
