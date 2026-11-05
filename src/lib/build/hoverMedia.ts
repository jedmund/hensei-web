import type { AtRule, Node, Plugin, Rule } from 'postcss'

/**
 * A PostCSS plugin that applies hover styles only where there's a real
 * pointer. On phones and iPads a tap leaves `:hover` stuck on whatever was
 * tapped, so hover feedback (backgrounds, colors, lifts) lingers after the
 * finger is gone. This moves hover rules into `@media (hover: hover)`, so
 * components don't each have to.
 *
 * Left alone:
 * - Rules where hovering an ancestor makes something appear
 *   (`.card:hover .remove { opacity: 1 }`). On touch screens the tap that
 *   sticks the hover is how those controls show up at all.
 * - `:not(:hover)`, which would flip meaning on touch screens.
 * - Rules already inside a media query about hover.
 *
 * In a selector list only the hover selectors move, so a shared
 * `&:hover, &:focus-visible` keeps its focus style everywhere.
 */
export function hoverMedia(): Plugin {
	return {
		postcssPlugin: 'hover-media',
		Rule(rule, { atRule }) {
			if (!rule.selector.includes(':hover') || insideHoverMedia(rule)) return

			const reveals = rule.some((n) => n.type === 'decl' && showsSomething(n.prop, n.value))
			const hovered = rule.selectors.filter((s) => (reveals ? subjectIsHovered(s) : isHovered(s)))
			if (hovered.length === 0) return

			const media = atRule({ name: 'media', params: '(hover: hover)' })
			media.append(rule.clone({ selectors: hovered }))
			rule.after(media)

			const rest = rule.selectors.filter((s) => !hovered.includes(s))
			if (rest.length > 0) rule.selectors = rest
			else rule.remove()
		}
	}
}
hoverMedia.postcss = true as const

/**
 * Whether a declaration shows or hides an element, rather than restyling it.
 * Opacity counts only at 1: lower values dim things as hover feedback.
 */
function showsSomething(prop: string, value: string): boolean {
	if (prop === 'display' || prop === 'visibility' || prop === 'pointer-events') return true
	return prop === 'opacity' && value.replace(/\s*!important$/, '').trim() === '1'
}

function insideHoverMedia(rule: Rule): boolean {
	for (let node: Node | undefined = rule.parent; node; node = node.parent) {
		if (node.type === 'atrule' && (node as AtRule).name === 'media') {
			if ((node as AtRule).params.includes('hover')) return true
		}
	}
	return false
}

/** Whether anything in a selector is hovered, outside any `:not()` */
export function isHovered(selector: string): boolean {
	return stripNot(unwrapGlobal(selector)).includes(':hover')
}

/** Whether the last compound of a selector is hovered, outside any `:not()` */
export function subjectIsHovered(selector: string): boolean {
	const plain = stripNot(unwrapGlobal(selector))
	return lastCompound(plain).includes(':hover')
}

/** Svelte's `:global(...)` wraps whole selectors; look inside it */
function unwrapGlobal(selector: string): string {
	let out = ''
	let i = 0
	while (i < selector.length) {
		if (selector.startsWith(':global(', i)) {
			const end = matchingParen(selector, i + ':global'.length)
			out += selector.slice(i + ':global('.length, end)
			i = end + 1
		} else {
			out += selector[i++]
		}
	}
	return out
}

function stripNot(selector: string): string {
	let out = ''
	let i = 0
	while (i < selector.length) {
		if (selector.startsWith(':not(', i)) {
			i = matchingParen(selector, i + ':not'.length) + 1
		} else {
			out += selector[i++]
		}
	}
	return out
}

/** Text after the last combinator that isn't inside parentheses */
function lastCompound(selector: string): string {
	const s = selector.trim()
	let depth = 0
	let start = 0
	for (let i = 0; i < s.length; i++) {
		const c = s[i]
		if (c === '(' || c === '[') depth++
		else if (c === ')' || c === ']') depth--
		else if (depth === 0 && (c === ' ' || c === '>' || c === '+' || c === '~' || c === '\n')) {
			start = i + 1
		}
	}
	return s.slice(start)
}

function matchingParen(s: string, open: number): number {
	let depth = 0
	for (let i = open; i < s.length; i++) {
		if (s[i] === '(') depth++
		else if (s[i] === ')' && --depth === 0) return i
	}
	return s.length
}
