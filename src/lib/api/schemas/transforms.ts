/**
 * Transforms snake_case keys to camelCase
 */
export function snakeToCamel<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel) as T
  }
  
  if (typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = snakeToCamel(value)
    }
    return result
  }
  
  return obj
}

/**
 * Keys that contain data maps where the keys themselves are data values
 * (like wiki page names), not property names that should be transformed
 */
const DATA_MAP_KEYS = new Set(['wiki_data', 'wikiData'])

/**
 * Transforms camelCase keys to snake_case
 * @param obj - The object to transform
 * @param skipValueTransform - If true, don't transform nested values (used for data maps)
 */
export function camelToSnake<T>(obj: T, skipValueTransform = false): T {
  if (obj === null || obj === undefined) return obj

  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnake(item, skipValueTransform)) as T
  }

  if (typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = skipValueTransform ? key : key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      // If this key is a data map, don't transform its nested keys
      if (DATA_MAP_KEYS.has(key) || DATA_MAP_KEYS.has(snakeKey)) {
        result[snakeKey] = value // Keep value as-is
      } else {
        result[snakeKey] = camelToSnake(value, skipValueTransform)
      }
    }
    return result
  }

  return obj
}

/**
 * Renames "object" fields to proper entity names in response data
 */
function renameObjectFields(obj: any): any {
  if (obj === null || obj === undefined) return obj

  if (Array.isArray(obj)) {
    return obj.map(renameObjectFields)
  }

  if (typeof obj === 'object') {
    const result: any = {}

    for (const [key, value] of Object.entries(obj)) {
      // Handle weapons array
      if (key === 'weapons' && Array.isArray(value)) {
        result.weapons = value.map((item: any) => {
          if (item && typeof item === 'object' && 'object' in item) {
            const { object, ...rest } = item
            return { ...rest, weapon: renameObjectFields(object) }
          }
          return renameObjectFields(item)
        })
      }
      // Handle characters array
      else if (key === 'characters' && Array.isArray(value)) {
        result.characters = value.map((item: any) => {
          if (item && typeof item === 'object' && 'object' in item) {
            const { object, ...rest } = item
            return { ...rest, character: renameObjectFields(object) }
          }
          return renameObjectFields(item)
        })
      }
      // Handle summons array
      else if (key === 'summons' && Array.isArray(value)) {
        result.summons = value.map((item: any) => {
          if (item && typeof item === 'object' && 'object' in item) {
            const { object, ...rest } = item
            return { ...rest, summon: renameObjectFields(object) }
          }
          return renameObjectFields(item)
        })
      }
      // Recursively process other fields
      else {
        result[key] = renameObjectFields(value)
      }
    }

    return result
  }

  return obj
}

/**
 * Renames entity fields back to "object" for API requests
 */
function renameEntityFields(obj: any): any {
  if (obj === null || obj === undefined) return obj

  if (Array.isArray(obj)) {
    return obj.map(renameEntityFields)
  }

  if (typeof obj === 'object') {
    const result: any = {}

    for (const [key, value] of Object.entries(obj)) {
      // Handle weapons array
      if (key === 'weapons' && Array.isArray(value)) {
        result.weapons = value.map((item: any) => {
          if (item && typeof item === 'object' && 'weapon' in item) {
            const { weapon, ...rest } = item
            return { ...rest, object: renameEntityFields(weapon) }
          }
          return renameEntityFields(item)
        })
      }
      // Handle characters array
      else if (key === 'characters' && Array.isArray(value)) {
        result.characters = value.map((item: any) => {
          if (item && typeof item === 'object' && 'character' in item) {
            const { character, ...rest } = item
            return { ...rest, object: renameEntityFields(character) }
          }
          return renameEntityFields(item)
        })
      }
      // Handle summons array
      else if (key === 'summons' && Array.isArray(value)) {
        result.summons = value.map((item: any) => {
          if (item && typeof item === 'object' && 'summon' in item) {
            const { summon, ...rest } = item
            return { ...rest, object: renameEntityFields(summon) }
          }
          return renameEntityFields(item)
        })
      }
      // Recursively process other fields
      else {
        result[key] = renameEntityFields(value)
      }
    }

    return result
  }

  return obj
}

/**
 * Transforms API response data to match our clean type definitions
 * - Converts snake_case to camelCase
 * - Renames "object" to proper entity names (weapon, character, summon)
 */
export function transformResponse<T>(data: any): T {
  if (data === null || data === undefined) return data

  // First convert snake_case to camelCase
  const camelCased = snakeToCamel(data)

  // Then rename "object" fields to proper entity names
  return renameObjectFields(camelCased) as T
}

/**
 * Transforms request data to match API expectations
 * - Converts camelCase to snake_case
 * - Renames entity names back to "object" for API
 */
export function transformRequest<T>(data: T): any {
  if (data === null || data === undefined) return data

  // First rename entity fields back to "object"
  const withObjectFields = renameEntityFields(data)

  // Then convert camelCase to snake_case
  return camelToSnake(withObjectFields)
}
