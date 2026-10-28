<script lang="ts">
	import { tick } from 'svelte';
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
		Info,
		Check
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
	let step3El = $state<HTMLElement | null>(null);

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

		const parsed = parseProductCsv(text);

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

		if (rows.length > 0) {
			await tick();
			if (step3El) {
				step3El.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
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
					// Akumulasikan stok varian tambahan ke total stok produk induk
					p.stock += r.stock;
					p.trackStock = p.trackStock || r.trackStock;
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
	<div class="mx-auto max-w-6xl space-y-6 pb-20">
		<!-- Navigation & Header -->
		<div class="space-y-3">
			<a
				href={resolve('/admin/products')}
				class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#f2efe9] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#262335] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
			>
				<ArrowLeft size={14} strokeWidth={2.5} />
				<span>Kembali ke Katalog Produk</span>
			</a>

			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div class="flex items-center gap-2.5">
						<span
							class="rounded-md border-2 border-[#262626] bg-[#fea770] px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#262626] uppercase shadow-[1.5px_1.5px_0px_#262626]"
						>
							BATCH CSV IMPORT
						</span>
						<h1
							class="font-serif text-2xl font-bold tracking-tight text-[#262626] sm:text-3xl dark:text-[#f2efe9]"
						>
							Import Produk Massal
						</h1>
					</div>
					<p class="mt-1 font-sans text-sm text-[#555] dark:text-[#bbb]">
						Tambahkan merchandise dalam jumlah banyak melalui spreadsheet, tinjau di tabel editor,
						dan simpan langsung ke katalog.
					</p>
				</div>
			</div>
		</div>

		<!-- 2-Column Workflow: Preparation & Upload Area -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
			<!-- Col 1 (5 cols): Step 1 - Unduh Template & Panduan Format -->
			<div class="space-y-4 lg:col-span-5">
				<div
					class="rounded-xl border-2 border-[#262626] bg-white p-5 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#262335] dark:shadow-[3px_3px_0px_#f2efe9]"
				>
					<div class="border-b-2 border-[#262626]/10 pb-4 dark:border-[#f2efe9]/10">
						<span
							class="rounded border border-[#262626] bg-[#fea770] px-2 py-0.5 font-mono text-xs font-bold text-[#262626]"
						>
							LANGKAH 1
						</span>
						<h2 class="mt-1 font-serif text-xl font-bold text-[#262626] dark:text-[#f2efe9]">
							Unduh Template Resmi
						</h2>
						<p class="mt-1 font-sans text-sm text-[#404040] dark:text-[#b8b5ad]">
							Pilih format yang sesuai dengan aplikasi spreadsheet yang Anda gunakan.
						</p>

						<div class="mt-3 flex flex-wrap gap-2">
							<a
								href="{base}/templates/template-import-produk.xlsx"
								download="template-import-produk.xlsx"
								rel="external"
								class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#2b8a3e] px-3.5 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#237032] active:translate-y-0.5 active:shadow-none sm:text-sm dark:border-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
							>
								<FileSpreadsheet size={16} strokeWidth={2.5} />
								<span>Excel (.xlsx)</span>
							</a>
							<button
								type="button"
								onclick={downloadCsvTemplate}
								class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#f2efe9] px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#e4e0d7] active:translate-y-0.5 active:shadow-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
							>
								<FileText size={16} strokeWidth={2.5} />
								<span>CSV (.csv)</span>
							</button>
						</div>
					</div>

					<!-- Tip Box Ringkas -->
					<div
						class="mt-4 flex items-start gap-2.5 rounded-lg border-2 border-[#262626] bg-[#fea770]/15 p-3.5 text-sm text-[#262626] dark:border-[#f2efe9] dark:bg-[#fea770]/10 dark:text-[#f2efe9]"
					>
						<Info
							size={18}
							class="mt-0.5 shrink-0 text-[#d9532f] dark:text-[#fea770]"
							strokeWidth={2.5}
						/>
						<p class="font-sans leading-relaxed">
							<strong class="font-bold text-[#d9532f] dark:text-[#fea770]">Catatan Gambar:</strong>
							File CSV berfokus pada data teks, harga, dan stok. Foto merchandise dapat dilengkapi melalui
							tombol <strong>Edit</strong> setelah produk masuk katalog.
						</p>
					</div>

					<!-- Tabs Panduan Format -->
					<div class="mt-4 pt-2">
						<div
							class="flex flex-wrap gap-1.5 border-b-2 border-[#262626]/20 pb-2 dark:border-[#f2efe9]/20"
						>
							<button
								type="button"
								onclick={() => (activeTutorialTab = 'rules')}
								class="rounded-md border px-2.5 py-1 font-mono text-xs font-bold transition-all {activeTutorialTab ===
								'rules'
									? 'border-[#262626] bg-[#262626] text-[#f2efe9] dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]'
									: 'border-transparent text-[#555] hover:text-[#262626] dark:text-[#aaa] dark:hover:text-[#f2efe9]'}"
							>
								Aturan Kolom
							</button>
							<button
								type="button"
								onclick={() => (activeTutorialTab = 'excel')}
								class="rounded-md border px-2.5 py-1 font-mono text-xs font-bold transition-all {activeTutorialTab ===
								'excel'
									? 'border-[#262626] bg-[#262626] text-[#f2efe9] dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]'
									: 'border-transparent text-[#555] hover:text-[#262626] dark:text-[#aaa] dark:hover:text-[#f2efe9]'}"
							>
								Panduan Excel
							</button>
							<button
								type="button"
								onclick={() => (activeTutorialTab = 'sheets')}
								class="rounded-md border px-2.5 py-1 font-mono text-xs font-bold transition-all {activeTutorialTab ===
								'sheets'
									? 'border-[#262626] bg-[#262626] text-[#f2efe9] dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]'
									: 'border-transparent text-[#555] hover:text-[#262626] dark:text-[#aaa] dark:hover:text-[#f2efe9]'}"
							>
								Google Sheets
							</button>
						</div>

						<div class="mt-3">
							{#if activeTutorialTab === 'rules'}
								<div
									class="space-y-2.5 font-sans text-sm leading-relaxed text-[#333] dark:text-[#d4d1c9]"
								>
									<p class="font-bold text-[#262626] dark:text-[#f2efe9]">
										Struktur 7 Kolom Wajib:
									</p>
									<ul class="list-disc space-y-1.5 pl-4">
										<li>
											<code class="font-mono font-bold text-[#262626] dark:text-[#f2efe9]"
												>name</code
											>: Nama produk utama.
										</li>
										<li>
											<code class="font-mono font-bold text-[#262626] dark:text-[#f2efe9]"
												>description</code
											>: Keterangan (isi <code>-</code> jika kosong).
										</li>
										<li>
											<code class="font-mono font-bold text-[#262626] dark:text-[#f2efe9]"
												>category</code
											>: Kategori barang.
										</li>
										<li>
											<code class="font-mono font-bold text-[#262626] dark:text-[#f2efe9]"
												>variantName</code
											>: Nama varian (misal <code>Set A</code>, isi <code>-</code> jika tanpa varian).
										</li>
										<li>
											<code class="font-mono font-bold text-[#262626] dark:text-[#f2efe9]"
												>price</code
											>: Angka bulat rupiah tanpa simbol (misal <code>15000</code>).
										</li>
										<li>
											<code class="font-mono font-bold text-[#262626] dark:text-[#f2efe9]"
												>stock</code
											>: Jumlah unit fisik (misal <code>50</code>).
										</li>
										<li>
											<code class="font-mono font-bold text-[#262626] dark:text-[#f2efe9]"
												>trackStock</code
											>: <code>true</code> (stok terbatas) atau <code>false</code> (unlimited pre-order).
										</li>
									</ul>
								</div>
							{:else if activeTutorialTab === 'excel'}
								<div
									class="space-y-2 font-sans text-sm leading-relaxed text-[#333] dark:text-[#d4d1c9]"
								>
									<p class="font-bold text-[#262626] dark:text-[#f2efe9]">
										Cara Ekspor CSV dari Excel:
									</p>
									<ol class="list-decimal space-y-1.5 pl-4">
										<li>Buka file template dan isi data merchandise Anda.</li>
										<li>Pilih menu <strong>File</strong> → <strong>Save As</strong>.</li>
										<li>
											Ubah format file menjadi: <strong
												class="font-mono text-[#2b8a3e] dark:text-[#51cf66]"
												>CSV UTF-8 (Comma delimited) (*.csv)</strong
											>.
										</li>
										<li>
											Klik <strong>Save</strong> lalu unggah file tersebut ke kolom sebelah kanan.
										</li>
									</ol>
								</div>
							{:else if activeTutorialTab === 'sheets'}
								<div
									class="space-y-2 font-sans text-sm leading-relaxed text-[#333] dark:text-[#d4d1c9]"
								>
									<p class="font-bold text-[#262626] dark:text-[#f2efe9]">
										Cara Ekspor CSV dari Google Sheets:
									</p>
									<ol class="list-decimal space-y-1.5 pl-4">
										<li>Buka spreadsheet data produk Anda.</li>
										<li>Klik menu <strong>File</strong> → <strong>Download</strong>.</li>
										<li>
											Pilih <strong class="font-mono text-[#228be6] dark:text-[#4dabf7]"
												>Comma Separated Values (.csv)</strong
											>.
										</li>
										<li>File otomatis terunduh dan siap diunggah ke formulir.</li>
									</ol>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Col 2 (7 cols): Step 2 - Dropzone Unggah CSV -->
			<div class="space-y-4 lg:col-span-7">
				<div
					class="flex h-full flex-col justify-between rounded-xl border-2 border-[#262626] bg-white p-5 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#262335] dark:shadow-[3px_3px_0px_#f2efe9]"
				>
					<div>
						<span
							class="rounded border border-[#262626] bg-[#a2e1db] px-2 py-0.5 font-mono text-xs font-bold text-[#065f46]"
						>
							LANGKAH 2
						</span>
						<h2 class="mt-1 font-serif text-xl font-bold text-[#262626] dark:text-[#f2efe9]">
							Unggah File CSV
						</h2>
						<p class="mt-1 font-sans text-sm text-[#404040] dark:text-[#b8b5ad]">
							Tarik file CSV ke dalam area dropzone atau klik untuk memilih file dari komputer.
						</p>
					</div>

					<div class="my-4 flex-1">
						<label
							for="csv_input"
							class="flex h-full min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#262626] bg-[#fcfbf9] p-6 text-center shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#f2efe9] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#1a1825] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#262335]"
						>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#262626] bg-[#fea770] text-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9]"
							>
								<UploadCloud size={24} strokeWidth={2.5} />
							</div>

							<p class="mt-3 font-sans text-base font-bold text-[#262626] dark:text-[#f2efe9]">
								{fileName
									? `File terpilih: ${fileName}`
									: 'Klik untuk memilih file CSV atau seret ke sini'}
							</p>
							<p class="mt-1 font-sans text-xs text-[#555] sm:text-sm dark:text-[#a3a3a3]">
								Mendukung pemisah koma (,) maupun titik-koma (;) khas Excel Windows secara otomatis.
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

					{#if fileName}
						<div
							class="flex items-center justify-between rounded-lg border-2 border-[#262626] bg-[#eef7ee] px-4 py-2.5 font-mono text-xs sm:text-sm dark:border-[#f2efe9] dark:bg-[#1e2a22]"
						>
							<div class="flex items-center gap-2 text-[#2b8a3e] dark:text-[#51cf66]">
								<Check size={18} strokeWidth={2.5} />
								<span class="font-bold">{fileName}</span>
								<span>({rows.length} baris terbaca)</span>
							</div>
							<button
								type="button"
								onclick={clearDraft}
								class="font-bold text-red-600 underline hover:text-red-800 dark:text-red-400"
							>
								Ganti File
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Step 3: Status Analisis Kategori & Duplikat -->
		{#if rows.length > 0}
			<div
				bind:this={step3El}
				id="step-verification"
				class="scroll-mt-6 space-y-4 rounded-xl border-2 border-[#262626] bg-white p-5 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#262335] dark:shadow-[3px_3px_0px_#f2efe9]"
			>
				<div>
					<span
						class="rounded border border-[#262626] bg-[#b4a6d5] px-2 py-0.5 font-mono text-xs font-bold text-[#262626]"
					>
						LANGKAH 3
					</span>
					<h2 class="mt-1 font-serif text-xl font-bold text-[#262626] dark:text-[#f2efe9]">
						Analisis Kategori & Validasi Duplikasi
					</h2>
					<p class="mt-1 font-sans text-sm text-[#404040] dark:text-[#b8b5ad]">
						Pengecekan otomatis terhadap integritas katalog yang sudah ada di database toko.
					</p>
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					<!-- Kategori yang Cocok -->
					<div
						class="rounded-lg border-2 border-[#262626] bg-[#eef7ee] p-4 font-sans text-sm shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#1e2a22] dark:shadow-[2px_2px_0px_#f2efe9]"
					>
						<div class="flex items-center gap-2 font-bold text-[#2b8a3e] dark:text-[#51cf66]">
							<CheckCircle2 size={18} strokeWidth={2.5} />
							<span>Kategori Cocok ({categoryAnalysis.matchedExisting.length}):</span>
						</div>
						{#if categoryAnalysis.matchedExisting.length === 0}
							<p class="mt-2 text-[#737373] dark:text-[#a3a3a3]">
								Belum ada kategori yang cocok dengan database.
							</p>
						{:else}
							<div class="mt-2.5 flex flex-wrap gap-1.5">
								{#each categoryAnalysis.matchedExisting as item (item.raw)}
									<span
										class="inline-flex items-center gap-1.5 rounded-md border-2 border-[#262626] bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#2b8a3e] shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#262335] dark:text-[#51cf66] dark:shadow-[1px_1px_0px_#f2efe9]"
									>
										<span>{item.raw}</span>
										{#if item.raw.toLowerCase() === item.matchedTo.toLowerCase() && item.raw !== item.matchedTo}
											<span class="text-[11px] text-[#737373] dark:text-[#a3a3a3]"
												>→ {item.matchedTo}</span
											>
										{/if}
									</span>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Kategori Baru -->
					<div
						class="rounded-lg border-2 border-[#262626] bg-[#fff9db] p-4 font-sans text-sm shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#342b15] dark:shadow-[2px_2px_0px_#f2efe9]"
					>
						<div class="flex items-center gap-2 font-bold text-[#d9532f] dark:text-[#ffd43b]">
							<AlertTriangle size={18} strokeWidth={2.5} />
							<span>Kategori Baru Terdeteksi ({categoryAnalysis.newCategories.length}):</span>
						</div>
						{#if categoryAnalysis.newCategories.length === 0}
							<p class="mt-2 text-[#737373] dark:text-[#a3a3a3]">
								Semua produk menggunakan kategori yang sudah terdaftar di database.
							</p>
						{:else}
							<div class="mt-2 space-y-2">
								<p class="text-[#404040] dark:text-[#d4d1c9]">
									Kategori berikut belum ada di database dan akan dibuat otomatis saat impor, atau
									Anda dapat mengalihkannya ke kategori yang ada:
								</p>
								<div class="space-y-1.5">
									{#each categoryAnalysis.newCategories as newCat (newCat)}
										<div
											class="flex flex-col justify-between gap-2 rounded-lg border-2 border-[#262626] bg-white p-2.5 text-sm shadow-[1px_1px_0px_#262626] sm:flex-row sm:items-center dark:border-[#f2efe9] dark:bg-[#262335] dark:shadow-[1px_1px_0px_#f2efe9]"
										>
											<span class="font-bold text-[#262626] dark:text-[#f2efe9]">
												"{newCat}"
												<span class="font-mono text-[#d9532f] dark:text-[#fea770]">(Baru)</span>
											</span>
											<div class="flex items-center gap-1.5">
												<span class="font-mono text-xs text-[#737373] dark:text-[#a3a3a3]"
													>Alihkan:</span
												>
												<select
													onchange={(e) => {
														const val = (e.target as HTMLSelectElement).value;
														if (val) remapCategory(newCat, val);
													}}
													class="rounded border-2 border-[#262626]/40 bg-white px-2.5 py-1 font-sans text-xs text-[#262626] focus:border-[#262626] focus:outline-none sm:text-sm dark:border-[#f2efe9]/40 dark:bg-[#1a1825] dark:text-[#f2efe9]"
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

				<!-- Alert Deteksi Duplikasi Produk -->
				{#if duplicateAnalysis.hasDuplicates}
					<div
						class="rounded-lg border-2 border-[#262626] bg-[#ffe3e3] p-4 font-sans text-sm shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#341818] dark:shadow-[2px_2px_0px_#f2efe9]"
					>
						<div class="flex items-center gap-2 font-bold text-[#e03131] dark:text-[#ff8787]">
							<AlertTriangle size={18} strokeWidth={2.5} />
							<span>{duplicateAnalysis.list.length} Produk Sudah Ada di Katalog Toko:</span>
						</div>
						<p class="mt-1 leading-relaxed text-[#c92a2a] dark:text-[#ffa8a8]">
							Produk berikut sudah ada di katalog Anda. Sistem akan <strong
								>otomatis menganulir (melewati)</strong
							> baris-baris ini agar katalog tidak memiliki produk kembar:
						</p>
						<div class="mt-2.5 flex flex-wrap gap-1.5">
							{#each duplicateAnalysis.list as dup (dup.name)}
								<span
									class="inline-flex items-center gap-1.5 rounded-md border-2 border-[#262626] bg-white px-2.5 py-1 font-sans text-xs font-semibold text-[#e03131] shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#262335] dark:text-[#ff8787] dark:shadow-[1px_1px_0px_#f2efe9]"
								>
									<span>"{dup.name}"</span>
									<span class="font-mono text-[11px] text-[#737373] dark:text-[#a3a3a3]"
										>({dup.categoryName})</span
									>
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Step 4: Tabel Pratinjau & Edit Data -->
			<div
				class="space-y-4 rounded-xl border-2 border-[#262626] bg-white p-5 shadow-[3px_3px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#262335] dark:shadow-[3px_3px_0px_#f2efe9]"
			>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<span
							class="rounded border border-[#262626] bg-[#e87a5d] px-2 py-0.5 font-mono text-xs font-bold text-white"
						>
							LANGKAH 4
						</span>
						<h2 class="mt-1 font-serif text-xl font-bold text-[#262626] dark:text-[#f2efe9]">
							Pratinjau & Penyesuaian Data
						</h2>
						<p class="mt-1 font-sans text-sm text-[#404040] dark:text-[#b8b5ad]">
							Tinjau dan sesuaikan harga, stok, atau hapus baris yang tidak diinginkan sebelum
							menyimpan.
						</p>
					</div>
				</div>

				<!-- Tabel Editable -->
				<div
					class="overflow-x-auto rounded-lg border-2 border-[#262626] shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
				>
					<table class="w-full text-left font-sans text-xs sm:text-sm">
						<thead
							class="border-b-2 border-[#262626] bg-[#f2efe9] font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
						>
							<tr>
								<th class="w-10 p-3 text-center">#</th>
								<th class="min-w-[200px] p-3">Nama Produk</th>
								<th class="min-w-[140px] p-3">Kategori</th>
								<th class="min-w-[140px] p-3">Varian</th>
								<th class="min-w-[110px] p-3">Harga (Rp)</th>
								<th class="min-w-[90px] p-3">Stok</th>
								<th class="min-w-[100px] p-3 text-center">Preorder</th>
								<th class="w-12 p-3 text-center">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y border-[#262626]/10 dark:divide-[#f2efe9]/10">
							{#each rows as row, index (row.id)}
								{@const isDup = duplicateAnalysis.isDuplicate(row.name)}
								<tr
									class="transition-colors hover:bg-[#fcfbf9] dark:hover:bg-[#1a1825]/50 {isDup
										? 'bg-[#ffe3e3]/40 dark:bg-[#341818]/40'
										: ''}"
								>
									<td class="p-3 text-center font-mono text-[#737373] dark:text-[#a3a3a3]"
										>{index + 1}</td
									>
									<td class="p-2.5">
										<input
											type="text"
											bind:value={row.name}
											required
											class="w-full rounded border px-3 py-2 font-sans text-xs focus:ring-1 focus:ring-[#fea770] focus:outline-none sm:text-sm {isDup
												? 'border-[#e03131] bg-[#ffe3e3] text-[#c92a2a] dark:bg-[#341818] dark:text-[#ff8787]'
												: 'border-[#262626]/30 bg-white text-[#262626] focus:border-[#262626] dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9] dark:focus:border-[#f2efe9]'}"
										/>
										{#if isDup}
											<span
												class="mt-1 block font-sans text-xs font-bold text-[#e03131] dark:text-[#ff8787]"
											>
												Sudah terdaftar di kategori {duplicateAnalysis.getCategoryName(row.name)} (Dilewati)
											</span>
										{/if}
									</td>
									<td class="p-2.5">
										<input
											type="text"
											bind:value={row.category}
											required
											class="w-full rounded border border-[#262626]/30 bg-white px-3 py-2 font-sans text-xs text-[#262626] focus:border-[#262626] focus:ring-1 focus:ring-[#fea770] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9] dark:focus:border-[#f2efe9]"
										/>
									</td>
									<td class="p-2.5">
										<input
											type="text"
											bind:value={row.variantName}
											placeholder="Mis. Set A / -"
											class="w-full rounded border border-[#262626]/30 bg-white px-3 py-2 font-sans text-xs text-[#262626] placeholder:text-[#a3a3a3] focus:border-[#262626] focus:ring-1 focus:ring-[#fea770] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9] dark:focus:border-[#f2efe9]"
										/>
									</td>
									<td class="p-2.5">
										<input
											type="number"
											min="0"
											step="500"
											bind:value={row.price}
											class="w-full rounded border border-[#262626]/30 bg-white px-3 py-2 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:ring-1 focus:ring-[#fea770] focus:outline-none sm:text-sm dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9] dark:focus:border-[#f2efe9]"
										/>
									</td>
									<td class="p-2.5">
										<input
											type="number"
											min="0"
											bind:value={row.stock}
											disabled={!row.trackStock}
											class="w-full rounded border border-[#262626]/30 bg-white px-3 py-2 font-mono text-xs font-bold text-[#262626] focus:border-[#262626] focus:ring-1 focus:ring-[#fea770] focus:outline-none disabled:opacity-40 sm:text-sm dark:border-[#f2efe9]/30 dark:bg-[#1a1825] dark:text-[#f2efe9] dark:focus:border-[#f2efe9]"
										/>
									</td>
									<td class="p-2.5 text-center">
										<label
											class="inline-flex cursor-pointer items-center gap-1.5 font-sans text-xs font-medium text-[#262626] dark:text-[#f2efe9]"
										>
											<input
												type="checkbox"
												checked={!row.trackStock}
												onchange={(e) => (row.trackStock = !(e.target as HTMLInputElement).checked)}
												class="h-4 w-4 rounded border-2 border-[#262626] text-[#e87a5d] focus:ring-0 dark:border-[#f2efe9]"
											/>
											<span>Preorder</span>
										</label>
									</td>
									<td class="p-2.5 text-center">
										<button
											type="button"
											onclick={() => removeRow(row.id)}
											class="rounded-md border border-transparent p-1.5 text-[#737373] transition-colors hover:border-[#262626] hover:bg-[#ffe3e3] hover:text-[#e03131] dark:text-[#a3a3a3] dark:hover:border-[#f2efe9] dark:hover:bg-[#341818] dark:hover:text-[#ff8787]"
											title="Hapus Baris Ini"
										>
											<Trash2 size={16} strokeWidth={2.5} />
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Ringkasan & Tombol Komit Final -->
				<div
					class="flex flex-col gap-4 border-t-2 border-[#262626] pt-4 font-mono sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9]"
				>
					<div class="font-sans text-sm text-[#404040] dark:text-[#b8b5ad]">
						<span>Siap diimpor: </span>
						<strong class="font-bold text-[#262626] dark:text-[#f2efe9]"
							>{groupedSummary.newProductsToInsert} Produk Baru</strong
						>
						{#if groupedSummary.totalProducts > groupedSummary.newProductsToInsert}
							<span class="font-bold text-[#e03131] dark:text-[#ff8787]">
								({groupedSummary.totalProducts - groupedSummary.newProductsToInsert} produk dilewati karena
								sudah terdaftar)</span
							>
						{/if}
						<span> dengan </span>
						<strong class="font-bold text-[#262626] dark:text-[#f2efe9]"
							>{groupedSummary.totalVariants} Total Baris/Varian</strong
						>.
					</div>

					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={clearDraft}
							disabled={isBusy}
							class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#f2efe9] active:translate-y-0.5 active:shadow-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
						>
							Batal / Bersihkan
						</button>
						<button
							type="button"
							onclick={handleSubmitImport}
							disabled={isBusy || rows.length === 0}
							class="group relative inline-flex items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#262626] px-6 py-2.5 font-mono text-xs font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50 sm:text-sm dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9] dark:hover:bg-[#e2ded6]"
						>
							<span
								class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
							>
								<span>{isBusy ? 'Menyimpan ke Database...' : 'Proses & Simpan Sekarang'}</span>
							</span>
							<span
								class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-2 transition-transform duration-300 ease-out group-hover:translate-y-0"
								aria-hidden="true"
							>
								<span>{isBusy ? 'Menyimpan...' : 'Konfirmasi Simpan →'}</span>
							</span>
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
