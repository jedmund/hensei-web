import { describe, expect, it } from 'vitest'
import { explicitReexports } from '../paraglideExplicitIndex'

const modules: Record<string, string> = {
	'./plain.js': 'const en_plain = () => `Hi`\nexport const plain = () => en_plain()',
	'./camel1.js': 'export const camel1 = () => `x`\nexport { camel1 as "camelCase" }',
	'./withDefault.js': 'export const named = 1\nexport default named',
	'./empty.js': 'const nothing = 1'
}

const read = async (path: string) => {
	const code = modules[path]
	if (code === undefined) throw new Error(`missing ${path}`)
	return code
}

describe('explicitReexports', () => {
	it('lists each module’s names in place of export *', async () => {
		const source = [
			'/* eslint-disable */',
			"/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */",
			"export * from './plain.js'",
			"export * from './camel1.js'"
		].join('\n')

		expect(await explicitReexports(source, read)).toBe(
			[
				'/* eslint-disable */',
				"/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */",
				"export { plain } from './plain.js'",
				"export { camel1, camelCase } from './camel1.js'"
			].join('\n')
		)
	})

	it('quotes names that are not identifiers', async () => {
		const source = "export * from './dashed.js'"
		const dashed = 'const a = 1\nexport { a as "with-dash" }'

		expect(await explicitReexports(source, async () => dashed)).toBe(
			`export { "with-dash" } from './dashed.js'`
		)
	})

	it('leaves out default exports, like export * does', async () => {
		expect(await explicitReexports("export * from './withDefault.js'", read)).toBe(
			"export { named } from './withDefault.js'"
		)
	})

	it('fails when a module exports nothing', async () => {
		await expect(explicitReexports("export * from './empty.js'", read)).rejects.toThrow(
			'./empty.js exports nothing'
		)
	})

	it('leaves sources without export * alone', async () => {
		const source = "export const x = 1\nexport { y } from './y.js'"
		expect(await explicitReexports(source, read)).toBe(source)
	})
})
