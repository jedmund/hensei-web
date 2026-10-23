import { describe, expect, it } from 'vitest'
import { escapeHtml, safeHref } from './safeHtml'

describe('escapeHtml', () => {
	it('escapes the five HTML-significant characters', () => {
		expect(escapeHtml('<script>alert("x" & \'y\')</script>')).toBe(
			'&lt;script&gt;alert(&quot;x&quot; &amp; &#39;y&#39;)&lt;/script&gt;'
		)
	})

	it('passes plain text through unchanged', () => {
		expect(escapeHtml('hello world 123')).toBe('hello world 123')
	})

	it('returns empty string for non-string input', () => {
		expect(escapeHtml(undefined)).toBe('')
		expect(escapeHtml(null)).toBe('')
		expect(escapeHtml(42)).toBe('')
		expect(escapeHtml({ toString: () => '<x>' })).toBe('')
	})

	it('escapes ampersand before other entities so we never produce &amp;lt;', () => {
		expect(escapeHtml('&<')).toBe('&amp;&lt;')
	})
})

describe('safeHref', () => {
	it('preserves https URLs', () => {
		expect(safeHref('https://gbf.wiki/Foo')).toBe('https://gbf.wiki/Foo')
	})

	it('preserves http URLs', () => {
		expect(safeHref('http://example.com/path')).toBe('http://example.com/path')
	})

	it('preserves mailto URLs', () => {
		expect(safeHref('mailto:foo@example.com')).toBe('mailto:foo@example.com')
	})

	it('preserves in-page anchors', () => {
		expect(safeHref('#section-1')).toBe('#section-1')
	})

	it('preserves root-relative paths', () => {
		expect(safeHref('/teams/abc123')).toBe('/teams/abc123')
	})

	it('neutralises javascript: URIs', () => {
		expect(safeHref('javascript:alert(1)')).toBe('#')
		expect(safeHref('JAVASCRIPT:alert(1)')).toBe('#')
		expect(safeHref('  javascript:alert(1)  ')).toBe('#')
		expect(safeHref('java\tscript:alert(1)')).toBe('#')
	})

	it('neutralises data: URIs', () => {
		expect(safeHref('data:text/html,<script>alert(1)</script>')).toBe('#')
	})

	it('neutralises vbscript: URIs', () => {
		expect(safeHref('vbscript:msgbox(1)')).toBe('#')
	})

	it('neutralises file: URIs', () => {
		expect(safeHref('file:///etc/passwd')).toBe('#')
	})

	it('neutralises protocol-relative URLs', () => {
		expect(safeHref('//evil.example.com/x')).toBe('#')
	})

	it('returns # for non-string input', () => {
		expect(safeHref(undefined)).toBe('#')
		expect(safeHref(null)).toBe('#')
		expect(safeHref(123)).toBe('#')
		expect(safeHref('')).toBe('#')
		expect(safeHref('   ')).toBe('#')
	})

	it('HTML-escapes characters within an allowed href', () => {
		expect(safeHref('/path?q=<x>"&\'')).toBe('/path?q=&lt;x&gt;&quot;&amp;&#39;')
	})

	it('HTML-escapes anchors with significant characters', () => {
		expect(safeHref('#a"b')).toBe('#a&quot;b')
	})
})
