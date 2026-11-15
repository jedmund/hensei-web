<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import SkillGroup from '$lib/components/skills/SkillGroup.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import SummonAuraText from '$lib/components/sidebar/details/SummonAuraText.svelte'
	import { SvelteSet } from 'svelte/reactivity'
	import type { Summon, SummonAura } from '$lib/types/api/entities'

	interface Props {
		summon: Summon
		/** A team's copy: its uncap and transcendence, which pick the tier it has reached */
		uncapLevel?: number | undefined
		transcendenceStep?: number | undefined
	}

	let { summon, uncapLevel, transcendenceStep }: Props = $props()

	// Main then sub aura, each by tier: uncap first, then transcendence stage
	function tiers(slot: string): SummonAura[] {
		return (summon.summonAuras ?? [])
			.filter((aura) => aura.slot === slot)
			.sort((a, b) => a.transcendenceStage - b.transcendenceStage || a.uncapLevel - b.uncapLevel)
	}

	// A team's copy: the tier it has reached, as the calculator picks it (the highest uncap
	// tier it reaches, then the transcendence stages up to its step). Such a group shows only
	// that tier until expanded; groups with one tier, and summons without a copy, show all.
	function currentTier(groupTiers: SummonAura[]): SummonAura | undefined {
		if (uncapLevel === undefined || groupTiers.length < 2) return undefined
		const step = transcendenceStep ?? 0
		return groupTiers
			.filter(
				(aura) =>
					aura.uncapLevel <= uncapLevel &&
					(aura.transcendenceStage === 0 || aura.transcendenceStage <= step)
			)
			.at(-1)
	}

	const groups = $derived(
		[
			{ slot: 'main', title: m.details_main_aura(), tiers: tiers('main') },
			{ slot: 'sub', title: m.details_sub_aura(), tiers: tiers('sub') }
		]
			.filter((group) => group.tiers.length > 0)
			.map((group) => ({ ...group, current: currentTier(group.tiers) }))
	)

	// Groups whose variants are expanded, by slot
	const expanded = new SvelteSet<string>()
	function toggleVariants(slot: string) {
		if (expanded.has(slot)) expanded.delete(slot)
		else expanded.add(slot)
	}

	// A transcended tier fills every uncap star; its stage fills the transcendence star
	function uncapFor(aura: SummonAura): number {
		return aura.transcendenceStage > 0 ? 6 : aura.uncapLevel
	}
</script>

<div class="summon-aura-list">
	{#each groups as group (group.slot)}
		{@const shown = group.current && !expanded.has(group.slot) ? [group.current] : group.tiers}
		<SkillGroup title={group.title}>
			<div class="skill-slot">
				<div class="aura-table">
					{#each shown as aura (aura.id)}
						<div class="aura-tier">
							<UncapIndicator
								type="summon"
								rarity={summon.rarity}
								uncapLevel={uncapFor(aura)}
								transcendenceStage={aura.transcendenceStage}
								flb={summon.uncap?.flb}
								ulb={summon.uncap?.ulb}
								transcendence={summon.uncap?.transcendence}
							/>
							<SummonAuraText {aura} class="aura-text" />
						</div>
					{/each}
				</div>
				{#if group.current}
					<div class="variants-toggle">
						<Button variant="ghost" size="small" onclick={() => toggleVariants(group.slot)}>
							{expanded.has(group.slot) ? m.skill_variants_hide() : m.skill_variants_show()}
						</Button>
					</div>
				{/if}
			</div>
		</SkillGroup>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	// One card per aura, a row per tier: the tier's uncap stars above its text
	.aura-table {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		background: var(--card-bg);
		border-radius: layout.$item-corner;
	}

	.aura-tier {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.aura-tier :global(.aura-text) {
		// The SkillCard text size, so a pane can step it down like the skill cards
		font-size: var(--skill-card-text-size, #{typography.$font-regular});
		line-height: 1.5;
		color: var(--text-primary);
	}

	// The Show/Hide all variants button, under the aura
	.variants-toggle {
		display: flex;
	}
</style>
