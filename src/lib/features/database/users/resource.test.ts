import { describe, expect, it } from 'vitest'
import { facetKeys } from '$lib/components/data-table/filters'
import { columnsFor, filtersFor } from '$lib/features/database/schema/columns'
import { detailLayout } from '$lib/features/database/schema/detail'
import { screenFor } from '$lib/features/database/schema/routes'
import { asUserRecord, usersResource as def } from './resource'
import { roleLabel } from './roles'

const user = asUserRecord({
	id: '2b0b6c1e-2f7c-4a63-9e0e-3c6a2f7c1a11',
	username: 'member',
	displayName: null,
	email: 'member@example.com',
	emailVerified: true,
	role: 1,
	avatar: { picture: 'gran', element: 'fire' },
	createdAt: '2026-01-02T03:04:05Z',
	deletionScheduledAt: null,
	partyCount: 3,
	history: []
})

describe('usersResource', () => {
	it('is read-only: a list and a detail, no edit or new screens', () => {
		expect(screenFor(def, 'list')).toBeDefined()
		expect(screenFor(def, 'detail')).toBeDefined()
		expect(screenFor(def, 'edit')).toBeUndefined()
		expect(screenFor(def, 'new')).toBeUndefined()
	})

	it('lists by newest first, faceting the role', () => {
		expect(columnsFor(def).map((c) => c.id)).toEqual([
			'username',
			'display_name',
			'role',
			'created_at',
			'deletion_scheduled_at',
			'granblue_id',
			'youtube',
			'wiki_profile'
		])
		expect(def.list.defaultSort).toEqual([{ id: 'created_at', desc: true }])
		expect(facetKeys(filtersFor(def))).toEqual(['role'])
	})

	it('titles the record with the display name, else the username', () => {
		expect(user.name).toBe('member')
		expect(asUserRecord({ ...user, displayName: 'Member One' }).name).toBe('Member One')
	})

	it('leaves out the deletion date and the empty history box when there is none', () => {
		const blocks = detailLayout(def, user).blocks
		const account = blocks.find((b) => b.section.id === 'account')!
		expect(account.rows.map((r) => r.field.key)).not.toContain('deletion_scheduled_at')
		expect(blocks.map((b) => b.section.id)).toEqual(['account', 'role', 'history'])
	})

	it('names the roles, and shows the number for one it does not know', () => {
		expect([1, 6, 7, 9].map(roleLabel)).toEqual(['User', 'Curator', 'Editor', 'Admin'])
		expect(roleLabel(3)).toBe('3')
	})
})
