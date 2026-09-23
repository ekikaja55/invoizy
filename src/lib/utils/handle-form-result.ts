
import { toast } from 'svelte-sonner';
import type { ActionResult } from '@sveltejs/kit';
import { handleSessionExpired } from './session-guard';

export function handleFormResult(
  result: ActionResult,
  messages: { success?: string; failure?: string } = {}
) {
  if (result.type === 'failure' && result.status === 401) {
    handleSessionExpired();
    return;
  }

  if (result.type === 'success') {
    toast.success(messages.success ?? 'Berhasil disimpan.');
  } else if (result.type === 'failure') {
    toast.error(messages.failure ?? 'Gagal menyimpan data.');
  } else if (result.type === 'error') {
    toast.error('Terjadi kesalahan tak terduga.');
  }
}