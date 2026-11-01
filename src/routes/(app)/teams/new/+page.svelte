<script lang="ts">
	import type { PageData } from './$types'
	import Party from '$lib/components/party/Party.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { partyQueries, partyKeys } from '$lib/api/queries/party.queries'
	import { useCreateParty } from '$lib/api/mutations/party.mutations'
	import { useCreateGridCharacter } from '$lib/api/mutations/gridCharacter.mutations'
	import { useCreateGridSummon } from '$lib/api/mutations/gridSummon.mutations'
	import { useCreateGridWeapon } from '$lib/api/mutations/gridWeapon.mutations'
	import { parseNewTeamStart } from '$lib/utils/browseRoutes'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { characterAdapter } from '$lib/api/adapters/character.adapter'
	import { summonAdapter } from '$lib/api/adapters/summon.adapter'
	import { weaponAdapter } from '$lib/api/adapters/weapon.adapter'
	import { raidAdapter } from '$lib/api/adapters/raid.adapter'
	import { getMaxUncapLevel, getSummonMaxUncapLevel } from '$lib/utils/uncap'
	import { toast } from 'svelte-sonner'
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { replaceState } from '$app/navigation'
	import { getLocalId } from '$lib/utils/localId'
	import { storeEditKey } from '$lib/utils/editKeys'
	import type {
		GridCharacter,
		GridSummon,
		GridWeapon,
		Party as PartyType
	} from '$lib/types/api/party'
	import type { Raid } from '$lib/types/api/entities'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	const collectionSourceUsername = $derived($page.url.searchParams.get('collectionSource'))
	// Home's "New team" buttons start the team with an item in its first
	// regular slot and/or a raid. They're only shown until the first real edit,
	// which saves them with the team, so opening the link saves nothing.
	const start = parseNewTeamStart($page.url.searchParams)
	let startCharacter = $state<GridCharacter | null>(null)
	let startWeapon = $state<GridWeapon | null>(null)
	let startSummon = $state<GridSummon | null>(null)
	let startRaid = $state<Raid | null>(null)

	let partyId = $state<string | null>(null)
	let shortcode = $state<string | null>(null)
	let creationPromise: Promise<{ id: string; shortcode: string }> | null = null

	const queryClient = useQueryClient()
	const createPartyMutation = useCreateParty()
	const createCharacter = useCreateGridCharacter()
	const createWeapon = useCreateGridWeapon()
	const createSummon = useCreateGridSummon()

	const placeholderParty: PartyType = $derived({
		id: 'new',
		shortcode: 'new',
		name: '',
		description: '',
		weapons: startWeapon ? [startWeapon] : [],
		summons: startSummon ? [startSummon] : [],
		characters: startCharacter ? [startCharacter] : [],
		...(startRaid ? { raid: startRaid } : {})
	})

	const partyQuery = createQuery(() => ({
		...partyQueries.byShortcode(shortcode || 'new'),
		enabled: !!shortcode
	}))

	const party = $derived(partyQuery.data ?? placeholderParty)

	async function ensurePartyExists(): Promise<{ id: string; shortcode: string }> {
		if (partyId && shortcode) return { id: partyId, shortcode }

		// If creation is already in flight, share the same promise
		if (creationPromise) return creationPromise

		creationPromise = (async () => {
			try {
				const payload: Record<string, unknown> = {
					name: 'New Team',
					visibility: 1,
					element: party.element || 0
				}
				if (startRaid) payload.raidId = startRaid.id

				if (!data.isAuthenticated) {
					payload.localId = getLocalId()
				}

				const created = await createPartyMutation.mutateAsync(payload)
				partyId = created.id
				shortcode = created.shortcode

				if (created.editKey) {
					storeEditKey(created.shortcode, created.editKey)
					storeEditKey(created.id, created.editKey)
				}

				queryClient.setQueryData(partyKeys.detail(created.shortcode), created)
				replaceState(`/teams/${created.shortcode}`, {})

				// Save the starting item before the edit that created the team
				const base = { partyId: created.id, partyShortcode: created.shortcode, position: 0 }
				if (startCharacter)
					await createCharacter.mutateAsync({ ...base, characterId: startCharacter.character.id })
				if (startWeapon)
					await createWeapon.mutateAsync({ ...base, weaponId: startWeapon.weapon.id })
				if (startSummon)
					await createSummon.mutateAsync({ ...base, summonId: startSummon.summon.id })

				return { id: created.id, shortcode: created.shortcode }
			} catch (err) {
				creationPromise = null
				throw err
			}
		})()

		return creationPromise
	}

	// Show the starting item in its first regular slot (not the mainhand or the
	// main summon) at its maximum uncap, as the server will save it
	onMount(async () => {
		try {
			// The entity endpoints return the same records as a team's grid, with
			// looser types
			if (start.add?.type === 'character') {
				const character = (await characterAdapter.getCharacter(
					start.add.id
				)) as GridCharacter['character']
				const { flb = false, ulb = false, transcendence = false } = character.uncap ?? {}
				const special = character.special ?? false
				const uncapLevel = getMaxUncapLevel(special, flb, special ? ulb : transcendence)
				startCharacter = { id: 'start', position: 0, character, uncapLevel }
			} else if (start.add?.type === 'weapon') {
				const weapon = (await weaponAdapter.getWeapon(start.add.id)) as GridWeapon['weapon']
				startWeapon = {
					id: 'start',
					position: 0,
					mainhand: false,
					weapon,
					uncapLevel: getSummonMaxUncapLevel({ uncap: weapon.uncap ?? {} })
				}
			} else if (start.add?.type === 'summon') {
				const summon = (await summonAdapter.getSummon(start.add.id)) as GridSummon['summon']
				startSummon = {
					id: 'start',
					position: 0,
					main: false,
					summon,
					uncapLevel: getSummonMaxUncapLevel({ uncap: summon.uncap ?? {} })
				}
			}
			if (start.raidSlug) {
				startRaid = (await raidAdapter.getAll()).find((r) => r.slug === start.raidSlug) ?? null
			}
		} catch (err) {
			toast.error(extractErrorMessage(err, m.error_unknown()))
		}
	})
</script>

<PageMeta title={m.page_title_new()} description={m.page_desc_home()} />

<Party
	{party}
	canEdit={true}
	authUserId={data.account?.userId}
	authUsername={data.account?.username}
	authUserAvatar={data.currentUser
		? { picture: data.currentUser.picture, element: data.currentUser.element }
		: undefined}
	isEditor={(data.account?.role ?? 0) >= 7}
	isNew={!shortcode}
	{ensurePartyExists}
	initialCollectionSourceUsername={collectionSourceUsername ?? undefined}
/>
