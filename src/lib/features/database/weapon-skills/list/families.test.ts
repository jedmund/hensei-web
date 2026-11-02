import { describe, expect, it } from 'vitest'
import { applyStaticQuery } from '$lib/components/data-table/staticQuery'
import type { WeaponSkillFamilySummary } from '$lib/types/api/weaponSkillFamily'
import { familyColumns, familyFilterFns, familyHref } from './families'

const family = (over: Partial<WeaponSkillFamilySummary>): WeaponSkillFamilySummary => ({
	modifier: 'Might',
	displayName: { en: 'Might', ja: '攻刃' },
	iconStems: [],
	boostTypes: ['atk'],
	series: ['normal'],
	sizes: ['small'],
	formulaTypes: [],
	counts: { dataRows: 1, effectRows: 1, versions: 2, weapons: 10 },
	manuallyEdited: false,
	...over
})

const might = family({})
const omegaMight = family({
	modifier: 'Omega Might',
	displayName: { en: 'Omega Might' },
	series: ['omega'],
	sizes: ['big'],
	manuallyEdited: true
})
const enmity = family({
	modifier: 'Enmity',
	displayName: null,
	boostTypes: ['enmity'],
	sizes: ['medium', 'big']
})
const rows = [might, omegaMight, enmity]
const query = (filters: Record<string, string[] | boolean>, q = '') =>
	applyStaticQuery(
		rows,
		{ q, filters, sort: [] },
		{
			columns: familyColumns,
			filters: familyFilterFns
		}
	).map((f) => f.modifier)

describe('weapon skill families list', () => {
	it('links each family to its curation page', () => {
		expect(familyHref(omegaMight)).toBe('/database/weapon-skills/Omega%20Might')
	})

	it('filters by series, size and boost type, matching any selected value', () => {
		expect(query({ series: ['omega'] })).toEqual(['Omega Might'])
		expect(query({ size: ['big'] })).toEqual(['Omega Might', 'Enmity'])
		expect(query({ boost_type: ['enmity', 'atk'] })).toEqual(['Might', 'Omega Might', 'Enmity'])
		expect(query({ series: [] })).toEqual(['Might', 'Omega Might', 'Enmity'])
	})

	it('narrows to manually edited families', () => {
		expect(query({ edited: true })).toEqual(['Omega Might'])
	})

	it('searches names and modifiers, including families with no display name', () => {
		expect(query({}, 'enmity')).toEqual(['Enmity'])
		expect(query({}, '攻刃')).toEqual(['Might'])
	})
})
