
// -----------------------------------------------------------------
// Penjelasan keputusan penting
// 1. priceInt bertipe integer, bukan numeric/decimal. Rupiah tidak punya pecahan sen,
// jadi integer paling aman — tidak ada risiko floating point error sama sekali.
// 2. invoiceStatus dan paymentStatus pakai pgEnum, bukan text bebas.
// Ini mencegah typo status di kode("SENTT" tidak akan lolos compile).
// Kalau nanti butuh status baru, tinggal tambah ke enum array dan generate migration.
// 3. productId di order_items nullable dengan onDelete: 'set null' — kalau admin hapus produk,
// histori order lama tidak ikut hilang / rusak, karena datanya sudah di - snapshot di kolom * Snapshot.
// Referensi ke productId cuma untuk kebutuhan "lihat produk asli" kalau masih ada, bukan sumber kebenaran invoice.
// 4. categories → onDelete: 'cascade' ke products, tapi products → orderItems tidak cascade (lewat set null).
// Sengaja beda: hapus kategori memang seharusnya ikut hapus produk di dalamnya(keputusan admin yang jelas),
// tapi hapus / ubah produk tidak boleh merusak histori transaksi yang sudah terjadi.
// 5. storeSettings.id dikunci default 1 — trik sederhana supaya cuma ada 1 baris. Query upsert nanti
// tinggal selalu target id = 1, tidak perlu tabel config key - value seperti Apps Script lama.
// 6. accessToken unique dan terpisah dari orderId. orderId (5 karakter) boleh gampang
// diingat / ditulis manual oleh admin, tapi tidak dipakai sebagai kunci akses karena terlalu
// mudah ditebak(36 ^ 5 kombinasi saja).accessToken yang jadi gerbang ke / invoice / [orderId] ? token =....
// ------------------------------------------------------------------

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
  bankName: text('bank_name'),
  bankAccountNumber: text('bank_account_number'),
  bankAccountHolder: text('bank_account_holder'),
  vaInfo: text('va_info'),
  paymentNote: text('payment_note'),

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
