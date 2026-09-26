import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { ActionResult } from '@sveltejs/kit';

interface Messages {
  success?: string;
  failure?: string;
}

export function handleFormResult(result: ActionResult, messages: Messages = {}) {
  if (result.type === 'failure' && result.status === 401) {
    toast.error('Sesi kamu sudah habis. Silakan login ulang.');
    setTimeout(() => goto(resolve('/login')), 1500);
    return;
  }

  if (result.type === 'success') {
    toast.success(messages.success ?? 'Berhasil disimpan.');
    return;
  }

  if (result.type === 'failure') {
    const serverMessage = typeof result.data?.error === 'string' ? result.data.error : undefined;
    toast.error(serverMessage ?? messages.failure ?? 'Gagal menyimpan data.');
    return;
  }

  if (result.type === 'error') {
    toast.error('Terjadi kesalahan tak terduga.');
  }
}