<script lang="ts">
	// The detail body for a panel record: the same components the full pages render.
	import type { DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import { resourceDef } from '$lib/features/database/schema/registry'
	import SummonDetail from '$lib/features/database/summons/SummonDetail.svelte'
	import CharacterStyleDetail from '$lib/features/database/characters/CharacterStyleDetail.svelte'
	import { parseRecordId, type PanelResource } from './panelUrl'

	interface Props {
		resource: PanelResource
		id: string
		role: number
		tab: DetailTab
		onTabChange: (tab: DetailTab) => void
	}

	const { resource, id, role, tab, onTabChange }: Props = $props()

	const record = $derived(parseRecordId(id))

	// Style shifts (`<id>-style`) keep their own detail. Other registered
	// resources use their panel override, else the generated detail (each
	// loaded on the first open, then cached)
	const style = $derived(resource === 'characters' && record.styleSwap)
	const def = $derived(style ? undefined : resourceDef(resource))
	const panel = $derived(def?.screens?.panel?.())
	const generated = $derived(
		!panel && def?.record ? import('$lib/features/database/schema/ResourceDetail.svelte') : null
	)
</script>

{#key id}
	{#if style}
		<CharacterStyleDetail granblueId={record.granblueId} {role} {tab} {onTabChange} />
	{:else if panel}
		{#await panel then { default: Panel }}
			<Panel granblueId={record.granblueId} {role} {tab} {onTabChange} />
		{/await}
	{:else if def && generated}
		{#await generated then { default: ResourceDetail }}
			<ResourceDetail {def} granblueId={record.granblueId} {role} {tab} {onTabChange} />
		{/await}
	{:else if resource === 'summons'}
		<SummonDetail granblueId={record.granblueId} {role} {tab} {onTabChange} />
	{/if}
{/key}
