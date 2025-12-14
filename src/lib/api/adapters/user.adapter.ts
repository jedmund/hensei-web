import { BaseAdapter } from './base.adapter'
import type { Party } from '$lib/types/api/party'
import type { RequestOptions } from './types'
import { DEFAULT_ADAPTER_CONFIG } from './config'

/**
 * API response for user data (already camelCased by BaseAdapter.transformResponse)
 * Note: BaseAdapter automatically transforms snake_case to camelCase,
 * so we receive granblueId, showGamertag, etc.
 */
interface ApiUserResponse {
  id: string
  username: string
  language: string
  private: boolean
  gender: number
  theme: string
  role: number
  granblueId?: number | string | null  // API returns number, transformed to camelCase
  showGamertag?: boolean  // transformed from show_gamertag
  showGranblueId?: boolean  // transformed from show_granblue_id
  collectionPrivacy?: number  // transformed from collection_privacy (0=everyone, 1=crew_only, 2=private)
  gamertag?: string
  email?: string  // Only included in settings view
  avatar: {
    picture: string
    element: string
  }
}

/**
 * Transformed user info (camelCase for frontend)
 * Uses our preferred naming convention (showCrewGamertag, crewGamertag)
 */
export interface UserInfo {
  id: string
  username: string
  language: string
  private: boolean
  gender: number
  theme: string
  role: number
  granblueId?: string
  showCrewGamertag?: boolean
  showGranblueId?: boolean
  collectionPrivacy?: number
  crewGamertag?: string
  avatar: {
    picture: string
    element: string
  }
}

/**
 * User settings info - includes email (only returned by /users/me endpoint)
 */
export interface UserSettings extends UserInfo {
  email: string
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
 * Transform API user response to frontend UserInfo format
 * Renames API fields to our preferred naming convention
 */
function transformUserResponse(apiUser: ApiUserResponse): UserInfo {
  return {
    id: apiUser.id,
    username: apiUser.username,
    language: apiUser.language,
    private: apiUser.private,
    gender: apiUser.gender,
    theme: apiUser.theme,
    role: apiUser.role,
    // granblueId comes as number from API, convert to string
    granblueId: apiUser.granblueId != null ? String(apiUser.granblueId) : undefined,
    // Rename showGamertag to showCrewGamertag
    showCrewGamertag: apiUser.showGamertag,
    // Privacy settings
    showGranblueId: apiUser.showGranblueId,
    collectionPrivacy: apiUser.collectionPrivacy,
    // Rename gamertag to crewGamertag
    crewGamertag: apiUser.gamertag,
    avatar: apiUser.avatar
  }
}

/**
 * Transform API user response to frontend UserSettings format (includes email)
 */
function transformSettingsResponse(apiUser: ApiUserResponse): UserSettings {
  return {
    ...transformUserResponse(apiUser),
    email: apiUser.email ?? ''
  }
}

/**
 * Adapter for user-related API operations
 */
export class UserAdapter extends BaseAdapter {
  /**
   * Get user information
   */
  async getInfo(username: string, options?: RequestOptions): Promise<UserInfo> {
    const result = await this.request<ApiUserResponse>(
      `/users/info/${encodeURIComponent(username)}`,
      options
    )
    return transformUserResponse(result)
  }

  /**
   * Get user profile with their parties
   */
  async getProfile(username: string, page = 1): Promise<UserProfileResponse> {
    const params = page > 1 ? { page } : undefined
    const response = await this.request<{
      profile: ApiUserResponse & { parties?: Party[] }
      meta?: {
        count?: number
        total_pages?: number
        totalPages?: number
        per_page?: number
        perPage?: number
      }
    }>(`/users/${encodeURIComponent(username)}`, { params })

    const items = Array.isArray(response.profile?.parties) ? response.profile.parties : []

    // Transform API response to frontend format
    const user: UserProfile = {
      ...transformUserResponse(response.profile),
      parties: items
    }

    const result: UserProfileResponse = {
      user,
      items,
      page
    }

    if (response.meta?.count !== undefined) {
      result.total = response.meta.count
    }
    const totalPages = response.meta?.total_pages ?? response.meta?.totalPages
    if (totalPages !== undefined) {
      result.totalPages = totalPages
    }
    const perPage = response.meta?.per_page ?? response.meta?.perPage
    if (perPage !== undefined) {
      result.perPage = perPage
    }

    return result
  }

  /**
   * Get user profile parties (for infinite scroll)
   * Returns in standard paginated format
   */
  async getProfileParties(username: string, page = 1): Promise<{
    results: Party[]
    page: number
    total: number
    totalPages: number
    perPage: number
  }> {
    const response = await this.getProfile(username, page)
    return {
      results: response.items,
      page: response.page,
      total: response.total || 0,
      totalPages: response.totalPages || 1,
      perPage: response.perPage || 20
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
    return this.request<{ available: boolean }>(`/check/username`, {
      method: 'POST',
      body: JSON.stringify({ username })
    })
  }

  /**
   * Check email availability
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    return this.request<{ available: boolean }>(`/check/email`, {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserInfo>): Promise<UserInfo> {
    // Wrap updates in 'user' key as required by Rails backend
    const result = await this.request<ApiUserResponse>('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ user: updates })
    })

    // Clear cache for current user after update
    this.clearCache('/users/me')

    return transformUserResponse(result)
  }

  /**
   * Get current user settings (includes email - only for settings modal)
   */
  async getCurrentUser(): Promise<UserSettings> {
    const result = await this.request<ApiUserResponse>('/users/me')
    return transformSettingsResponse(result)
  }
}

export const userAdapter = new UserAdapter(DEFAULT_ADAPTER_CONFIG)