<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
  import {authClient} from '$lib/auth-client';
  import {toast} from 'svelte-sonner';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);

  async function handleSubmit(e: SubmitEvent) {
      e.preventDefault();
      loading = true;

      const { error: signInError } = await authClient.signIn.email({
        email,
        password
      });

      loading = false;

      if (signInError) {
        toast.error('Login gagal. Cek email/password.');
        return;
      }

      toast.success('Berhasil login! tunggu sebentar...');
      goto(resolve('/admin'));
    }
</script>

<div class="flex min-h-screen items-center justify-center">
  <form onsubmit={handleSubmit} class="w-full max-w-sm space-y-4">
    <h1 class="text-xl font-semibold">Login Admin</h1>
    <div>
      <label for="email" class="block text-sm">Email</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        required
        class="w-full rounded border px-3 py-2"
      />
    </div>

    <div>
      <label for="password" class="block text-sm">Password</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        required
        class="w-full rounded border px-3 py-2"
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      class="w-full rounded bg-black py-2 text-white disabled:opacity-50"
    >
      {loading ? 'Memproses...' : 'Login'}
    </button>
  </form>
</div>
