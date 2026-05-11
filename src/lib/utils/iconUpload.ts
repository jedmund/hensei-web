export const ICON_MAX_DIMENSION = 128
export const ICON_MAX_BYTES = 256 * 1024

export type IconValidationError = 'mime' | 'size' | 'dimensions' | 'decode'

export type IconValidationResult =
	| { ok: true; file: File; dataUrl: string; width: number; height: number }
	| { ok: false; error: IconValidationError }

export function checkIconMime(file: File): boolean {
	return file.type === 'image/png'
}

export function checkIconBytes(size: number): boolean {
	return size <= ICON_MAX_BYTES
}

export function checkIconDimensions(width: number, height: number): boolean {
	return width <= ICON_MAX_DIMENSION && height <= ICON_MAX_DIMENSION
}

export async function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = () => reject(reader.error ?? new Error('FileReader error'))
		reader.readAsDataURL(file)
	})
}

export async function readImageDimensions(
	dataUrl: string
): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve({ width: img.width, height: img.height })
		img.onerror = () => reject(new Error('Could not decode image'))
		img.src = dataUrl
	})
}

export async function validateIconFile(file: File): Promise<IconValidationResult> {
	if (!checkIconMime(file)) return { ok: false, error: 'mime' }
	if (!checkIconBytes(file.size)) return { ok: false, error: 'size' }

	let dataUrl: string
	try {
		dataUrl = await readFileAsDataUrl(file)
	} catch {
		return { ok: false, error: 'decode' }
	}

	let dims: { width: number; height: number }
	try {
		dims = await readImageDimensions(dataUrl)
	} catch {
		return { ok: false, error: 'decode' }
	}

	if (!checkIconDimensions(dims.width, dims.height)) {
		return { ok: false, error: 'dimensions' }
	}

	return { ok: true, file, dataUrl, width: dims.width, height: dims.height }
}

export function dataUrlToBase64(dataUrl: string): string {
	return dataUrl.replace(/^data:[^;]+;base64,/, '')
}
