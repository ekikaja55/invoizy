// Util untuk generate identifier order.
//
// order_id   : 5 karakter, alphabet tanpa O/0/I/1 — dirancang gampang dibaca/ditulis
//              manual oleh admin, BUKAN kunci akses (terlalu mudah ditebak: 32^5).
// access_token: kunci akses halaman invoice (/invoice/[orderId]?token=...) — acak & unik.
//
// Alphabet: 26 huruf - (I, O) = 24, 10 digit - (0, 1) = 8 → total 32 karakter.
// 256 % 32 === 0, jadi pemetaan byte → index tidak punya modulo bias.

const ORDER_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateOrderId(length = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ORDER_ID_ALPHABET[bytes[i] % ORDER_ID_ALPHABET.length];
  }
  return result;
}

export function generateAccessToken(): string {
  return crypto.randomUUID();
}
