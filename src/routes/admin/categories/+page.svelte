<!-- src/routes/admin/categories/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { handleFormResult } from '$lib/utils/handle-form-result';
  import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
  import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
  import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X } from '@lucide/svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let showCreateForm = $state(false);
  let editingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  let isBusy = $state(false);

  function startEdit(id: string) {
    editingId = id;
  }

  function cancelEdit() {
    editingId = null;
  }

  function confirmDelete(id: string) {
    deletingId = id;
  }

  function cancelDelete() {
    deletingId = null;
  }
</script>

<div class="mx-auto max-w-2xl space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-semibold">Categories</h1>
    <button
      onclick={() => (showCreateForm = !showCreateForm)}
      disabled={isBusy}
      class="flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white
             hover:bg-neutral-800 disabled:opacity-50
             dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
    >
      <Plus size={16} />
      Kategori Baru
    </button>
  </div>

  {#if showCreateForm}
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        isBusy = true;
        return async ({ result, update }) => {
          handleFormResult(result, { success: 'Kategori berhasil dibuat.' });
          if (result.type === 'success') {
            showCreateForm = false;
          }
          await update({ reset: result.type === 'success' });
          isBusy = false;
        };
      }}
      class="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <div>
        <label for="name" class="block text-sm font-medium">Nama Kategori</label>
        <input
          id="name"
          name="name"
          required
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </div>
      <div>
        <label for="sortOrder" class="block text-sm font-medium">Urutan</label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          value={data.categories.length}
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
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

  {#if !data.categories}
    <ListSkeleton rows={3} />
  {:else}
    <BusyOverlay active={isBusy}>
      <div class="space-y-2">
        {#if data.categories.length === 0}
          <p class="py-8 text-center text-sm text-neutral-500">
            Belum ada kategori. Buat kategori pertama kamu.
          </p>
        {:else}
          {#each data.categories as category, index (category.id)}
            <div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              {#if editingId === category.id}
                <form
                  method="POST"
                  action="?/update"
                  use:enhance={() => {
                    isBusy = true;
                    return async ({ result, update }) => {
                      handleFormResult(result, { success: 'Kategori berhasil diperbarui.' });
                      if (result.type === 'success') {
                        editingId = null;
                      }
                      await update();
                      isBusy = false;
                    };
                  }}
                  class="space-y-3"
                >
                  <input type="hidden" name="id" value={category.id} />
                  <div>
                    <label for="edit-name-{category.id}" class="block text-sm font-medium">
                      Nama Kategori
                    </label>
                    <input
                      id="edit-name-{category.id}"
                      name="name"
                      value={category.name}
                      required
                      disabled={isBusy}
                      class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                             placeholder:text-neutral-400 disabled:opacity-50
                             dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                    />
                  </div>
                  <input type="hidden" name="sortOrder" value={category.sortOrder} />
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
                      onclick={cancelEdit}
                      class="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              {:else}
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">{category.name}</p>
                    <p class="text-xs text-neutral-500">
                      {category.products?.length ?? 0} produk
                    </p>
                  </div>

                  <div class="flex items-center gap-1">
                    <form
                      method="POST"
                      action="?/reorder"
                      use:enhance={() => {
                        isBusy = true;
                        return async ({ result, update }) => {
                          handleFormResult(result, {});
                          await update();
                          isBusy = false;
                        };
                      }}
                    >
                      <input type="hidden" name="id" value={category.id} />
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
                        return async ({ result, update }) => {
                          handleFormResult(result, {});
                          await update();
                          isBusy = false;
                        };
                      }}
                    >
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        disabled={isBusy || index === data.categories.length - 1}
                        class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </form>

                    <button
                      onclick={() => startEdit(category.id)}
                      disabled={isBusy}
                      class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onclick={() => confirmDelete(category.id)}
                      disabled={isBusy}
                      class="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {#if deletingId === category.id}
                  <div class="mt-3 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20">
                    <span>Hapus "{category.name}"? Produk di dalamnya juga akan terhapus.</span>
                    <div class="flex gap-2">
                      <form
                        method="POST"
                        action="?/delete"
                        use:enhance={() => {
                          isBusy = true;
                          return async ({ result, update }) => {
                            handleFormResult(result, { success: 'Kategori berhasil dihapus.' });
                            if (result.type === 'success') {
                              deletingId = null;
                            }
                            await update();
                            isBusy = false;
                          };
                        }}
                      >
                        <input type="hidden" name="id" value={category.id} />
                        <button
                          type="submit"
                          disabled={isBusy}
                          class="rounded bg-red-600 px-3 py-1.5 text-white disabled:opacity-50"
                        >
                          {isBusy ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                      </form>
                      <button
                        onclick={cancelDelete}
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
          {/each}
        {/if}
      </div>
    </BusyOverlay>
  {/if}
</div>
