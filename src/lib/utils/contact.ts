// Helper kontak bersama (checkout + halaman error).

// Kontak bisa berupa nomor ("0827..."/"62827...") atau handle ("@toko").
// Hanya nomor yang bisa jadi link wa.me; sisanya kembalikan null (tampil teks).
export function waLink(
	contact: string,
	text = 'Halo, saya butuh bantuan order di Invoizy.'
): string | null {
	const digits = contact.replace(/\D/g, '');
	if (digits.length < 9 || digits.length > 15) return null;
	const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
	return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
