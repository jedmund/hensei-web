import { describe, expect, it } from 'vitest'
import { buildKamigameUrl, buildWikiJaUrl } from './external-links'

const base = 'https://gbf-wiki.com/?'
const enc = (s: string) => encodeURIComponent(s).replace(/%20/g, '+')

describe('buildWikiJaUrl', () => {
	it('adds the type prefix to a plain weapon or summon title', () => {
		expect(buildWikiJaUrl('新神気鋭・猫之印 (SSR)', 'weapon')).toBe(
			base + enc('武器/新神気鋭・猫之印 (SSR)')
		)
		expect(buildWikiJaUrl('アグニス', 'summon')).toBe(base + enc('召喚石/アグニス'))
	})

	it('leaves an already-prefixed title unchanged', () => {
		expect(buildWikiJaUrl('武器/新神気鋭・猫之印 (SSR)', 'weapon')).toBe(
			base + enc('武器/新神気鋭・猫之印 (SSR)')
		)
		expect(buildWikiJaUrl('召喚石/アグニス', 'summon')).toBe(base + enc('召喚石/アグニス'))
	})

	it('leaves a title on another path unchanged', () => {
		expect(buildWikiJaUrl('武器評価/ガチャ武器', 'weapon')).toBe(base + enc('武器評価/ガチャ武器'))
	})

	it('keeps an anchor as a fragment', () => {
		expect(buildWikiJaUrl('武器概要/四象武器#jfce0a20', 'weapon')).toBe(
			base + enc('武器概要/四象武器') + '#jfce0a20'
		)
		expect(buildWikiJaUrl('四象武器#jfce0a20', 'weapon')).toBe(
			base + enc('武器/四象武器') + '#jfce0a20'
		)
	})

	it('does not prefix character titles', () => {
		expect(buildWikiJaUrl('フロレンス (SSR)闇属性バージョン', 'character')).toBe(
			base + enc('フロレンス (SSR)闇属性バージョン')
		)
		expect(buildWikiJaUrl('フロレンス', 'character')).toBe(
			'https://gbf-wiki.com/?%E3%83%95%E3%83%AD%E3%83%AC%E3%83%B3%E3%82%B9'
		)
	})

	it('returns null for empty input', () => {
		expect(buildWikiJaUrl(undefined, 'weapon')).toBeNull()
		expect(buildWikiJaUrl('  ', 'weapon')).toBeNull()
		expect(buildWikiJaUrl('#anchor', 'weapon')).toBeNull()
	})
})

describe('buildKamigameUrl for events', () => {
	const path = (p: string) => p.split('/').map(encodeURIComponent).join('/')

	it('keeps the folder of an event page and adds .html', () => {
		expect(buildKamigameUrl('イベント/天上劇団もぐら座/index', 'event')).toBe(
			`https://kamigame.jp${path('/グラブル/イベント/天上劇団もぐら座/index')}.html`
		)
		expect(buildKamigameUrl(' イベント/決戦！星の古戦場/勲章 ', 'event')).toBe(
			`https://kamigame.jp${path('/グラブル/イベント/決戦！星の古戦場/勲章')}.html`
		)
		// Exo Crucible pages sit under 神滅戦, not イベント
		expect(buildKamigameUrl('神滅戦/エクスディアボロス_index', 'event')).toBe(
			`https://kamigame.jp${path('/グラブル/神滅戦/エクスディアボロス_index')}.html`
		)
	})

	it('builds nothing from a blank path', () => {
		expect(buildKamigameUrl('', 'event')).toBeNull()
		expect(buildKamigameUrl(null, 'event')).toBeNull()
	})
})
