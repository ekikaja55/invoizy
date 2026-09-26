NOTE FASE 2 PART 3

Oke, ini yang paling berbeda dari dua CRUD sebelumnya — bukan list multi-row, tapi **satu form besar** untuk baris singleton (`id = 1`), plus ada bagian **upload file** yang perlu ditangani khusus.

## Keputusan desain sebelum nulis kode

**1. Update settings — pakai action tunggal, bukan create/edit/delete**
Karena cuma ada 1 baris (`store_settings.id = 1`), tidak perlu skema CRUD penuh — cukup satu action `update` yang selalu target `id = 1`.

**2. Upload QRIS — validasi di server, bukan cuma bucket policy**
Sesuai yang sudah kita bahas di awal (Fase 0): validasi `file.size` dan `file.type` eksplisit di server action sebelum upload ke Supabase Storage.

**3. Preview gambar QRIS yang sudah ada**
Kalau `qrisUrl` sudah terisi, tampilkan preview-nya di form, supaya admin tahu QRIS mana yang aktif sebelum ganti.

---

## 1. Setup Supabase Storage client

```ts
// src/lib/server/storage/supabase.ts

import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const MAX_QRIS_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_QRIS_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function validateQrisFile(file: File): string | null {
  if (file.size === 0) return null; // tidak ada file dipilih, bukan error
  if (file.size > MAX_QRIS_SIZE_BYTES) {
    return 'Ukuran file QRIS maksimal 2MB.';
  }
  if (!ALLOWED_QRIS_TYPES.includes(file.type)) {
    return 'Format file harus PNG, JPEG, atau WebP.';
  }
  return null;
}

export async function uploadQrisImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `qris-${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from('qris')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    throw new Error(`Gagal upload QRIS: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from('qris').getPublicUrl(path);
  return data.publicUrl;
}
```

Perlu install client Supabase kalau belum:

```bash
npm install @supabase/supabase-js
```

## 2. Query helper settings

```ts
// src/lib/server/db/queries/settings.ts

import { db } from '$lib/server/db';
import { storeSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { SettingsInput } from '$lib/schemas/settings';

export async function getSettings() {
  const row = await db.query.storeSettings.findFirst({
    where: eq(storeSettings.id, 1)
  });
  return row ?? null;
}

export async function updateSettings(input: SettingsInput & { qrisUrl?: string }) {
  const [row] = await db
    .update(storeSettings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(storeSettings.id, 1))
    .returning();
  return row;
}
```

## 3. `+page.server.ts`

```ts
// src/routes/admin/settings/+page.server.ts

import { fail } from '@sveltejs/kit';
import { settingsSchema } from '$lib/schemas/settings';
import { getSettings, updateSettings } from '$lib/server/db/queries/settings';
import { validateQrisFile, uploadQrisImage } from '$lib/server/storage/supabase';
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
      bankName: formData.get('bankName'),
      bankAccountNumber: formData.get('bankAccountNumber'),
      bankAccountHolder: formData.get('bankAccountHolder'),
      vaInfo: formData.get('vaInfo'),
      paymentNote: formData.get('paymentNote')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    const qrisFile = formData.get('qrisFile');
    let qrisUrl: string | undefined;

    if (qrisFile instanceof File && qrisFile.size > 0) {
      const validationError = validateQrisFile(qrisFile);
      if (validationError) {
        return fail(400, { error: validationError });
      }

      try {
        qrisUrl = await uploadQrisImage(qrisFile);
      } catch (err) {
        logger.error('settings.qris-upload-failed', { error: err });
        return fail(500, { error: 'Gagal mengunggah QRIS.' });
      }
    }

    try {
      await updateSettings({ ...parsed.data, ...(qrisUrl && { qrisUrl }) });
      return { success: true };
    } catch (err) {
      logger.error('settings.update-failed', { error: err });
      return fail(500, { error: 'Gagal menyimpan pengaturan.' });
    }
  }
};
```

Catatan penting: `qrisUrl` cuma di-update **kalau ada file baru diupload**. Kalau admin cuma ubah nama toko tanpa ganti QRIS, `qrisUrl` yang lama tetap dipertahankan (tidak ke-overwrite jadi kosong).

## 4. `+page.svelte`

```svelte
<!-- src/routes/admin/settings/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { handleFormResult } from '$lib/utils/handle-form-result';
  import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let isBusy = $state(false);
  let qrisPreview = $state<string | null>(data.settings?.qrisUrl ?? null);

  function handleQrisChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      qrisPreview = URL.createObjectURL(file);
    }
  }
</script>

<div class="mx-auto max-w-2xl space-y-6">
  <h1 class="text-xl font-semibold">Settings</h1>

  <BusyOverlay active={isBusy}>
    <form
      method="POST"
      action="?/update"
      enctype="multipart/form-data"
      use:enhance={() => {
        isBusy = true;
        return async ({ result, update }) => {
          handleFormResult(result, { success: 'Pengaturan berhasil disimpan.' });
          await update();
          isBusy = false;
        };
      }}
      class="space-y-6"
    >
      <section class="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 class="font-medium">Informasi Toko</h2>

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
      </section>

      <section class="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 class="font-medium">QRIS</h2>

        {#if qrisPreview}
          <img src={qrisPreview} alt="QRIS" class="h-40 w-40 rounded-lg border border-neutral-200 object-contain dark:border-neutral-800" />
        {/if}

        <div>
          <label for="qrisFile" class="block text-sm font-medium">
            {qrisPreview ? 'Ganti QRIS' : 'Upload QRIS'}
          </label>
          <input
            id="qrisFile"
            name="qrisFile"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onchange={handleQrisChange}
            disabled={isBusy}
            class="mt-1 w-full text-sm disabled:opacity-50"
          />
          <p class="mt-1 text-xs text-neutral-500">PNG, JPEG, atau WebP. Maksimal 2MB.</p>
        </div>
      </section>

      <section class="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 class="font-medium">Info Pembayaran Lain</h2>

        <div>
          <label for="bankName" class="block text-sm font-medium">Nama Bank</label>
          <input
            id="bankName"
            name="bankName"
            value={data.settings?.bankName ?? ''}
            placeholder="BCA, Mandiri, dll."
            disabled={isBusy}
            class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                   placeholder:text-neutral-400 disabled:opacity-50
                   dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>

        <div>
          <label for="bankAccountNumber" class="block text-sm font-medium">Nomor Rekening</label>
          <input
            id="bankAccountNumber"
            name="bankAccountNumber"
            value={data.settings?.bankAccountNumber ?? ''}
            disabled={isBusy}
            class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                   disabled:opacity-50
                   dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div>
          <label for="bankAccountHolder" class="block text-sm font-medium">Atas Nama</label>
          <input
            id="bankAccountHolder"
            name="bankAccountHolder"
            value={data.settings?.bankAccountHolder ?? ''}
            disabled={isBusy}
            class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                   disabled:opacity-50
                   dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div>
          <label for="vaInfo" class="block text-sm font-medium">Info Virtual Account (opsional)</label>
          <input
            id="vaInfo"
            name="vaInfo"
            value={data.settings?.vaInfo ?? ''}
            placeholder="Contoh: VA BCA 12345-xxxxxxxxxx"
            disabled={isBusy}
            class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                   placeholder:text-neutral-400 disabled:opacity-50
                   dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>

        <div>
          <label for="paymentNote" class="block text-sm font-medium">Catatan Pembayaran</label>
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
      </section>

      <button
        type="submit"
        disabled={isBusy}
        class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {isBusy ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </form>
  </BusyOverlay>
</div>
```

## Catatan penting yang perlu diperhatikan

**1. `enctype="multipart/form-data"` wajib ada** — tanpa ini, file upload tidak akan terkirim sama sekali ke server action, form cuma kirim data teks biasa.

**2. `textarea` pakai `{data.settings?.paymentNote ?? ''}` sebagai children, bukan `value=`** — ini spesifik HTML: `<textarea>` tidak punya atribut `value`, isinya harus diletakkan sebagai konten di antara tag pembuka-penutup.

**3. Env yang perlu dicek** — pastikan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah ada di `.env` (sudah kamu ambil sebelumnya di Fase 0), dan **juga sudah diisi di Environment Variables Vercel** untuk production.

**4. Baris `store_settings` harus sudah ada dari seed** — karena `updateSettings` pakai `.where(eq(storeSettings.id, 1))`, kalau baris `id=1` belum ada sama sekali (misal seed belum pernah jalan), `update()` tidak akan insert baris baru, cuma diam tidak melakukan apa-apa. Tapi karena kita sudah jalankan `npm run db:seed` di Fase 0 yang insert `storeSettings` dengan `id: 1`, ini harusnya aman — kalau nanti ternyata `data.settings` tampil `null` di halaman ini, itu tandanya baris seed belum ada dan perlu dicek ulang.

Coba jalankan, isi form, upload QRIS test, submit — cek di Supabase Storage bucket `qris` apakah file benar-benar masuk, dan cek tabel `store_settings` apakah `qrisUrl` terisi URL publik yang valid. Kabari hasilnya.

