import { BaseAdapter } from './base.adapter'
import type { Party } from '$lib/types/api/party'
import type { RequestOptions } from './types'
import { DEFAULT_ADAPTER_CONFIG } from './config'

export interface UserInfo {
  id: string
  username: string
  language: string
  private: boolean
  gender: number
  theme: string
  role: number
  avatar: {
    picture: string
    element: string
  }
}

export interface UserProfile extends UserInfo {
  parties?: Party[]
}

export interface UserProfileResponse {
  user: UserProfile
  items: Party[]
  page: number
  total?: number
  totalPages?: number
  perPage?: number
}

/**
 * Adapter for user-related API operations
 */
export class UserAdapter extends BaseAdapter {
  /**
   * Get user information
   */
  async getInfo(username: string, options?: RequestOptions): Promise<UserInfo> {
    return this.request<UserInfo>(`/users/info/${encodeURIComponent(username)}`, options)
  }

  /**
   * Get user profile with their parties
   */
  async getProfile(username: string, page = 1): Promise<UserProfileResponse> {
    const params = page > 1 ? { page } : undefined
    const response = await this.request<{
      profile: UserProfile
      meta?: { count?: number; total_pages?: number; per_page?: number }
    }>(`/users/${encodeURIComponent(username)}`, { params })

    const items = Array.isArray(response.profile?.parties) ? response.profile.parties : []

    return {
      user: response.profile,
      items,
      page,
      total: response.meta?.count,
      totalPages: response.meta?.total_pages || response.meta?.totalPages,
      perPage: response.meta?.per_page || response.meta?.perPage
    }
  }

  /**
   * Get user's favorite parties
   */
  async getFavorites(options: { page?: number } = {}): Promise<{
    items: Party[]
    page: number
    total: number
    totalPages: number
    perPage: number
  }> {
    const { page = 1 } = options
    const params = page > 1 ? { page } : undefined

    const response = await this.request<{
      results: Party[]
      total: number
      total_pages?: number
      totalPages?: number
      per?: number
    }>('/parties/favorites', { params })

    return {
      items: response.results,
      page,
      total: response.total,
      totalPages: response.total_pages || response.totalPages || 1,
      perPage: response.per || 20
    }
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    return this.request<{ available: boolean }>(`/users/check-username`, {
      method: 'POST',
      body: JSON.stringify({ username })
    })
  }

  /**
   * Check email availability
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    return this.request<{ available: boolean }>(`/users/check-email`, {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserInfo>): Promise<UserInfo> {
    const result = await this.request<UserInfo>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })

    // Clear cache for current user after update
    this.clearCache('/users/me')

    return result
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<UserInfo> {
    return this.request<UserInfo>('/users/me')
  }
}

export const userAdapter = new UserAdapter(DEFAULT_ADAPTER_CONFIG)