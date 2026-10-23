<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import DetailsSection from './DetailsSection.svelte'
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
			<div class="fa-row" class:ineligible={!s.eligible}>
				<div class="thumb-wrapper">
					{#if s.iconUrl}
						<img
							class="thumb"
							src={s.iconUrl}
							alt=""
							loading="lazy"
							onerror={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
						/>
					{/if}
				</div>
				<span class="name">{s.name}</span>
				{#if s.eligible}
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
				{/if}
			</div>
		{/each}
	</DetailsSection>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.fa-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		border-radius: spacing.$unit;
		font-size: typography.$font-regular;

		&.ineligible .name {
			color: var(--text-secondary);
		}
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-primary);
		font-size: typography.$font-regular;
	}

	.thumb-wrapper {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.thumb {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: layout.$item-corner-small;
		border: 1px solid var(--border-primary);
		background: var(--placeholder-bg);
	}
</style>
