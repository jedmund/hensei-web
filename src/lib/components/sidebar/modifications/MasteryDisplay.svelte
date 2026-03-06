<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import { formatRingStat, formatEarringStat } from '$lib/utils/modificationFormatters'
	import { getRingStat, getElementalizedEarringStat } from '$lib/utils/masteryUtils'
	import { getMasteryImage } from '$lib/utils/images'
	import { getLocale } from '$lib/paraglide/runtime.js'

	interface Props {
		rings?: GridCharacter['overMastery']
		earring?: GridCharacter['aetherialMastery']
		characterElement?: number
		variant?: 'compact' | 'detailed'
		showIcons?: boolean
	}

	let { rings, earring, characterElement, variant = 'compact', showIcons = true }: Props = $props()

	// Get current locale
	const locale = $derived(getLocale() as 'en' | 'ja')

	// Get icon for mastery type based on modifier
	function getMasteryIcon(type: 'ring' | 'earring', modifier: number): string | null {
		if (!showIcons) return null

		const stat = type === 'ring'
			? getRingStat(modifier)
			: (characterElement !== undefined && (modifier === 3 || modifier === 4))
				? getElementalizedEarringStat(modifier, characterElement, locale)
				: getElementalizedEarringStat(modifier, undefined, locale)

		if (!stat || !stat.slug) return null

		return getMasteryImage(stat.slug)
	}
</script>

{#if rings && rings.length > 0}
	<div class="mastery-display rings {variant}">
		{#if variant === 'detailed'}
			<h4 class="mastery-title">Over Mastery</h4>
		{/if}
		<ul class="mastery-list">
			{#each rings as ring}
				<li class="mastery-item">
					{#if showIcons}
						{@const iconUrl = getMasteryIcon('ring', ring.modifier)}
						{#if iconUrl}
							<img
								src={iconUrl}
								alt={formatRingStat(ring.modifier, ring.strength, locale).split('+')[0]?.trim() ?? ''}
								class="mastery-icon"
							/>
						{/if}
					{/if}
					<span class="mastery-content">
						{#if variant === 'detailed'}
							<strong class="mastery-label">
								{formatRingStat(ring.modifier, ring.strength, locale).split('+')[0]?.trim() ?? ''}
							</strong>
							<span class="mastery-value">
								+{ring.strength}{getRingStat(ring.modifier)?.suffix || ''}
							</span>
						{:else}
							{formatRingStat(ring.modifier, ring.strength, locale)}
						{/if}
					</span>
				</li>
			{/each}
		</ul>
	</div>
{/if}

{#if earring}
	<div class="mastery-display earring {variant}">
		{#if variant === 'detailed'}
			<h4 class="mastery-title">Aetherial Mastery</h4>
		{/if}
		<ul class="mastery-list">
			<li class="mastery-item enhanced">
				{#if showIcons}
					{@const iconUrl = getMasteryIcon('earring', earring.modifier)}
					{#if iconUrl}
						<img
							src={iconUrl}
							alt={formatEarringStat(earring.modifier, earring.strength, locale, characterElement).split('+')[0]?.trim() ?? ''}
							class="mastery-icon"
						/>
					{/if}
				{/if}
				<span class="mastery-content">
					{#if variant === 'detailed'}
						<strong class="mastery-label">
							{formatEarringStat(earring.modifier, earring.strength, locale, characterElement).split('+')[0]?.trim() ?? ''}
						</strong>
						<span class="mastery-value enhanced">
							+{earring.strength}{getElementalizedEarringStat(earring.modifier, characterElement, locale)?.suffix || ''}
						</span>
					{:else}
						{formatEarringStat(earring.modifier, earring.strength, locale, characterElement)}
					{/if}
				</span>
			</li>
		</ul>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.mastery-display {
		&.detailed {
			margin-bottom: spacing.$unit-2x;
		}

		&.compact {
			margin-bottom: spacing.$unit;
		}
	}

	.mastery-title {
		margin: 0 0 spacing.$unit 0;
		font-size: typography.$font-regular;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.mastery-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: calc(spacing.$unit * 0.5);
	}

	.mastery-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: calc(spacing.$unit * 0.75);
		background: var(--unit-bg);
		border-radius: layout.$item-corner-small;

		&.enhanced {
			background: linear-gradient(135deg, var(--unit-bg), rgba(#d4af37, 0.1));
			border: 1px solid rgba(#d4af37, 0.2);
		}
	}

	.mastery-icon {
		width: spacing.$unit-3x;
		height: spacing.$unit-3x;
		object-fit: contain;
		flex-shrink: 0;
	}

	.mastery-content {
		display: flex;
		gap: spacing.$unit;
		align-items: center;
		font-size: typography.$font-small;
		color: var(--text-primary);
		flex: 1;

		.detailed & {
			justify-content: space-between;
		}
	}

	.mastery-label {
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.mastery-value {
		font-weight: typography.$normal;
		color: var(--text-secondary);

		&.enhanced {
			color: #d4af37;
			font-weight: typography.$medium;
		}
	}

	// Compact variant styles
	.compact {
		.mastery-list {
			gap: spacing.$unit-half;
		}

		.mastery-item {
			padding: spacing.$unit-half;
			background: transparent;
			border: none;
		}

		.mastery-content {
			font-size: typography.$font-small;
		}
	}
</style>
