/** Board fixtures (snake_case, as the API emits) run through the adapter's transform. */
import { transformResponse } from '$lib/api/schemas/transforms'
import type { Party } from '$lib/types/api/party'
import type { BlessingCatalogue } from '$lib/api/adapters/solomonis.adapter'
import type { RouteEvoker } from '$lib/types/api/solomonis'
import routeEvokersJson from '$lib/api/adapters/__tests__/fixtures/solomonis/route-evokers.json'
import blessingsJson from '$lib/api/adapters/__tests__/fixtures/solomonis/blessings.json'
import partyBuildJson from '$lib/api/adapters/__tests__/fixtures/solomonis/party-build.json'
import partyRunJson from '$lib/api/adapters/__tests__/fixtures/solomonis/party-run.json'

export const ROUTE_EVOKERS = transformResponse<{ routeEvokers: RouteEvoker[] }>(
	routeEvokersJson
).routeEvokers
export const BLESSINGS = transformResponse<BlessingCatalogue>(blessingsJson)
export const BUILD_PARTY = transformResponse<{ party: Party }>(partyBuildJson).party
export const RUN_PARTY = transformResponse<{ party: Party }>(partyRunJson).party

export function blessingBySlug(slug: string) {
	const b = BLESSINGS.blessings.find((x) => x.slug === slug)
	if (!b) throw new Error(`no blessing ${slug}`)
	return b
}

export const NIER_ID = 'c816c582-b04a-5173-982b-fa833919f4e6'
export const FRAUX_ID = '128fb62e-dcb6-50fc-a541-bc1ee5188b9e'
