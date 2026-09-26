NOTE FASE 2 PART 5

Sip, itu juga yang lebih sederhana untuk diimplementasi dan dites. Sekarang lanjut ke halaman-halamannya.

## Update `settingsSchema` — bersihkan field yang sudah pindah

```ts
// src/lib/schemas/settings.ts

import { z } from 'zod';

export const settingsSchema = z.object({
  storeName: z.string().trim().min(1, 'Nama toko wajib diisi').max(100),
  instagram: z.string().trim().max(100).optional().or(z.literal('')),
  twitter: z.string().trim().max(100).optional().or(z.literal('')),
  emailFromName: z.string().trim().max(100).optional().or(z.literal('')),
  paymentNote: z.string().trim().max(1000).optional().or(z.literal(''))
});

export type SettingsInput = z.infer<typeof settingsSchema>;
```

## 1. `/admin/settings` — dibersihkan, cuma info toko

```ts
// src/routes/admin/settings/+page.server.ts

import { fail } from '@sveltejs/kit';
import { settingsSchema } from '$lib/schemas/settings';
import { getSettings, updateSettings } from '$lib/server/db/queries/settings';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const settings = await getSettings();
  return { settings };
};

export const actions: Actions = {
  update: async ({ request }) => {
    const formData = await request.formData();

    const parsed = settingsSchema.safeParse({
      storeName: formData.get('storeName'),
      instagram: formData.get('instagram'),
      twitter: formData.get('twitter'),
      emailFromName: formData.get('emailFromName'),
      paymentNote: formData.get('paymentNote')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    try {
      await updateSettings(parsed.data);
      return { success: true };
    } catch (err) {
      logger.error('settings.update-failed', { error: err });
      return fail(500, { error: 'Gagal menyimpan pengaturan.' });
    }
  }
};
```

```ts
// update lib/server/db/queries/settings.ts — hapus qrisUrl dari signature

import { db } from '$lib/server/db';
import { storeSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { SettingsInput } from '$lib/schemas/settings';

export async function getSettings() {
  return db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 1) }) ?? null;
}

export async function updateSettings(input: SettingsInput) {
  const [row] = await db
    .update(storeSettings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(storeSettings.id, 1))
    .returning();
  return row;
}
```

```svelte
<!-- src/routes/admin/settings/+page.svelte -->
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
```

## 2. `/admin/settings/payment-methods`

```ts
// src/routes/admin/settings/payment-methods/+page.server.ts

import { fail } from '@sveltejs/kit';
import { paymentMethodSchema } from '$lib/schemas/payment-method';
import {
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  reorderPaymentMethod
} from '$lib/server/db/queries/payment-method';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const methods = await listPaymentMethods();
  return { methods };
};

function parseForm(formData: FormData) {
  return paymentMethodSchema.safeParse({
    type: formData.get('type'),
    label: formData.get('label'),
    accountNumber: formData.get('accountNumber'),
    accountHolder: formData.get('accountHolder'),
    note: formData.get('note'),
    active: formData.get('active') === 'on',
    sortOrder: formData.get('sortOrder')
  });
}

export const actions: Actions = {
  create: async ({ request }) => {
    const parsed = parseForm(await request.formData());
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    try {
      await createPaymentMethod(parsed.data);
      return { success: true };
    } catch (err) {
      logger.error('payment-method.create-failed', { error: err });
      return fail(500, { error: 'Gagal menyimpan metode pembayaran.' });
    }
  },

  update: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');
    if (typeof id !== 'string') return fail(400, { error: 'ID tidak valid.' });

    const parsed = parseForm(formData);
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    try {
      await updatePaymentMethod(id, parsed.data);
      return { success: true };
    } catch (err) {
      logger.error('payment-method.update-failed', { error: err, id });
      return fail(500, { error: 'Gagal memperbarui metode pembayaran.' });
    }
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');
    if (typeof id !== 'string') return fail(400, { error: 'ID tidak valid.' });

    try {
      await deletePaymentMethod(id);
      return { success: true };
    } catch (err) {
      logger.error('payment-method.delete-failed', { error: err, id });
      return fail(500, { error: 'Gagal menghapus metode pembayaran.' });
    }
  },

  reorder: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');
    const direction = formData.get('direction');

    if (typeof id !== 'string' || (direction !== 'up' && direction !== 'down')) {
      return fail(400, { error: 'Data reorder tidak valid.' });
    }

    try {
      await reorderPaymentMethod(id, direction);
      return { success: true };
    } catch (err) {
      logger.error('payment-method.reorder-failed', { error: err, id });
      return fail(500, { error: 'Gagal mengubah urutan.' });
    }
  }
};
```

```svelte
<!-- src/routes/admin/settings/payment-methods/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { handleFormResult } from '$lib/utils/handle-form-result';
  import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
  import { resolve } from '$app/paths';
  import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, ArrowLeft } from '@lucide/svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let showCreateForm = $state(false);
  let editingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);
  let isBusy = $state(false);
  let processingId = $state<string | null>(null);
</script>

<div class="mx-auto max-w-2xl space-y-6">
  <div class="flex items-center gap-2">
    <a href={resolve('/admin/settings')} class="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10">
      <ArrowLeft size={16} />
    </a>
    <h1 class="text-xl font-semibold">Bank / Virtual Account</h1>
  </div>

  <button
    onclick={() => (showCreateForm = !showCreateForm)}
    disabled={isBusy}
    class="flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white
           hover:bg-neutral-800 disabled:opacity-50
           dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
  >
    <Plus size={16} />
    Metode Baru
  </button>

  {#if showCreateForm}
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        isBusy = true;
        return async ({ result, update }) => {
          handleFormResult(result, { success: 'Metode pembayaran berhasil ditambahkan.' });
          if (result.type === 'success') showCreateForm = false;
          await update({ reset: result.type === 'success' });
          isBusy = false;
        };
      }}
      class="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <input type="hidden" name="sortOrder" value={data.methods.length} />

      <div>
        <label for="type" class="block text-sm font-medium">Jenis</label>
        <select
          id="type"
          name="type"
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="bank">Bank</option>
          <option value="va">Virtual Account</option>
          <option value="other">Lainnya</option>
        </select>
      </div>

      <div>
        <label for="label" class="block text-sm font-medium">Label</label>
        <input
          id="label"
          name="label"
          placeholder="BCA, Mandiri, OVO, dst."
          required
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </div>

      <div>
        <label for="accountNumber" class="block text-sm font-medium">Nomor Rekening / VA</label>
        <input
          id="accountNumber"
          name="accountNumber"
          required
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      <div>
        <label for="accountHolder" class="block text-sm font-medium">Atas Nama</label>
        <input
          id="accountHolder"
          name="accountHolder"
          required
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      <div>
        <label for="note" class="block text-sm font-medium">Catatan (opsional)</label>
        <input
          id="note"
          name="note"
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" checked disabled={isBusy} />
        Aktif (tampil di invoice)
      </label>

      <div class="flex gap-2">
        <button
          type="submit"
          disabled={isBusy}
          class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {isBusy ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button
          type="button"
          disabled={isBusy}
          onclick={() => (showCreateForm = false)}
          class="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
        >
          Batal
        </button>
      </div>
    </form>
  {/if}

  <div class="space-y-2">
    {#if data.methods.length === 0}
      <p class="py-8 text-center text-sm text-neutral-500">Belum ada metode pembayaran.</p>
    {:else}
      {#each data.methods as method, index (method.id)}
        <BusyOverlay active={processingId === method.id}>
          <div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            {#if editingId === method.id}
              <form
                method="POST"
                action="?/update"
                use:enhance={() => {
                  isBusy = true;
                  processingId = method.id;
                  return async ({ result, update }) => {
                    handleFormResult(result, { success: 'Metode pembayaran berhasil diperbarui.' });
                    if (result.type === 'success') editingId = null;
                    await update();
                    isBusy = false;
                    processingId = null;
                  };
                }}
                class="space-y-3"
              >
                <input type="hidden" name="id" value={method.id} />
                <input type="hidden" name="sortOrder" value={method.sortOrder} />

                <div>
                  <label for="edit-type-{method.id}" class="block text-sm font-medium">Jenis</label>
                  <select
                    id="edit-type-{method.id}"
                    name="type"
                    value={method.type}
                    disabled={isBusy}
                    class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                           disabled:opacity-50
                           dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    <option value="bank">Bank</option>
                    <option value="va">Virtual Account</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label for="edit-label-{method.id}" class="block text-sm font-medium">Label</label>
                  <input
                    id="edit-label-{method.id}"
                    name="label"
                    value={method.label}
                    required
                    disabled={isBusy}
                    class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                           disabled:opacity-50
                           dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label for="edit-account-{method.id}" class="block text-sm font-medium">Nomor Rekening / VA</label>
                  <input
                    id="edit-account-{method.id}"
                    name="accountNumber"
                    value={method.accountNumber}
                    required
                    disabled={isBusy}
                    class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                           disabled:opacity-50
                           dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label for="edit-holder-{method.id}" class="block text-sm font-medium">Atas Nama</label>
                  <input
                    id="edit-holder-{method.id}"
                    name="accountHolder"
                    value={method.accountHolder}
                    required
                    disabled={isBusy}
                    class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                           disabled:opacity-50
                           dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label for="edit-note-{method.id}" class="block text-sm font-medium">Catatan (opsional)</label>
                  <input
                    id="edit-note-{method.id}"
                    name="note"
                    value={method.note ?? ''}
                    disabled={isBusy}
                    class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                           disabled:opacity-50
                           dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="active" checked={method.active} disabled={isBusy} />
                  Aktif (tampil di invoice)
                </label>

                <div class="flex gap-2">
                  <button
                    type="submit"
                    disabled={isBusy}
                    class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                  >
                    {isBusy ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onclick={() => (editingId = null)}
                    class="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
                  >
                    Batal
                  </button>
                </div>
              </form>
            {:else}
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">
                    {method.label}
                    {#if !method.active}
                      <span class="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                        Nonaktif
                      </span>
                    {/if}
                  </p>
                  <p class="text-xs text-neutral-500">{method.accountNumber} a.n. {method.accountHolder}</p>
                </div>

                <div class="flex items-center gap-1">
                  <form
                    method="POST"
                    action="?/reorder"
                    use:enhance={() => {
                      isBusy = true;
                      processingId = method.id;
                      return async ({ result, update }) => {
                        handleFormResult(result, { success: 'Urutan berhasil diubah.' });
                        await update();
                        isBusy = false;
                        processingId = null;
                      };
                    }}
                  >
                    <input type="hidden" name="id" value={method.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      disabled={isBusy || index === 0}
                      class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                    >
                      <ChevronUp size={16} />
                    </button>
                  </form>

                  <form
                    method="POST"
                    action="?/reorder"
                    use:enhance={() => {
                      isBusy = true;
                      processingId = method.id;
                      return async ({ result, update }) => {
                        handleFormResult(result, { success: 'Urutan berhasil diubah.' });
                        await update();
                        isBusy = false;
                        processingId = null;
                      };
                    }}
                  >
                    <input type="hidden" name="id" value={method.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={isBusy || index === data.methods.length - 1}
                      class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </form>

                  <button
                    onclick={() => (editingId = method.id)}
                    disabled={isBusy}
                    class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onclick={() => (deletingId = method.id)}
                    disabled={isBusy}
                    class="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {#if deletingId === method.id}
                <div class="mt-3 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20">
                  <span>Hapus "{method.label}"?</span>
                  <div class="flex gap-2">
                    <form
                      method="POST"
                      action="?/delete"
                      use:enhance={() => {
                        isBusy = true;
                        processingId = method.id;
                        return async ({ result, update }) => {
                          handleFormResult(result, { success: 'Metode pembayaran berhasil dihapus.' });
                          if (result.type === 'success') deletingId = null;
                          await update();
                          isBusy = false;
                          processingId = null;
                        };
                      }}
                    >
                      <input type="hidden" name="id" value={method.id} />
                      <button type="submit" disabled={isBusy} class="rounded bg-red-600 px-3 py-1.5 text-white disabled:opacity-50">
                        {isBusy ? 'Menghapus...' : 'Ya, Hapus'}
                      </button>
                    </form>
                    <button
                      onclick={() => (deletingId = null)}
                      disabled={isBusy}
                      class="rounded border border-neutral-300 px-3 py-1.5 disabled:opacity-50 dark:border-neutral-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              {/if}
            {/if}
          </div>
        </BusyOverlay>
      {/each}
    {/if}
  </div>
</div>
```

---

Ini sudah cukup panjang untuk satu giliran. Halaman `/admin/settings/qris` (dengan upload file, mirip pola form settings versi lama tapi sekarang list multi-item) akan aku kirim di respons berikutnya supaya tidak terlalu padat sekaligus.

Coba pasang dulu bagian ini (`/admin/settings` yang dibersihkan + `/admin/settings/payment-methods` lengkap), jalankan `npm run db:push` kalau belum, tes CRUD payment methods. Kabari hasilnya, baru lanjut ke halaman QRIS.
