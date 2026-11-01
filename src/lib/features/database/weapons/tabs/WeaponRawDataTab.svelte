<script lang="ts">
	// The weapon's stored wiki and game data, with re-parse and wiki fetch for editors
	import { createQuery } from '@tanstack/svelte-query'
	import { weaponAdapter, type Weapon } from '$lib/api/adapters/weapon.adapter'
	import { fetchWikiPage } from '$lib/api/wiki'
	import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
	import type { RecordTabProps } from '$lib/features/database/schema/types'

	let { record, canEdit, refetch }: RecordTabProps<Weapon> = $props()

	const rawDataQuery = createQuery(() => ({
		queryKey: ['weapons', 'raw', record.id],
		queryFn: () => weaponAdapter.getWeaponRawData(record.id),
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
				await weaponAdapter.reparseWeapon(record.id, refetchFirst)
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
				// Update the weapon with the wiki_raw data
				await weaponAdapter.updateWeapon(record.id, { wiki_raw: wikiResult.wikiRaw })
				rawDataQuery.refetch()
				return { wikiRaw: wikiResult.wikiRaw ?? null, gameRawEn: null, gameRawJp: null }
			}
		: undefined}
/>
