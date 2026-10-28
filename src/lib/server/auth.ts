import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

const trustedOrigins: string[] = [
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'http://localhost:4173',
	'http://127.0.0.1:4173'
];

if (env.ORIGIN) {
	trustedOrigins.push(env.ORIGIN);
	if (env.ORIGIN.includes('://www.')) {
		trustedOrigins.push(env.ORIGIN.replace('://www.', '://'));
	} else if (env.ORIGIN.includes('://')) {
		trustedOrigins.push(env.ORIGIN.replace('://', '://www.'));
	}
}

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	trustedOrigins,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true },
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
