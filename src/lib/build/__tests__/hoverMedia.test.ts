import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
import { hoverMedia, subjectIsHovered } from '../hoverMedia'

const run = (css: string) =>
	postcss([hoverMedia()])
		.process(css, { from: undefined })
		.css.replace(/\s*([{}])\s*/g, ' $1 ')
		.replace(/\s+/g, ' ')
		.trim()

describe('subjectIsHovered', () => {
	it.each([
		['.a:hover', true],
		['.a:hover:not(:disabled)', true],
		['.a > .b:hover', true],
		[':global(.item:hover)', true],
		['.a :global([data-x]:hover)', true],
		['.a:hover:not(:has(:global([data-own-hover]:hover)))', true],
		['.a:hover .b', false],
		[':global(.a:hover) .b', false],
		['.a:hover > .b', false],
		['.a:not(:hover)', false],
		['.a[title~="x"]:hover', true]
	])('%s → %s', (selector, expected) => {
		expect(subjectIsHovered(selector)).toBe(expected)
	})
})

describe('hoverMedia', () => {
	it('moves hover rules into a hover media query', () => {
		expect(run('.a:hover { color: red }')).toBe('@media (hover: hover) { .a:hover { color: red } }')
	})

	it('keeps the other selectors of a list outside', () => {
		expect(run('.a:hover, .a:focus-visible { color: red }')).toBe(
			'.a:focus-visible { color: red } @media (hover: hover) { .a:hover { color: red } }'
		)
	})

	it('moves rules that restyle the children of a hovered element', () => {
		expect(run('.row:hover .label { color: red }')).toBe(
			'@media (hover: hover) { .row:hover .label { color: red } }'
		)
	})

	it("moves dimming a hovered element's children", () => {
		expect(run('.row:hover .label { opacity: 0.7 }')).toBe(
			'@media (hover: hover) { .row:hover .label { opacity: 0.7 } }'
		)
	})

	it("moves a hovered element's own opacity change", () => {
		expect(run('.a:hover { opacity: 0.8 }')).toBe(
			'@media (hover: hover) { .a:hover { opacity: 0.8 } }'
		)
	})

	it('leaves hover reveals and :not(:hover) alone', () => {
		const css = '.card:hover .remove { opacity: 1 } .a:not(:hover) { opacity: 0.5 }'
		expect(run(css)).toBe(css)
	})

	it('leaves rules already in a hover media query alone', () => {
		const css = '@media (hover: none) { .a:hover { color: red } }'
		expect(run(css)).toBe(css)
		expect(run(run('.a:hover { color: red }'))).toBe(run('.a:hover { color: red }'))
	})

	it('works inside other media queries', () => {
		expect(run('@media (max-width: 768px) { .a:hover { color: red } }')).toBe(
			'@media (max-width: 768px) { @media (hover: hover) { .a:hover { color: red } } }'
		)
	})
})
