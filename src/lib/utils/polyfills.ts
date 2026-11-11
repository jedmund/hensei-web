// Vite transpiles syntax for older browsers but never adds missing methods.
// Chromium 109 is the last version on Windows 7, and it has no toSorted.
if (!Array.prototype.toSorted) {
	Object.defineProperty(Array.prototype, 'toSorted', {
		value<T>(this: T[], compare?: (a: T, b: T) => number): T[] {
			return Array.from(this).sort(compare)
		},
		writable: true,
		configurable: true
	})
}

export {}
