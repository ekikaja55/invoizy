import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// Singleton pattern saat local dev agar HMR Vite tidak membuat koneksi baru berulang kali.
// prepare: false wajib untuk Supabase transaction pooler (port 6543 / PgBouncer).
const globalClient = globalThis as unknown as { __dbClient?: postgres.Sql };

const client =
	globalClient.__dbClient ??
	postgres(env.DATABASE_URL, {
		prepare: false,
		max: dev ? 3 : 10
	});

if (dev) {
	globalClient.__dbClient = client;
}

export const db = drizzle(client, { schema });

