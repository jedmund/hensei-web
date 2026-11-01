<script lang="ts">
	// The summon's stored wiki and game data, with re-parse and wiki fetch for editors
	import { createQuery } from '@tanstack/svelte-query'
	import { summonAdapter, type Summon } from '$lib/api/adapters/summon.adapter'
	import { fetchWikiPage } from '$lib/api/wiki'
	import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
	import type { RecordTabProps } from '$lib/features/database/schema/types'

	let { record, canEdit, refetch }: RecordTabProps<Summon> = $props()

	const rawDataQuery = createQuery(() => ({
		queryKey: ['summons', 'raw', record.id],
		queryFn: () => summonAdapter.getSummonRawData(record.id),
		enabled: !!record.id
	}))
</script>

<EntityRawDataTab
	wikiRaw={rawDataQuery.data?.wikiRaw}
	gameRawEn={rawDataQuery.data?.gameRawEn}
	gameRawJp={rawDataQuery.data?.gameRawJp}
	isLoading={rawDataQuery.isLoading}
	{canEdit}
	onReparse={canEdit && record.id
		? async (refetchFirst) => {
				await summonAdapter.reparseSummon(record.id, refetchFirst)
				refetch()
				rawDataQuery.refetch()
			}
		: undefined}
	onFetchWiki={canEdit && record.id && record.wiki?.en
		? async () => {
				// Fetch wiki data client-side (bypasses CloudFlare)
				const wikiResult = await fetchWikiPage(record.wiki!.en!)
				if (wikiResult.error) {
					throw new Error(wikiResult.error)
				}
				// Update the summon with the wiki_raw data
				await summonAdapter.updateSummon(record.id, { wiki_raw: wikiResult.wikiRaw })
				rawDataQuery.refetch()
				return { wikiRaw: wikiResult.wikiRaw ?? null, gameRawEn: null, gameRawJp: null }
			}
		: undefined}
/>
