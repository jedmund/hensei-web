<script lang="ts">
	// The character's stored wiki and game data, with the refresh actions for editors
	import { createQuery } from '@tanstack/svelte-query'
	import { characterAdapter, type Character } from '$lib/api/adapters/character.adapter'
	import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
	import CharacterRefreshActions from '$lib/features/database/characters/refresh/CharacterRefreshActions.svelte'
	import type { RecordTabProps } from '$lib/features/database/schema/types'

	let { record, canEdit, refetch }: RecordTabProps<Character> = $props()

	// The :full character carries when its wikitext was fetched (not on the shared Character type)
	const fetchTimes = $derived(
		record as Character & { wikiRawFetchedAt?: string | null; wikiRawJpFetchedAt?: string | null }
	)

	const rawDataQuery = createQuery(() => ({
		queryKey: ['characters', 'raw', record.id],
		queryFn: () => characterAdapter.getCharacterRawData(record.id),
		enabled: !!record.id
	}))
</script>

<EntityRawDataTab
	wikiRaw={rawDataQuery.data?.wikiRaw}
	gameRawEn={rawDataQuery.data?.gameRawEn}
	gameRawJp={rawDataQuery.data?.gameRawJp}
	isLoading={rawDataQuery.isLoading}
	{canEdit}
	fetchedAt={{ en: fetchTimes.wikiRawFetchedAt, jp: fetchTimes.wikiRawJpFetchedAt }}
>
	{#snippet wikiActions()}
		{#if canEdit && record.id}
			<CharacterRefreshActions
				characterId={record.id}
				characterName={record.name}
				onRefreshed={() => {
					refetch()
					rawDataQuery.refetch()
				}}
			/>
		{/if}
	{/snippet}
</EntityRawDataTab>
