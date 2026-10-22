<script lang="ts">
	import { enhance } from '$app/forms';
	import { base, resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { parseProductCsv, getProductCsvTemplate, type ParsedCsvProduct } from '$lib/utils/csv';
	import { handleFormResult } from '$lib/utils/handle-form-result';
	import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
	import {
		ArrowLeft,
		UploadCloud,
		FileSpreadsheet,
		FileText,
		CheckCircle2,
		AlertTriangle,
		Trash2,
		Info
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isBusy = $state(false);
	let activeTutorialTab = $state<'rules' | 'excel' | 'sheets'>('rules');

	interface EditableRow {
		id: string;
		name: string;
		description: string;
		category: string;
		variantName: string;
		price: number;
		stock: number;
		trackStock: boolean;
	}

	let rows = $state<EditableRow[]>([]);
	let fileName = $state('');
	let importFormEl = $state<HTMLFormElement | null>(null);

	// Restore draft dari sessionStorage saat awal dibuka
	$effect(() => {
		if (typeof window !== 'undefined' && rows.length === 0) {
			try {
				const savedDraft = sessionStorage.getItem('invoizy:import_draft');
				const savedFileName = sessionStorage.getItem('invoizy:import_filename');
				if (savedDraft) {
					const parsed = JSON.parse(savedDraft);
					if (Array.isArray(parsed) && parsed.length > 0) {
						rows = parsed;
						if (savedFileName) fileName = savedFileName;
					}
				}
			} catch {
				// Abaikan jika storage bermasalah
			}
		}
	});

	// Simpan otomatis ke sessionStorage setiap rows berubah
	$effect(() => {
		if (typeof window !== 'undefined') {
			try {
				if (rows.length > 0) {
					sessionStorage.setItem('invoizy:import_draft', JSON.stringify(rows));
					sessionStorage.setItem('invoizy:import_filename', fileName);
				} else {
					sessionStorage.removeItem('invoizy:import_draft');
					sessionStorage.removeItem('invoizy:import_filename');
				}
			} catch {
				// Abaikan jika storage penuh
			}
		}
	});

	function clearDraft() {
		rows = [];
		fileName = '';
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem('invoizy:import_draft');
			sessionStorage.removeItem('invoizy:import_filename');
		}
		toast.info('Draf impor telah dibersihkan.');
	}

	// Unduh template CSV
	function downloadCsvTemplate() {
		const csvText = getProductCsvTemplate();
		const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'template-import-produk.csv';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		toast.success('Template CSV berhasil diunduh.');
	}

	// Tangani upload file CSV
	async function handleFileUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];
		if (!file.name.toLowerCase().endsWith('.csv')) {
			toast.error(
				'File harus berformat .csv. Silakan simpan draf Excel/Spreadsheet Anda sebagai CSV terlebih dahulu.'
			);
			return;
		}

		fileName = file.name;
		const text = await file.text();
		console.log('[CSV Import] Membaca file:', file.name, 'Ukuran teks:', text.length, 'karakter');

		const parsed = parseProductCsv(text);
		console.log('[CSV Import] Delimiter terdeteksi:', JSON.stringify(parsed.delimiter));
		console.log('[CSV Import] Baris valid terdeteksi:', parsed.rows.length);

		if (parsed.errors.length > 0) {
			console.warn('[CSV Import] Catatan parsing CSV:', parsed.errors);
		}

		if (parsed.rows.length === 0) {
			const reason = parsed.errors[0] || 'Tidak ada baris data produk yang valid.';
			toast.error(`Gagal memuat CSV: ${reason}`);
			return;
		}

		rows = parsed.rows.map((item: ParsedCsvProduct, idx: number) => ({
			id: `row-${Date.now()}-${idx}`,
			name: item.name || '',
			description: item.description === '-' ? '' : item.description || '',
			category: item.category || 'Merchandise',
			variantName: item.variantName === '-' ? '' : item.variantName || '',
			price: Number(item.price) || 0,
			stock: Number(item.stock) || 0,
			trackStock: item.trackStock !== false
		}));

		if (parsed.errors.length > 0) {
			toast.warning(
				`Memuat ${rows.length} baris produk (${parsed.errors.length} baris diabaikan).`
			);
		} else {
			toast.success(
				`Berhasil memuat ${rows.length} baris produk (pemisah '${parsed.delimiter}'). Data tersimpan di draf browser.`
			);
		}
	}

	// Deteksi Kategori dari Rows vs Database
	const categoryAnalysis = $derived.by(() => {
		const dbCatMap = new SvelteMap<string, string>(); // lower -> original
		for (const cat of data.categories) {
			dbCatMap.set(cat.name.trim().toLowerCase(), cat.name);
		}

		const presentCategories = new SvelteSet<string>();
		for (const r of rows) {
			if (r.category.trim()) presentCategories.add(r.category.trim());
		}

		const matchedExisting: { raw: string; matchedTo: string }[] = [];
		const newCategories: string[] = [];

		for (const catName of presentCategories) {
			const lower = catName.toLowerCase();
			if (dbCatMap.has(lower)) {
				matchedExisting.push({
					raw: catName,
					matchedTo: dbCatMap.get(lower)!
				});
			} else {
				newCategories.push(catName);
			}
		}

		return { matchedExisting, newCategories };
	});

	// Deteksi Nama Produk yang Sudah Terdaftar di Database Toko
	const duplicateAnalysis = $derived.by(() => {
		const dbProdMap = new SvelteMap<string, string>(); // lowerName -> categoryName
		if (data.existingProducts) {
			for (const p of data.existingProducts) {
				dbProdMap.set(p.name.trim().toLowerCase(), p.categoryName);
			}
		}

		const duplicates = new SvelteMap<string, string>(); // rawName -> categoryName
		for (const r of rows) {
			const key = r.name.trim().toLowerCase();
			if (key && dbProdMap.has(key)) {
				duplicates.set(r.name.trim(), dbProdMap.get(key)!);
			}
		}

		return {
			hasDuplicates: duplicates.size > 0,
			list: Array.from(duplicates.entries()).map(([name, categoryName]) => ({
				name,
				categoryName
			})),
			isDuplicate: (name: string) => dbProdMap.has(name.trim().toLowerCase()),
			getCategoryName: (name: string) => dbProdMap.get(name.trim().toLowerCase()) ?? ''
		};
	});

	// Alihkan kategori baru ke kategori yang sudah ada
	function remapCategory(fromName: string, toName: string) {
		for (const r of rows) {
			if (r.category.trim().toLowerCase() === fromName.trim().toLowerCase()) {
				r.category = toName;
			}
		}
		toast.success(`Kategori "${fromName}" dialihkan ke "${toName}".`);
	}

	function removeRow(id: string) {
		rows = rows.filter((r) => r.id !== id);
	}

	function getGroupedItems() {
		const grouped = new SvelteMap<
			string,
			{
				categoryName: string;
				name: string;
				priceInt: number;
				trackStock: boolean;
				stock: number;
				description?: string;
				variants: { name: string; stock: number; trackStock?: boolean }[];
			}
		>();

		for (const r of rows) {
			const key = r.name.trim().toLowerCase();
			if (!key) continue;

			// Lewati produk yang sudah terdaftar di database agar tidak dibuat kembar
			if (duplicateAnalysis.isDuplicate(r.name)) {
				continue;
			}

			const hasVariantName = Boolean(r.variantName.trim());

			if (!grouped.has(key)) {
				grouped.set(key, {
					categoryName: r.category.trim(),
					name: r.name.trim(),
					priceInt: r.price,
					trackStock: r.trackStock,
					stock: r.stock,
					description: r.description.trim() || undefined,
					variants: hasVariantName
						? [{ name: r.variantName.trim(), stock: r.stock, trackStock: r.trackStock }]
						: []
				});
			} else {
				const p = grouped.get(key)!;
				if (hasVariantName) {
					p.variants.push({
						name: r.variantName.trim(),
						stock: r.stock,
						trackStock: r.trackStock
					});
				}
			}
		}

		return Array.from(grouped.values());
	}

	// Ringkasan pengelompokan produk sebelum disimpan
	const groupedSummary = $derived.by(() => {
		const prodMap = new SvelteMap<
			string,
			{ category: string; variantCount: number; isDuplicate: boolean }
		>();
		let newCount = 0;
		for (const r of rows) {
			const key = r.name.trim().toLowerCase();
			if (!key) continue;
			const isDup = duplicateAnalysis.isDuplicate(r.name);
			if (!prodMap.has(key)) {
				prodMap.set(key, { category: r.category, variantCount: 1, isDuplicate: isDup });
				if (!isDup) newCount++;
			} else {
				const cur = prodMap.get(key)!;
				cur.variantCount++;
			}
		}
		return {
			totalProducts: prodMap.size,
			newProductsToInsert: newCount,
			totalVariants: rows.length
		};
	});

	function handleSubmitImport() {
		if (rows.length === 0) {
			toast.error('Tidak ada baris produk untuk diimpor.');
			return;
		}

		// Validasi kelengkapan
		for (let i = 0; i < rows.length; i++) {
			const r = rows[i];
			if (!r.name.trim()) {
				toast.error(`Baris #${i + 1}: Nama produk tidak boleh kosong.`);
				return;
			}
			if (!r.category.trim()) {
				toast.error(`Baris #${i + 1}: Kategori tidak boleh kosong.`);
				return;
			}
			if (r.price < 0) {
				toast.error(`Baris #${i + 1}: Harga tidak valid.`);
				return;
			}
		}

		const grouped = getGroupedItems();
		if (grouped.length === 0) {
			toast.error(
				'Semua produk di tabel sudah terdaftar di toko. Tidak ada produk baru untuk disimpan.'
			);
			return;
		}

		if (importFormEl) {
			importFormEl.requestSubmit();
		}
	}
</script>

<svelte:head>
	<title>Import Produk Massal — Admin</title>
</svelte:head>

<BusyOverlay active={isBusy}>
	<div class="mx-auto max-w-5xl space-y-8 pb-20">
		<!-- Navigation & Header -->
		<div class="space-y-3">
			<a
				href={resolve('/admin/products')}
				class="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
			>
				<ArrowLeft size={14} />
				<span>Kembali ke Daftar Produk</span>
			</a>

			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
						Import Produk via CSV / Excel
					</h1>
					<p class="mt-1 text-xs text-neutral-500">
						Unggah daftar merchandise secara massal, lakukan penyesuaian di tabel pratinjau, dan
						simpan langsung ke database.
					</p>
				</div>
			</div>
		</div>

		<!-- Card 1: Unduh Template & Tutorial Panduan (Tanpa Ikon di Judul Section) -->
		<div
			class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
		>
			<div
				class="flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
			>
				<div>
					<h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100">
						1. Unduh Template Resmi
					</h2>
					<p class="mt-1 text-xs text-neutral-500">
						Pilih format template yang Anda sukai untuk diisi di Microsoft Excel atau Google
						Spreadsheet.
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-2.5">
					<a
						href="{base}/templates/template-import-produk.xlsx"
						download="template-import-produk.xlsx"
						rel="external"
						class="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
					>
						<FileSpreadsheet size={15} />
						<span>Unduh Template Excel (.xlsx)</span>
					</a>
					<button
						type="button"
						onclick={downloadCsvTemplate}
						class="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
					>
						<FileText size={15} />
						<span>Unduh Template CSV (.csv)</span>
					</button>
				</div>
			</div>

			<!-- Box Informasi Edukasi Mengenai Gambar & Kecepatan Impor -->
			<div
				class="mt-4 flex items-start gap-2.5 rounded-xl border border-teal/20 bg-teal/5 p-3.5 text-xs text-neutral-700 dark:border-teal/30 dark:bg-teal/10 dark:text-neutral-300"
			>
				<Info size={16} class="mt-0.5 shrink-0 text-teal" />
				<p class="leading-relaxed">
					<strong>Fokus Impor Massal:</strong> Fitur ini dirancang khusus untuk memasukkan data teks
					dan angka (nama produk, kategori, varian, harga, dan stok) dalam jumlah banyak secara
					instan. Foto produk dapat dilengkapi setelah impor selesai melalui tombol
					<strong>Edit</strong> pada masing-masing produk di daftar katalog.
				</p>
			</div>

			<!-- Tab Tutorial Step-by-Step yang Jelas -->
			<div class="mt-5 space-y-4">
				<div
					class="flex items-center gap-2 border-b border-neutral-200 text-xs font-medium dark:border-neutral-800"
				>
					<button
						type="button"
						onclick={() => (activeTutorialTab = 'rules')}
						class="border-b-2 px-3 py-2 transition-colors {activeTutorialTab === 'rules'
							? 'border-neutral-900 font-bold text-neutral-900 dark:border-white dark:text-white'
							: 'border-transparent text-neutral-500 hover:text-neutral-700'}"
					>
						Aturan Pengisian Kolom
					</button>
					<button
						type="button"
						onclick={() => (activeTutorialTab = 'excel')}
						class="border-b-2 px-3 py-2 transition-colors {activeTutorialTab === 'excel'
							? 'border-neutral-900 font-bold text-neutral-900 dark:border-white dark:text-white'
							: 'border-transparent text-neutral-500 hover:text-neutral-700'}"
					>
						Cara Simpan CSV di Microsoft Excel
					</button>
					<button
						type="button"
						onclick={() => (activeTutorialTab = 'sheets')}
						class="border-b-2 px-3 py-2 transition-colors {activeTutorialTab === 'sheets'
							? 'border-neutral-900 font-bold text-neutral-900 dark:border-white dark:text-white'
							: 'border-transparent text-neutral-500 hover:text-neutral-700'}"
					>
						Cara Simpan CSV di Google Spreadsheet
					</button>
				</div>

				{#if activeTutorialTab === 'rules'}
					<div class="grid gap-3 text-xs text-neutral-600 sm:grid-cols-2 dark:text-neutral-400">
						<div class="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
							<p class="font-bold text-neutral-900 dark:text-neutral-100">
								Aturan Kolom Template (7 Kolom):
							</p>
							<ol class="list-decimal space-y-1.5 pl-4 leading-relaxed">
								<li><strong>name:</strong> Nama produk induk (wajib diisi).</li>
								<li>
									<strong>description:</strong> Deskripsi produk. Jika tidak ada deskripsi, isi
									tanda strip <code>-</code>.
								</li>
								<li>
									<strong>category:</strong> Nama kategori (contoh: <code>Merchandise</code>,
									<code>Print</code>).
								</li>
								<li>
									<strong>variantName:</strong> Nama varian (contoh: <code>Set A</code>,
									<code>Set B</code>). Jika produk tidak bervarian, isi tanda strip <code>-</code>.
								</li>
								<li>
									<strong>price:</strong> Harga satuan dalam Rupiah. Tulis angka bulat murni tanpa
									titik atau Rp (contoh: <code>15000</code>).
								</li>
								<li><strong>stock:</strong> Jumlah stok unit fisik (contoh: <code>50</code>).</li>
								<li>
									<strong>trackStock:</strong> Isi <code>true</code> untuk barang ready stock yang
									stoknya berkurang saat dibeli, atau <code>false</code> untuk barang pre-order (unlimited).
								</li>
							</ol>
						</div>
						<div class="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
							<p class="font-bold text-neutral-900 dark:text-neutral-100">
								Cara Menginput Produk Multi-Varian:
							</p>
							<p class="leading-relaxed">
								Jika 1 produk memiliki beberapa varian (misal: 1 jenis stiker dengan 3 pilihan
								karakter), tulis <strong>nama produk induk yang sama persis</strong> di baris
								terpisah dan bedakan kolom <strong>variantName</strong>:
							</p>
							<div
								class="space-y-1 rounded-lg bg-neutral-100 p-2.5 font-mono text-[11px] dark:bg-neutral-800"
							>
								<p>Baris 1: Sticker Chibi · Set A · 15000 · 20 · true</p>
								<p>Baris 2: Sticker Chibi · Set B · 15000 · 30 · true</p>
							</div>
							<p class="text-[11px] text-neutral-500">
								Sistem otomatis mengelompokkan kedua baris di atas menjadi 1 produk induk dengan 2
								varian.
							</p>
						</div>
					</div>
				{:else if activeTutorialTab === 'excel'}
					<div
						class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-300"
					>
						<p class="text-sm font-bold">Langkah Menyimpan File CSV di Microsoft Excel:</p>
						<ol class="mt-2.5 list-decimal space-y-2 pl-4 leading-relaxed">
							<li>
								Buka file <code>template-import-produk.xlsx</code> yang sudah Anda unduh dan isi data
								produk Anda.
							</li>
							<li>Klik menu <strong>File</strong> di pojok kiri atas jendela Excel.</li>
							<li>
								Pilih menu <strong>Save As</strong> (Simpan Sebagai) dan pilih folder di komputer Anda.
							</li>
							<li>
								Pada kotak pilihan <strong>Save as type</strong> (Format File), cari dan pilih:
								<strong class="mt-1 block font-mono text-emerald-800 dark:text-emerald-200"
									>CSV UTF-8 (Comma delimited) (*.csv)</strong
								>
							</li>
							<li>
								Klik <strong>Save</strong>. File CSV tersebut siap diunggah pada kotak nomor 2 di
								bawah. (Sistem sudah mendukung pemisah titik koma <code>;</code> khas Excel Windows secara
								otomatis).
							</li>
						</ol>
					</div>
				{:else if activeTutorialTab === 'sheets'}
					<div
						class="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900 dark:border-blue-800/40 dark:bg-blue-950/20 dark:text-blue-300"
					>
						<p class="text-sm font-bold">Langkah Menyimpan File CSV di Google Spreadsheet:</p>
						<ol class="mt-2.5 list-decimal space-y-2 pl-4 leading-relaxed">
							<li>Buka Google Spreadsheet dan isi data produk mengikuti susunan kolom template.</li>
							<li>Klik menu <strong>File</strong> di bagian atas lembar kerja.</li>
							<li>Arahkan kursor ke menu <strong>Download</strong>.</li>
							<li>
								Klik pilihan:
								<strong class="mt-1 block font-mono text-blue-800 dark:text-blue-200"
									>Comma Separated Values (.csv)</strong
								>
							</li>
							<li>
								File .csv akan otomatis terunduh ke folder Downloads laptop/komputer Anda dan siap
								diunggah ke formulir di bawah.
							</li>
						</ol>
					</div>
				{/if}
			</div>
		</div>

		<!-- Card 2: Upload Dropzone File CSV (Pertahankan Ikon di Dropzone Saja) -->
		<div
			class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
		>
			<h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100">
				2. Unggah File CSV Hasil Export
			</h2>
			<p class="mt-1 text-xs text-neutral-500">
				Pilih file CSV yang sudah Anda isi dan simpan dari Excel atau Google Spreadsheet.
			</p>

			<div class="mt-4">
				<label
					for="csv_input"
					class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center transition-colors hover:border-neutral-900 hover:bg-neutral-100/70 dark:border-neutral-700 dark:bg-neutral-800/40 dark:hover:border-neutral-500"
				>
					<UploadCloud size={32} class="text-neutral-400" />
					<p class="mt-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
						{fileName
							? `File terpilih: ${fileName}`
							: 'Klik untuk memilih file CSV atau seret ke sini'}
					</p>
					<p class="mt-1 text-xs text-neutral-500">
						Mendukung file .csv dari Excel Windows (pemisah ';') maupun Google Sheets (pemisah ',')
					</p>
					<input
						id="csv_input"
						type="file"
						accept=".csv"
						onchange={handleFileUpload}
						disabled={isBusy}
						class="hidden"
					/>
				</label>
			</div>
		</div>

		<!-- Section 3: Deteksi Kategori Baru & Konflik Penulisan (Tanpa Ikon di Judul Section) -->
		{#if rows.length > 0}
			<div
				class="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
			>
				<div>
					<h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100">
						3. Analisis & Deteksi Kategori
					</h2>
					<p class="mt-1 text-xs text-neutral-500">
						Sistem memeriksa nama kategori pada CSV terhadap data kategori yang sudah terdaftar di
						database.
					</p>
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					<!-- Kategori yang Tercocokkan -->
					<div
						class="rounded-xl border border-green-200 bg-green-50/50 p-4 text-xs dark:border-green-900/40 dark:bg-green-950/20"
					>
						<div class="flex items-center gap-2 font-bold text-green-800 dark:text-green-300">
							<CheckCircle2 size={16} />
							<span>Kategori Sudah Terdaftar ({categoryAnalysis.matchedExisting.length}):</span>
						</div>
						{#if categoryAnalysis.matchedExisting.length === 0}
							<p class="mt-2 text-neutral-500">Belum ada kategori yang cocok dengan database.</p>
						{:else}
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each categoryAnalysis.matchedExisting as item (item.raw)}
									<span
										class="inline-flex items-center gap-1 rounded-md border border-green-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-green-700 shadow-xs dark:border-green-800 dark:bg-neutral-800 dark:text-green-300"
									>
										<span>{item.raw}</span>
										{#if item.raw.toLowerCase() === item.matchedTo.toLowerCase() && item.raw !== item.matchedTo}
											<span class="text-[10px] text-neutral-400">→ {item.matchedTo}</span>
										{/if}
									</span>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Kategori Baru Terdeteksi -->
					<div
						class="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs dark:border-amber-900/40 dark:bg-amber-950/20"
					>
						<div class="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
							<AlertTriangle size={16} />
							<span>Kategori Baru Terdeteksi ({categoryAnalysis.newCategories.length}):</span>
						</div>
						{#if categoryAnalysis.newCategories.length === 0}
							<p class="mt-2 text-neutral-500">
								Tidak ada kategori baru. Semua produk memakai kategori yang sudah ada.
							</p>
						{:else}
							<div class="mt-2 space-y-2">
								<p class="text-neutral-600 dark:text-neutral-400">
									Kategori berikut belum ada di database dan akan dibuat otomatis saat impor, atau
									Anda bisa menggabungkannya ke kategori lama:
								</p>
								<div class="space-y-2">
									{#each categoryAnalysis.newCategories as newCat (newCat)}
										<div
											class="flex flex-col justify-between gap-2 rounded-lg border border-amber-200 bg-white p-2.5 sm:flex-row sm:items-center dark:border-amber-800/60 dark:bg-neutral-800"
										>
											<span class="font-bold text-amber-900 dark:text-amber-200">
												"{newCat}" (Baru)
											</span>
											<div class="flex items-center gap-2">
												<span class="text-[11px] text-neutral-500">Alihkan ke:</span>
												<select
													onchange={(e) => {
														const val = (e.target as HTMLSelectElement).value;
														if (val) remapCategory(newCat, val);
													}}
													class="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
												>
													<option value="">-- Tetap Buat Baru --</option>
													{#each data.categories as c (c.id)}
														<option value={c.name}>{c.name}</option>
													{/each}
												</select>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Alert Deteksi Nama Produk Sudah Terdaftar di Toko -->
				{#if duplicateAnalysis.hasDuplicates}
					<div
						class="rounded-xl border border-red-200 bg-red-50/70 p-4 text-xs dark:border-red-900/50 dark:bg-red-950/20"
					>
						<div class="flex items-center gap-2 font-bold text-red-800 dark:text-red-300">
							<AlertTriangle size={16} />
							<span
								>{duplicateAnalysis.list.length} Nama Produk Sudah Terdaftar di Database Toko:</span
							>
						</div>
						<p class="mt-1 leading-relaxed text-red-700 dark:text-red-300">
							Produk berikut sudah ada di katalog toko Anda. Sistem akan <strong
								>otomatis menganulir (melewati)</strong
							> baris produk ini agar tidak terjadi produk kembar di katalog:
						</p>
						<div class="mt-2.5 flex flex-wrap gap-1.5">
							{#each duplicateAnalysis.list as dup (dup.name)}
								<span
									class="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-red-700 shadow-xs dark:border-red-900/60 dark:bg-neutral-800 dark:text-red-300"
								>
									<span>"{dup.name}"</span>
									<span class="font-sans text-[10px] text-neutral-500"
										>· Kategori {dup.categoryName}</span
									>
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Card 4: Tabel Pratinjau Interaktif & Editable -->
			<div
				class="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
			>
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100">
							4. Pratinjau & Edit Data Sebelum Disimpan
						</h2>
						<p class="mt-1 text-xs text-neutral-500">
							Data otomatis tersimpan di draf browser. Anda dapat mengubah nama, harga, stok, atau
							menghapus baris produk langsung dari tabel.
						</p>
					</div>
				</div>

				<!-- Tabel Editable -->
				<div class="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
					<table class="w-full text-left text-xs">
						<thead
							class="border-b border-neutral-200 bg-neutral-50 font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
						>
							<tr>
								<th class="w-12 p-3 text-center">#</th>
								<th class="min-w-[200px] p-3">Nama Produk</th>
								<th class="min-w-[140px] p-3">Kategori</th>
								<th class="min-w-[140px] p-3">Varian</th>
								<th class="min-w-[110px] p-3">Harga (Rp)</th>
								<th class="min-w-[90px] p-3">Stok</th>
								<th class="min-w-[100px] p-3 text-center">Preorder</th>
								<th class="w-14 p-3 text-center">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
							{#each rows as row, index (row.id)}
								{@const isDup = duplicateAnalysis.isDuplicate(row.name)}
								<tr
									class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 {isDup
										? 'bg-red-50/20'
										: ''}"
								>
									<td class="p-3 text-center font-mono text-neutral-400">{index + 1}</td>
									<td class="p-2">
										<input
											type="text"
											bind:value={row.name}
											required
											class="w-full rounded border px-2 py-1 text-xs focus:outline-none {isDup
												? 'border-red-400 bg-red-50/50 text-red-900 dark:bg-red-950/30 dark:text-red-200'
												: 'border-neutral-300 bg-white text-neutral-900 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'}"
										/>
										{#if isDup}
											<span
												class="mt-0.5 block text-[10px] font-semibold text-red-600 dark:text-red-400"
											>
												Sudah ada di kategori {duplicateAnalysis.getCategoryName(row.name)} (Dilewati)
											</span>
										{/if}
									</td>
									<td class="p-2">
										<input
											type="text"
											bind:value={row.category}
											required
											class="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
										/>
									</td>
									<td class="p-2">
										<input
											type="text"
											bind:value={row.variantName}
											placeholder="Mis. Set A / -"
											class="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
										/>
									</td>
									<td class="p-2">
										<input
											type="number"
											min="0"
											step="500"
											bind:value={row.price}
											class="w-full rounded border border-neutral-300 bg-white px-2 py-1 font-mono text-xs text-neutral-900 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
										/>
									</td>
									<td class="p-2">
										<input
											type="number"
											min="0"
											bind:value={row.stock}
											disabled={!row.trackStock}
											class="w-full rounded border border-neutral-300 bg-white px-2 py-1 font-mono text-xs text-neutral-900 focus:border-neutral-900 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
										/>
									</td>
									<td class="p-2 text-center">
										<label class="inline-flex cursor-pointer items-center gap-1">
											<input
												type="checkbox"
												checked={!row.trackStock}
												onchange={(e) => (row.trackStock = !(e.target as HTMLInputElement).checked)}
												class="rounded border-neutral-300 text-neutral-900 focus:ring-0 dark:border-neutral-700"
											/>
											<span class="text-[11px] text-neutral-600 dark:text-neutral-400"
												>Unlimited</span
											>
										</label>
									</td>
									<td class="p-2 text-center">
										<button
											type="button"
											onclick={() => removeRow(row.id)}
											class="rounded p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
											title="Hapus Baris Ini"
										>
											<Trash2 size={15} />
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Ringkasan & Tombol Komit Final -->
				<div
					class="flex flex-col gap-4 border-t border-neutral-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
				>
					<div class="text-xs text-neutral-600 dark:text-neutral-400">
						<span>Siap diimpor: </span>
						<strong class="font-bold text-neutral-900 dark:text-neutral-100"
							>{groupedSummary.newProductsToInsert} Produk Baru</strong
						>
						{#if groupedSummary.totalProducts > groupedSummary.newProductsToInsert}
							<span class="font-medium text-red-600">
								({groupedSummary.totalProducts - groupedSummary.newProductsToInsert} produk dilewati karena
								sudah terdaftar)</span
							>
						{/if}
						<span> dengan </span>
						<strong class="font-bold text-neutral-900 dark:text-neutral-100"
							>{groupedSummary.totalVariants} Total Baris/Varian</strong
						>.
					</div>

					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={clearDraft}
							disabled={isBusy}
							class="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
						>
							Batal / Bersihkan
						</button>
						<button
							type="button"
							onclick={handleSubmitImport}
							disabled={isBusy || rows.length === 0}
							class="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-6 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
						>
							<span>{isBusy ? 'Menyimpan ke Database...' : 'Proses & Simpan Sekarang'}</span>
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</BusyOverlay>

<!-- Form Tersembunyi untuk Submit Impor via SvelteKit Action -->
<form
	bind:this={importFormEl}
	method="POST"
	action="?/import"
	use:enhance={({ formData }) => {
		isBusy = true;
		const grouped = getGroupedItems();
		formData.set('items', JSON.stringify(grouped));
		return async ({ result }) => {
			if (result.type === 'success') {
				const count = (result.data as { count?: number })?.count ?? rows.length;
				toast.success(`Berhasil mengimpor ${count} produk ke katalog!`);
				if (typeof window !== 'undefined') {
					sessionStorage.removeItem('invoizy:import_draft');
					sessionStorage.removeItem('invoizy:import_filename');
				}
				await goto(resolve('/admin/products'));
			} else {
				handleFormResult(result, { failure: 'Gagal mengimpor produk.' });
			}
			isBusy = false;
		};
	}}
	class="hidden"
></form>
