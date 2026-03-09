<script lang="ts">
	import type { PageData } from './$types'
	import Party from '$lib/components/party/Party.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { partyQueries, partyKeys } from '$lib/api/queries/party.queries'
	import { useCreateParty } from '$lib/api/mutations/party.mutations'
	import { replaceState } from '$app/navigation'
	import { getLocalId } from '$lib/utils/localId'
	import { storeEditKey } from '$lib/utils/editKeys'
	import { PartyVisibility } from '$lib/types/visibility'
	import type { Party as PartyType } from '$lib/types/api/party'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	let partyId = $state<string | null>(null)
	let shortcode = $state<string | null>(null)
	let creationPromise: Promise<{ id: string; shortcode: string }> | null = null

	const queryClient = useQueryClient()
	const createPartyMutation = useCreateParty()

	const placeholderParty: PartyType = {
		id: 'new',
		shortcode: 'new',
		name: '',
		description: '',
		weapons: [],
		summons: [],
		characters: [],
		element: 0,
		visibility: PartyVisibility.PRIVATE,
		job: undefined,
		jobSkills: undefined,
		accessory: undefined
	}

	const partyQuery = createQuery(() => ({
		...partyQueries.byShortcode(shortcode || 'new'),
		initialData: shortcode ? undefined : placeholderParty,
		enabled: !!shortcode
	}))

	const party = $derived(partyQuery.data ?? placeholderParty)

	async function ensurePartyExists(): Promise<{ id: string; shortcode: string }> {
		if (partyId && shortcode) return { id: partyId, shortcode }

		// If creation is already in flight, share the same promise
		if (creationPromise) return creationPromise

		creationPromise = (async () => {
			try {
				const payload: any = {
					name: 'New Team',
					visibility: 1,
					element: party.element || 0
				}

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

				return { id: created.id, shortcode: created.shortcode }
			} catch (err) {
				creationPromise = null
				throw err
			}
		})()

		return creationPromise
	}
</script>

<PageMeta title={m.page_title_new()} description={m.page_desc_home()} />

<Party
	party={party}
	canEdit={true}
	authUserId={data.account?.userId}
	isNew={true}
	{ensurePartyExists}
/>
