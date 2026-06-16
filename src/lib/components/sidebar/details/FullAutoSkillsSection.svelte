<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import DetailsSection from './DetailsSection.svelte'
	import DetailRow from './DetailRow.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import { getAbilitySlots } from '$lib/utils/fullAutoSkills'
	import { useUpdateGridCharacter } from '$lib/api/mutations/grid.mutations'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import { getElementTypeKey } from '$lib/utils/element'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		item: GridCharacter
		isPartyOwner?: boolean
	}

	let { item, isPartyOwner = false }: Props = $props()

	const updateCharacter = useUpdateGridCharacter()

	const slots = $derived(getAbilitySlots(item.character))
	const fullAuto = $derived(item.fullAutoSkills ?? {})
	const element = $derived(getElementTypeKey(item.character?.element))

	// Absent or true => ON; only an explicit false is OFF.
	function isOn(slot: number): boolean {
		return fullAuto[String(slot)] !== false
	}

	function setSlot(slot: number, on: boolean) {
		const shortcode = partyStore.party?.shortcode
		if (!item.id || !shortcode) return

		// Send the full object so persisted state stays explicit.
		const next: Record<string, boolean> = { ...fullAuto, [String(slot)]: on }
		updateCharacter.mutate({
			id: item.id,
			partyShortcode: shortcode,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- partial update only needs fullAutoSkills
			updates: { fullAutoSkills: next } as any
		})
	}
</script>

{#if slots.length > 0}
	<DetailsSection title={m.details_full_auto_skills()}>
		{#each slots as s (s.slot)}
			{#if s.eligible}
				<DetailRow label={s.name} compact>
					<Switch
						size="small"
						{element}
						checked={isOn(s.slot)}
						disabled={!isPartyOwner}
						onCheckedChange={(checked) => {
							// Guard against the Switch's mount-time callback firing a no-op write.
							if (checked !== isOn(s.slot)) setSlot(s.slot, checked)
						}}
					/>
				</DetailRow>
			{:else}
				<DetailRow compact>
					{#snippet labelSlot()}
						<span class="ineligible">{s.name}</span>
					{/snippet}
				</DetailRow>
			{/if}
		{/each}
	</DetailsSection>
{/if}

<style lang="scss">
	.ineligible {
		color: var(--text-secondary);
	}
</style>
