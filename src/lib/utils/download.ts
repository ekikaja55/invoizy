// Unduh file via fetch → blob (agar bisa validasi content-type + toast).
// Gagal (bukan PDF / network) → throw, panggil yang handle fallback-nya.
export async function downloadFile(url: string, filename: string): Promise<void> {
	const res = await fetch(url);
	const type = res.headers.get('content-type') ?? '';
	if (!res.ok || !type.includes('pdf')) throw new Error('not-a-pdf');

	const blob = await res.blob();
	const obj = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = obj;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(obj);
}
