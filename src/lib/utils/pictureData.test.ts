import { describe, expect, it } from 'vitest'
import { pictureData, picturesFor } from './pictureData'

const ownerOf = (filename: string) => pictureData.find((p) => p.filename === filename)?.ownerId
const filenames = (userId?: string) => picturesFor(userId).map((p) => p.filename)

describe('picturesFor', () => {
	it('shows an owner their own picture and hides the others', () => {
		const names = filenames(ownerOf('custom_umikin'))
		expect(names).toContain('custom_umikin')
		expect(names).not.toContain('custom_reverie')
		expect(names).not.toContain('custom_jedmund')
		expect(names).toContain('zeta')
	})

	it('shows only shared pictures to everyone else', () => {
		expect(filenames('someone-else').some((n) => n.startsWith('custom_'))).toBe(false)
		expect(filenames(undefined).some((n) => n.startsWith('custom_'))).toBe(false)
	})
})
