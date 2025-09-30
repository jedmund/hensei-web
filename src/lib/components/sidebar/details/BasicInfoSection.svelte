<script lang="ts">
	import { getElementLabel } from '$lib/utils/element'
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getProficiencyLabel } from '$lib/utils/proficiency'
	import { getRaceLabel } from '$lib/utils/race'
	import { getGenderLabel } from '$lib/utils/gender'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		itemData: any
	}

	let { type, itemData }: Props = $props()
</script>

<div class="details-section">
	<h3>Basic Information</h3>
	<div class="detail-row">
		<span class="label">Rarity</span>
		<span class="value">{getRarityLabel(itemData?.rarity)}</span>
	</div>
	<div class="detail-row">
		<span class="label">Element</span>
		<span class="value">{getElementLabel(itemData?.element)}</span>
	</div>

	{#if type === 'character'}
		{#if itemData?.race && itemData.race.length > 0}
			<div class="detail-row">
				<span class="label">Race</span>
				<span class="value">
					{itemData.race
						.map((r) => getRaceLabel(r))
						.filter(Boolean)
						.join(', ') || '—'}
				</span>
			</div>
		{/if}
		<div class="detail-row">
			<span class="label">Gender</span>
			<span class="value">{getGenderLabel(itemData?.gender)}</span>
		</div>
		{#if itemData?.proficiency && itemData.proficiency.length > 0}
			<div class="detail-row">
				<span class="label">Proficiencies</span>
				<span class="value">
					{itemData.proficiency
						.map((p) => getProficiencyLabel(p))
						.filter(Boolean)
						.join(', ') || '—'}
				</span>
			</div>
		{/if}
	{:else if type === 'weapon'}
		<div class="detail-row">
			<span class="label">Proficiency</span>
			<span class="value">{getProficiencyLabel(itemData?.proficiency)}</span>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.details-section {
		padding: 0 spacing.$unit;

		h3 {
			margin: 0 0 calc(spacing.$unit * 1.5) 0;
			font-size: typography.$font-name;
			font-weight: typography.$medium;
			color: var(--text-primary);
			padding: 0 spacing.$unit;
		}
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(spacing.$unit * 1.5) spacing.$unit;

		&:hover {
			background: var(--page-hover);
			border-radius: layout.$item-corner;
		}

		&:last-child {
			border-bottom: none;
		}

		.label {
			font-size: typography.$font-regular;
			color: var(--text-secondary, colors.$grey-50);
		}

		.value {
			font-size: typography.$font-regular;
			color: var(--text-primary, colors.$grey-10);
			font-weight: typography.$medium;
			text-align: right;
		}
	}
</style>
