import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type {
  RaidFull,
  RaidGroupFull,
  RaidGroupFlat,
  CreateRaidInput,
  UpdateRaidInput,
  CreateRaidGroupInput,
  UpdateRaidGroupInput,
  RaidFilters
} from '$lib/types/api/raid'
import type { Raid, RaidGroup } from '$lib/types/api/entities'

/**
 * Adapter for Raid and RaidGroup API operations
 */
export class RaidAdapter extends BaseAdapter {
  // ==================== Raid Operations ====================

  /**
   * Get all raids with optional filtering
   */
  async getAll(filters?: RaidFilters, options?: RequestOptions): Promise<Raid[]> {
    const queryParams: Record<string, any> = {}

    if (filters) {
      if (filters.element !== undefined) queryParams.element = filters.element
      if (filters.groupId) queryParams.group_id = filters.groupId
      if (filters.difficulty !== undefined) queryParams.difficulty = filters.difficulty
      if (filters.hl !== undefined) queryParams.hl = filters.hl
      if (filters.extra !== undefined) queryParams.extra = filters.extra
      if (filters.guidebooks !== undefined) queryParams.guidebooks = filters.guidebooks
    }

    const response = await this.request<Raid[]>('/raids', {
      ...options,
      query: Object.keys(queryParams).length > 0 ? queryParams : undefined
    })
    return response
  }

  /**
   * Get a single raid by slug
   */
  async getBySlug(slug: string, options?: RequestOptions): Promise<RaidFull> {
    const response = await this.request<RaidFull>(`/raids/${slug}`, options)
    return response
  }

  /**
   * Create a new raid (editor only)
   */
  async create(input: CreateRaidInput, options?: RequestOptions): Promise<RaidFull> {
    const response = await this.request<RaidFull>('/raids', {
      ...options,
      method: 'POST',
      body: JSON.stringify({ raid: input })
    })
    this.clearCache('/raids')
    return response
  }

  /**
   * Update a raid (editor only)
   */
  async update(slug: string, input: UpdateRaidInput, options?: RequestOptions): Promise<RaidFull> {
    const response = await this.request<RaidFull>(`/raids/${slug}`, {
      ...options,
      method: 'PUT',
      body: JSON.stringify({ raid: input })
    })
    this.clearCache('/raids')
    this.clearCache(`/raids/${slug}`)
    return response
  }

  /**
   * Delete a raid (editor only)
   */
  async delete(slug: string, options?: RequestOptions): Promise<void> {
    await this.request<void>(`/raids/${slug}`, {
      ...options,
      method: 'DELETE'
    })
    this.clearCache('/raids')
    this.clearCache(`/raids/${slug}`)
  }

  // ==================== RaidGroup Operations ====================

  /**
   * Get all raid groups with their raids
   */
  async getGroups(options?: RequestOptions): Promise<RaidGroupFull[]> {
    const response = await this.request<RaidGroupFull[]>('/raid_groups', options)
    return response
  }

  /**
   * Get a single raid group by ID
   */
  async getGroupById(id: string, options?: RequestOptions): Promise<RaidGroupFull> {
    const response = await this.request<RaidGroupFull>(`/raid_groups/${id}`, options)
    return response
  }

  /**
   * Create a new raid group (editor only)
   */
  async createGroup(input: CreateRaidGroupInput, options?: RequestOptions): Promise<RaidGroupFull> {
    const response = await this.request<RaidGroupFull>('/raid_groups', {
      ...options,
      method: 'POST',
      body: JSON.stringify({ raid_group: input })
    })
    this.clearCache('/raid_groups')
    return response
  }

  /**
   * Update a raid group (editor only)
   */
  async updateGroup(id: string, input: UpdateRaidGroupInput, options?: RequestOptions): Promise<RaidGroupFull> {
    const response = await this.request<RaidGroupFull>(`/raid_groups/${id}`, {
      ...options,
      method: 'PUT',
      body: JSON.stringify({ raid_group: input })
    })
    this.clearCache('/raid_groups')
    this.clearCache(`/raid_groups/${id}`)
    return response
  }

  /**
   * Delete a raid group (editor only)
   */
  async deleteGroup(id: string, options?: RequestOptions): Promise<void> {
    await this.request<void>(`/raid_groups/${id}`, {
      ...options,
      method: 'DELETE'
    })
    this.clearCache('/raid_groups')
    this.clearCache(`/raid_groups/${id}`)
  }

  // ==================== Legacy Endpoints ====================

  /**
   * Get all raid groups with raids (legacy endpoint)
   * @deprecated Use getGroups() instead
   */
  async getLegacyGroups(options?: RequestOptions): Promise<RaidGroupFull[]> {
    const response = await this.request<RaidGroupFull[]>('/raids/groups', options)
    return response
  }
}

export const raidAdapter = new RaidAdapter(DEFAULT_ADAPTER_CONFIG)
