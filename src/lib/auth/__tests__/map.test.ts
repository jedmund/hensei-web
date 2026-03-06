import { describe, it, expect } from 'vitest'
import { buildCookies } from '../map'
import type { OAuthLoginResponse, UserInfoResponse } from '../oauth'

const mockOAuth: OAuthLoginResponse = {
	access_token: 'tok-1',
	token_type: 'Bearer',
	expires_in: 3600,
	refresh_token: 'ref-1',
	created_at: 1700000000,
	user: { id: 'u1', username: 'grug', role: 0 }
}

const mockUserInfo: UserInfoResponse = {
	id: 'u1',
	username: 'grug',
	role: 0,
	avatar: { picture: 'avatar.jpg', element: 'fire' },
	language: 'en',
	gender: 1,
	theme: 'dark',
	granblueId: 'gbf-123',
	showCrewGamertag: true
}

describe('buildCookies', () => {
	it('maps oauth + user info to cookie data', () => {
		const result = buildCookies(mockOAuth, mockUserInfo)

		expect(result.account).toEqual({
			userId: 'u1',
			username: 'grug',
			token: 'tok-1',
			role: 0,
			expires_at: new Date((1700000000 + 3600) * 1000).toISOString()
		})

		expect(result.user).toEqual({
			picture: 'avatar.jpg',
			element: 'fire',
			language: 'en',
			gender: 1,
			theme: 'dark',
			granblueId: 'gbf-123',
			showCrewGamertag: true
		})

		expect(result.refresh).toBe('ref-1')
		expect(result.accessTokenExpiresAt).toBeInstanceOf(Date)
	})

	it('defaults null avatar/language/gender/theme values', () => {
		const sparseInfo: UserInfoResponse = {
			id: 'u2',
			username: 'cave',
			role: 1,
			avatar: { picture: null, element: null },
			language: null,
			gender: null,
			theme: null
		}

		const result = buildCookies(mockOAuth, sparseInfo)

		expect(result.user.picture).toBe('')
		expect(result.user.element).toBe('')
		expect(result.user.language).toBe('en')
		expect(result.user.gender).toBe(0)
		expect(result.user.theme).toBe('system')
	})
})
