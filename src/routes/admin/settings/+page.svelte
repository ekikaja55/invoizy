<script lang="ts">
	import { enhance, deserialize } from '$app/forms';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import { resolve } from '$app/paths';
	import { CreditCard, QrCode } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let isBusy = $state(false);

	let pickupEnabled = $state(false);
	let pickupCode = $state('');
	let savedPickupCode = $state('');
	let copied = $state(false);
	let savingPickupCode = $state(false);

	const isPickupCodeDirty = $derived(pickupCode.trim() !== savedPickupCode.trim());

	$effect(() => {
		pickupEnabled = data.settings?.pickupCodeEnabled ?? false;
		pickupCode = data.settings?.pickupCode ?? '';
		savedPickupCode = data.settings?.pickupCode ?? '';
	});

	function generateCode() {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let res = '';
		for (let i = 0; i < 6; i++) {
			res += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		pickupCode = res;
	}

	async function handleCopyCode() {
		const code = pickupCode.trim();
		if (!code) {
			toast.error('Tidak ada kode untuk disalin.');
			return;
		}

		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);

			if (isPickupCodeDirty) {
				toast.warning('Kode disalin! Jangan lupa simpan kode agar aktif di checkout.');
			} else {
				toast.success('Kode rahasia berhasil disalin.');
			}
		} catch {
			toast.error('Gagal mengakses clipboard.');
		}
	}

	async function handleSavePickupCodeOnly() {
		const code = pickupCode.trim();
		if (!code) {
			toast.error('Kode pickup tidak boleh kosong.');
			return;
		}
		if (savingPickupCode) return;
		savingPickupCode = true;
		try {
			const fd = new FormData();
			fd.append('pickupCode', code);
			fd.append('pickupCodeEnabled', 'true');

			const res = await fetch('?/savePickupCode', {
				method: 'POST',
				body: fd
			});
			const result = deserialize(await res.text());
			if (result.type === 'success') {
				savedPickupCode = code;
				pickupEnabled = true;
				if (data.settings) {
					data.settings.pickupCode = code;
					data.settings.pickupCodeEnabled = true;
				}
				toast.success('Kode pickup berhasil disimpan ke database.');
			} else if (result.type === 'failure') {
				const errMsg = (result.data as { error?: string })?.error ?? 'Gagal menyimpan kode.';
				toast.error(errMsg);
			} else {
				toast.error('Gagal menyimpan kode.');
			}
		} catch {
			toast.error('Terjadi kesalahan saat menyimpan kode.');
		} finally {
			savingPickupCode = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl space-y-6">
	<h1 class="text-xl font-semibold">Settings</h1>

	<div class="flex gap-2">
		<a
			href={resolve('/admin/settings/payment-methods')}
			class="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm
             hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
		>
			<CreditCard size={16} />
			Kelola Bank / VA
		</a>
		<a
			href={resolve('/admin/settings/qris')}
			class="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm
             hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
		>
			<QrCode size={16} />
			Kelola QRIS
		</a>
	</div>

	<BusyOverlay active={isBusy}>
		<form
			method="POST"
			action="?/update"
			use:enhance={() => {
				isBusy = true;
				return async ({ result, update }) => {
					handleFormResult(result, { success: 'Pengaturan berhasil disimpan.' });
					await update();
					isBusy = false;
				};
			}}
			class="space-y-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
		>
			<div>
				<label for="storeName" class="block text-sm font-medium">Nama Toko</label>
				<input
					id="storeName"
					name="storeName"
					value={data.settings?.storeName ?? ''}
					required
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
				/>
			</div>

			<div>
				<label for="instagram" class="block text-sm font-medium">Instagram</label>
				<input
					id="instagram"
					name="instagram"
					value={data.settings?.instagram ?? ''}
					placeholder="@namatoko"
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
				/>
			</div>

			<div>
				<label for="twitter" class="block text-sm font-medium">Twitter</label>
				<input
					id="twitter"
					name="twitter"
					value={data.settings?.twitter ?? ''}
					placeholder="@namatoko"
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
				/>
			</div>

			<div>
				<label for="emailFromName" class="block text-sm font-medium">Nama Pengirim Email</label>
				<input
					id="emailFromName"
					name="emailFromName"
					value={data.settings?.emailFromName ?? ''}
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
				/>
			</div>

			<div>
				<label for="proofContact" class="block text-sm font-medium">Kontak Bukti Transfer</label>
				<input
					id="proofContact"
					name="proofContact"
					value={data.settings?.proofContact ?? ''}
					placeholder="@artist / WA 08xx"
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
				/>
			</div>

			<div>
				<label for="paymentNote" class="block text-sm font-medium">Catatan Pembayaran Umum</label>
				<textarea
					id="paymentNote"
					name="paymentNote"
					rows="3"
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
					>{data.settings?.paymentNote ?? ''}</textarea
				>
			</div>

			<div>
				<label for="shopeeCheckoutUrl" class="block text-sm font-medium">Link Checkout Shopee (Event / Booth)</label>
				<input
					id="shopeeCheckoutUrl"
					name="shopeeCheckoutUrl"
					type="url"
					value={data.settings?.shopeeCheckoutUrl ?? ''}
					placeholder="https://shopee.co.id/Link-khusus-co-..."
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
				/>
				<p class="mt-1 text-xs text-neutral-500">
					Tautan ini akan otomatis disertakan pada draf pesan WhatsApp saat pesanan dengan metode pengiriman Mail Order (Shopee) telah lunas.
				</p>
			</div>

			<div>
				<label for="emergencyFlatRate" class="block text-sm font-medium">
					Ongkir Flat Darurat (Rp)
				</label>
				<input
					id="emergencyFlatRate"
					name="emergencyFlatRate"
					type="number"
					min="0"
					step="500"
					value={data.settings?.emergencyFlatRate ?? 0}
					disabled={isBusy}
					class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
				/>
				<p class="mt-1 text-xs text-neutral-500">
					Dipakai bila layanan cek ongkir gangguan/kena limit. 0 = nonaktif (checkout ditutup saat
					gangguan).
				</p>
			</div>

			<div class="space-y-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
				<div class="flex items-center justify-between gap-4">
					<div>
						<label for="pickupCodeEnabled" class="text-sm font-medium">Opsi Ambil Sendiri (Self-Pickup)</label>
						<p class="text-xs text-neutral-500">
							Jika aktif, pembeli dapat memilih opsi Self-Pickup (ongkir Rp 0) dengan memasukkan kode rahasia.
						</p>
					</div>
					<input
						type="checkbox"
						id="pickupCodeEnabled"
						name="pickupCodeEnabled"
						bind:checked={pickupEnabled}
						disabled={isBusy}
						class="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 dark:border-neutral-700"
					/>
				</div>

				{#if pickupEnabled}
					<div>
						<label for="pickupCode" class="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
							Kode Rahasia Rekanan / Teman
						</label>
						<div class="mt-1 flex flex-wrap gap-2">
							<input
								id="pickupCode"
								name="pickupCode"
								bind:value={pickupCode}
								placeholder="misal: TEMAN2026"
								disabled={isBusy || savingPickupCode}
								class="min-w-36 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono uppercase text-neutral-900
                     disabled:opacity-50
                     dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
							/>
							<button
								type="button"
								onclick={generateCode}
								disabled={isBusy || savingPickupCode}
								class="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-white/10"
							>
								Generate Acak
							</button>
							<button
								type="button"
								onclick={handleCopyCode}
								disabled={isBusy || savingPickupCode || !pickupCode.trim()}
								class="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-white/10"
							>
								{copied ? 'Tersalin!' : 'Salin'}
							</button>
						</div>
						<p class="mt-1 text-xs text-neutral-500">
							Bagikan kode ini hanya ke rekan yang ingin mengambil barang di tempat.
						</p>

						{#if isPickupCodeDirty && pickupCode.trim().length > 0}
							<div
								class="mt-2.5 flex flex-col justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 sm:flex-row sm:items-center dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
							>
								<div>
									<p class="font-bold">Kode baru belum tersimpan di database!</p>
									<p class="mt-0.5 text-amber-800 dark:text-amber-300">
										Pembeli belum bisa menggunakan kode ini di checkout sebelum disimpan.
									</p>
								</div>
								<button
									type="button"
									onclick={handleSavePickupCodeOnly}
									disabled={isBusy || savingPickupCode}
									class="shrink-0 rounded-md bg-amber-800 px-3.5 py-1.5 font-medium text-white transition-colors hover:bg-amber-900 disabled:opacity-50 dark:bg-amber-700 dark:hover:bg-amber-600"
								>
									{savingPickupCode ? 'Menyimpan...' : 'Simpan Kode Ini Saja'}
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<button
				type="submit"
				disabled={isBusy}
				class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
			>
				{isBusy ? 'Menyimpan...' : 'Simpan'}
			</button>
		</form>
	</BusyOverlay>
</div>
