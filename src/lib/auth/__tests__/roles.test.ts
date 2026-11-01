import { describe, it, expect } from 'vitest'
import {
	CURATOR_ROLE,
	EDITOR_ROLE,
	canEditStaffPicks,
	isCurator,
	isEditor,
	requiredDatabaseRole
} from '../roles'

describe('isCurator / isEditor', () => {
	it('treats each role as including the ones below it', () => {
		expect([null, undefined, 0, 1, 6, 7, 9].map(isCurator)).toEqual([
			false,
			false,
			false,
			false,
			true,
			true,
			true
		])
		expect([null, 1, 6, 7, 9].map(isEditor)).toEqual([false, false, false, true, true])
	})
})

describe('requiredDatabaseRole', () => {
	const generic = [
		'/(app)/database/[resource=resource]',
		'/(app)/database/[resource=resource]/[id]',
		'/(app)/database/[resource=resource]/[id]/edit',
		'/(app)/database/[resource=resource]/new'
	]

	it('lets curators reach the Database root', () => {
		expect(requiredDatabaseRole('/(app)/database')).toBe(CURATOR_ROLE)
	})

	it('keeps every bespoke Database route editor-only', () => {
		expect(requiredDatabaseRole('/(app)/database/summons')).toBe(EDITOR_ROLE)
		expect(requiredDatabaseRole('/(app)/database/weapons/import')).toBe(EDITOR_ROLE)
		expect(requiredDatabaseRole('/(app)/database/artifact-skills/[id]')).toBe(EDITOR_ROLE)
		expect(requiredDatabaseRole(null)).toBe(EDITOR_ROLE)
		// A resource role never opens a bespoke route
		expect(requiredDatabaseRole('/(app)/database/summons', CURATOR_ROLE)).toBe(EDITOR_ROLE)
	})

	it("gates the generic resource routes on the resource's role, editor by default", () => {
		for (const id of generic) {
			expect(requiredDatabaseRole(id), id).toBe(EDITOR_ROLE)
			expect(requiredDatabaseRole(id, CURATOR_ROLE), id).toBe(CURATOR_ROLE)
		}
	})
})

describe('canEditStaffPicks', () => {
	const now = Date.parse('2026-10-31T00:00:00Z')
	const ended = '2026-10-30T00:00:00Z'
	const running = '2026-11-02T00:00:00Z'

	it('lets editors change any pick', () => {
		expect(canEditStaffPicks(7, ended, now)).toBe(true)
		expect(canEditStaffPicks(9, null, now)).toBe(true)
	})

	it('lets curators change general picks and picks for events that have not ended', () => {
		expect(canEditStaffPicks(6, null, now)).toBe(true)
		expect(canEditStaffPicks(6, running, now)).toBe(true)
		expect(canEditStaffPicks(6, ended, now)).toBe(false)
		expect(canEditStaffPicks(6, '2026-10-31T00:00:00Z', now)).toBe(false)
	})

	it('denies everyone else', () => {
		expect(canEditStaffPicks(1, running, now)).toBe(false)
		expect(canEditStaffPicks(null, null, now)).toBe(false)
	})
})
