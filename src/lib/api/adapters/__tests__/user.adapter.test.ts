import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserAdapter } from '../user.adapter'
import type { UserInfo, UserProfile } from '../user.adapter'
import type { Party } from '$lib/types/api/party'

describe('UserAdapter', () => {
  let adapter: UserAdapter
  let mockFetch: ReturnType<typeof vi.fn>

  const mockUserInfo: UserInfo = {
    id: 'user-1',
    username: 'testuser',
    language: 'en',
    private: false,
    gender: 1,
    theme: 'dark',
    role: 0,
    avatar: {
      picture: 'avatar.jpg',
      element: 'fire'
    }
  }

  const mockUserProfile: UserProfile = {
    ...mockUserInfo,
    parties: [
      {
        id: 'party-1',
        shortcode: 'abc123',
        name: 'Test Party',
        user: mockUserInfo
      } as Party
    ]
  }

  const mockParty: Party = {
    id: 'party-1',
    shortcode: 'abc123',
    name: 'Fire Team',
    user: mockUserInfo,
    visibility: 0,
    element: 1,
    characters: [],
    weapons: [],
    summons: []
  } as Party

  beforeEach(() => {
    mockFetch = vi.fn()
    global.fetch = mockFetch
    adapter = new UserAdapter()
  })

  describe('getInfo', () => {
    it('should fetch user information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserInfo
      })

      const result = await adapter.getInfo('testuser')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/info/testuser'),
        expect.any(Object)
      )
      expect(result).toEqual(mockUserInfo)
    })

    it('should encode username in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserInfo
      })

      await adapter.getInfo('user with spaces')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/info/user%20with%20spaces'),
        expect.any(Object)
      )
    })
  })

  describe('getProfile', () => {
    it('should fetch user profile with parties', async () => {
      const response = {
        profile: mockUserProfile,
        meta: {
          count: 10,
          total_pages: 2,
          per_page: 5
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => response
      })

      const result = await adapter.getProfile('testuser')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/testuser'),
        expect.any(Object)
      )
      expect(result).toEqual({
        user: mockUserProfile,
        items: mockUserProfile.parties,
        page: 1,
        total: 10,
        totalPages: 2,
        perPage: 5
      })
    })

    it('should handle pagination', async () => {
      const response = {
        profile: mockUserProfile,
        meta: {
          count: 10,
          total_pages: 2,
          per_page: 5
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => response
      })

      await adapter.getProfile('testuser', 2)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/testuser'),
        expect.objectContaining({
          params: { page: 2 }
        })
      )
    })

    it('should handle empty parties array', async () => {
      const response = {
        profile: { ...mockUserProfile, parties: undefined },
        meta: {}
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => response
      })

      const result = await adapter.getProfile('testuser')

      expect(result.items).toEqual([])
    })

    it('should not include page param for page 1', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile: mockUserProfile })
      })

      await adapter.getProfile('testuser', 1)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/testuser'),
        expect.objectContaining({
          params: undefined
        })
      )
    })
  })

  describe('getFavorites', () => {
    it('should fetch favorite parties', async () => {
      const response = {
        results: [mockParty],
        total: 5,
        total_pages: 1,
        per: 20
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => response
      })

      const result = await adapter.getFavorites()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/parties/favorites'),
        expect.any(Object)
      )
      expect(result).toEqual({
        items: [mockParty],
        page: 1,
        total: 5,
        totalPages: 1,
        perPage: 20
      })
    })

    it('should handle pagination for favorites', async () => {
      const response = {
        results: [mockParty],
        total: 30,
        total_pages: 3,
        per: 10
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => response
      })

      await adapter.getFavorites({ page: 2 })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/parties/favorites'),
        expect.objectContaining({
          params: { page: 2 }
        })
      )
    })

    it('should use default perPage when not provided', async () => {
      const response = {
        results: [],
        total: 0,
        total_pages: 0
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => response
      })

      const result = await adapter.getFavorites()

      expect(result.perPage).toBe(20)
    })
  })

  describe('checkUsernameAvailability', () => {
    it('should check username availability', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: true })
      })

      const result = await adapter.checkUsernameAvailability('newuser')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/check-username'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'newuser' })
        })
      )
      expect(result).toEqual({ available: true })
    })

    it('should return unavailable for taken username', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: false })
      })

      const result = await adapter.checkUsernameAvailability('existinguser')

      expect(result).toEqual({ available: false })
    })
  })

  describe('checkEmailAvailability', () => {
    it('should check email availability', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: true })
      })

      const result = await adapter.checkEmailAvailability('new@example.com')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/check-email'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'new@example.com' })
        })
      )
      expect(result).toEqual({ available: true })
    })
  })

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updates = {
        username: 'newusername',
        theme: 'light' as const
      }

      const updatedUser = { ...mockUserInfo, ...updates }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser
      })

      const result = await adapter.updateProfile(updates)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates)
        })
      )
      expect(result).toEqual(updatedUser)
    })

    it('should handle partial updates', async () => {
      const updates = { private: true }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockUserInfo, ...updates })
      })

      await adapter.updateProfile(updates)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({
          body: JSON.stringify(updates)
        })
      )
    })
  })

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserInfo
      })

      const result = await adapter.getCurrentUser()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.any(Object)
      )
      expect(result).toEqual(mockUserInfo)
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(adapter.getInfo('testuser')).rejects.toThrow()
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'User not found' })
      })

      await expect(adapter.getProfile('nonexistent')).rejects.toThrow()
    })
  })

  describe('caching', () => {
    it('should cache user info requests when cache option is provided', async () => {
      // Create adapter with caching enabled
      const cachedAdapter = new UserAdapter({ cacheTime: 60000 })

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockUserInfo
      })

      // First call
      await cachedAdapter.getInfo('testuser')
      // Second call should use cache
      await cachedAdapter.getInfo('testuser')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should cache profile requests when cache option is provided', async () => {
      // Create adapter with caching enabled
      const cachedAdapter = new UserAdapter({ cacheTime: 60000 })

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          profile: mockUserProfile,
          meta: {}
        })
      })

      // First call
      await cachedAdapter.getProfile('testuser')
      // Second call should use cache
      await cachedAdapter.getProfile('testuser')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should not cache different pages', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          profile: mockUserProfile,
          meta: {}
        })
      })

      await adapter.getProfile('testuser', 1)
      await adapter.getProfile('testuser', 2)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should clear cache after updates', async () => {
      // Create adapter with caching enabled
      const cachedAdapter = new UserAdapter({ cacheTime: 60000 })

      // Setup initial cached request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserInfo
      })
      await cachedAdapter.getCurrentUser()

      // Perform update (should clear cache)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockUserInfo, theme: 'light' })
      })
      await cachedAdapter.updateProfile({ theme: 'light' })

      // Next getCurrentUser should hit the API again (cache was cleared)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockUserInfo, theme: 'light' })
      })
      await cachedAdapter.getCurrentUser()

      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })
})