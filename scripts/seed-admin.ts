import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
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
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? 'Admin';

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib diisi di .env');
  }

  console.log(` Membuat admin: ${email}`);

  const hashedPassword = await hashPassword(password);
  const userId = randomUUID();
  const accountId = randomUUID();
  const now = new Date();

  await db.insert(schema.user).values({
    id: userId,
    name,
    email,
    emailVerified: true, // admin tunggal, skip flow verifikasi email
    createdAt: now,
    updatedAt: now
  });

  await db.insert(schema.account).values({
    id: accountId,
    accountId: userId, // untuk provider "credential", accountId = userId
    providerId: 'credential',
    userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now
  });

  console.log(' Admin berhasil dibuat:', email);
}

main()
  .catch((err) => {
    console.error(' Gagal membuat admin:', err.message ?? err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
    process.exit(0);
  });
