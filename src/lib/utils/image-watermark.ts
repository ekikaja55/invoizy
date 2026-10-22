// src/lib/utils/image-watermark.ts

/**
 * Kompresi gambar ke format WebP dan gambar watermark teks permanen ke pixel canvas.
 * Menghasilkan file WebP ringan (< 250 KB) dengan watermark yang tidak bisa di-inspect/dihapus.
 */
export async function processAndWatermarkImage(
	file: File,
	watermarkText: string,
	maxDimension = 1200,
	quality = 0.82
): Promise<File> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const objectUrl = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(objectUrl);

			let { width, height } = img;
			if (width > maxDimension || height > maxDimension) {
				if (width > height) {
					height = Math.round((height * maxDimension) / width);
					width = maxDimension;
				} else {
					width = Math.round((width * maxDimension) / height);
					height = maxDimension;
				}
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				reject(new Error('Canvas context tidak tersedia.'));
				return;
			}

			// Render foto dasar
			ctx.drawImage(img, 0, 0, width, height);

			// Lukis watermark
			if (watermarkText.trim()) {
				const tag = watermarkText.trim().startsWith('@')
					? watermarkText.trim()
					: `@${watermarkText.trim()}`;

				ctx.save();
				// Ukuran font proporsional lebih tegas (32px - 96px)
				const fontSize = Math.max(32, Math.min(96, Math.round(width / 14)));
				ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';

				// Rotasi diagonal -25 derajat di tengah foto
				ctx.translate(width / 2, height / 2);
				ctx.rotate((-25 * Math.PI) / 180);

				// Outline hitam semi-transparan tipis untuk keterbacaan di background terang
				ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
				ctx.lineWidth = Math.max(1.5, Math.round(fontSize * 0.035));
				ctx.strokeText(tag, 0, 0);

				// Bayangan halus untuk efek kedalaman
				ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
				ctx.shadowBlur = 4;
				ctx.shadowOffsetX = 1;
				ctx.shadowOffsetY = 1;

				// Teks putih lembut (~30% opasitas, terbaca namun tidak menutupi produk)
				ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
				ctx.fillText(tag, 0, 0);

				ctx.restore();
			}

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						reject(new Error('Gagal mengekspor gambar ke WebP.'));
						return;
					}
					const baseName = file.name.replace(/\.[^/.]+$/, '');
					const webpFile = new File([blob], `${baseName}.webp`, { type: 'image/webp' });
					resolve(webpFile);
				},
				'image/webp',
				quality
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error('Gagal memuat file gambar.'));
		};

		img.src = objectUrl;
	});
}
