// Helper kontak bersama (checkout + halaman error).

// Kontak bisa berupa nomor ("0827..."/"62827...") atau handle ("@toko").
// Hanya nomor yang bisa jadi link wa.me; sisanya kembalikan null (tampil teks).
export function waLink(
	contact: string,
	text = 'Halo, saya butuh bantuan order di cho.lazey - CHIBICONXI CATALOGUE.'
): string | null {
	const digits = contact.replace(/\D/g, '');
	if (digits.length < 9 || digits.length > 15) return null;
	const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
	return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function igLink(handle: string): string | null {
	const cleaned = handle.trim();
	if (!cleaned) return null;
	if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
	const username = cleaned.replace(/^@/, '').trim();
	if (!username) return null;
	return `https://instagram.com/${username}`;
}
