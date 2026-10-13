<script lang="ts">
	/**
	 * BlessingEditSection - the edit pane's blessings: the loadout's cost
	 * gauge over a level stepper per released blessing (0 = not equipped).
	 */
	import * as m from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import Stepper from '$lib/components/ui/Stepper.svelte'
	import { appLocale } from '$lib/utils/locale'
	import type { ArcarumBlessing } from '$lib/types/api/solomonis'
	import BlessingRow from './BlessingRow.svelte'
	import BlessingCostGauge from './BlessingCostGauge.svelte'
	import { solomonisName, type BlessingSelection } from './solomonisParty'

	interface Props {
		/** The released blessings, in arcana order */
		blessings: ArcarumBlessing[]
		/** The chosen level of each equipped blessing */
		selection: BlessingSelection
		total: number
		limit: number
	}

	let { blessings, selection = $bindable(), total, limit }: Props = $props()

	const locale = appLocale()

	/** The selected level of a blessing, if it's equipped. */
	function selectedLevel(blessing: ArcarumBlessing) {
		return blessing.levels.find((l) => l.id === selection[blessing.id])
	}

	function maxLevel(blessing: ArcarumBlessing): number {
		return Math.max(0, ...blessing.levels.map((l) => l.level))
	}

	function setLevel(blessing: ArcarumBlessing, level: number) {
		const next = { ...selection }
		const target = blessing.levels.find((l) => l.level === level)
		if (target) next[blessing.id] = target.id
		else delete next[blessing.id]
		selection = next
	}
</script>

<DetailsSection title={m.solomonis_web_party_blessings_title()}>
	<div class="blessings">
		<BlessingCostGauge {total} {limit} />

		<ul class="blessing-list">
			{#each blessings as blessing (blessing.id)}
				{@const level = selectedLevel(blessing)}
				{@const described = level ?? blessing.levels.find((l) => l.level === 1)}
				{@const name = solomonisName(blessing.name, locale)}
				<li>
					<BlessingRow
						slug={blessing.slug}
						{name}
						subtitle={level
							? m.solomonis_web_party_blessing_cost({ cost: level.cost })
							: m.solomonis_web_party_blessing_not_equipped()}
						description={described ? solomonisName(described.description, locale) : null}
						descriptionMuted={!level}
					>
						{#snippet trailing()}
							<Stepper
								value={level?.level ?? 0}
								max={maxLevel(blessing)}
								onChange={(value) => setLevel(blessing, value)}
								size="medium"
								label={name}
								decreaseLabel={m.solomonis_web_party_blessing_level_down({ name })}
								increaseLabel={m.solomonis_web_party_blessing_level_up({ name })}
							/>
						{/snippet}
					</BlessingRow>
				</li>
			{/each}
		</ul>
	</div>
</DetailsSection>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	// Lined up with the section heading, like the details pane's blessing list
	.blessings {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: 0 $unit;
	}

	.blessing-list {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
