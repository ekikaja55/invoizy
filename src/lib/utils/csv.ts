// RFC-4180 Compliant CSV Parser & Generator
// Zero-dependency, handles commas, semicolons (Excel Windows locale), quotes, multiline text, CRLF and LF.

export function detectDelimiter(text: string): string {
	const firstLine = text.split(/\r\n|\n|\r/)[0] || '';
	let commaCount = 0;
	let semicolonCount = 0;
	let tabCount = 0;
	let inQ = false;

	for (const ch of firstLine) {
		if (ch === '"') inQ = !inQ;
		else if (!inQ) {
			if (ch === ',') commaCount++;
			else if (ch === ';') semicolonCount++;
			else if (ch === '\t') tabCount++;
		}
	}

	if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
	if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
	return ',';
}

export function parseCSV(text: string, customDelimiter?: string): string[][] {
	const cleanText = text.replace(/^\uFEFF/, ''); // strip UTF-8 BOM
	const delimiter = customDelimiter || detectDelimiter(cleanText);

	const rows: string[][] = [];
	let currentRow: string[] = [];
	let currentCell = '';
	let inQuotes = false;
	const len = cleanText.length;

	for (let i = 0; i < len; i++) {
		const char = cleanText[i];
		const nextChar = i + 1 < len ? cleanText[i + 1] : '';

		if (inQuotes) {
			if (char === '"') {
				if (nextChar === '"') {
					// Escaped double quote ("")
					currentCell += '"';
					i++;
				} else {
					// End of quoted section
					inQuotes = false;
				}
			} else {
				currentCell += char;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
			} else if (char === delimiter) {
				currentRow.push(currentCell.trim());
				currentCell = '';
			} else if (char === '\r') {
				if (nextChar === '\n') i++; // Skip \n in \r\n
				currentRow.push(currentCell.trim());
				currentCell = '';
				if (currentRow.length > 0 && currentRow.some((c) => c !== '')) {
					rows.push(currentRow);
				}
				currentRow = [];
			} else if (char === '\n') {
				currentRow.push(currentCell.trim());
				currentCell = '';
				if (currentRow.length > 0 && currentRow.some((c) => c !== '')) {
					rows.push(currentRow);
				}
				currentRow = [];
			} else {
				currentCell += char;
			}
		}
	}

	if (currentCell !== '' || currentRow.length > 0) {
		currentRow.push(currentCell.trim());
		if (currentRow.some((c) => c !== '')) {
			rows.push(currentRow);
		}
	}

	return rows;
}

export function generateCSV(rows: (string | number | boolean)[][], delimiter = ','): string {
	return rows
		.map((row) =>
			row
				.map((cell) => {
					const str = String(cell ?? '');
					if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
						return `"${str.replace(/"/g, '""')}"`;
					}
					return str;
				})
				.join(delimiter)
		)
		.join('\r\n');
}

export interface ParsedCsvProduct {
	name: string;
	description: string;
	category: string;
	variantName: string;
	price: number;
	stock: number;
	trackStock: boolean;
}

export function parseProductCsv(text: string): { rows: ParsedCsvProduct[]; errors: string[]; delimiter: string } {
	const detectedDelim = detectDelimiter(text);
	const raw = parseCSV(text, detectedDelim);

	if (raw.length < 2) {
		return {
			rows: [],
			errors: [`File CSV hanya memiliki ${raw.length} baris. Minimal membutuhkan 1 baris header dan 1 baris data produk.`],
			delimiter: detectedDelim
		};
	}

	const headers = raw[0].map((h) => h.trim().toLowerCase());
	const rows: ParsedCsvProduct[] = [];
	const errors: string[] = [];

	// Deteksi letak indeks kolom fleksibel (mendukung header Inggris & Indonesia)
	const findColIdx = (aliases: string[]) => {
		for (const alias of aliases) {
			const idx = headers.findIndex((h) => h === alias || h.startsWith(alias));
			if (idx !== -1) return idx;
		}
		return -1;
	};

	const nameIdx = findColIdx(['name', 'nama', 'nama produk', 'product name']);
	const descIdx = findColIdx(['description', 'deskripsi', 'keterangan']);
	const catIdx = findColIdx(['category', 'kategori']);
	const varIdx = findColIdx(['variantname', 'variant', 'varian', 'nama varian']);
	const priceIdx = findColIdx(['price', 'harga', 'harga (rp)', 'harga rp']);
	const stockIdx = findColIdx(['stock', 'stok', 'jumlah stok', 'qty']);
	const trackIdx = findColIdx(['trackstock', 'lacak stok', 'lacak stok (ya/tidak)', 'kelola stok']);

	const isDetailedFormat = nameIdx !== -1 || catIdx !== -1 || priceIdx !== -1;

	if (isDetailedFormat) {
		for (let i = 1; i < raw.length; i++) {
			const r = raw[i];
			if (!r.some((c) => c !== '')) continue; // Lewati baris kosong

			const name = (nameIdx >= 0 ? r[nameIdx] : r[1] || r[0]) || '';
			if (!name.trim()) {
				errors.push(`Baris #${i + 1}: Kolom nama produk kosong.`);
				continue;
			}

			const rawPrice = (priceIdx >= 0 ? r[priceIdx] : '0').replace(/\D/g, '');
			const price = parseInt(rawPrice || '0', 10);

			const rawStock = (stockIdx >= 0 ? r[stockIdx] : '0').replace(/\D/g, '');
			const stock = parseInt(rawStock || '0', 10);

			const rawTrack = trackIdx >= 0 ? r[trackIdx]?.trim().toLowerCase() : '';
			const trackStock =
				rawTrack === ''
					? stock > 0
					: rawTrack !== 'false' &&
						rawTrack !== 'tidak' &&
						rawTrack !== 'no' &&
						rawTrack !== '0';

			rows.push({
				name: name.trim(),
				description: (descIdx >= 0 ? r[descIdx] : '') || '',
				category: (catIdx >= 0 ? r[catIdx] : 'Merchandise') || 'Merchandise',
				variantName: (varIdx >= 0 ? r[varIdx] : '') || '',
				price,
				stock: trackStock ? stock : stock > 0 ? stock : 0,
				trackStock: trackStock || stock > 0
			});
		}
	} else {
		// Fallback: Format urutan kolom Indonesia (Kategori, Nama, Harga, Lacak Stok, Stok, Deskripsi, Varian)
		for (let i = 1; i < raw.length; i++) {
			const r = raw[i];
			if (!r.some((c) => c !== '')) continue;

			const category = r[0]?.trim() || 'Merchandise';
			const name = r[1]?.trim() || '';
			if (!name) {
				errors.push(`Baris #${i + 1}: Kolom nama produk kosong.`);
				continue;
			}

			const rawPrice = (r[2] || '0').replace(/\D/g, '');
			const price = parseInt(rawPrice || '0', 10);

			const rawTrack = (r[3] || '').trim().toLowerCase();
			const rawStock = (r[4] || '0').replace(/\D/g, '');
			const stock = parseInt(rawStock || '0', 10);

			const trackStock =
				rawTrack === ''
					? stock > 0
					: rawTrack === 'ya' ||
						rawTrack === 'true' ||
						rawTrack === '1' ||
						rawTrack === 'yes';

			const description = r[5]?.trim() || '';
			const variantText = r[6]?.trim() || '';

			if (variantText && variantText !== '-') {
				const variants = variantText.split(';').map((v) => v.trim()).filter(Boolean);
				for (const vStr of variants) {
					const match = vStr.match(/^(.*?)\s*\((\d+)\)$/);
					if (match) {
						const vStock = parseInt(match[2], 10);
						rows.push({
							name,
							description,
							category,
							variantName: match[1].trim(),
							price,
							stock: vStock,
							trackStock: trackStock || vStock > 0
						});
					} else {
						rows.push({
							name,
							description,
							category,
							variantName: vStr,
							price,
							stock,
							trackStock: trackStock || stock > 0
						});
					}
				}
			} else {
				rows.push({
					name,
					description,
					category,
					variantName: '',
					price,
					stock,
					trackStock: trackStock || stock > 0
				});
			}
		}
	}

	return { rows, errors, delimiter: detectedDelim };
}

export function getProductCsvTemplate(): string {
	return generateCSV([
		['name', 'description', 'category', 'variantName', 'price', 'stock', 'trackStock'],
		[
			'Sticker Pack Fanmerch',
			'Sticker vinyl waterproof laminasi doff',
			'Merchandise',
			'Set A (Ready)',
			15000,
			50,
			true
		],
		[
			'Sticker Pack Fanmerch',
			'Sticker vinyl waterproof laminasi doff',
			'Merchandise',
			'Set B (Preorder)',
			15000,
			0,
			false
		]
	]);
}
