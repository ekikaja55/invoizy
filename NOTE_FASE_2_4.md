NOTE FASE 2 PART 4

Oke, revisi schema. Ini perubahannya di `schema.ts`:

## 1. Hapus 4 kolom lama dari `storeSettings`, tambah tabel `paymentMethods`

```ts
// src/lib/server/db/schema.ts

import { pgTable, text, integer, boolean, timestamp, pgEnum, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'PENDING',
  'GENERATING',
  'SENT',
  'FAILED'
]);

export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'CONFIRMED', 'CANCELLED']);

export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['bank', 'va', 'other']);

// ─────────────────────────────────────────────
// STORE SETTINGS (singleton — selalu 1 baris)
// ─────────────────────────────────────────────

export const storeSettings = pgTable('store_settings', {
  id: integer('id').primaryKey().default(1),
  storeName: text('store_name').notNull().default(''),
  instagram: text('instagram').notNull().default(''),
  twitter: text('twitter').notNull().default(''),
  emailFromName: text('email_from_name').notNull().default(''),

  qrisUrl: text('qris_url'),
  paymentNote: text('payment_note'), // catatan umum, tetap di sini karena sifatnya global

  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// ─────────────────────────────────────────────
// PAYMENT METHODS — banyak metode, tiap metode bebas nama/nomor/pemilik sendiri
// ─────────────────────────────────────────────

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),

  type: paymentMethodTypeEnum('type').notNull(),
  label: text('label').notNull(), // "BCA", "Mandiri", "OVO", "DANA", dst
  accountNumber: text('account_number').notNull(), // no rekening / no VA
  accountHolder: text('account_holder').notNull(), // atas nama
  note: text('note'), // catatan khusus metode ini, opsional

  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products)
}));

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  priceInt: integer('price_int').notNull(),

  trackStock: boolean('track_stock').notNull().default(false),
  stock: integer('stock').notNull().default(0),

  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  orderItems: many(orderItems)
}));

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),

  orderId: text('order_id').notNull().unique(),
  accessToken: text('access_token').notNull().unique(),

  handle: text('handle').notNull(),
  email: text('email').notNull(),
  note: text('note').notNull().default(''),

  subtotal: integer('subtotal').notNull(),
  total: integer('total').notNull(),

  invoiceStatus: invoiceStatusEnum('invoice_status').notNull().default('PENDING'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('PENDING'),

  invoiceUrl: text('invoice_url'),
  pdfFilePath: text('pdf_file_path'),
  error: text('error'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems)
}));

// ─────────────────────────────────────────────
// ORDER ITEMS
// ─────────────────────────────────────────────

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),

  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),

  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),

  categorySnapshot: text('category_snapshot').notNull(),
  nameSnapshot: text('name_snapshot').notNull(),
  priceSnapshot: integer('price_snapshot').notNull(),

  qty: integer('qty').notNull(),
  subtotal: integer('subtotal').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));

// ─────────────────────────────────────────────
// AUTH (generated by Better Auth — jangan diedit di sini)
// ─────────────────────────────────────────────

export * from './auth.schema';
```

## Push perubahan

```bash
npm run db:push
```

Drizzle akan mendeteksi 4 kolom (`bankName`, `bankAccountNumber`, `bankAccountHolder`, `vaInfo`) hilang dari `storeSettings` dan tabel baru `paymentMethods` perlu dibuat. Kemungkinan besar akan muncul prompt konfirmasi di terminal (karena drop kolom itu operasi destruktif) — karena data lama di 4 kolom itu memang mau dibuang (digantikan struktur baru), aman untuk dikonfirmasi ya/lanjutkan.

## Update `lib/schemas/settings.ts` — hapus field yang sudah pindah

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

## Skema baru — `lib/schemas/payment-method.ts`

```ts
// src/lib/schemas/payment-method.ts

import { z } from 'zod';

export const paymentMethodSchema = z.object({
  type: z.enum(['bank', 'va', 'other']),
  label: z.string().trim().min(1, 'Label wajib diisi').max(100),
  accountNumber: z.string().trim().min(1, 'Nomor rekening/VA wajib diisi').max(100),
  accountHolder: z.string().trim().min(1, 'Nama pemilik wajib diisi').max(100),
  note: z.string().trim().max(255).optional().or(z.literal('')),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
```

## Query helper baru

```ts
// src/lib/server/db/queries/payment-method.ts

import { db } from '$lib/server/db';
import { paymentMethods } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { PaymentMethodInput } from '$lib/schemas/payment-method';

export async function listPaymentMethods() {
  return db.query.paymentMethods.findMany({
    orderBy: [asc(paymentMethods.sortOrder)]
  });
}

export async function createPaymentMethod(input: PaymentMethodInput) {
  const [row] = await db.insert(paymentMethods).values(input).returning();
  return row;
}

export async function updatePaymentMethod(id: string, input: PaymentMethodInput) {
  const [row] = await db
    .update(paymentMethods)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(paymentMethods.id, id))
    .returning();
  return row;
}

export async function deletePaymentMethod(id: string) {
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
}

export async function reorderPaymentMethod(id: string, direction: 'up' | 'down') {
  const all = await db.query.paymentMethods.findMany({ orderBy: [asc(paymentMethods.sortOrder)] });
  const index = all.findIndex((p) => p.id === id);
  if (index === -1) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= all.length) return;

  const current = all[index];
  const swapWith = all[swapIndex];

  await db.transaction(async (tx) => {
    await tx.update(paymentMethods).set({ sortOrder: swapWith.sortOrder }).where(eq(paymentMethods.id, current.id));
    await tx.update(paymentMethods).set({ sortOrder: current.sortOrder }).where(eq(paymentMethods.id, swapWith.id));
  });
}
```

---

Ini kerangka skema dan query-nya. Sebelum aku tulis `+page.server.ts` dan `+page.svelte` untuk halaman payment methods (yang polanya identik dengan categories — list + create + edit + delete + reorder + toggle active), satu keputusan kecil:

**Mau ditaruh di mana halamannya?**

- **Opsi 1**: `/admin/settings/payment-methods` — sub-halaman terpisah dari settings utama, perlu breadcrumb/link balik
- **Opsi 2**: Tetap satu halaman `/admin/settings`, tapi bagian pembayaran jadi section list terpisah (mirip pola accordion products, cuma tanpa kategori)

Mana yang kamu lebih suka?

Oke, ini perubahan besar tapi konsepnya sama — QRIS juga jadi entitas berulang seperti bank/VA, bukan kolom tunggal di `store_settings`. Mari dirapikan strukturnya dulu sebelum nulis kode.

## Keputusan desain

**QRIS itu sebenarnya bentuk "metode pembayaran" juga** (visual/gambar, bukan nomor rekening) — jadi ada dua pilihan:

**Opsi A** — QRIS jadi bagian dari `paymentMethods` juga (`type: 'qris'`, field `imageUrl` menggantikan `accountNumber`/`accountHolder` untuk tipe ini)
**Opsi B** — QRIS jadi tabel terpisah (`qris_codes`), independen dari `payment_methods`

Aku sarankan **Opsi B — tabel terpisah**. Alasannya: QRIS secara struktur data beda signifikan dari bank/VA (dia butuh field `imageUrl`, bukan `accountNumber`/`accountHolder`), memaksakan jadi satu tabel dengan kolom nullable campur-campur (`accountNumber` nullable untuk QRIS, `imageUrl` nullable untuk bank/VA) bikin skema kotor dan query harus selalu hati-hati field mana yang relevan untuk tipe apa. Tabel terpisah lebih bersih dan lebih gampang di-maintain jangka panjang.

## Revisi schema

```ts
// tambahkan ke src/lib/server/db/schema.ts, setelah paymentMethods

export const qrisCodes = pgTable('qris_codes', {
  id: uuid('id').primaryKey().defaultRandom(),

  label: text('label').notNull(), // "QRIS Statis Toko", "QRIS Shopee", dst — bebas ditulis admin
  imageUrl: text('image_url').notNull(), // url publik di Supabase Storage bucket "qris"
  imagePath: text('image_path').notNull(), // path internal di bucket, untuk keperluan hapus/ganti file

  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
```

Hapus `qrisUrl` dari `storeSettings` sepenuhnya (sudah tidak relevan lagi karena sekarang bisa banyak QRIS):

```ts
export const storeSettings = pgTable('store_settings', {
  id: integer('id').primaryKey().default(1),
  storeName: text('store_name').notNull().default(''),
  instagram: text('instagram').notNull().default(''),
  twitter: text('twitter').notNull().default(''),
  emailFromName: text('email_from_name').notNull().default(''),
  paymentNote: text('payment_note'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
```

Jalankan setelah revisi:

```bash
npm run db:push
```

## Struktur halaman final

```
/admin/settings              → info toko + payment note saja (form sederhana, sudah ada, tinggal dibersihkan dari field QRIS)
/admin/settings/payment-methods  → CRUD bank/VA/other
/admin/settings/qris          → CRUD gambar QRIS (bisa lebih dari satu)
```

Dengan struktur ini, `/admin/settings` jadi halaman kecil murni info toko, dan dua sub-halaman lain fokus masing-masing.

## Update storage helper — generalisasi untuk multi-QRIS

```ts
// src/lib/server/storage/supabase.ts

import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const MAX_QRIS_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_QRIS_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function validateQrisFile(file: File): string | null {
  if (file.size === 0) return 'File QRIS wajib diunggah.';
  if (file.size > MAX_QRIS_SIZE_BYTES) return 'Ukuran file QRIS maksimal 2MB.';
  if (!ALLOWED_QRIS_TYPES.includes(file.type)) return 'Format file harus PNG, JPEG, atau WebP.';
  return null;
}

export async function uploadQrisImage(file: File): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `qris-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from('qris')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Gagal upload QRIS: ${error.message}`);

  const { data } = supabaseAdmin.storage.from('qris').getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteQrisImage(path: string) {
  await supabaseAdmin.storage.from('qris').remove([path]);
}
```

Catatan penting: sekarang **file random suffix** (bukan cuma timestamp) supaya beberapa upload di detik yang sama tidak saling timpa, dan menyimpan `path` (bukan cuma `url`) supaya kita bisa **hapus file lama dari Storage** saat QRIS dihapus dari database — kalau cuma simpan URL, file lama akan jadi sampah tak terpakai selamanya di bucket.

## Query helper QRIS

```ts
// src/lib/server/db/queries/qris.ts

import { db } from '$lib/server/db';
import { qrisCodes } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function listQrisCodes() {
  return db.query.qrisCodes.findMany({ orderBy: [asc(qrisCodes.sortOrder)] });
}

export async function createQrisCode(input: { label: string; imageUrl: string; imagePath: string; sortOrder: number }) {
  const [row] = await db.insert(qrisCodes).values(input).returning();
  return row;
}

export async function updateQrisLabel(id: string, label: string, active: boolean) {
  const [row] = await db
    .update(qrisCodes)
    .set({ label, active, updatedAt: new Date() })
    .where(eq(qrisCodes.id, id))
    .returning();
  return row;
}

export async function getQrisCode(id: string) {
  return db.query.qrisCodes.findFirst({ where: eq(qrisCodes.id, id) });
}

export async function deleteQrisCode(id: string) {
  await db.delete(qrisCodes).where(eq(qrisCodes.id, id));
}

export async function reorderQrisCode(id: string, direction: 'up' | 'down') {
  const all = await db.query.qrisCodes.findMany({ orderBy: [asc(qrisCodes.sortOrder)] });
  const index = all.findIndex((q) => q.id === id);
  if (index === -1) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= all.length) return;

  const current = all[index];
  const swapWith = all[swapIndex];

  await db.transaction(async (tx) => {
    await tx.update(qrisCodes).set({ sortOrder: swapWith.sortOrder }).where(eq(qrisCodes.id, current.id));
    await tx.update(qrisCodes).set({ sortOrder: current.sortOrder }).where(eq(qrisCodes.id, swapWith.id));
  });
}
```

---

Ini fondasi schema dan query-nya. Sebelum aku lanjut nulis `+page.server.ts` + `+page.svelte` untuk `/admin/settings/payment-methods` dan `/admin/settings/qris` (dua halaman terpisah, masing-masing dengan pola CRUD identik categories/products yang sudah terbukti), ada satu hal perlu diputuskan:

**Untuk edit QRIS — apakah admin bisa ganti gambar file-nya, atau cuma bisa edit label/toggle active (dan kalau mau ganti gambar, hapus lalu upload baru)?**

Aku condong ke opsi kedua (edit cuma untuk label/active, ganti gambar = hapus + upload baru) karena lebih sederhana — tidak perlu logic "hapus file lama dari Storage saat file baru diupload di form edit yang sama". Setuju?
