<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { GridSummon } from '$lib/types/api/party'

	interface Props {
		/** GridSummon.activeAuraScaling: Grand Order's weapon-group count and the boost it gives */
		scaling: NonNullable<GridSummon['activeAuraScaling']>
		class?: string
	}

	const { scaling, class: className = '' }: Props = $props()
</script>

<!-- "4 weapon groups: 160% Normal ATK", or the count alone when the tier states no amount -->
<p class="aura-scaling {className}">
	{scaling.value != null
		? m.aura_weapon_groups_value({ count: scaling.weaponGroups, value: scaling.value })
		: m.aura_weapon_groups({ count: scaling.weaponGroups })}
</p>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.aura-scaling {
		margin: spacing.$unit-half 0 0;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}
</style>
