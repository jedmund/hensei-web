<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import type { GridSummon } from '$lib/types/api/party'

	interface Props {
		/** GridSummon.activeAuraScaling: Grand Order's weapon-group count and what it gives */
		scaling: NonNullable<GridSummon['activeAuraScaling']>
		class?: string
	}

	const { scaling, class: className = '' }: Props = $props()

	const EFFECT_TEXT: Record<string, (value: number) => string> = {
		normal_atk: (value) => m.aura_scaled_normal_atk({ value }),
		def: (value) => m.aura_scaled_def({ value })
	}

	// "160% Normal ATK and 40% DEF"; effects without a value or a known target are left out
	const effects = $derived.by(() => {
		const parts = scaling.effects.flatMap((effect) => {
			const text = EFFECT_TEXT[effect.target]
			return text && effect.value != null ? [text(effect.value)] : []
		})
		return parts.length > 0
			? new Intl.ListFormat(getLocale(), { type: 'conjunction' }).format(parts)
			: undefined
	})
</script>

<!-- "4 weapon groups: 160% Normal ATK and 40% DEF", or the count alone without an amount -->
<p class="aura-scaling {className}">
	{effects
		? m.aura_weapon_groups_value({ count: scaling.weaponGroups, effects })
		: m.aura_weapon_groups({ count: scaling.weaponGroups })}
</p>
{#if scaling.bonusActive && scaling.bonusAt != null}
	<p class="aura-scaling {className}">{m.aura_weapon_groups_bonus({ count: scaling.bonusAt })}</p>
{/if}

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
