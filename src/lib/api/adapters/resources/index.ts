/**
 * Reactive Resources using Svelte 5 Runes
 *
 * This module exports reactive resources that provide
 * state management for API operations.
 *
 * @module adapters/resources
 */

export { SearchResource, createSearchResource } from './search.resource.svelte'
export type { SearchResourceOptions } from './search.resource.svelte'

export { PartyResource, createPartyResource } from './party.resource.svelte'
export type { PartyResourceOptions } from './party.resource.svelte'

// Future resources will be added here
// export { GridResource, createGridResource } from './grid.resource.svelte'
// export { EntityResource, createEntityResource } from './entity.resource.svelte'