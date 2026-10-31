<script lang="ts">
	import { usePartyContext } from '$lib/types/party-context'
	import Notice from '$lib/components/ui/Notice.svelte'
	import * as m from '$lib/paraglide/messages'

	/** Status notices under the party header: unsaved changes and orphaned items. */
	interface Props {
		/** The user has edited the info of a new team that isn't saved yet */
		hasEditedInfo: boolean
		isNew: boolean
	}

	let { hasEditedInfo, isNew }: Props = $props()

	const ctx = usePartyContext()
	const party = $derived(ctx.getParty())

	const hasOrphanedItems = $derived.by(() => {
		const hasOrphanedWeapons = (party?.weapons ?? []).some((w) => w?.orphaned)
		const hasOrphanedCharacters = (party?.characters ?? []).some((c) => c?.orphaned)
		const hasOrphanedSummons = (party?.summons ?? []).some((s) => s?.orphaned)
		return hasOrphanedWeapons || hasOrphanedCharacters || hasOrphanedSummons
	})
</script>

{#if hasEditedInfo && isNew && party.id === 'new'}
	<Notice variant="blue">
		{m.party_unsaved_notice()}
	</Notice>
{/if}

{#if hasOrphanedItems}
	<Notice variant="yellow">
		{m.party_orphan_warning()}
	</Notice>
{/if}
