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
    <h1 class="text-xl font-semibold">QRIS</h1>
  </div>

  <button
    onclick={() => (showCreateForm = !showCreateForm)}
    disabled={isBusy}
    class="flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white
           hover:bg-neutral-800 disabled:opacity-50
           dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
  >
    <Plus size={16} />
    QRIS Baru
  </button>

  {#if showCreateForm}
    <form
      method="POST"
      action="?/create"
      enctype="multipart/form-data"
      use:enhance={() => {
        isBusy = true;
        return async ({ result, update }) => {
          handleFormResult(result, { success: 'QRIS berhasil ditambahkan.' });
          if (result.type === 'success') showCreateForm = false;
          await update({ reset: result.type === 'success' });
          isBusy = false;
        };
      }}
      class="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <div>
        <label for="label" class="block text-sm font-medium">Label</label>
        <input
          id="label"
          name="label"
          placeholder="QRIS Statis Toko, QRIS Shopee, dst."
          required
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </div>

      <div>
        <label for="imageFile" class="block text-sm font-medium">Gambar QRIS</label>
        <input
          id="imageFile"
          name="imageFile"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          disabled={isBusy}
          class="mt-1 w-full text-sm disabled:opacity-50"
        />
        <p class="mt-1 text-xs text-neutral-500">PNG, JPEG, atau WebP. Maksimal 2MB.</p>
      </div>

      <div class="flex gap-2">
        <button
          type="submit"
          disabled={isBusy}
          class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {isBusy ? 'Mengunggah...' : 'Simpan'}
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
    {#if data.codes.length === 0}
      <p class="py-8 text-center text-sm text-neutral-500">Belum ada QRIS.</p>
    {:else}
      {#each data.codes as qris, index (qris.id)}
        <BusyOverlay active={processingId === qris.id}>
          <div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div class="flex items-start gap-4">
              <img
                src={qris.imageUrl}
                alt={qris.label}
                loading="lazy"
                decoding="async"
                class="h-20 w-20 rounded-lg border border-neutral-200 object-contain dark:border-neutral-800"
              />

              <div class="flex-1">
                {#if editingId === qris.id}
                  <form
                    method="POST"
                    action="?/update"
                    use:enhance={() => {
                      isBusy = true;
                      processingId = qris.id;
                      return async ({ result, update }) => {
                        handleFormResult(result, { success: 'QRIS berhasil diperbarui.' });
                        if (result.type === 'success') editingId = null;
                        await update();
                        isBusy = false;
                        processingId = null;
                      };
                    }}
                    class="space-y-2"
                  >
                    <input type="hidden" name="id" value={qris.id} />
                    <input
                      name="label"
                      value={qris.label}
                      required
                      disabled={isBusy}
                      class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                             disabled:opacity-50
                             dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    />
                    <label class="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="active" checked={qris.active} disabled={isBusy} />
                      Aktif
                    </label>
                    <div class="flex gap-2">
                      <button
                        type="submit"
                        disabled={isBusy}
                        class="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onclick={() => (editingId = null)}
                        class="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-700"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                {:else}
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium">
                        {qris.label}
                        {#if !qris.active}
                          <span class="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                            Nonaktif
                          </span>
                        {/if}
                      </p>
                    </div>

                    <div class="flex items-center gap-1">
                      <form
                        method="POST"
                        action="?/reorder"
                        use:enhance={() => {
                          isBusy = true;
                          processingId = qris.id;
                          return async ({ result, update }) => {
                            handleFormResult(result, { success: 'Urutan berhasil diubah.' });
                            await update();
                            isBusy = false;
                            processingId = null;
                          };
                        }}
                      >
                        <input type="hidden" name="id" value={qris.id} />
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
                          processingId = qris.id;
                          return async ({ result, update }) => {
                            handleFormResult(result, { success: 'Urutan berhasil diubah.' });
                            await update();
                            isBusy = false;
                            processingId = null;
                          };
                        }}
                      >
                        <input type="hidden" name="id" value={qris.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={isBusy || index === data.codes.length - 1}
                          class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </form>

                      <button
                        onclick={() => (editingId = qris.id)}
                        disabled={isBusy}
                        class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onclick={() => (deletingId = qris.id)}
                        disabled={isBusy}
                        class="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {#if deletingId === qris.id}
                    <div class="mt-3 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20">
                      <span>Hapus "{qris.label}"?</span>
                      <div class="flex gap-2">
                        <form
                          method="POST"
                          action="?/delete"
                          use:enhance={() => {
                            isBusy = true;
                            processingId = qris.id;
                            return async ({ result, update }) => {
                              handleFormResult(result, { success: 'QRIS berhasil dihapus.' });
                              if (result.type === 'success') deletingId = null;
                              await update();
                              isBusy = false;
                              processingId = null;
                            };
                          }}
                        >
                          <input type="hidden" name="id" value={qris.id} />
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
            </div>
          </div>
        </BusyOverlay>
      {/each}
    {/if}
  </div>
</div>
