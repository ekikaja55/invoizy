
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const MAX_QRIS_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_QRIS_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function validateQrisFile(file: File): string | null {
  if (file.size === 0) return 'File QRIS wajib diunggah.';
  if (file.size > MAX_QRIS_SIZE_BYTES) {
    return 'Ukuran file QRIS maksimal 2MB.';
  }
  if (!ALLOWED_QRIS_TYPES.includes(file.type)) {
    return 'Format file harus PNG, JPEG, atau WebP.';
  }
  return null;
}

export async function uploadQrisImage(file: File): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `qris-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from('qris')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    throw new Error(`Gagal upload QRIS: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from('qris').getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteQrisImage(path: string) {
  await supabaseAdmin.storage.from('qris').remove([path]);
}