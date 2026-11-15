import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { init, parse } from 'es-module-lexer'
import type { Plugin } from 'vite'

const INDEX_SUFFIX = '/paraglide/messages/_index.js'
const EXPORT_ALL = /^export \* from '(\.\/[^']+)';?$/gm
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/
const READ_BATCH = 64

/**
 * A Vite plugin that rewrites Paraglide's `messages/_index.js` from
 * `export * from './x.js'` to `export { x } from './x.js'` for production builds.
 *
 * The index re-exports ~3,000 message modules. Rollup resolves each name
 * imported through `export *` by checking every re-exported module, so the
 * cost grows with the square of the message count. That alone held ~1.25 GB of
 * heap and pushed deploys past Node's heap limit (GBF-264). Explicit names let
 * Rollup look each one up directly. The bundles come out the same.
 *
 * Drop this once Paraglide emits explicit re-exports itself.
 */
export function paraglideExplicitIndex(): Plugin {
	return {
		name: 'paraglide-explicit-index',
		apply: 'build',
		// Run before Vite's own loader, after Paraglide has written the files
		enforce: 'pre',
		async load(id) {
			const file = id.split('?')[0] ?? id
			if (!file.endsWith(INDEX_SUFFIX)) return null

			const source = await readFile(file, 'utf8')
			const dir = dirname(file)
			const rewritten = await explicitReexports(source, (path) =>
				readFile(resolve(dir, path), 'utf8')
			)
			if (rewritten === source) {
				// Paraglide changed its output format, or emits explicit names now
				this.warn(`no export * lines to rewrite in ${file}; this plugin may no longer be needed`)
			}
			return rewritten
		}
	}
}

/**
 * Replaces each `export * from './x.js'` line in `source` with the names that
 * module exports. `readModule` returns a module's source by its relative path.
 */
export async function explicitReexports(
	source: string,
	readModule: (path: string) => Promise<string>
): Promise<string> {
	await init

	const paths = [...source.matchAll(EXPORT_ALL)].map((match) => match[1]!)
	const names = new Map<string, string[]>()
	// In batches, so a few thousand files don't run into the open-file limit
	for (let i = 0; i < paths.length; i += READ_BATCH) {
		const batch = paths.slice(i, i + READ_BATCH)
		const codes = await Promise.all(batch.map(readModule))
		batch.forEach((path, j) => names.set(path, exportedNames(path, codes[j]!)))
	}

	return source.replace(EXPORT_ALL, (_line, path: string) => {
		const list = names
			.get(path)!
			.map((name) => (IDENTIFIER.test(name) ? name : JSON.stringify(name)))
		return `export { ${list.join(', ')} } from '${path}'`
	})
}

function exportedNames(path: string, code: string): string[] {
	const [, exports] = parse(code, path)
	// `export *` never re-exports a default, so leave it out here too
	const names = exports.map((e) => e.n).filter((name) => name !== 'default')
	if (names.length === 0) {
		throw new Error(
			`[paraglide-explicit-index] ${path} exports nothing; check the Paraglide output`
		)
	}
	return names
}
