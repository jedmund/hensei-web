/** Whether the viewer asked for less motion; false outside the browser */
export function prefersReducedMotion(): boolean {
	return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Fades one image in once it loads (see img[data-fade] in app.scss): hidden
 * while it loads (`pending`), then faded in (`in`). Images already loaded,
 * like cached or server-rendered ones, are left alone, so nothing blinks
 * when they're shown again.
 */
function fadeImageIn(img: HTMLImageElement) {
	if (img.complete || 'noFade' in img.dataset) return
	const shown = () => (img.dataset.fade = 'in')
	img.dataset.fade = 'pending'
	img.addEventListener('load', shown, { once: true })
	img.addEventListener('error', shown, { once: true })
}

/**
 * Fades in every image under `root` as it loads: those there now, those
 * added later, and any whose source changes. Started once by the root
 * layout, so no image needs anything of its own; `data-no-fade` opts one
 * out. Returns a function that stops watching.
 */
export function fadeImagesIn(root: Element = document.body): () => void {
	const scan = (node: Node) => {
		if (node instanceof HTMLImageElement) fadeImageIn(node)
		else if (node instanceof Element) node.querySelectorAll('img').forEach(fadeImageIn)
	}
	scan(root)

	// Callbacks run before the next paint, so a new image is hidden before
	// it's ever drawn half-loaded
	const observer = new MutationObserver((records) => {
		for (const record of records) {
			if (record.type === 'attributes') scan(record.target)
			else record.addedNodes.forEach(scan)
		}
	})
	observer.observe(root, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['src', 'srcset']
	})
	return () => observer.disconnect()
}
