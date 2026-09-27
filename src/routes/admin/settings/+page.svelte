<script lang="ts">
  import { enhance } from '$app/forms';
  import { handleFormResult } from '$lib/utils/handle-form-result';
  import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
  import { resolve } from '$app/paths';
  import { CreditCard, QrCode } from '@lucide/svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let isBusy = $state(false);
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
        <label for="paymentNote" class="block text-sm font-medium">Catatan Pembayaran Umum</label>
        <textarea
          id="paymentNote"
          name="paymentNote"
          rows="3"
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >{data.settings?.paymentNote ?? ''}</textarea>
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