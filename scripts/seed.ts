
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/server/db/schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL tidak ditemukan di .env');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log('Seeding Invoizy...\n');

  // ── 1. Store Settings ──
  console.log('→ store_settings');
  await db
    .insert(schema.storeSettings)
    .values({
      id: 1,
      storeName: 'mytokogweh',
      instagram: '@mytokogweh',
      twitter: '@mytokogweh',
      emailFromName: 'mytokogweh',
      qrisUrl: null,
      bankName: null,
      bankAccountNumber: null,
      bankAccountHolder: null,
      vaInfo: null,
      paymentNote: 'Barang yang sudah dibeli tidak dapat ditukar.'
    })
    .onConflictDoNothing({ target: schema.storeSettings.id });

  // ── 2. Categories ──
  console.log('→ categories');
  const [stickerCat, keychainCat, ongkirCat] = await db
    .insert(schema.categories)
    .values([
      { name: 'Sticker', sortOrder: 1 },
      { name: 'Keychain', sortOrder: 2 },
      { name: 'Ongkir', sortOrder: 3 }
    ])
    .returning();

  // ── 3. Products ──
  console.log('→ products');
  await db.insert(schema.products).values([
    // Sticker
    {
      categoryId: stickerCat.id,
      name: 'Gintoki',
      priceInt: 15000,
      trackStock: true,
      stock: 50,
      active: true,
      sortOrder: 1
    },
    {
      categoryId: stickerCat.id,
      name: 'Shin',
      priceInt: 15000,
      trackStock: true,
      stock: 50,
      active: true,
      sortOrder: 2
    },
    {
      categoryId: stickerCat.id,
      name: 'Zura',
      priceInt: 15000,
      trackStock: true,
      stock: 50,
      active: true,
      sortOrder: 3
    },

    // Keychain
    {
      categoryId: keychainCat.id,
      name: 'Gintoki',
      priceInt: 45000,
      trackStock: true,
      stock: 20,
      active: true,
      sortOrder: 1
    },
    {
      categoryId: keychainCat.id,
      name: 'Shin',
      priceInt: 45000,
      trackStock: true,
      stock: 20,
      active: true,
      sortOrder: 2
    },
    {
      categoryId: keychainCat.id,
      name: 'Zura',
      priceInt: 45000,
      trackStock: true,
      stock: 20,
      active: true,
      sortOrder: 3
    },

    // Ongkir — trackStock false karena bukan barang fisik bertumpuk
    {
      categoryId: ongkirCat.id,
      name: 'Paxel Jabodetabek',
      priceInt: 15000,
      trackStock: false,
      stock: 0,
      active: true,
      sortOrder: 1
    },
    {
      categoryId: ongkirCat.id,
      name: 'JNE Jabodetabek',
      priceInt: 11000,
      trackStock: false,
      stock: 0,
      active: true,
      sortOrder: 2
    },
    {
      categoryId: ongkirCat.id,
      name: 'JNE Area Jawa Barat',
      priceInt: 20000,
      trackStock: false,
      stock: 0,
      active: true,
      sortOrder: 3
    },
    {
      categoryId: ongkirCat.id,
      name: 'Checkout Shopee',
      priceInt: 0,
      trackStock: false,
      stock: 0,
      active: true,
      sortOrder: 4
    }
  ]);

  console.log('\nSeed selesai.');
}

main()
  .catch((err) => {
    console.error('Seed gagal:', err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
