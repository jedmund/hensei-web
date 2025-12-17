declare module '*.jpg'

declare module '*.svg' {
  import React from 'react'
  const SVG: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  export default SVG
}

// SvelteKit environment variables type declarations
// These are populated from .env files at build time
declare module '$env/static/public' {
  export const PUBLIC_SIERO_API_URL: string
}

// wx-svelte-grid type declarations
declare module 'wx-svelte-grid' {
  import type { SvelteComponent } from 'svelte'

  export interface IColumn {
    id: string
    header?: string
    width?: number
    flexgrow?: number
    sort?: boolean
    cell?: any
    template?: any
    [key: string]: any
  }

  export interface IRow {
    id: string | number
    [key: string]: any
  }

  // Cell component props - used by custom cell components
  export interface Cell {
    row: IRow
    col: IColumn
    value?: any
  }

  // Alias for backward compatibility
  export interface ICellProps extends Cell {}

  export interface IDataConfig {
    data: IRow[]
    columns: IColumn[]
  }

  export class Grid extends SvelteComponent<{
    data?: IRow[]
    columns?: IColumn[]
    sortMarks?: Record<string, { order: 'asc' | 'desc'; index?: number }>
    [key: string]: any
  }> {}

  export class Willow extends SvelteComponent<{
    fonts?: boolean
    children?: any
  }> {}

  export class WillowDark extends SvelteComponent<{
    fonts?: boolean
    children?: any
  }> {}

  export class Material extends SvelteComponent<{
    fonts?: boolean
    children?: any
  }> {}

  export class RestDataProvider<T = any> {
    constructor(url: string, options?: any)
    getData(): Promise<T[]>
    [key: string]: any
  }
}
