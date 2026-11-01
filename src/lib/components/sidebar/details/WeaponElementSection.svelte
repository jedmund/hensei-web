<script lang="ts">
	/**
	 * WeaponElementSection - The chosen element of an element-less weapon,
	 * with an inline picker for the party owner.
	 */
	import type { ComponentProps } from 'svelte'
	import type { GridWeapon } from '$lib/types/api/party'
	import DetailsSection from './DetailsSection.svelte'
	import DetailRow from './DetailRow.svelte'
	import SyncMenuButton from './SyncMenuButton.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ElementPickerSegmented from '$lib/components/ui/element-picker/ElementPickerSegmented.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { useUpdateGridWeapon } from '$lib/api/mutations/gridWeapon.mutations'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import * as m from '$lib/paraglide/messages'

	type ElementColor = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		weapon: GridWeapon
		isPartyOwner: boolean
		/** Element for the Change/Done button */
		buttonElement: ElementColor | undefined
		/** Section sync button props; omit when the section is in sync */
		sync?: ComponentProps<typeof SyncMenuButton> | undefined
	}

	let { weapon, isPartyOwner, buttonElement, sync }: Props = $props()

	const updateWeaponMutation = useUpdateGridWeapon()
	let showElementPicker = $state(false)

	function handleElementChange(value: number | number[]) {
		const element = typeof value === 'number' ? value : value[0]
		if (element === undefined) return

		const shortcode = partyStore.party?.shortcode
		if (!weapon.id || !shortcode) return

		updateWeaponMutation.mutate({
			id: weapon.id,
			partyShortcode: shortcode,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- partial update only needs element field
			updates: { element } as any
		})
		showElementPicker = false
	}
</script>

<DetailsSection
	title={m.details_element()}
	empty={!weapon.element && !showElementPicker}
	emptyMessage={m.details_element_not_set()}
>
	{#snippet action()}
		<div class="section-actions">
			{#if sync}
				<SyncMenuButton {...sync} />
			{/if}
			{#if isPartyOwner}
				<Button
					variant="element-ghost"
					size="small"
					element={buttonElement}
					onclick={() => (showElementPicker = !showElementPicker)}
				>
					{showElementPicker ? m.action_done() : m.action_change()}
				</Button>
			{/if}
		</div>
	{/snippet}
	{#if showElementPicker}
		<ElementPickerSegmented
			value={weapon.element || undefined}
			onValueChange={handleElementChange}
			contained
			class="element-picker-full"
		/>
	{:else}
		<DetailRow label={m.details_weapon_element()}>
			<ElementLabel element={weapon.element} size="medium" />
		</DetailRow>
	{/if}
</DetailsSection>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	:global(.element-picker-full) {
		width: 100%;
		display: flex;

		:global(.element-group) {
			width: 100%;
			justify-content: space-between;
		}
	}

	.section-actions {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
	}
</style>
