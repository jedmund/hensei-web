import { escapeHtml } from './safeHtml'

/**
 * Converts the MediaWiki markup found in gbf.wiki skill descriptions into safe
 * HTML. The output contains only a whitelisted set of tags (`<strong>`, `<em>`,
 * `<br>`); everything else is HTML-escaped, so the result is safe for `{@html}`.
 *
 * Handles:
 * - `'''bold'''` → `<strong>`, `''italic''` → `<em>`
 * - `<br>` / `<br/>` / `<br />` line breaks
 * - `{{status|Name|...}}` → `Name` (the status's display name)
 * - other `{{template|arg|...}}` → first argument
 * - `[[Link|Display]]` → `Display`, `[[Link]]` → `Link`
 * - strips `<ref>` citations entirely
 */
export function wikiToHtml(input: string | null | undefined): string {
	if (!input) return ''

	const stripped = input
		// Drop citation refs (paired and self-closing) before anything else.
		.replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, '')
		.replace(/<ref\b[^>]*\/?>/gi, '')
		// Line breaks → newline (covers <br>, <br/>, <br />, and the stray <br/ >).
		.replace(/<br\s*\/?\s*>/gi, '\n')
		// {{status|Name|...}} → the status name (first parameter).
		.replace(/\{\{status\|([^|}]+)[^}]*\}\}/gi, '$1')
		// Any other {{template|arg|...}} → first argument / template name.
		.replace(/\{\{([^|}]+)[^}]*\}\}/g, '$1')
		// [[Link|Display]] → Display ; [[Link]] → Link.
		.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')

	// Escape, then convert wiki bold/italic. escapeHtml turns each apostrophe into
	// &#39;, so '''bold''' becomes a run of six entities — match those. Bold (3)
	// runs before italic (2) so triple-quotes aren't mistaken for italics.
	return escapeHtml(stripped)
		.replace(/(?:&#39;){3}(.+?)(?:&#39;){3}/g, '<strong>$1</strong>')
		.replace(/(?:&#39;){2}(.+?)(?:&#39;){2}/g, '<em>$1</em>')
		.replace(/\n/g, '<br>')
}
