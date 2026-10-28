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

<div class="mx-auto max-w-2xl space-y-6 pb-20">
	<div class="border-b-2 border-[#262626]/10 pb-4 dark:border-[#f2efe9]/10">
		<div
			class="mb-1 inline-flex items-center gap-1.5 rounded-md border-2 border-[#262626] bg-[#e87a5d] px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626]"
		>
			<span>KONFIGURASI SISTEM</span>
		</div>
		<h1 class="text-2xl font-black tracking-tight text-[#262626] dark:text-[#f2efe9]">
			Pengaturan Toko
		</h1>
		<p class="font-mono text-xs text-[#262626]/70 sm:text-[13px] dark:text-[#f2efe9]/70">
			Kelola identitas brand, kontak darurat, rekening pembayaran, dan kode self-pickup booth.
		</p>
	</div>

	<div class="flex flex-wrap gap-2.5">
		<a
			href={resolve('/admin/settings/payment-methods')}
			class="flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
		>
			<CreditCard size={15} />
			<span>Kelola Bank / VA ↗</span>
		</a>
		<a
			href={resolve('/admin/settings/qris')}
			class="flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
		>
			<QrCode size={15} />
			<span>Kelola QRIS ↗</span>
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
			class="relative space-y-4 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-6 shadow-[4px_4px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 select-none dark:text-[#f2efe9]/30"
				>+</span
			>

			<div>
				<label
					for="storeName"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
				>
					Nama Toko
				</label>
				<input
					id="storeName"
					name="storeName"
					value={data.settings?.storeName ?? ''}
					required
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
				/>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label
						for="instagram"
						class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>
						Instagram
					</label>
					<input
						id="instagram"
						name="instagram"
						value={data.settings?.instagram ?? ''}
						placeholder="@namatoko"
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
					/>
				</div>

				<div>
					<label
						for="twitter"
						class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>
						Twitter / X
					</label>
					<input
						id="twitter"
						name="twitter"
						value={data.settings?.twitter ?? ''}
						placeholder="@namatoko"
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label
						for="emailFromName"
						class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>
						Nama Pengirim Email
					</label>
					<input
						id="emailFromName"
						name="emailFromName"
						value={data.settings?.emailFromName ?? ''}
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
					/>
				</div>

				<div>
					<label
						for="proofContact"
						class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
					>
						Kontak Bukti Transfer
					</label>
					<input
						id="proofContact"
						name="proofContact"
						value={data.settings?.proofContact ?? ''}
						placeholder="@artist / WA 08xx"
						disabled={isBusy}
						class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
					/>
				</div>
			</div>

			<div>
				<label
					for="paymentNote"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
				>
					Catatan Pembayaran Umum
				</label>
				<textarea
					id="paymentNote"
					name="paymentNote"
					rows="3"
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
					>{data.settings?.paymentNote ?? ''}</textarea
				>
			</div>

			<div>
				<label
					for="shopeeCheckoutUrl"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
				>
					Link Checkout Shopee (Event / Booth)
				</label>
				<input
					id="shopeeCheckoutUrl"
					name="shopeeCheckoutUrl"
					type="url"
					value={data.settings?.shopeeCheckoutUrl ?? ''}
					placeholder="https://shopee.co.id/Link-khusus-co-..."
					disabled={isBusy}
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs text-[#262626] placeholder:text-[#262626]/40 focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
				/>
				<p class="mt-1 font-mono text-xs text-[#262626]/60 dark:text-[#f2efe9]/60">
					Tautan ini akan otomatis disertakan pada draf pesan WhatsApp saat pesanan dengan metode
					pengiriman Mail Order (Shopee) telah lunas.
				</p>
			</div>

			<div>
				<label
					for="emergencyFlatRate"
					class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
				>
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
					class="mt-1.5 w-full rounded-lg border-2 border-[#262626] bg-[#f2efe9]/30 px-3.5 py-2.5 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-black/30 dark:text-[#f2efe9]"
				/>
				<p class="mt-1 font-mono text-xs text-[#262626]/60 dark:text-[#f2efe9]/60">
					Dipakai bila layanan cek ongkir gangguan/kena limit. 0 = nonaktif (checkout ditutup saat
					gangguan).
				</p>
			</div>

			<div
				class="space-y-3 rounded-lg border-2 border-[#262626] bg-[#f2efe9]/40 p-4 shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]/20 dark:bg-black/20"
			>
				<div class="flex items-center justify-between gap-4">
					<div>
						<label
							for="pickupCodeEnabled"
							class="font-mono text-xs font-black text-[#262626] uppercase sm:text-sm dark:text-[#f2efe9]"
						>
							Opsi Ambil Sendiri (Self-Pickup)
						</label>
						<p class="font-mono text-xs text-[#262626]/60 dark:text-[#f2efe9]/60">
							Jika aktif, pembeli dapat memilih opsi Self-Pickup (ongkir Rp 0) dengan memasukkan
							kode rahasia.
						</p>
					</div>
					<input
						type="checkbox"
						id="pickupCodeEnabled"
						name="pickupCodeEnabled"
						bind:checked={pickupEnabled}
						disabled={isBusy}
						class="h-4 w-4 rounded border-2 border-[#262626] text-[#262626] focus:ring-0"
					/>
				</div>

				{#if pickupEnabled}
					<div class="border-t border-[#262626]/10 pt-3 dark:border-[#f2efe9]/10">
						<label
							for="pickupCode"
							class="block font-mono text-xs font-bold tracking-wider text-[#262626]/70 uppercase dark:text-[#f2efe9]/70"
						>
							Kode Rahasia Rekanan / Teman
						</label>
						<div class="mt-1.5 flex flex-wrap gap-2">
							<input
								id="pickupCode"
								name="pickupCode"
								bind:value={pickupCode}
								placeholder="misal: TEMAN2026"
								disabled={isBusy || savingPickupCode}
								class="min-w-36 flex-1 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] uppercase focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9]"
							/>
							<button
								type="button"
								onclick={generateCode}
								disabled={isBusy || savingPickupCode}
								class="shrink-0 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
							>
								Generate Acak
							</button>
							<button
								type="button"
								onclick={handleCopyCode}
								disabled={isBusy || savingPickupCode || !pickupCode.trim()}
								class="shrink-0 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
							>
								{copied ? 'Tersalin!' : 'Salin'}
							</button>
						</div>
						<p class="mt-1 font-mono text-xs text-[#262626]/60 dark:text-[#f2efe9]/60">
							Bagikan kode ini hanya ke rekan yang ingin mengambil barang di tempat booth.
						</p>

						{#if isPickupCodeDirty && pickupCode.trim().length > 0}
							<div
								class="mt-2.5 flex flex-col justify-between gap-3 rounded-lg border-2 border-[#262626] bg-amber-100 p-3 font-mono text-xs text-amber-900 shadow-[2px_2px_0px_#262626] sm:flex-row sm:items-center sm:text-[13px] dark:bg-amber-950/60 dark:text-amber-200"
							>
								<div>
									<p class="font-black">Kode baru belum tersimpan di database!</p>
									<p class="mt-0.5 text-xs opacity-90">
										Pembeli belum bisa menggunakan kode ini di checkout sebelum disimpan.
									</p>
								</div>
								<button
									type="button"
									onclick={handleSavePickupCodeOnly}
									disabled={isBusy || savingPickupCode}
									class="shrink-0 rounded-lg border-2 border-[#262626] bg-amber-800 px-3.5 py-2 font-mono text-xs font-bold text-white shadow-[1px_1px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm"
								>
									{savingPickupCode ? 'Menyimpan...' : 'Simpan Kode Ini Saja'}
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="pt-2">
				<button
					type="submit"
					disabled={isBusy}
					class="rounded-lg border-2 border-[#262626] bg-[#262626] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]"
				>
					{isBusy ? 'Menyimpan...' : 'Simpan Pengaturan'}
				</button>
			</div>
		</form>
	</BusyOverlay>
</div>
