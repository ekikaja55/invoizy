
import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

export function handleSessionExpired() {
  toast.error('Sesi kamu sudah habis. Silakan login ulang.');
  setTimeout(() => goto(resolve('/login')), 1500);
}
