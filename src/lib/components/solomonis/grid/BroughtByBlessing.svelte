<script lang="ts">
	/**
	 * Marks the ally brought by The Hanged Man on a Solomonis run. Editors get
	 * a checkbox (at most one ally can hold it); viewers see a label on the
	 * marked ally. Writes `brought_by_blessing` through the existing grid
	 * character update.
	 */
	import type { GridCharacter } from '$lib/types/api/party'
	import { usePartyContext } from '$lib/types/party-context'
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		character: GridCharacter
		/** Whether this ally may be marked now (see canMarkBroughtByBlessing). */
		allowed: boolean
	}

	let { character, allowed }: Props = $props()

	const ctx = usePartyContext()
	let saving = $state(false)
	const editable = $derived((ctx?.canEdit() ?? false) && allowed)

	async function handleChange(checked: boolean) {
		if (saving || checked === !!character.broughtByBlessing) return
		saving = true
		try {
			await ctx.services.gridService.updateCharacter(ctx.getParty().id, character.id, {
				broughtByBlessing: checked
			})
		} catch {
			// gridService already reports the failure with a toast
		} finally {
			saving = false
		}
	}
</script>

{#if editable}
	<label class="brought-by-blessing">
		<Checkbox
			checked={!!character.broughtByBlessing}
			onCheckedChange={handleChange}
			disabled={saving}
			size="small"
		/>
		<span>{m.solomonis_web_grid_brought_by_blessing()}</span>
	</label>
{:else if character.broughtByBlessing}
	<span class="brought-by-blessing static">{m.solomonis_web_grid_brought_by_blessing()}</span>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.brought-by-blessing {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit-half;
		margin-top: spacing.$unit-half;
		font-size: typography.$font-tiny;
		color: var(--text-secondary);
		text-align: center;
		cursor: pointer;

		&.static {
			cursor: default;
			font-weight: typography.$medium;
		}
	}
</style>
