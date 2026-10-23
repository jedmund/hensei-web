<script lang="ts">
	import type { Snippet } from 'svelte'
	import SkillDescription from '$lib/components/weapon/SkillDescription.svelte'
	import type { CharacterSkillEffect, DescriptionSegment } from '$lib/types/api/entities'

	// One skill as a card: icon, name and badges, description, then a secondary meta line.
	// Character and weapon skills both render through it; linked cards are a slot's later
	// versions (a character's transform, a weapon's upgraded tier) shown under its first.
	interface Props {
		name: string
		iconUrl?: string | null | undefined
		/** Fills the icon box when there's no image (character skill colours: damage, heal, …) */
		iconType?: string | undefined
		badges?: string[]
		/** Display segments; plain text goes in as a single segment */
		segments?: DescriptionSegment[] | undefined
		/** Raw wiki text, the fallback for responses without segments */
		raw?: string | undefined
		/** The skill's effects, which `effect` segments point at */
		effects?: CharacterSkillEffect[] | undefined
		/** Shown after the description: timing, classification, … */
		meta?: Snippet
		/** Connector label above a linked card (e.g. "Transforms into") */
		relationLabel?: string | undefined
		linked?: boolean
	}

	let {
		name,
		iconUrl,
		iconType,
		badges = [],
		segments,
		raw,
		effects,
		meta,
		relationLabel,
		linked = false
	}: Props = $props()

	let imgFailed = $state(false)
	const showImg = $derived(!!iconUrl && !imgFailed)
</script>

<div class="skill-card" class:linked>
	{#if relationLabel}
		<div class="relation">↳ {relationLabel}</div>
	{/if}
	<div class="body">
		<div class="icon" data-type={iconType ?? 'none'}>
			{#if showImg}
				<img src={iconUrl} alt={name} loading="lazy" onerror={() => (imgFailed = true)} />
			{/if}
		</div>
		<div class="info">
			<div class="name-row">
				<span class="name">{name}</span>
				{#each badges as badge (badge)}
					<span class="badge">{badge}</span>
				{/each}
			</div>

			{#if segments?.length || raw}
				<div class="description">
					<SkillDescription {segments} {raw} {effects} />
				</div>
			{/if}

			{#if meta}
				<div class="meta">{@render meta()}</div>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.skill-card {
		background: var(--card-bg);
		border-radius: layout.$item-corner;

		&.linked {
			margin-left: spacing.$unit-2x;
			padding-left: spacing.$unit-2x;
			border-left: spacing.$unit-fourth solid var(--separator-bg);
		}
	}

	.relation {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		padding: spacing.$unit-half 0;
	}

	.body {
		display: flex;
		gap: spacing.$unit * 1.5;
		padding: spacing.$unit;
	}

	.icon {
		flex: 0 0 auto;
		width: spacing.$unit-5x;
		height: spacing.$unit-5x;
		border-radius: layout.$item-corner-small;
		overflow: hidden;
		// Type-color fill when no image is available.
		background: var(--background);

		&[data-type='damage'] {
			background: #d64545;
		}
		&[data-type='heal'] {
			background: #3fa34d;
		}
		&[data-type='buff'] {
			background: #e0a93b;
		}
		&[data-type='debuff'] {
			background: #4a6fd6;
		}
		&[data-type='field'] {
			background: #8b5cf6;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.name-row {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: spacing.$unit-half spacing.$unit;
	}

	.name {
		font-size: typography.$font-medium;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.badge {
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		background: var(--background);
		padding: 0 spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		line-height: 1.6;
	}

	.description {
		font-size: typography.$font-regular;
		line-height: 1.5;
		color: var(--text-primary);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
