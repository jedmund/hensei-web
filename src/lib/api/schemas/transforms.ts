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
 * Transforms camelCase keys to snake_case
 */
export function camelToSnake<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake) as T
  }
  
  if (typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      result[snakeKey] = camelToSnake(value)
    }
    return result
  }
  
  return obj
}