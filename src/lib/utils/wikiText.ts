import { escapeHtml } from './safeHtml'

/**
 * Converts the MediaWiki markup found in gbf.wiki skill descriptions into safe
 * HTML. The output contains only a whitelisted set of tags (`<strong>`, `<em>`,
 * `<br>`); everything else is HTML-escaped, so the result is safe for `{@html}`.
 *
 * Handles:
 * - `'''bold'''` → `<strong>`, `''italic''` → `<em>`
 * - `<br>` / `<br/>` / `<br />` line breaks
 * - `{{template|arg|...}}` → its first argument (`{{tt|text|tip}}` → `text`,
 *   `{{status|Name|...}}` → `Name`, `{{classSkill|skill=Name}}` → `Name`); nested
 *   templates resolve innermost first. `{{{param|default}}}` → `default`.
 * - `[[Link|Display]]` → `Display`, `[[Link]]` → `Link`
 * - strips `<ref>` citations entirely
 *
 * This is the fallback for API responses without `descriptionSegments`, which carry
 * the same text with tooltips and the weapon's element resolved.
 */
export function wikiToHtml(input: string | null | undefined): string {
	if (!input) return ''

	const delinked = input
		// Drop citation refs (paired and self-closing) before anything else.
		.replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, '')
		.replace(/<ref\b[^>]*\/?>/gi, '')
		// Line breaks → newline (covers <br>, <br/>, <br />, and the stray <br/ >).
		.replace(/<br\s*\/?\s*>/gi, '\n')
		// [[Link|Display]] → Display ; [[Link]] → Link. Before templates, whose
		// arguments are split on "|".
		.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
	const stripped = resolveTemplates(delinked)

	// Escape, then convert wiki bold/italic. escapeHtml turns each apostrophe into
	// &#39;, so '''bold''' becomes a run of six entities — match those. Bold (3)
	// runs before italic (2) so triple-quotes aren't mistaken for italics.
	return escapeHtml(stripped)
		.replace(/(?:&#39;){3}(.+?)(?:&#39;){3}/g, '<strong>$1</strong>')
		.replace(/(?:&#39;){2}(.+?)(?:&#39;){2}/g, '<em>$1</em>')
		.replace(/\n/g, '<br>')
}

// Element templates need the weapon's element, which only the API knows.
const ELEMENT_TEMPLATES = new Set(['weaponelement', 'element', 'weaponweakelement'])
const ELEMENTS = new Set(['wind', 'fire', 'water', 'earth', 'dark', 'light'])

/** Replaces templates innermost first, so nested ones resolve before their parent. */
function resolveTemplates(input: string): string {
	let text = input
	for (let i = 0; i < 20; i++) {
		const next = text
			.replace(/\{\{\{[^{}|]*\|?([^{}]*)\}\}\}/g, '$1')
			.replace(/\{\{([^{}]*)\}\}/g, (_, inner: string) => templateText(inner))
		if (next === text) break
		text = next
	}
	return text
}

function templateText(inner: string): string {
	const [name = '', ...args] = inner.split('|')
	if (ELEMENT_TEMPLATES.has(name.trim().toLowerCase())) {
		const element = args[0]?.trim().toLowerCase() ?? ''
		return ELEMENTS.has(element) ? element[0]!.toUpperCase() + element.slice(1) : 'same-element'
	}
	const positional = args.find((arg) => !/^\s*[A-Za-z_][\w-]*\s*=/.test(arg))
	if (positional !== undefined) return positional
	const named = args[0]?.replace(/^\s*[A-Za-z_][\w-]*\s*=/, '')
	return named ?? ''
}
