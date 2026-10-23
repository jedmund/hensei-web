/**
 * Title-case a raw enum value: capitalize each underscore/space-delimited word,
 * keeping common all-caps tokens (EX, roman numerals) uppercase.
 * e.g. "normal" → "Normal", "big_ii" → "Big II", "ex" → "EX".
 */
export function titleCase(value: string): string {
	return value
		.split(/[_\s]+/)
		.map((word) =>
			/^(ex|ii|iii|iv|v)$/i.test(word)
				? word.toUpperCase()
				: word.charAt(0).toUpperCase() + word.slice(1)
		)
		.join(' ')
}
